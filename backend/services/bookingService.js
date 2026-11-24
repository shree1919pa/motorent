const mongoose = require("mongoose");
const bookingRepository = require("../repositories/bookingRepository");
const bikeRepository = require("../repositories/bikeRepository");
const notificationService = require("./notificationService");

// ==========================================
// CREATE BOOKING (CLIENT WITH ADVANCE EVIDENCE)
// ==========================================
const createBooking = async (bookingData, file, currentUser) => {
    const {
        bikeId,
        startDate,
        endDate,
        customerName,
        customerMobile,
        notes,
        submittedAdvanceAmount,
        paymentTransactionId,
        policyAccepted
    } = bookingData;

    if (!bikeId || !startDate || !endDate) {
        throw new Error("Bike ID, rental start date, and end date are required");
    }

    if (!mongoose.Types.ObjectId.isValid(bikeId)) {
        throw new Error("Invalid bike ID");
    }

    const start = bookingRepository.parseBookingDate(startDate);
    const end = bookingRepository.parseBookingDate(endDate);

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error("Invalid rental dates provided");
    }

    if (start >= end) {
        throw new Error("Rental start date must be before end date");
    }

    // Payment screenshot is required for booking submission (Feature 4)
    if (!file && !bookingData.paymentScreenshot) {
        throw new Error("Payment transaction screenshot is required to submit a booking request.");
    }

    const screenshotPath = file
        ? (file.savedPath || file.cloudinaryUrl || `/uploads/payments/${file.filename}`)
        : bookingData.paymentScreenshot;

    const bike = await bikeRepository.getBikeById(bikeId);
    if (!bike) {
        throw new Error("Bike not found");
    }

    if (bike.approvalStatus !== "approved") {
        throw new Error("This bike is currently not approved for rental");
    }

    if (bike.status === "blocked" || bike.status === "unavailable") {
        throw new Error("This bike is currently not available for rental");
    }

    const bikeOwnerId = bike.ownerId?._id || bike.ownerId;
    if (bikeOwnerId.toString() === currentUser.id.toString()) {
        throw new Error("You cannot book your own bike");
    }

    // FEATURE 5 & DATE-BASED AVAILABILITY: Check date-based conflicts (overlapping bookings)
    // Formula: requestedStartDate < existingEndDate AND requestedEndDate > existingStartDate
    const conflicts = await bookingRepository.findConflictingBookings(bike._id, start, end);
    if (conflicts && conflicts.length > 0) {
        throw new Error(
            "Sorry! This bike is already booked for some of your selected dates. Please select another date range or choose another bike."
        );
    }

    // FEATURE 3: Calculate days, total amount, and 20% advance
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalDays = diffDays === 0 ? 1 : diffDays;

    const pricePerDay = Number(bike.pricePerDay);
    const totalAmount = totalDays * pricePerDay;
    const advancePercentage = 20;
    const requiredAdvance = Math.round(totalAmount * 0.20);

    const submittedAdvance = submittedAdvanceAmount
        ? Number(submittedAdvanceAmount)
        : requiredAdvance;

    if (submittedAdvance < requiredAdvance) {
        throw new Error(
            `Minimum advance payment required is ₹${requiredAdvance} (20% of total ₹${totalAmount}).`
        );
    }

    const remainingAmount = totalAmount - submittedAdvance;

    // FEATURE 5: Temporary reservation with 24 hours expiration
    const reservationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newBooking = await bookingRepository.createBooking({
        userId: currentUser.id,
        bikeId: bike._id,
        ownerId: bikeOwnerId,
        startDate: start,
        endDate: end,
        totalDays,
        pricePerDay,
        totalAmount,
        advancePercentage,
        advanceAmount: submittedAdvance,
        advancePaid: submittedAdvance,
        remainingAmount,
        paymentScreenshot: screenshotPath,
        paymentTransactionId: paymentTransactionId ? paymentTransactionId.trim() : "",
        status: "Pending Owner Verification",
        paymentStatus: "Evidence Submitted",
        reservationExpiresAt,
        policyAccepted: policyAccepted === "true" || policyAccepted === true,
        customerName: customerName ? customerName.trim() : currentUser.name,
        customerMobile: customerMobile ? customerMobile.trim() : (currentUser.mobile || ""),
        notes: notes ? notes.trim() : "",
        bookingDate: new Date()
    });

    // Notify Bike Owner about advance payment verification
    try {
        await notificationService.createNotification({
            userId: bikeOwnerId,
            title: "New Advance Payment Verification",
            message: `New booking request for ${bike.bikeName} by ${currentUser.name}. Advance paid: ₹${submittedAdvance}. Please verify payment screenshot.`,
            type: "booking_request",
            bookingId: newBooking._id
        });
    } catch (notifErr) {
        console.error("Failed to notify owner:", notifErr);
    }

    return newBooking;
};

// ==========================================
// ACCEPT / APPROVE BOOKING (OWNER)
// ==========================================
const acceptBooking = async (id, currentUser) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid booking ID");
    }

    const booking = await bookingRepository.getBookingById(id);
    if (!booking) {
        throw new Error("Booking not found");
    }

    const bookingOwnerId = booking.ownerId?._id || booking.ownerId;
    if (
        currentUser.role !== "admin" &&
        bookingOwnerId.toString() !== currentUser.id.toString()
    ) {
        throw new Error("You can only verify bookings for your own bikes");
    }

    if (
        booking.status !== "Pending Owner Verification" &&
        booking.status !== "pending"
    ) {
        throw new Error(`Booking is already ${booking.status} and cannot be approved`);
    }

    // Re-verify conflicts before final approval
    const bikeId = booking.bikeId?._id || booking.bikeId;
    const conflicts = await bookingRepository.findConflictingBookings(
        bikeId,
        booking.startDate,
        booking.endDate,
        booking._id
    );

    if (conflicts && conflicts.length > 0) {
        throw new Error("Sorry! This bike is already booked for some of your selected dates. Please select another date range or choose another bike.");
    }

    // Change status to Confirmed & Verified
    const updatedBooking = await bookingRepository.updateBooking(id, {
        status: "Confirmed",
        paymentStatus: "Verified",
        reservationExpiresAt: null
    });

    // Notify Client
    try {
        const clientUserId = booking.userId?._id || booking.userId;
        const bikeName = booking.bikeId?.bikeName || "your bike";
        await notificationService.createNotification({
            userId: clientUserId,
            title: "Payment Verified & Booking Confirmed",
            message: `Your advance payment of ₹${booking.advanceAmount} for ${bikeName} has been verified and your booking is confirmed! Remaining amount to pay on pickup: ₹${booking.remainingAmount}.`,
            type: "booking_confirmed",
            bookingId: booking._id
        });
    } catch (notifErr) {
        console.error("Failed to notify client:", notifErr);
    }

    return updatedBooking;
};

// ==========================================
// REJECT BOOKING (OWNER)
// ==========================================
const rejectBooking = async (id, rejectionReason, currentUser) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid booking ID");
    }

    const booking = await bookingRepository.getBookingById(id);
    if (!booking) {
        throw new Error("Booking not found");
    }

    const bookingOwnerId = booking.ownerId?._id || booking.ownerId;
    if (
        currentUser.role !== "admin" &&
        bookingOwnerId.toString() !== currentUser.id.toString()
    ) {
        throw new Error("You can only reject bookings for your own bikes");
    }

    if (
        booking.status !== "Pending Owner Verification" &&
        booking.status !== "pending"
    ) {
        throw new Error(`Booking is already ${booking.status} and cannot be rejected`);
    }

    const reason = rejectionReason && rejectionReason.trim()
        ? rejectionReason.trim()
        : "Payment screenshot verification failed or rejected by owner.";

    const updatedBooking = await bookingRepository.updateBooking(id, {
        status: "Rejected",
        paymentStatus: "Rejected",
        rejectionReason: reason,
        reservationExpiresAt: null
    });

    // Notify Client
    try {
        const clientUserId = booking.userId?._id || booking.userId;
        const bikeName = booking.bikeId?.bikeName || "requested bike";
        await notificationService.createNotification({
            userId: clientUserId,
            title: "Booking Request Rejected",
            message: `Your booking request for ${bikeName} was rejected. Reason: ${reason}`,
            type: "booking_rejected",
            bookingId: booking._id
        });
    } catch (notifErr) {
        console.error("Failed to notify client:", notifErr);
    }

    return updatedBooking;
};

// ==========================================
// TIME-BASED CANCELLATION POLICY CALCULATION
// ==========================================
const calculateCancellationPolicy = (rentalStartDate, cancellationTimestamp = new Date(), advancePaid = 0) => {
    const cancelTime = new Date(cancellationTimestamp).getTime();
    const startTime = new Date(rentalStartDate).getTime();
    const diffMs = startTime - cancelTime;
    const hoursRemaining = diffMs / (1000 * 60 * 60);

    let percentage = 60; // default for 24h or less (or past start)
    if (hoursRemaining >= 96) {
        // RULE 1: Cancellation 4 days or more before rental start date: 10% deduction
        percentage = 10;
    } else if (hoursRemaining >= 72) {
        // RULE 2: Cancellation 3 days or more, but less than 4 days: 20% deduction
        percentage = 20;
    } else if (hoursRemaining >= 48) {
        // RULE 3: Cancellation 2 days or more, but less than 3 days: 30% deduction
        percentage = 30;
    } else if (hoursRemaining > 24) {
        // RULE 4: Cancellation less than 2 days but more than 24 hours: 30% deduction
        percentage = 30;
    } else {
        // RULE 5: Cancellation 24 hours or less before rental start date: 60% deduction
        percentage = 60;
    }

    const advance = Number(advancePaid) || 0;
    const deduction = Math.round((advance * percentage) / 100);
    const refundAmount = Math.max(0, advance - deduction);

    return {
        percentage,
        deduction,
        refundAmount,
        hoursRemaining,
        daysRemaining: hoursRemaining / 24
    };
};

// ==========================================
// CANCEL BOOKING (TIME-BASED POLICY CANCELLATION)
// ==========================================
const cancelBooking = async (id, cancellationReason, currentUser, customCancelTimestamp = null) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid booking ID");
    }

    const booking = await bookingRepository.getBookingById(id);
    if (!booking) {
        throw new Error("Booking not found");
    }

    const clientUserId = (booking.userId?._id || booking.userId).toString();
    const ownerUserId = (booking.ownerId?._id || booking.ownerId).toString();
    const currentUserId = currentUser.id.toString();

    if (
        currentUser.role !== "admin" &&
        currentUserId !== clientUserId &&
        currentUserId !== ownerUserId
    ) {
        throw new Error("You are not authorized to cancel this booking");
    }

    if (booking.status === "Cancelled" || booking.status === "cancelled") {
        throw new Error("This booking has already been cancelled");
    }

    if (
        booking.status === "Active" ||
        booking.status === "active" ||
        booking.status === "Completed" ||
        booking.status === "completed"
    ) {
        throw new Error("Active or completed bookings cannot be cancelled through the normal cancellation flow. Please contact customer support.");
    }

    if (booking.status === "Rejected" || booking.status === "rejected") {
        throw new Error("Rejected booking cannot be cancelled");
    }

    // FORMULA: Time-based cancellation calculation on verified advance payment
    const cancellationDate = customCancelTimestamp ? new Date(customCancelTimestamp) : new Date();
    const advancePaid = Number(booking.advancePaid || booking.advanceAmount) || 0;

    const { percentage, deduction, refundAmount } = calculateCancellationPolicy(
        booking.startDate,
        cancellationDate,
        advancePaid
    );
    const refundStatus = refundAmount > 0 ? "Refund Pending" : "Not Applicable";

    const updatedBooking = await bookingRepository.updateBooking(id, {
        status: "Cancelled",
        paymentStatus: refundAmount > 0 ? "Refund Pending" : "Not Paid",
        advancePaid,
        cancellationDate,
        cancellationPercentage: percentage,
        cancellationDeduction: deduction,
        maximumCancellationDeduction: deduction,
        actualCancellationDeduction: deduction,
        refundAmount,
        refundStatus,
        cancelledAt: cancellationDate,
        cancelledBy: currentUser.id,
        cancellationReason: cancellationReason ? cancellationReason.trim() : "Cancelled by customer",
        reservationExpiresAt: null
    });

    // Notify Bike Owner immediately with PRIORITY notification (Feature 5)
    try {
        const customerName = booking.customerName || booking.userId?.name || "Customer";
        const bikeName = booking.bikeId?.bikeName || "your bike";
        const startStr = new Date(booking.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const cancelTimeStr = cancellationDate.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        await notificationService.createNotification({
            userId: ownerUserId,
            title: "IMPORTANT: Ride Cancelled",
            message: `Customer ${customerName} has cancelled the booking for ${bikeName}. Rental Start: ${startStr}. Cancellation Time: ${cancelTimeStr}. Advance Received: ₹${advancePaid}, Cancellation Charge: ${percentage}%, Deduction: ₹${deduction}, Refund Amount: ₹${refundAmount}. Booking ID: #${booking._id}.`,
            type: "booking_cancelled",
            priority: "urgent",
            recipientRole: "owner",
            bookingId: booking._id,
            link: `/owner/bookings?tab=cancelled&bookingId=${booking._id}`
        });
    } catch (err) {
        console.error("Failed to notify owner about cancellation:", err);
    }

    return updatedBooking;
};

// ==========================================
// COMPLETE REFUND (FEATURE 7: OWNER FINANCIAL SETTLEMENT)
// ==========================================
const completeRefund = async (id, refundData = {}, currentUser = null) => {
    // Allow backwards compatibility if called as completeRefund(id, currentUser)
    if (refundData && (refundData.id || refundData.role || refundData._id) && !currentUser) {
        currentUser = refundData;
        refundData = {};
    }

    if (!currentUser) {
        throw new Error("Authentication required to complete refund");
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid booking ID");
    }

    const booking = await bookingRepository.getBookingById(id);
    if (!booking) {
        throw new Error("Booking not found");
    }

    const ownerUserId = (booking.ownerId?._id || booking.ownerId).toString();
    if (currentUser.role !== "admin" && ownerUserId !== currentUser.id.toString()) {
        throw new Error("Only the bike owner can record refund settlements");
    }

    if (booking.status !== "Cancelled" && booking.status !== "cancelled") {
        throw new Error("Refund settlement is only applicable to cancelled bookings");
    }

    if (booking.refundStatus === "Refunded") {
        throw new Error("Refund for this booking has already been marked as completed");
    }

    const advancePaid = Number(booking.advancePaid || booking.advanceAmount) || 0;
    const maxDeduction = booking.cancellationDeduction !== undefined && booking.cancellationDeduction !== null
        ? Number(booking.cancellationDeduction)
        : (booking.maximumCancellationDeduction !== undefined ? Number(booking.maximumCancellationDeduction) : Math.round(advancePaid * 0.10));

    // Actual deduction chosen by owner (cannot exceed policy deduction or be negative)
    let deduction = maxDeduction;
    if (refundData.actualDeduction !== undefined && refundData.actualDeduction !== null && refundData.actualDeduction !== "") {
        deduction = Number(refundData.actualDeduction);
    } else if (booking.actualCancellationDeduction !== undefined && booking.actualCancellationDeduction !== null) {
        deduction = Number(booking.actualCancellationDeduction);
    }

    if (isNaN(deduction) || deduction < 0) {
        throw new Error("Cancellation deduction cannot be negative.");
    }

    if (deduction > maxDeduction) {
        throw new Error(`Cancellation deduction (₹${deduction}) cannot exceed the policy cancellation fee of ₹${maxDeduction} (${booking.cancellationPercentage || 0}% of advance amount).`);
    }

    const finalRefund = Math.max(0, advancePaid - deduction);
    const refundRef = refundData.refundTransactionReference
        ? refundData.refundTransactionReference.trim()
        : (refundData.refundTransactionId ? refundData.refundTransactionId.trim() : "");

    const updatedBooking = await bookingRepository.updateBooking(id, {
        maximumCancellationDeduction: maxDeduction,
        actualCancellationDeduction: deduction,
        cancellationDeduction: deduction,
        refundAmount: finalRefund,
        refundStatus: "Refunded",
        paymentStatus: "Refunded",
        refundTransactionReference: refundRef
    });

    // Notify Client
    try {
        const clientUserId = (booking.userId?._id || booking.userId).toString();
        const bikeName = booking.bikeId?.bikeName || "your booking";
        await notificationService.createNotification({
            userId: clientUserId,
            title: "Refund Processed by Owner",
            message: `The owner has processed your refund of ₹${finalRefund} (Advance: ₹${advancePaid}, Deduction: ₹${deduction}) for ${bikeName}.${refundRef ? ` Reference / UTR: ${refundRef}.` : ""}`,
            type: "refund_processed",
            priority: "high",
            recipientRole: "customer",
            bookingId: booking._id
        });
    } catch (err) {
        console.error("Failed to notify client:", err);
    }

    return updatedBooking;
};

// ==========================================
// COMPLETE BOOKING
// ==========================================
const completeBooking = async (id, currentUser) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid booking ID");
    }

    const booking = await bookingRepository.getBookingById(id);
    if (!booking) {
        throw new Error("Booking not found");
    }

    const bookingOwnerId = (booking.ownerId?._id || booking.ownerId).toString();
    if (
        currentUser.role !== "admin" &&
        bookingOwnerId !== currentUser.id.toString()
    ) {
        throw new Error("You are not authorized to complete this booking");
    }

    return await bookingRepository.updateBooking(id, {
        status: "Completed"
    });
};

// ==========================================
// QUERY HELPERS
// ==========================================
const getOwnerBookings = async (currentUser, status = null) => {
    if (currentUser.role !== "owner" && currentUser.role !== "admin") {
        throw new Error("Only bike owners can view their bookings");
    }
    return await bookingRepository.getOwnerBookings(currentUser.id, status);
};

const getOwnerRequests = async (currentUser) => {
    if (currentUser.role !== "owner" && currentUser.role !== "admin") {
        throw new Error("Only bike owners can view booking requests");
    }
    return await bookingRepository.getOwnerBookings(currentUser.id, "pending");
};

const getOwnerConfirmed = async (currentUser) => {
    if (currentUser.role !== "owner" && currentUser.role !== "admin") {
        throw new Error("Only bike owners can view confirmed bookings");
    }
    return await bookingRepository.getOwnerBookings(currentUser.id, "confirmed");
};

const getOwnerCompleted = async (currentUser) => {
    if (currentUser.role !== "owner" && currentUser.role !== "admin") {
        throw new Error("Only bike owners can view completed bookings");
    }
    return await bookingRepository.getOwnerBookings(currentUser.id, "completed");
};

const getUserBookings = async (currentUser) => {
    return await bookingRepository.getUserBookings(currentUser.id);
};

const getBookingById = async (id, currentUser) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid booking ID");
    }

    const booking = await bookingRepository.getBookingById(id);
    if (!booking) {
        throw new Error("Booking not found");
    }

    const clientUserId = (booking.userId?._id || booking.userId).toString();
    const ownerUserId = (booking.ownerId?._id || booking.ownerId).toString();
    const currentUserId = currentUser.id.toString();

    if (
        currentUser.role !== "admin" &&
        currentUserId !== clientUserId &&
        currentUserId !== ownerUserId
    ) {
        throw new Error("You are not authorized to view this booking");
    }

    return booking;
};

const getOwnerStats = async (currentUser) => {
    if (currentUser.role !== "owner" && currentUser.role !== "admin") {
        throw new Error("Access denied");
    }
    return await bookingRepository.getOwnerStats(currentUser.id);
};

const getOwnerEarnings = async (currentUser) => {
    if (currentUser.role !== "owner" && currentUser.role !== "admin") {
        throw new Error("Access denied");
    }
    return await bookingRepository.getOwnerEarningsData(currentUser.id);
};

module.exports = {
    calculateCancellationPolicy,
    createBooking,
    acceptBooking,
    rejectBooking,
    cancelBooking,
    completeRefund,
    completeBooking,
    getOwnerBookings,
    getOwnerRequests,
    getOwnerConfirmed,
    getOwnerCompleted,
    getUserBookings,
    getBookingById,
    getOwnerStats,
    getOwnerEarnings
};
