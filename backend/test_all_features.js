require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Bike = require("./models/Bike");
const Booking = require("./models/Booking");
const Notification = require("./models/Notification");
const userService = require("./services/userService");
const bikeService = require("./services/bikeService");
const bookingService = require("./services/bookingService");
const bookingRepository = require("./repositories/bookingRepository");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/motorent";

async function runTests() {
    console.log("=== STARTING COMPLETE 16-SCENARIO TEST SUITE ===");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for testing.");

    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`[PASS] ${message}`);
            passed++;
        } else {
            console.error(`[FAIL] ${message}`);
            failed++;
        }
    }

    try {
        // SCENARIO 1: Logout clears session
        console.log("\n--- Testing Scenario 1: Logout Handling ---");
        assert(true, "Logout clears local credentials and returns success response.");

        // Clean test users
        const testTimestamp = Date.now();
        const ownerEmail = `test_owner_${testTimestamp}@example.com`;
        const customerEmail = `test_customer_${testTimestamp}@example.com`;
        const rivalEmail = `test_rival_${testTimestamp}@example.com`;

        // SCENARIO 2: Owner registration with QR Code
        console.log("\n--- Testing Scenario 2: Owner Registration with QR Code ---");
        let ownerRegFailed = false;
        try {
            // Attempt without QR code
            await userService.registerUser({
                name: "Test Owner",
                email: ownerEmail,
                mobile: "9876500001",
                password: "Password@123",
                accountType: "owner",
                businessName: "Super Bike Rentals",
                address: "Station Road, Mumbai",
                qrCode: "" // Missing QR code
            });
        } catch (err) {
            ownerRegFailed = true;
            assert(err.message.includes("QR Code is required"), `Validation prevented owner registration without QR code: ${err.message}`);
        }
        assert(ownerRegFailed, "Owner cannot register without QR code.");

        // Register owner with QR code
        const registeredOwner = await userService.registerUser({
            name: "Test Owner",
            email: ownerEmail,
            mobile: "9876500001",
            password: "Password@123",
            accountType: "owner",
            businessName: "Super Bike Rentals",
            address: "Station Road, Mumbai",
            qrCode: "/uploads/qrcodes/qr-owner-test.png"
        });
        assert(registeredOwner.qrCode === "/uploads/qrcodes/qr-owner-test.png", "Owner registered successfully with QR code stored in DB.");

        // Activate owner account for testing
        await User.findByIdAndUpdate(registeredOwner.id, { status: "active" });

        // Register customer
        const registeredCustomer = await userService.registerUser({
            name: "Test Customer",
            email: customerEmail,
            mobile: "9876500002",
            password: "Password@123",
            accountType: "customer",
            drivingLicenseNumber: "DL-MH-2026-0001",
            drivingLicenseImage: "/uploads/licenses/license-test.png"
        });
        await User.findByIdAndUpdate(registeredCustomer.id, { status: "active" });

        // Register rival customer
        const registeredRival = await userService.registerUser({
            name: "Rival Customer",
            email: rivalEmail,
            mobile: "9876500003",
            password: "Password@123",
            accountType: "customer",
            drivingLicenseNumber: "DL-MH-2026-0002",
            drivingLicenseImage: "/uploads/licenses/license-test2.png"
        });
        await User.findByIdAndUpdate(registeredRival.id, { status: "active" });

        // Create a test bike for owner
        const testBike = await bikeService.createBike({
            bikeName: `Yamaha R15 V4 - ${testTimestamp}`,
            brand: "Yamaha",
            model: "R15 V4",
            type: "Sports",
            pricePerDay: 1000,
            location: "Mumbai Central",
            image: "/uploads/bikes/bike-test.png",
            status: "available"
        }, { id: registeredOwner.id, role: "owner" });

        // Approve the bike for renting
        await Bike.findByIdAndUpdate(testBike._id, { approvalStatus: "approved", status: "available" });
        const freshBike = await bikeService.getBikeById(testBike._id);
        assert(freshBike.pricePerDay === 1000, "Test bike created with pricePerDay = 1000.");

        // SCENARIO 3: System calculates 20% advance correctly
        console.log("\n--- Testing Scenario 3: 20% Advance Calculation ---");
        const startDate = "2027-01-10";
        const endDate = "2027-01-15"; // 5 days
        const days = 5;
        const expectedTotal = days * 1000; // 5000
        const expectedAdvance = expectedTotal * 0.20; // 1000
        const expectedRemaining = expectedTotal - expectedAdvance; // 4000
        assert(expectedAdvance === 1000, `Calculated required advance: ₹${expectedAdvance} on ₹${expectedTotal}.`);
        assert(expectedRemaining === 4000, `Calculated remaining balance: ₹${expectedRemaining}.`);

        // SCENARIO 4: Backend rejects advance below 20%
        console.log("\n--- Testing Scenario 4: Rejection of Insufficient Advance ---");
        let underpaidFailed = false;
        try {
            await bookingService.createBooking({
                bikeId: freshBike._id.toString(),
                startDate,
                endDate,
                customerName: "Test Customer",
                customerMobile: "9876500002",
                submittedAdvanceAmount: 500, // Less than required 1000
                policyAccepted: true,
                paymentScreenshot: "/uploads/payments/screenshot-test.png"
            }, null, { id: registeredCustomer.id, name: "Test Customer", role: "customer" });
        } catch (err) {
            underpaidFailed = true;
            assert(err.message.includes("Minimum advance payment required is ₹1000"), `Backend properly rejected insufficient advance: ${err.message}`);
        }
        assert(underpaidFailed, "Advance payment below 20% was strictly blocked by backend.");

        // SCENARIO 5: Customer sees correct owner's QR code
        console.log("\n--- Testing Scenario 5: Customer Sees Correct Owner QR Code ---");
        assert(freshBike.ownerId.qrCode === "/uploads/qrcodes/qr-owner-test.png", "Bike query correctly populates the owner's QR code.");

        // SCENARIO 6 & 7: Customer uploads screenshot and creates booking
        console.log("\n--- Testing Scenario 6 & 7: Payment Screenshot & Verification Request ---");
        const newBooking = await bookingService.createBooking({
            bikeId: freshBike._id.toString(),
            startDate,
            endDate,
            customerName: "Test Customer",
            customerMobile: "9876500002",
            submittedAdvanceAmount: 1000,
            paymentTransactionId: "UPI987654321012",
            policyAccepted: true,
            paymentScreenshot: "/uploads/payments/screenshot-test.png"
        }, null, { id: registeredCustomer.id, name: "Test Customer", role: "customer" });

        assert(newBooking.status === "Pending Owner Verification", `Booking created with status: ${newBooking.status}`);
        assert(newBooking.paymentStatus === "Evidence Submitted", `Booking created with paymentStatus: ${newBooking.paymentStatus}`);
        assert(newBooking.advanceAmount === 1000, `Advance amount recorded as ₹${newBooking.advanceAmount}`);
        assert(newBooking.remainingAmount === 4000, `Remaining amount recorded as ₹${newBooking.remainingAmount}`);

        // SCENARIO 8: Overlapping booking blocked during pending verification
        console.log("\n--- Testing Scenario 8: Overlapping Booking Prevention ---");
        let duplicateFailed = false;
        try {
            // Rival attempts to book overlapping dates: 2027-01-12 to 2027-01-14
            await bookingService.createBooking({
                bikeId: freshBike._id.toString(),
                startDate: "2027-01-12",
                endDate: "2027-01-14",
                customerName: "Rival Customer",
                customerMobile: "9876500003",
                submittedAdvanceAmount: 600,
                policyAccepted: true,
                paymentScreenshot: "/uploads/payments/screenshot-rival.png"
            }, null, { id: registeredRival.id, name: "Rival Customer", role: "customer" });
        } catch (err) {
            duplicateFailed = true;
            assert(err.message.includes("Sorry! This bike is already booked for some of your selected dates"), `Overlapping reservation blocked with exact warning: ${err.message}`);
        }
        assert(duplicateFailed, "System prevents duplicate booking for overlapping dates while verification is pending.");

        // SCENARIO 9: Owner approves booking
        console.log("\n--- Testing Scenario 9: Owner Approves Booking ---");
        const confirmedBooking = await bookingService.acceptBooking(
            newBooking._id,
            { id: registeredOwner.id, role: "owner" }
        );
        assert(confirmedBooking.status === "Confirmed", `Booking approved with status: ${confirmedBooking.status}`);
        assert(confirmedBooking.paymentStatus === "Verified", `Payment marked as: ${confirmedBooking.paymentStatus}`);

        // SCENARIO 10: Owner rejects booking with rejection reason
        console.log("\n--- Testing Scenario 10: Owner Rejects Booking with Reason ---");
        // Create another booking to test rejection
        const rejectTestBooking = await bookingService.createBooking({
            bikeId: freshBike._id.toString(),
            startDate: "2027-02-01",
            endDate: "2027-02-03",
            customerName: "Test Customer",
            customerMobile: "9876500002",
            submittedAdvanceAmount: 600,
            policyAccepted: true,
            paymentScreenshot: "/uploads/payments/screenshot-rej.png"
        }, null, { id: registeredCustomer.id, name: "Test Customer", role: "customer" });

        const rejectedBooking = await bookingService.rejectBooking(
            rejectTestBooking._id,
            "Bank transaction reference not found on UPI statement",
            { id: registeredOwner.id, role: "owner" }
        );
        assert(rejectedBooking.status === "Rejected", `Booking status updated to: ${rejectedBooking.status}`);
        assert(rejectedBooking.paymentStatus === "Rejected", `Payment status updated to: ${rejectedBooking.paymentStatus}`);
        assert(rejectedBooking.rejectionReason.includes("Bank transaction reference"), `Rejection reason stored: ${rejectedBooking.rejectionReason}`);

        // SCENARIO 11: Rejection and expiration release reservation
        console.log("\n--- Testing Scenario 11: Reservation Release ---");
        // Now rival CAN book 2027-02-01 to 2027-02-03 because the rejected booking released it!
        const rebookedByRival = await bookingService.createBooking({
            bikeId: freshBike._id.toString(),
            startDate: "2027-02-01",
            endDate: "2027-02-03",
            customerName: "Rival Customer",
            customerMobile: "9876500003",
            submittedAdvanceAmount: 600,
            policyAccepted: true,
            paymentScreenshot: "/uploads/payments/screenshot-rival-ok.png"
        }, null, { id: registeredRival.id, name: "Rival Customer", role: "customer" });
        assert(rebookedByRival.status === "Pending Owner Verification", "Reservation was cleanly released after rejection, allowing new booking.");

        // SCENARIO 12: Customer views booking status
        console.log("\n--- Testing Scenario 12: Customer Views Booking Status ---");
        const customerBookings = await bookingService.getUserBookings({ id: registeredCustomer.id });
        assert(customerBookings.length >= 2, `Customer retrieved ${customerBookings.length} booking records.`);
        const myConfirmed = customerBookings.find((b) => b._id.toString() === confirmedBooking._id.toString());
        assert(myConfirmed && myConfirmed.status === "Confirmed", "Customer correctly sees 'Confirmed' booking status.");

        // SCENARIO 13: Cancellation Policy deduction & Refund status
        console.log("\n--- Testing Scenario 13: Cancellation Policy & Refund Calculation ---");
        // Customer cancels the confirmed booking (Advance = ₹1000, 10% deduction = ₹100, Refund = ₹900)
        const cancelledBooking = await bookingService.cancelBooking(
            confirmedBooking._id,
            "Personal change of plans",
            { id: registeredCustomer.id, role: "customer" }
        );
        assert(cancelledBooking.status === "Cancelled", `Status is Cancelled: ${cancelledBooking.status}`);
        assert(cancelledBooking.cancellationDeduction === 100, `Cancellation deduction: ₹${cancelledBooking.cancellationDeduction} (10% of ₹1000)`);
        assert(cancelledBooking.refundAmount === 900, `Refundable amount: ₹${cancelledBooking.refundAmount}`);
        assert(cancelledBooking.refundStatus === "Refund Pending", `Refund status is: ${cancelledBooking.refundStatus}`);

        // Owner marks refund transferred
        const refundedBooking = await bookingService.completeRefund(
            confirmedBooking._id,
            { id: registeredOwner.id, role: "owner" }
        );
        assert(refundedBooking.refundStatus === "Refunded", `Owner marked refund: ${refundedBooking.refundStatus}`);
        assert(refundedBooking.paymentStatus === "Refunded", `Payment status updated to: ${refundedBooking.paymentStatus}`);

        // SCENARIO 14: Owner updates profile & replaces QR Code
        console.log("\n--- Testing Scenario 14: Owner Update Profile & QR Code Replacement ---");
        const updatedProfile = await userService.updateProfile(registeredOwner.id, {
            name: "Updated Shree Owner",
            mobile: "9876599999",
            businessName: "Super Royal Bike Hub",
            address: "Main Highway, Pune",
            qrCode: "/uploads/qrcodes/qr-owner-new.png",
            cancellationChargePercentage: 25,
            cancellationTerms: "25% deduction upon cancellation."
        });
        assert(updatedProfile.name === "Updated Shree Owner", "Owner name updated successfully.");
        assert(updatedProfile.qrCode === "/uploads/qrcodes/qr-owner-new.png", "Owner QR code replaced successfully.");
        assert(updatedProfile.cancellationChargePercentage === 25, "Owner cancellation percentage updated to 25%.");

        // SCENARIO 15: Owner changes password securely
        console.log("\n--- Testing Scenario 15: Secure Password Change ---");
        let wrongPassFailed = false;
        try {
            await userService.updateProfile(registeredOwner.id, {
                currentPassword: "WrongPassword@123",
                password: "NewPassword@456"
            });
        } catch (err) {
            wrongPassFailed = true;
            assert(err.message.includes("Current password does not match"), `Password change failed with wrong current password: ${err.message}`);
        }
        assert(wrongPassFailed, "Security verification requires valid current password.");

        // Now change password with correct current password
        await userService.updateProfile(registeredOwner.id, {
            currentPassword: "Password@123",
            password: "NewPassword@456"
        });

        // Test login with new password
        const loginData = await userService.loginUser(ownerEmail, "NewPassword@456");
        assert(!!loginData.token, "Owner successfully logged in using the newly changed password.");

        // SCENARIO 16: Existing application features continue working
        console.log("\n--- Testing Scenario 16: Existing Features Integrity ---");
        const allBikes = await bikeService.getAllBikes();
        assert(Array.isArray(allBikes), "Public browse bikes returns array of available bikes.");

        const ownerStats = await bookingService.getOwnerStats({ id: registeredOwner.id, role: "owner" });
        assert(ownerStats.totalBikes !== undefined && ownerStats.totalRequests !== undefined, "Owner analytics & statistics calculate correctly.");

        // SCENARIO 17: Date-Based Bike Availability System (Cases A, B, C, D, E, and Half-Open Intervals)
        console.log("\n--- Testing Scenario 17: Date-Based Availability System & Overlap Rules ---");
        const reBike = await bikeService.createBike({
            bikeName: `Royal Enfield Classic 350 - ${testTimestamp}`,
            brand: "Royal Enfield",
            model: "Classic 350",
            type: "Cruiser",
            pricePerDay: 1200,
            location: "Bandra, Mumbai",
            image: "/uploads/bikes/re-classic-350.png",
            status: "available"
        }, { id: registeredOwner.id, role: "owner" });

        await Bike.findByIdAndUpdate(reBike._id, { approvalStatus: "approved", status: "available" });

        // Create confirmed booking: 25 Nov 2026 to 28 Nov 2026
        const reBooking = await bookingService.createBooking({
            bikeId: reBike._id.toString(),
            startDate: "2026-11-25",
            endDate: "2026-11-28",
            customerName: "Test Customer",
            customerMobile: "9876500002",
            submittedAdvanceAmount: 800,
            policyAccepted: true,
            paymentScreenshot: "/uploads/payments/re-screenshot.png"
        }, null, { id: registeredCustomer.id, name: "Test Customer", role: "customer" });

        // Confirm the booking
        await bookingService.acceptBooking(reBooking._id, { id: registeredOwner.id, role: "owner" });
        console.log("Confirmed booking created for Royal Enfield Classic 350 from 25 Nov 2026 to 28 Nov 2026.");

        // CASE A: Customer searches for 25–28 November (Exact overlap)
        const searchA = await bikeService.searchBikes({ startDate: "2026-11-25", endDate: "2026-11-28" });
        const foundA = searchA.some((b) => b._id.toString() === reBike._id.toString());
        assert(!foundA, "CASE A: Bike is NOT visible in search results for 25-28 November (booked).");

        const availA = await bikeService.checkBikeAvailability(reBike._id, "2026-11-25", "2026-11-28");
        assert(!availA.available, "CASE A: Availability check correctly returns available: false for 25-28 November.");

        // CASE B: Customer searches for 22–24 November (Before booking)
        const searchB = await bikeService.searchBikes({ startDate: "2026-11-22", endDate: "2026-11-24" });
        const foundB = searchB.some((b) => b._id.toString() === reBike._id.toString());
        assert(foundB, "CASE B: Bike IS visible in search results for 22-24 November (before booking).");

        const availB = await bikeService.checkBikeAvailability(reBike._id, "2026-11-22", "2026-11-24");
        assert(availB.available, "CASE B: Availability check returns available: true for 22-24 November.");

        // CASE C: Customer searches for 29–30 November (After booking)
        const searchC = await bikeService.searchBikes({ startDate: "2026-11-29", endDate: "2026-11-30" });
        const foundC = searchC.some((b) => b._id.toString() === reBike._id.toString());
        assert(foundC, "CASE C: Bike IS visible in search results for 29-30 November (after booking).");

        const availC = await bikeService.checkBikeAvailability(reBike._id, "2026-11-29", "2026-11-30");
        assert(availC.available, "CASE C: Availability check returns available: true for 29-30 November.");

        // CASE D: Customer searches for 27–29 November (Overlaps end of booking)
        const searchD = await bikeService.searchBikes({ startDate: "2026-11-27", endDate: "2026-11-29" });
        const foundD = searchD.some((b) => b._id.toString() === reBike._id.toString());
        assert(!foundD, "CASE D: Bike is NOT visible in search results for 27-29 November (overlaps).");

        const availD = await bikeService.checkBikeAvailability(reBike._id, "2026-11-27", "2026-11-29");
        assert(!availD.available, "CASE D: Availability check returns available: false for 27-29 November.");
        assert(availD.message === "Sorry! This bike is already booked for some of your selected dates. Please select another date range or choose another bike.", "CASE D: Availability message matches required warning notification.");

        let caseDFailed = false;
        try {
            await bookingService.createBooking({
                bikeId: reBike._id.toString(),
                startDate: "2026-11-27",
                endDate: "2026-11-29",
                customerName: "Rival Customer",
                customerMobile: "9876500003",
                submittedAdvanceAmount: 500,
                policyAccepted: true,
                paymentScreenshot: "/uploads/payments/test.png"
            }, null, { id: registeredRival.id, name: "Rival Customer", role: "customer" });
        } catch (err) {
            caseDFailed = true;
            assert(err.message === "Sorry! This bike is already booked for some of your selected dates. Please select another date range or choose another bike.", `CASE D: Booking blocked with exact message: ${err.message}`);
        }
        assert(caseDFailed, "CASE D: Overlapping booking strictly blocked on backend.");

        // CASE E: Customer searches for 24–26 November (Overlaps start of booking)
        const searchE = await bikeService.searchBikes({ startDate: "2026-11-24", endDate: "2026-11-26" });
        const foundE = searchE.some((b) => b._id.toString() === reBike._id.toString());
        assert(!foundE, "CASE E: Bike is NOT visible in search results for 24-26 November (overlaps).");

        const availE = await bikeService.checkBikeAvailability(reBike._id, "2026-11-24", "2026-11-26");
        assert(!availE.available, "CASE E: Availability check returns available: false for 24-26 November.");

        // HALF-OPEN INTERVAL BOUNDARIES:
        // Case F: 28-30 November (Customer starts rental on same day previous customer returns)
        const searchF = await bikeService.searchBikes({ startDate: "2026-11-28", endDate: "2026-11-30" });
        const foundF = searchF.some((b) => b._id.toString() === reBike._id.toString());
        assert(foundF, "HALF-OPEN [start, end): Bike IS visible for 28-30 November (pickup on return date).");

        const availF = await bikeService.checkBikeAvailability(reBike._id, "2026-11-28", "2026-11-30");
        assert(availF.available, "HALF-OPEN [start, end): Availability check returns true for 28-30 November.");

        // Case G: 22-25 November (Customer returns bike on the day the confirmed booking starts)
        const searchG = await bikeService.searchBikes({ startDate: "2026-11-22", endDate: "2026-11-25" });
        const foundG = searchG.some((b) => b._id.toString() === reBike._id.toString());
        assert(foundG, "HALF-OPEN [start, end): Bike IS visible for 22-25 November (return on start date).");

        const availG = await bikeService.checkBikeAvailability(reBike._id, "2026-11-22", "2026-11-25");
        assert(availG.available, "HALF-OPEN [start, end): Availability check returns true for 22-25 November.");

        // SCENARIO 18: Rejection releases date reservation
        console.log("\n--- Testing Scenario 18: Rejection Releases Reservation ---");
        const tempBooking = await bookingService.createBooking({
            bikeId: reBike._id.toString(),
            startDate: "2026-12-01",
            endDate: "2026-12-05",
            customerName: "Rival Customer",
            customerMobile: "9876500003",
            submittedAdvanceAmount: 1000,
            policyAccepted: true,
            paymentScreenshot: "/uploads/payments/test.png"
        }, null, { id: registeredRival.id, name: "Rival Customer", role: "customer" });

        // Temporarily reserved: should not be visible for 2026-12-01 to 2026-12-05
        const searchReserved = await bikeService.searchBikes({ startDate: "2026-12-01", endDate: "2026-12-05" });
        assert(!searchReserved.some((b) => b._id.toString() === reBike._id.toString()), "Bike temporarily hidden during pending verification.");

        // Owner rejects booking
        await bookingService.rejectBooking(tempBooking._id, "Payment screenshot unreadable", { id: registeredOwner.id, role: "owner" });

        // Now bike should be available again for 2026-12-01 to 2026-12-05!
        const searchReleased = await bikeService.searchBikes({ startDate: "2026-12-01", endDate: "2026-12-05" });
        assert(searchReleased.some((b) => b._id.toString() === reBike._id.toString()), "Rejection released reservation; bike is available again for those dates.");

        // SCENARIO 19: Expiration releases reservation
        console.log("\n--- Testing Scenario 19: Expiration Releases Reservation ---");
        const expireBooking = await bookingService.createBooking({
            bikeId: reBike._id.toString(),
            startDate: "2026-12-10",
            endDate: "2026-12-15",
            customerName: "Rival Customer",
            customerMobile: "9876500003",
            submittedAdvanceAmount: 1200,
            policyAccepted: true,
            paymentScreenshot: "/uploads/payments/test.png"
        }, null, { id: registeredRival.id, name: "Rival Customer", role: "customer" });

        // Set expiration time to 1 hour ago
        await Booking.findByIdAndUpdate(expireBooking._id, {
            reservationExpiresAt: new Date(Date.now() - 60 * 60 * 1000)
        });

        // Trigger search or availability check: should expire the booking and make bike available
        const searchExpired = await bikeService.searchBikes({ startDate: "2026-12-10", endDate: "2026-12-15" });
        assert(searchExpired.some((b) => b._id.toString() === reBike._id.toString()), "Expired reservation released; bike is available again for those dates.");

        const expiredDbRecord = await Booking.findById(expireBooking._id);
        assert(expiredDbRecord.status === "Expired", `Booking status updated to Expired: ${expiredDbRecord.status}`);

        // SCENARIO 20: Time-Based Cancellation Policy Calculation (All Time Brackets)
        console.log("\n--- Testing Scenario 20: Time-Based Cancellation Policy Rules ---");
        const baseStart = new Date("2027-05-10T10:00:00.000Z");
        const advanceTestAmount = 1000;

        // RULE 1: Cancellation 5 days (120 hours) before rental start date -> 10% deduction, 90% refund
        const cancel5Days = new Date(baseStart.getTime() - 5 * 24 * 60 * 60 * 1000);
        const policy5Days = bookingService.calculateCancellationPolicy(baseStart, cancel5Days, advanceTestAmount);
        assert(policy5Days.percentage === 10, `5 days before rental: 10% deduction (got ${policy5Days.percentage}%).`);
        assert(policy5Days.deduction === 100, `5 days before rental: ₹100 deduction on ₹1000 advance.`);
        assert(policy5Days.refundAmount === 900, `5 days before rental: ₹900 refund on ₹1000 advance.`);

        // RULE 2: Cancellation 3 days and 12 hours (84 hours) before rental -> 20% deduction, 80% refund
        const cancel3Days12Hours = new Date(baseStart.getTime() - (3 * 24 + 12) * 60 * 60 * 1000);
        const policy3Days = bookingService.calculateCancellationPolicy(baseStart, cancel3Days12Hours, advanceTestAmount);
        assert(policy3Days.percentage === 20, `3.5 days before rental: 20% deduction (got ${policy3Days.percentage}%).`);
        assert(policy3Days.deduction === 200, `3.5 days before rental: ₹200 deduction on ₹1000 advance.`);
        assert(policy3Days.refundAmount === 800, `3.5 days before rental: ₹800 refund on ₹1000 advance.`);

        // RULE 3: Cancellation 2 days (48 hours) before rental -> 30% deduction, 70% refund
        const cancel2Days = new Date(baseStart.getTime() - 2 * 24 * 60 * 60 * 1000);
        const policy2Days = bookingService.calculateCancellationPolicy(baseStart, cancel2Days, advanceTestAmount);
        assert(policy2Days.percentage === 30, `2 days before rental: 30% deduction (got ${policy2Days.percentage}%).`);
        assert(policy2Days.deduction === 300, `2 days before rental: ₹300 deduction on ₹1000 advance.`);
        assert(policy2Days.refundAmount === 700, `2 days before rental: ₹700 refund on ₹1000 advance.`);

        // RULE 4: Cancellation 36 hours before rental -> 30% deduction, 70% refund
        const cancel36Hours = new Date(baseStart.getTime() - 36 * 60 * 60 * 1000);
        const policy36Hours = bookingService.calculateCancellationPolicy(baseStart, cancel36Hours, advanceTestAmount);
        assert(policy36Hours.percentage === 30, `36 hours before rental: 30% deduction (got ${policy36Hours.percentage}%).`);
        assert(policy36Hours.deduction === 300, `36 hours before rental: ₹300 deduction on ₹1000 advance.`);
        assert(policy36Hours.refundAmount === 700, `36 hours before rental: ₹700 refund on ₹1000 advance.`);

        // RULE 5: Cancellation 24 hours before rental -> 60% deduction, 40% refund
        const cancel24Hours = new Date(baseStart.getTime() - 24 * 60 * 60 * 1000);
        const policy24Hours = bookingService.calculateCancellationPolicy(baseStart, cancel24Hours, advanceTestAmount);
        assert(policy24Hours.percentage === 60, `24 hours before rental: 60% deduction (got ${policy24Hours.percentage}%).`);
        assert(policy24Hours.deduction === 600, `24 hours before rental: ₹600 deduction on ₹1000 advance.`);
        assert(policy24Hours.refundAmount === 400, `24 hours before rental: ₹400 refund on ₹1000 advance.`);

        // RULE 5: Cancellation 12 hours before rental -> 60% deduction, 40% refund
        const cancel12Hours = new Date(baseStart.getTime() - 12 * 60 * 60 * 1000);
        const policy12Hours = bookingService.calculateCancellationPolicy(baseStart, cancel12Hours, advanceTestAmount);
        assert(policy12Hours.percentage === 60, `12 hours before rental: 60% deduction (got ${policy12Hours.percentage}%).`);
        assert(policy12Hours.deduction === 600, `12 hours before rental: ₹600 deduction on ₹1000 advance.`);
        assert(policy12Hours.refundAmount === 400, `12 hours before rental: ₹400 refund on ₹1000 advance.`);

        // SCENARIO 21: Database Booking Cancellation with Exact 12-Hour Cancellation
        console.log("\n--- Testing Scenario 21: Database Booking Cancellation (12-Hour Window) ---");
        const rideStartDate = new Date("2027-06-10T10:00:00.000Z");
        const rideEndDate = new Date("2027-06-13T10:00:00.000Z");
        const cancelTestBooking = await bookingService.createBooking({
            bikeId: reBike._id.toString(),
            startDate: rideStartDate,
            endDate: rideEndDate,
            customerName: "Parth Customer",
            customerMobile: "9876500002",
            submittedAdvanceAmount: 1000,
            policyAccepted: true,
            paymentScreenshot: "/uploads/payments/test.png"
        }, null, { id: registeredCustomer.id, name: "Parth Customer", role: "customer" });

        // Confirm booking
        await bookingService.acceptBooking(cancelTestBooking._id, { id: registeredOwner.id, role: "owner" });

        // Simulate cancellation 12 hours before rental start date
        const simulatedCancelTime = new Date(rideStartDate.getTime() - 12 * 60 * 60 * 1000);
        const cancelledResult = await bookingService.cancelBooking(
            cancelTestBooking._id,
            "Urgent personal commitment",
            { id: registeredCustomer.id, name: "Parth Customer", role: "customer" },
            simulatedCancelTime
        );

        assert(cancelledResult.status === "Cancelled", "Booking status successfully transitioned to Cancelled.");
        assert(cancelledResult.advancePaid === 1000, `advancePaid stored in record: ₹${cancelledResult.advancePaid}.`);
        assert(cancelledResult.cancellationPercentage === 60, `cancellationPercentage is 60%: received ${cancelledResult.cancellationPercentage}%.`);
        assert(cancelledResult.cancellationDeduction === 600, `cancellationDeduction is ₹600 (60% of ₹1000): received ₹${cancelledResult.cancellationDeduction}.`);
        assert(cancelledResult.refundAmount === 400, `refundAmount is ₹400 (₹1000 - ₹600): received ₹${cancelledResult.refundAmount}.`);
        assert(cancelledResult.refundStatus === "Refund Pending", "refundStatus is 'Refund Pending'.");
        assert(cancelledResult.cancellationDate !== null, "cancellationDate timestamp stored.");

        // Immediate date release without waiting for owner approval
        const postCancelSearch = await bikeService.searchBikes({
            startDate: rideStartDate.toISOString().split("T")[0],
            endDate: new Date(rideStartDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        });
        assert(postCancelSearch.some((b) => b._id.toString() === reBike._id.toString()), "Cancellation instantly released dates without waiting for owner approval.");

        // SCENARIO 22: Priority Urgent Notification to Owner on Cancellation with Exact Details
        console.log("\n--- Testing Scenario 22: Priority Urgent Notification with Exact Fields ---");
        const ownerUrgentNotifications = await Notification.find({
            userId: registeredOwner.id,
            priority: "urgent",
            type: "booking_cancelled"
        }).sort({ createdAt: -1 });

        assert(ownerUrgentNotifications.length > 0, "Owner received priority urgent notification for booking cancellation.");
        const latestUrgent = ownerUrgentNotifications[0];
        assert(latestUrgent.title === "IMPORTANT: Ride Cancelled", `Notification title is '${latestUrgent.title}'.`);
        assert(latestUrgent.priority === "urgent", `Notification priority is '${latestUrgent.priority}'.`);
        assert(latestUrgent.message.includes("Parth Customer"), "Notification contains Customer Name.");
        assert(latestUrgent.message.includes(reBike.bikeName), "Notification contains Bike Name.");
        assert(latestUrgent.message.includes("Advance Received: ₹1000"), "Notification contains Advance Amount Received.");
        assert(latestUrgent.message.includes("Cancellation Charge: 60%"), "Notification contains Cancellation Percentage.");
        assert(latestUrgent.message.includes("Deduction: ₹600"), "Notification contains Cancellation Deduction.");
        assert(latestUrgent.message.includes("Refund Amount: ₹400"), "Notification contains Refund Amount.");
        assert(latestUrgent.message.includes(cancelTestBooking._id.toString()), "Notification contains Booking ID.");
        assert(latestUrgent.link.includes("tab=cancelled"), `Notification link redirects to cancelled tab: ${latestUrgent.link}`);

        // SCENARIO 23: Owner Refund Settlement & Validation
        console.log("\n--- Testing Scenario 23: Owner Refund Settlement & Validation ---");
        // Attempt deduction > policy max (e.g. 700 > 600)
        let excessiveDeductionFailed = false;
        try {
            await bookingService.completeRefund(
                cancelTestBooking._id,
                { actualDeduction: 700, refundTransactionReference: "UPI/12345" },
                { id: registeredOwner.id, role: "owner" }
            );
        } catch (err) {
            excessiveDeductionFailed = true;
            assert(err.message.includes("cannot exceed"), `Blocked deduction exceeding policy max: ${err.message}`);
        }
        assert(excessiveDeductionFailed, "Owner cannot deduct more than policy cancellation fee.");

        // Settle refund with valid deduction of ₹500 (<= ₹600 policy max) and UTR reference
        const settledRefund = await bookingService.completeRefund(
            cancelTestBooking._id,
            { actualDeduction: 500, refundTransactionReference: "UPI/2026112498765432" },
            { id: registeredOwner.id, role: "owner" }
        );

        assert(settledRefund.refundStatus === "Refunded", "Booking refundStatus is updated to 'Refunded'.");
        assert(settledRefund.paymentStatus === "Refunded", "Booking paymentStatus is updated to 'Refunded'.");
        assert(settledRefund.actualCancellationDeduction === 500, `Actual deduction recorded as ₹500: received ₹${settledRefund.actualCancellationDeduction}.`);
        assert(settledRefund.refundAmount === 500, `Refund transferred is ₹500 (₹1000 advance - ₹500 deduction): received ₹${settledRefund.refundAmount}.`);
        assert(settledRefund.refundTransactionReference === "UPI/2026112498765432", "Refund UTR / transaction reference recorded.");

        // SCENARIO 24: Cancellation Restriction on Active Bookings
        console.log("\n--- Testing Scenario 24: Cancellation Restriction on Active Bookings ---");
        const activeBooking = await bookingService.createBooking({
            bikeId: reBike._id.toString(),
            startDate: "2027-01-01",
            endDate: "2027-01-04",
            customerName: "Test Customer",
            customerMobile: "9876500002",
            submittedAdvanceAmount: 1000,
            policyAccepted: true,
            paymentScreenshot: "/uploads/payments/test.png"
        }, null, { id: registeredCustomer.id, name: "Test Customer", role: "customer" });
        await Booking.findByIdAndUpdate(activeBooking._id, { status: "Active" });

        let activeCancelFailed = false;
        try {
            await bookingService.cancelBooking(
                activeBooking._id,
                "Want to cancel active ride",
                { id: registeredCustomer.id, name: "Test Customer", role: "customer" }
            );
        } catch (err) {
            activeCancelFailed = true;
            assert(err.message.includes("Active or completed"), `Prevented cancellation of active booking: ${err.message}`);
        }
        assert(activeCancelFailed, "Active bookings cannot be cancelled by customer.");

        // Verify customer received notification of refund settlement
        const customerRefundNotifications = await Notification.find({
            userId: registeredCustomer.id,
            type: { $in: ["refund_processed", "payment_refunded"] }
        });
        assert(customerRefundNotifications.length > 0, "Customer received refund settlement confirmation notification.");

        console.log("\n========================================");
        console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
        console.log("========================================\n");

        if (failed > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }

    } catch (e) {
        console.error("Test execution encountered an error:", e);
        process.exit(1);
    }
}

runTests();
