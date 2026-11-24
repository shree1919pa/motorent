const ExcelJS = require("exceljs");
const User = require("../models/User");
const Bike = require("../models/Bike");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

// ===================================================
// DATE RANGE PARSER HELPER
// ===================================================

const buildDateFilter = (query = {}, dateField = "createdAt") => {
    const { range, startDate, endDate, exportAll } = query;

    if (exportAll === "true" || exportAll === true || range === "all") {
        return {};
    }

    const now = new Date();
    let start = null;
    let end = new Date(now);

    if (range === "today") {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (range === "7days") {
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "thisMonth") {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else if (range === "6months") {
        start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0);
    } else if (range === "thisYear") {
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    } else if (startDate || endDate) {
        if (startDate) start = new Date(startDate);
        if (endDate) {
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        }
    }

    if (start || end) {
        const dateCond = {};
        if (start && !isNaN(start.getTime())) dateCond.$gte = start;
        if (end && !isNaN(end.getTime())) dateCond.$lte = end;
        if (Object.keys(dateCond).length > 0) {
            return { [dateField]: dateCond };
        }
    }

    return {};
};

// Months helper for 12 months timeline
const getMonthsArray = () => [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// ===================================================
// 1. REPORT SUMMARY OVERVIEW
// ===================================================

const getSummary = async (query = {}) => {
    const userDateFilter = buildDateFilter(query, "createdAt");
    const bikeDateFilter = buildDateFilter(query, "createdAt");
    const bookingDateFilter = buildDateFilter(query, "createdAt");
    const paymentDateFilter = buildDateFilter(query, "createdAt");

    // Clients Stats
    const clientBase = { role: "customer", ...userDateFilter };
    const [
        totalClients,
        activeClients,
        pendingClients,
        blockedClients,
        rejectedClients
    ] = await Promise.all([
        User.countDocuments(clientBase),
        User.countDocuments({ ...clientBase, status: "active", isBlocked: { $ne: true } }),
        User.countDocuments({ ...clientBase, status: "pending" }),
        User.countDocuments({ ...clientBase, $or: [{ status: "blocked" }, { isBlocked: true }] }),
        User.countDocuments({ ...clientBase, status: "rejected" })
    ]);

    // Bike Owners Stats
    const ownerBase = { role: "owner", ...userDateFilter };
    const [
        totalOwners,
        activeOwners,
        pendingOwners,
        blockedOwners,
        rejectedOwners
    ] = await Promise.all([
        User.countDocuments(ownerBase),
        User.countDocuments({ ...ownerBase, status: "active", isBlocked: { $ne: true } }),
        User.countDocuments({ ...ownerBase, status: "pending" }),
        User.countDocuments({ ...ownerBase, $or: [{ status: "blocked" }, { isBlocked: true }] }),
        User.countDocuments({ ...ownerBase, status: "rejected" })
    ]);

    // Bikes Stats
    const bikeBase = { ...bikeDateFilter };
    const [
        totalBikes,
        approvedBikes,
        pendingBikes,
        blockedBikes,
        rejectedBikes,
        availableBikes,
        unavailableBikes
    ] = await Promise.all([
        Bike.countDocuments(bikeBase),
        Bike.countDocuments({ ...bikeBase, approvalStatus: "approved", isBlocked: { $ne: true } }),
        Bike.countDocuments({ ...bikeBase, approvalStatus: "pending" }),
        Bike.countDocuments({ ...bikeBase, $or: [{ approvalStatus: "blocked" }, { isBlocked: true }] }),
        Bike.countDocuments({ ...bikeBase, approvalStatus: "rejected" }),
        Bike.countDocuments({ ...bikeBase, status: "available" }),
        Bike.countDocuments({ ...bikeBase, status: "unavailable" })
    ]);

    // Bookings Stats
    const bookingBase = { ...bookingDateFilter };
    const [
        totalBookings,
        completedBookings,
        cancelledBookings,
        confirmedBookings,
        pendingBookings
    ] = await Promise.all([
        Booking.countDocuments(bookingBase),
        Booking.countDocuments({ ...bookingBase, status: "completed" }),
        Booking.countDocuments({ ...bookingBase, status: "cancelled" }),
        Booking.countDocuments({ ...bookingBase, status: "confirmed" }),
        Booking.countDocuments({ ...bookingBase, status: "pending" })
    ]);

    // Total Revenue (from completed bookings / successful payments)
    const revenueAgg = await Payment.aggregate([
        { $match: { paymentStatus: "successful", ...paymentDateFilter } },
        { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
    ]);

    const bookingRevenueAgg = await Booking.aggregate([
        { $match: { status: { $in: ["completed", "confirmed"] }, ...bookingDateFilter } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]);

    const totalRevenue = (revenueAgg[0]?.totalRevenue || 0) + (bookingRevenueAgg[0]?.totalRevenue || 0);

    return {
        clients: {
            total: totalClients,
            active: activeClients,
            pending: pendingClients,
            blocked: blockedClients,
            rejected: rejectedClients
        },
        owners: {
            total: totalOwners,
            active: activeOwners,
            pending: pendingOwners,
            blocked: blockedOwners,
            rejected: rejectedOwners
        },
        bikes: {
            total: totalBikes,
            approved: approvedBikes,
            pending: pendingBikes,
            blocked: blockedBikes,
            rejected: rejectedBikes,
            available: availableBikes,
            unavailable: unavailableBikes
        },
        bookings: {
            total: totalBookings,
            completed: completedBookings,
            cancelled: cancelledBookings,
            confirmed: confirmedBookings,
            pending: pendingBookings
        },
        revenue: {
            total: totalRevenue
        }
    };
};

// ===================================================
// 2. CLIENT REPORT
// ===================================================

const getClientReports = async (query = {}) => {
    const userDateFilter = buildDateFilter(query, "createdAt");
    const clientBase = { role: "customer", ...userDateFilter };

    // Status breakdown
    const [active, pending, blocked, rejected, total] = await Promise.all([
        User.countDocuments({ ...clientBase, status: "active", isBlocked: { $ne: true } }),
        User.countDocuments({ ...clientBase, status: "pending" }),
        User.countDocuments({ ...clientBase, $or: [{ status: "blocked" }, { isBlocked: true }] }),
        User.countDocuments({ ...clientBase, status: "rejected" }),
        User.countDocuments(clientBase)
    ]);

    // Monthly registration stats for current / filtered year
    const monthlyData = await User.aggregate([
        { $match: { role: "customer", ...userDateFilter } },
        {
            $group: {
                _id: { $month: "$createdAt" },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    const months = getMonthsArray();
    const monthlyRegistrations = months.map((name, index) => {
        const found = monthlyData.find((m) => m._id === index + 1);
        return {
            month: name,
            count: found ? found.count : 0
        };
    });

    return {
        totalRegistered: total,
        statusDistribution: [
            { name: "Active", value: active, color: "#10B981" },
            { name: "Pending", value: pending, color: "#F59E0B" },
            { name: "Blocked", value: blocked, color: "#EF4444" },
            { name: "Rejected", value: rejected, color: "#64748B" }
        ],
        monthlyRegistrations
    };
};

// ===================================================
// 3. BIKE OWNER REPORT
// ===================================================

const getOwnerReports = async (query = {}) => {
    const userDateFilter = buildDateFilter(query, "createdAt");
    const ownerBase = { role: "owner", ...userDateFilter };

    const [active, pending, blocked, rejected, total] = await Promise.all([
        User.countDocuments({ ...ownerBase, status: "active", isBlocked: { $ne: true } }),
        User.countDocuments({ ...ownerBase, status: "pending" }),
        User.countDocuments({ ...ownerBase, $or: [{ status: "blocked" }, { isBlocked: true }] }),
        User.countDocuments({ ...ownerBase, status: "rejected" }),
        User.countDocuments(ownerBase)
    ]);

    const monthlyData = await User.aggregate([
        { $match: { role: "owner", ...userDateFilter } },
        {
            $group: {
                _id: { $month: "$createdAt" },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    const months = getMonthsArray();
    const monthlyRegistrations = months.map((name, index) => {
        const found = monthlyData.find((m) => m._id === index + 1);
        return {
            month: name,
            count: found ? found.count : 0
        };
    });

    return {
        totalRegistered: total,
        statusDistribution: [
            { name: "Active", value: active, color: "#10B981" },
            { name: "Pending", value: pending, color: "#F59E0B" },
            { name: "Blocked", value: blocked, color: "#EF4444" },
            { name: "Rejected", value: rejected, color: "#64748B" }
        ],
        monthlyRegistrations
    };
};

// ===================================================
// 4. APPROVAL ANALYTICS (COMPARISON)
// ===================================================

const getApprovalAnalytics = async (query = {}) => {
    const userDateFilter = buildDateFilter(query, "createdAt");

    const [clientStats, ownerStats] = await Promise.all([
        Promise.all([
            User.countDocuments({ role: "customer", ...userDateFilter }),
            User.countDocuments({ role: "customer", status: "active", isBlocked: { $ne: true }, ...userDateFilter }),
            User.countDocuments({ role: "customer", status: "pending", ...userDateFilter }),
            User.countDocuments({ role: "customer", status: "rejected", ...userDateFilter }),
            User.countDocuments({ role: "customer", $or: [{ status: "blocked" }, { isBlocked: true }], ...userDateFilter })
        ]),
        Promise.all([
            User.countDocuments({ role: "owner", ...userDateFilter }),
            User.countDocuments({ role: "owner", status: "active", isBlocked: { $ne: true }, ...userDateFilter }),
            User.countDocuments({ role: "owner", status: "pending", ...userDateFilter }),
            User.countDocuments({ role: "owner", status: "rejected", ...userDateFilter }),
            User.countDocuments({ role: "owner", $or: [{ status: "blocked" }, { isBlocked: true }], ...userDateFilter })
        ])
    ]);

    const comparison = [
        {
            category: "Registered",
            Clients: clientStats[0],
            Owners: ownerStats[0]
        },
        {
            category: "Approved",
            Clients: clientStats[1],
            Owners: ownerStats[1]
        },
        {
            category: "Pending",
            Clients: clientStats[2],
            Owners: ownerStats[2]
        },
        {
            category: "Rejected",
            Clients: clientStats[3],
            Owners: ownerStats[3]
        },
        {
            category: "Blocked",
            Clients: clientStats[4],
            Owners: ownerStats[4]
        }
    ];

    return { comparison };
};

// ===================================================
// 5. BIKE REPORT
// ===================================================

const getBikeReports = async (query = {}) => {
    const bikeDateFilter = buildDateFilter(query, "createdAt");

    const [
        total,
        approved,
        pending,
        blocked,
        rejected,
        available,
        unavailable
    ] = await Promise.all([
        Bike.countDocuments(bikeDateFilter),
        Bike.countDocuments({ approvalStatus: "approved", isBlocked: { $ne: true }, ...bikeDateFilter }),
        Bike.countDocuments({ approvalStatus: "pending", ...bikeDateFilter }),
        Bike.countDocuments({ $or: [{ approvalStatus: "blocked" }, { isBlocked: true }], ...bikeDateFilter }),
        Bike.countDocuments({ approvalStatus: "rejected", ...bikeDateFilter }),
        Bike.countDocuments({ status: "available", ...bikeDateFilter }),
        Bike.countDocuments({ status: "unavailable", ...bikeDateFilter })
    ]);

    // Brand distribution
    const brandAgg = await Bike.aggregate([
        { $match: bikeDateFilter },
        { $group: { _id: "$brand", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
    ]);

    const brandDistribution = brandAgg.map((b) => ({
        brand: b._id || "Other",
        count: b.count
    }));

    // Type distribution
    const typeAgg = await Bike.aggregate([
        { $match: bikeDateFilter },
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    const colors = ["#2563EB", "#F97316", "#10B981", "#8B5CF6", "#EC4899", "#64748B"];
    const typeDistribution = typeAgg.map((t, idx) => ({
        name: t._id ? (t._id.charAt(0).toUpperCase() + t._id.slice(1)) : "Other",
        value: t.count,
        color: colors[idx % colors.length]
    }));

    return {
        summary: {
            total,
            approved,
            pending,
            blocked,
            rejected,
            available,
            unavailable
        },
        statusDistribution: [
            { name: "Approved", value: approved, color: "#10B981" },
            { name: "Pending", value: pending, color: "#F59E0B" },
            { name: "Blocked", value: blocked, color: "#EF4444" },
            { name: "Rejected", value: rejected, color: "#64748B" }
        ],
        brandDistribution,
        typeDistribution
    };
};

// ===================================================
// 6. BOOKING REPORT
// ===================================================

const getBookingReports = async (query = {}) => {
    const bookingDateFilter = buildDateFilter(query, "createdAt");

    const [
        total,
        pending,
        confirmed,
        completed,
        cancelled
    ] = await Promise.all([
        Booking.countDocuments(bookingDateFilter),
        Booking.countDocuments({ status: "pending", ...bookingDateFilter }),
        Booking.countDocuments({ status: "confirmed", ...bookingDateFilter }),
        Booking.countDocuments({ status: "completed", ...bookingDateFilter }),
        Booking.countDocuments({ status: "cancelled", ...bookingDateFilter })
    ]);

    // Monthly bookings
    const monthlyData = await Booking.aggregate([
        { $match: bookingDateFilter },
        {
            $group: {
                _id: { $month: "$createdAt" },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    const months = getMonthsArray();
    const monthlyBookings = months.map((name, index) => {
        const found = monthlyData.find((m) => m._id === index + 1);
        return {
            month: name,
            bookings: found ? found.count : 0
        };
    });

    // Most rented bikes
    const mostRentedBikesAgg = await Booking.aggregate([
        { $match: bookingDateFilter },
        {
            $group: {
                _id: "$bikeId",
                totalBookings: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" }
            }
        },
        { $sort: { totalBookings: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: "bikes",
                localField: "_id",
                foreignField: "_id",
                as: "bike"
            }
        },
        { $unwind: { path: "$bike", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "users",
                localField: "bike.ownerId",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } }
    ]);

    const mostRentedBikes = mostRentedBikesAgg.map((item, idx) => ({
        rank: idx + 1,
        bikeId: item._id,
        bikeName: item.bike?.bikeName || "Motorcycle",
        brand: item.bike?.brand || "Generic",
        ownerName: item.owner?.name || "Verified Owner",
        totalBookings: item.totalBookings,
        totalRevenue: item.totalRevenue || 0
    }));

    return {
        summary: {
            total,
            pending,
            confirmed,
            completed,
            cancelled
        },
        statusDistribution: [
            { name: "Completed", value: completed, color: "#10B981" },
            { name: "Confirmed", value: confirmed, color: "#2563EB" },
            { name: "Pending", value: pending, color: "#F59E0B" },
            { name: "Cancelled", value: cancelled, color: "#EF4444" }
        ],
        monthlyBookings,
        mostRentedBikes
    };
};

// ===================================================
// 7. REVENUE / PAYMENT REPORT
// ===================================================

const getPaymentReports = async (query = {}) => {
    const paymentDateFilter = buildDateFilter(query, "createdAt");
    const bookingDateFilter = buildDateFilter(query, "createdAt");

    const [
        successfulPayments,
        pendingPayments,
        failedPayments,
        refundedPayments,
        paymentStats
    ] = await Promise.all([
        Payment.countDocuments({ paymentStatus: "successful", ...paymentDateFilter }),
        Payment.countDocuments({ paymentStatus: "pending", ...paymentDateFilter }),
        Payment.countDocuments({ paymentStatus: "failed", ...paymentDateFilter }),
        Payment.countDocuments({ paymentStatus: "refunded", ...paymentDateFilter }),
        Payment.aggregate([
            { $match: paymentDateFilter },
            {
                $group: {
                    _id: "$paymentStatus",
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ])
    ]);

    const totalPaymentsCount = paymentStats.reduce((acc, curr) => acc + curr.count, 0);
    const successfulAmount = paymentStats.find((p) => p._id === "successful")?.totalAmount || 0;
    const refundedAmount = paymentStats.find((p) => p._id === "refunded")?.totalAmount || 0;

    // Monthly revenue from payments + completed bookings
    const monthlyPaymentAgg = await Payment.aggregate([
        { $match: { paymentStatus: "successful", ...paymentDateFilter } },
        {
            $group: {
                _id: { $month: "$paidAt" },
                revenue: { $sum: "$amount" }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    const months = getMonthsArray();
    const monthlyRevenue = months.map((name, index) => {
        const found = monthlyPaymentAgg.find((m) => m._id === index + 1);
        return {
            month: name,
            revenue: found ? found.revenue : 0
        };
    });

    // Top earning bike owners
    const topOwnersAgg = await Booking.aggregate([
        { $match: { status: { $in: ["completed", "confirmed"] }, ...bookingDateFilter } },
        {
            $group: {
                _id: "$ownerId",
                totalBookings: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" }
            }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } }
    ]);

    const topOwners = topOwnersAgg.map((o) => ({
        ownerId: o._id,
        ownerName: o.owner?.name || "Partner Owner",
        email: o.owner?.email || "owner@motorent.com",
        totalBookings: o.totalBookings,
        totalRevenue: o.totalRevenue || 0
    }));

    // Top earning bikes
    const topBikesAgg = await Booking.aggregate([
        { $match: { status: { $in: ["completed", "confirmed"] }, ...bookingDateFilter } },
        {
            $group: {
                _id: "$bikeId",
                totalBookings: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" }
            }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: "bikes",
                localField: "_id",
                foreignField: "_id",
                as: "bike"
            }
        },
        { $unwind: { path: "$bike", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "users",
                localField: "bike.ownerId",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } }
    ]);

    const topBikes = topBikesAgg.map((b) => ({
        bikeId: b._id,
        bikeName: b.bike?.bikeName || "Fleet Bike",
        ownerName: b.owner?.name || "Verified Owner",
        totalBookings: b.totalBookings,
        revenue: b.totalRevenue || 0
    }));

    return {
        summary: {
            totalRevenue: successfulAmount,
            totalPayments: totalPaymentsCount,
            successfulPayments,
            pendingPayments,
            failedPayments,
            refundedAmount
        },
        monthlyRevenue,
        topOwners,
        topBikes
    };
};

// ===================================================
// 8. BLOCKED & REJECTED ACCOUNTS REPORT
// ===================================================

const getBlockedAndRejectedReports = async (query = {}) => {
    const userDateFilter = buildDateFilter(query, "updatedAt");

    const [blockedUsers, rejectedUsers] = await Promise.all([
        User.find({
            $or: [{ status: "blocked" }, { isBlocked: true }],
            ...userDateFilter
        })
            .populate("blockedBy", "name email")
            .select("name email role status isBlocked blockReason blockedAt blockedBy createdAt updatedAt")
            .sort({ updatedAt: -1 })
            .lean(),
        User.find({
            status: "rejected",
            ...userDateFilter
        })
            .select("name email role status createdAt updatedAt")
            .sort({ updatedAt: -1 })
            .lean()
    ]);

    return {
        blockedAccounts: blockedUsers.map((u) => ({
            id: u._id,
            name: u.name,
            email: u.email,
            accountType: u.role === "customer" ? "Client" : "Bike Owner",
            blockedDate: u.blockedAt || u.updatedAt,
            blockReason: u.blockReason || "Administrative safety action",
            blockedBy: u.blockedBy?.name || "System Admin"
        })),
        rejectedRegistrations: rejectedUsers.map((u) => ({
            id: u._id,
            name: u.name,
            email: u.email,
            accountType: u.role === "customer" ? "Client" : "Bike Owner",
            registrationDate: u.createdAt,
            rejectedDate: u.updatedAt,
            rejectionReason: "Incomplete/Invalid credentials review"
        }))
    };
};

// ===================================================
// EXCELJS STYLING HELPER
// ===================================================

const formatWorksheet = (worksheet, headerBgColor = "1E3A8A") => {
    // Freeze header row
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    // Format Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
        cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: headerBgColor }
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
            top: { style: "thin", color: { argb: "FFCBD5E1" } },
            left: { style: "thin", color: { argb: "FFCBD5E1" } },
            bottom: { style: "medium", color: { argb: "FF0F172A" } },
            right: { style: "thin", color: { argb: "FFCBD5E1" } }
        };
    });

    // Auto fit column widths
    worksheet.columns.forEach((column) => {
        let maxLen = column.header ? column.header.length : 12;
        column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
            if (rowNumber > 1) {
                cell.font = { name: "Arial", size: 10 };
                cell.border = {
                    top: { style: "thin", color: { argb: "FFE2E8F0" } },
                    left: { style: "thin", color: { argb: "FFE2E8F0" } },
                    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
                    right: { style: "thin", color: { argb: "FFE2E8F0" } }
                };
                if (rowNumber % 2 === 0) {
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFF8FAFC" }
                    };
                }
                const cellLen = cell.value ? cell.value.toString().length : 0;
                if (cellLen > maxLen) maxLen = cellLen;
            }
        });
        column.width = Math.min(Math.max(maxLen + 4, 14), 45);
    });
};

// ===================================================
// 9. EXPORT CLIENT REPORT EXCEL (.xlsx)
// ===================================================

const exportClientsExcel = async (query = {}) => {
    const userDateFilter = buildDateFilter(query, "createdAt");
    const clients = await User.find({ role: "customer", ...userDateFilter })
        .sort({ createdAt: -1 })
        .lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MotoRent Admin Console";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Clients");

    worksheet.columns = [
        { header: "Client ID", key: "id", width: 26 },
        { header: "Client Name", key: "name", width: 22 },
        { header: "Email Address", key: "email", width: 28 },
        { header: "Phone Number", key: "phone", width: 16 },
        { header: "Registration Date", key: "createdAt", width: 20 },
        { header: "Account Status", key: "status", width: 16 },
        { header: "Total Bookings", key: "totalBookings", width: 16 },
        { header: "Total Amount Spent (₹)", key: "totalSpent", width: 22 }
    ];

    // Populate clients with booking data
    for (const client of clients) {
        const bookingsCount = await Booking.countDocuments({ userId: client._id });
        const spentAgg = await Booking.aggregate([
            { $match: { userId: client._id, status: { $in: ["completed", "confirmed"] } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalSpent = spentAgg[0]?.total || 0;

        worksheet.addRow({
            id: client._id.toString(),
            name: client.name,
            email: client.email,
            phone: client.mobile || "N/A",
            createdAt: new Date(client.createdAt).toLocaleDateString("en-IN"),
            status: client.isBlocked ? "blocked" : (client.status || "active"),
            totalBookings: bookingsCount,
            totalSpent: totalSpent
        });
    }

    formatWorksheet(worksheet, "1E40AF");
    return workbook;
};

// ===================================================
// 10. EXPORT BIKE OWNER REPORT EXCEL (.xlsx)
// ===================================================

const exportOwnersExcel = async (query = {}) => {
    const userDateFilter = buildDateFilter(query, "createdAt");
    const owners = await User.find({ role: "owner", ...userDateFilter })
        .sort({ createdAt: -1 })
        .lean();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MotoRent Admin Console";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Bike Owners");

    worksheet.columns = [
        { header: "Owner ID", key: "id", width: 26 },
        { header: "Owner Name", key: "name", width: 22 },
        { header: "Business / Store", key: "businessName", width: 24 },
        { header: "Email Address", key: "email", width: 28 },
        { header: "Phone Number", key: "phone", width: 16 },
        { header: "Registration Date", key: "createdAt", width: 20 },
        { header: "Account Status", key: "status", width: 16 },
        { header: "Total Bikes", key: "totalBikes", width: 14 },
        { header: "Approved Bikes", key: "approvedBikes", width: 16 },
        { header: "Pending Bikes", key: "pendingBikes", width: 15 },
        { header: "Blocked Bikes", key: "blockedBikes", width: 15 },
        { header: "Total Bookings", key: "totalBookings", width: 16 },
        { header: "Total Revenue (₹)", key: "totalRevenue", width: 20 }
    ];

    for (const owner of owners) {
        const [
            totalBikes,
            approvedBikes,
            pendingBikes,
            blockedBikes,
            bookingsCount,
            revenueAgg
        ] = await Promise.all([
            Bike.countDocuments({ ownerId: owner._id }),
            Bike.countDocuments({ ownerId: owner._id, approvalStatus: "approved", isBlocked: { $ne: true } }),
            Bike.countDocuments({ ownerId: owner._id, approvalStatus: "pending" }),
            Bike.countDocuments({ ownerId: owner._id, $or: [{ approvalStatus: "blocked" }, { isBlocked: true }] }),
            Booking.countDocuments({ ownerId: owner._id }),
            Booking.aggregate([
                { $match: { ownerId: owner._id, status: { $in: ["completed", "confirmed"] } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ])
        ]);

        worksheet.addRow({
            id: owner._id.toString(),
            name: owner.name,
            businessName: owner.businessName || "Individual Partner",
            email: owner.email,
            phone: owner.mobile || "N/A",
            createdAt: new Date(owner.createdAt).toLocaleDateString("en-IN"),
            status: owner.isBlocked ? "blocked" : (owner.status || "active"),
            totalBikes,
            approvedBikes,
            pendingBikes,
            blockedBikes,
            totalBookings: bookingsCount,
            totalRevenue: revenueAgg[0]?.total || 0
        });
    }

    formatWorksheet(worksheet, "6B21A8");
    return workbook;
};

// ===================================================
// 11. EXPORT COMPLETE REPORT EXCEL (6 SHEETS)
// ===================================================

const exportCompleteExcel = async (query = {}) => {
    const summary = await getSummary(query);
    const userDateFilter = buildDateFilter(query, "createdAt");
    const bikeDateFilter = buildDateFilter(query, "createdAt");
    const bookingDateFilter = buildDateFilter(query, "createdAt");
    const paymentDateFilter = buildDateFilter(query, "createdAt");

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MotoRent Master Admin";
    workbook.created = new Date();

    // --------------------------------------------------
    // SHEET 1: SUMMARY
    // --------------------------------------------------
    const wsSummary = workbook.addWorksheet("Summary");
    wsSummary.columns = [
        { header: "Metric Category", key: "category", width: 28 },
        { header: "Indicator", key: "indicator", width: 28 },
        { header: "Value", key: "value", width: 20 }
    ];

    const summaryRows = [
        { category: "System Metadata", indicator: "Report Generated Date", value: new Date().toLocaleString("en-IN") },
        { category: "System Metadata", indicator: "Filter Applied", value: query.range || (query.startDate ? `${query.startDate} to ${query.endDate}` : "All Time Data") },
        
        { category: "Clients", indicator: "Total Clients", value: summary.clients.total },
        { category: "Clients", indicator: "Active Clients", value: summary.clients.active },
        { category: "Clients", indicator: "Pending Clients", value: summary.clients.pending },
        { category: "Clients", indicator: "Blocked Clients", value: summary.clients.blocked },
        { category: "Clients", indicator: "Rejected Clients", value: summary.clients.rejected },

        { category: "Bike Owners", indicator: "Total Bike Owners", value: summary.owners.total },
        { category: "Bike Owners", indicator: "Active Owners", value: summary.owners.active },
        { category: "Bike Owners", indicator: "Pending Owners", value: summary.owners.pending },
        { category: "Bike Owners", indicator: "Blocked Owners", value: summary.owners.blocked },
        { category: "Bike Owners", indicator: "Rejected Owners", value: summary.owners.rejected },

        { category: "Fleet / Bikes", indicator: "Total Bikes", value: summary.bikes.total },
        { category: "Fleet / Bikes", indicator: "Approved Bikes", value: summary.bikes.approved },
        { category: "Fleet / Bikes", indicator: "Pending Bikes", value: summary.bikes.pending },
        { category: "Fleet / Bikes", indicator: "Blocked Bikes", value: summary.bikes.blocked },
        { category: "Fleet / Bikes", indicator: "Rejected Bikes", value: summary.bikes.rejected },

        { category: "Bookings", indicator: "Total Bookings", value: summary.bookings.total },
        { category: "Bookings", indicator: "Completed Bookings", value: summary.bookings.completed },
        { category: "Bookings", indicator: "Cancelled Bookings", value: summary.bookings.cancelled },

        { category: "Financials", indicator: "Total Platform Revenue (₹)", value: summary.revenue.total }
    ];

    summaryRows.forEach((r) => wsSummary.addRow(r));
    formatWorksheet(wsSummary, "0F172A");

    // --------------------------------------------------
    // SHEET 2: CLIENTS
    // --------------------------------------------------
    const wsClients = workbook.addWorksheet("Clients");
    wsClients.columns = [
        { header: "Client ID", key: "id", width: 26 },
        { header: "Client Name", key: "name", width: 22 },
        { header: "Email", key: "email", width: 28 },
        { header: "Phone", key: "phone", width: 16 },
        { header: "Registration Date", key: "createdAt", width: 18 },
        { header: "Status", key: "status", width: 14 },
        { header: "Total Bookings", key: "totalBookings", width: 15 },
        { header: "Total Amount Spent (₹)", key: "totalSpent", width: 22 }
    ];

    const clients = await User.find({ role: "customer", ...userDateFilter }).sort({ createdAt: -1 }).lean();
    for (const client of clients) {
        const bookingsCount = await Booking.countDocuments({ userId: client._id });
        const spentAgg = await Booking.aggregate([
            { $match: { userId: client._id, status: { $in: ["completed", "confirmed"] } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        wsClients.addRow({
            id: client._id.toString(),
            name: client.name,
            email: client.email,
            phone: client.mobile || "N/A",
            createdAt: new Date(client.createdAt).toLocaleDateString("en-IN"),
            status: client.isBlocked ? "blocked" : (client.status || "active"),
            totalBookings: bookingsCount,
            totalSpent: spentAgg[0]?.total || 0
        });
    }
    formatWorksheet(wsClients, "1E40AF");

    // --------------------------------------------------
    // SHEET 3: BIKE OWNERS
    // --------------------------------------------------
    const wsOwners = workbook.addWorksheet("Bike Owners");
    wsOwners.columns = [
        { header: "Owner ID", key: "id", width: 26 },
        { header: "Owner Name", key: "name", width: 22 },
        { header: "Business Name", key: "businessName", width: 24 },
        { header: "Email", key: "email", width: 28 },
        { header: "Phone", key: "phone", width: 16 },
        { header: "Registration Date", key: "createdAt", width: 18 },
        { header: "Status", key: "status", width: 14 },
        { header: "Total Bikes", key: "totalBikes", width: 14 },
        { header: "Approved Bikes", key: "approvedBikes", width: 16 },
        { header: "Pending Bikes", key: "pendingBikes", width: 15 },
        { header: "Blocked Bikes", key: "blockedBikes", width: 15 },
        { header: "Total Bookings", key: "totalBookings", width: 15 },
        { header: "Total Revenue (₹)", key: "totalRevenue", width: 20 }
    ];

    const owners = await User.find({ role: "owner", ...userDateFilter }).sort({ createdAt: -1 }).lean();
    for (const owner of owners) {
        const [totalBikes, approvedBikes, pendingBikes, blockedBikes, bookingsCount, revenueAgg] = await Promise.all([
            Bike.countDocuments({ ownerId: owner._id }),
            Bike.countDocuments({ ownerId: owner._id, approvalStatus: "approved", isBlocked: { $ne: true } }),
            Bike.countDocuments({ ownerId: owner._id, approvalStatus: "pending" }),
            Bike.countDocuments({ ownerId: owner._id, $or: [{ approvalStatus: "blocked" }, { isBlocked: true }] }),
            Booking.countDocuments({ ownerId: owner._id }),
            Booking.aggregate([
                { $match: { ownerId: owner._id, status: { $in: ["completed", "confirmed"] } } },
                { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ])
        ]);
        wsOwners.addRow({
            id: owner._id.toString(),
            name: owner.name,
            businessName: owner.businessName || "N/A",
            email: owner.email,
            phone: owner.mobile || "N/A",
            createdAt: new Date(owner.createdAt).toLocaleDateString("en-IN"),
            status: owner.isBlocked ? "blocked" : (owner.status || "active"),
            totalBikes,
            approvedBikes,
            pendingBikes,
            blockedBikes,
            totalBookings: bookingsCount,
            totalRevenue: revenueAgg[0]?.total || 0
        });
    }
    formatWorksheet(wsOwners, "6B21A8");

    // --------------------------------------------------
    // SHEET 4: BIKES
    // --------------------------------------------------
    const wsBikes = workbook.addWorksheet("Bikes");
    wsBikes.columns = [
        { header: "Bike ID", key: "id", width: 26 },
        { header: "Bike Name", key: "bikeName", width: 22 },
        { header: "Brand", key: "brand", width: 16 },
        { header: "Model", key: "model", width: 16 },
        { header: "Type", key: "type", width: 16 },
        { header: "Price Per Day (₹)", key: "pricePerDay", width: 18 },
        { header: "Location", key: "location", width: 18 },
        { header: "Owner Name", key: "ownerName", width: 22 },
        { header: "Owner Email", key: "ownerEmail", width: 28 },
        { header: "Added Date", key: "createdAt", width: 18 },
        { header: "Status", key: "status", width: 14 }
    ];

    const bikes = await Bike.find(bikeDateFilter)
        .populate("ownerId", "name email")
        .sort({ createdAt: -1 })
        .lean();

    bikes.forEach((bike) => {
        wsBikes.addRow({
            id: bike._id.toString(),
            bikeName: bike.bikeName,
            brand: bike.brand,
            model: bike.model,
            type: bike.type,
            pricePerDay: bike.pricePerDay,
            location: bike.location,
            ownerName: bike.ownerId?.name || "Verified Partner",
            ownerEmail: bike.ownerId?.email || "N/A",
            createdAt: new Date(bike.createdAt).toLocaleDateString("en-IN"),
            status: bike.isBlocked ? "blocked" : (bike.approvalStatus || "approved")
        });
    });
    formatWorksheet(wsBikes, "047857");

    // --------------------------------------------------
    // SHEET 5: BOOKINGS
    // --------------------------------------------------
    const wsBookings = workbook.addWorksheet("Bookings");
    wsBookings.columns = [
        { header: "Booking ID", key: "id", width: 26 },
        { header: "Client Name", key: "clientName", width: 22 },
        { header: "Client Email", key: "clientEmail", width: 28 },
        { header: "Bike Name", key: "bikeName", width: 22 },
        { header: "Bike Owner", key: "ownerName", width: 22 },
        { header: "Booking Date", key: "createdAt", width: 18 },
        { header: "Start Date", key: "startDate", width: 16 },
        { header: "End Date", key: "endDate", width: 16 },
        { header: "Number of Days", key: "totalDays", width: 16 },
        { header: "Price Per Day (₹)", key: "pricePerDay", width: 18 },
        { header: "Total Amount (₹)", key: "totalAmount", width: 18 },
        { header: "Booking Status", key: "status", width: 16 }
    ];

    const bookings = await Booking.find(bookingDateFilter)
        .populate("userId", "name email")
        .populate("bikeId", "bikeName brand model")
        .populate("ownerId", "name email")
        .sort({ createdAt: -1 })
        .lean();

    bookings.forEach((booking) => {
        wsBookings.addRow({
            id: booking._id.toString(),
            clientName: booking.userId?.name || "Guest Rider",
            clientEmail: booking.userId?.email || "N/A",
            bikeName: booking.bikeId?.bikeName || "Rental Bike",
            ownerName: booking.ownerId?.name || "Partner Owner",
            createdAt: new Date(booking.createdAt).toLocaleDateString("en-IN"),
            startDate: booking.startDate ? new Date(booking.startDate).toLocaleDateString("en-IN") : "N/A",
            endDate: booking.endDate ? new Date(booking.endDate).toLocaleDateString("en-IN") : "N/A",
            totalDays: booking.totalDays || 1,
            pricePerDay: booking.pricePerDay || 0,
            totalAmount: booking.totalAmount || 0,
            status: booking.status || "pending"
        });
    });
    formatWorksheet(wsBookings, "C2410C");

    // --------------------------------------------------
    // SHEET 6: PAYMENTS
    // --------------------------------------------------
    const wsPayments = workbook.addWorksheet("Payments");
    wsPayments.columns = [
        { header: "Payment ID", key: "id", width: 26 },
        { header: "Booking ID", key: "bookingId", width: 26 },
        { header: "Client Name", key: "clientName", width: 22 },
        { header: "Amount (₹)", key: "amount", width: 16 },
        { header: "Payment Date", key: "paidAt", width: 18 },
        { header: "Payment Method", key: "paymentMethod", width: 18 },
        { header: "Payment Status", key: "paymentStatus", width: 16 }
    ];

    const payments = await Payment.find(paymentDateFilter)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .lean();

    payments.forEach((p) => {
        wsPayments.addRow({
            id: p.transactionId || p._id.toString(),
            bookingId: p.bookingId ? p.bookingId.toString() : "N/A",
            clientName: p.userId?.name || "Customer",
            amount: p.amount || 0,
            paidAt: new Date(p.paidAt || p.createdAt).toLocaleDateString("en-IN"),
            paymentMethod: p.paymentMethod || "Online",
            paymentStatus: p.paymentStatus || "successful"
        });
    });
    formatWorksheet(wsPayments, "4338CA");

    return workbook;
};

module.exports = {
    getSummary,
    getClientReports,
    getOwnerReports,
    getApprovalAnalytics,
    getBikeReports,
    getBookingReports,
    getPaymentReports,
    getBlockedAndRejectedReports,
    exportClientsExcel,
    exportOwnersExcel,
    exportCompleteExcel
};
