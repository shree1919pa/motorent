const adminReportService = require("../services/adminReportService");

// ==========================================
// GET SUMMARY
// ==========================================
const getSummary = async (req, res) => {
    try {
        const data = await adminReportService.getSummary(req.query);
        res.status(200).json({
            success: true,
            ...data
        });
    } catch (error) {
        console.error("Report Summary Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate report summary"
        });
    }
};

// ==========================================
// GET CLIENT REPORTS
// ==========================================
const getClientReports = async (req, res) => {
    try {
        const data = await adminReportService.getClientReports(req.query);
        res.status(200).json({
            success: true,
            ...data
        });
    } catch (error) {
        console.error("Client Report Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate client report"
        });
    }
};

// ==========================================
// GET OWNER REPORTS
// ==========================================
const getOwnerReports = async (req, res) => {
    try {
        const data = await adminReportService.getOwnerReports(req.query);
        res.status(200).json({
            success: true,
            ...data
        });
    } catch (error) {
        console.error("Owner Report Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate bike owner report"
        });
    }
};

// ==========================================
// GET APPROVAL ANALYTICS
// ==========================================
const getApprovalAnalytics = async (req, res) => {
    try {
        const data = await adminReportService.getApprovalAnalytics(req.query);
        res.status(200).json({
            success: true,
            ...data
        });
    } catch (error) {
        console.error("Approval Analytics Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate approval analytics"
        });
    }
};

// ==========================================
// GET BIKE REPORTS
// ==========================================
const getBikeReports = async (req, res) => {
    try {
        const data = await adminReportService.getBikeReports(req.query);
        res.status(200).json({
            success: true,
            ...data
        });
    } catch (error) {
        console.error("Bike Report Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate bike fleet report"
        });
    }
};

// ==========================================
// GET BOOKING REPORTS
// ==========================================
const getBookingReports = async (req, res) => {
    try {
        const data = await adminReportService.getBookingReports(req.query);
        res.status(200).json({
            success: true,
            ...data
        });
    } catch (error) {
        console.error("Booking Report Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate booking report"
        });
    }
};

// ==========================================
// GET PAYMENT / REVENUE REPORTS
// ==========================================
const getPaymentReports = async (req, res) => {
    try {
        const data = await adminReportService.getPaymentReports(req.query);
        res.status(200).json({
            success: true,
            ...data
        });
    } catch (error) {
        console.error("Payment Report Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate revenue report"
        });
    }
};

// ==========================================
// GET BLOCKED & REJECTED ACCOUNTS
// ==========================================
const getBlockedAndRejectedReports = async (req, res) => {
    try {
        const data = await adminReportService.getBlockedAndRejectedReports(req.query);
        res.status(200).json({
            success: true,
            ...data
        });
    } catch (error) {
        console.error("Blocked/Rejected Accounts Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to load blocked and rejected records"
        });
    }
};

// ==========================================
// EXPORT CLIENT EXCEL
// ==========================================
const exportClientsExcel = async (req, res) => {
    try {
        const workbook = await adminReportService.exportClientsExcel(req.query);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=MotoRent_Client_Report.xlsx"
        );
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Export Client Excel Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to export client report"
        });
    }
};

// ==========================================
// EXPORT BIKE OWNER EXCEL
// ==========================================
const exportOwnersExcel = async (req, res) => {
    try {
        const workbook = await adminReportService.exportOwnersExcel(req.query);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=MotoRent_BikeOwner_Report.xlsx"
        );
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Export Owner Excel Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to export bike owner report"
        });
    }
};

// ==========================================
// EXPORT COMPLETE EXCEL (6 SHEETS)
// ==========================================
const exportCompleteExcel = async (req, res) => {
    try {
        const workbook = await adminReportService.exportCompleteExcel(req.query);
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=MotoRent_Admin_Report.xlsx"
        );
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Export Complete Excel Error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to export complete report"
        });
    }
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
