import api from "./api";

// Helper for file download
const downloadExcelBlob = (blobData, defaultFilename = "MotoRent_Report.xlsx") => {
    const blob = new Blob([blobData], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", defaultFilename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
};

export const getReportSummary = async (params = {}) => {
    const res = await api.get("/admin/reports/summary", { params });
    return res.data;
};

export const getClientReports = async (params = {}) => {
    const res = await api.get("/admin/reports/clients", { params });
    return res.data;
};

export const getOwnerReports = async (params = {}) => {
    const res = await api.get("/admin/reports/owners", { params });
    return res.data;
};

export const getApprovalAnalytics = async (params = {}) => {
    const res = await api.get("/admin/reports/analytics", { params });
    return res.data;
};

export const getBikeReports = async (params = {}) => {
    const res = await api.get("/admin/reports/bikes", { params });
    return res.data;
};

export const getBookingReports = async (params = {}) => {
    const res = await api.get("/admin/reports/bookings", { params });
    return res.data;
};

export const getPaymentReports = async (params = {}) => {
    const res = await api.get("/admin/reports/payments", { params });
    return res.data;
};

export const getBlockedAndRejectedReports = async (params = {}) => {
    const res = await api.get("/admin/reports/blocked-rejected", { params });
    return res.data;
};

// ==========================================
// EXCEL EXPORTS
// ==========================================

export const exportClientsExcel = async (params = {}) => {
    const res = await api.get("/admin/reports/export/clients", {
        params,
        responseType: "blob"
    });
    downloadExcelBlob(res.data, "MotoRent_Client_Report.xlsx");
    return true;
};

export const exportOwnersExcel = async (params = {}) => {
    const res = await api.get("/admin/reports/export/owners", {
        params,
        responseType: "blob"
    });
    downloadExcelBlob(res.data, "MotoRent_BikeOwner_Report.xlsx");
    return true;
};

export const exportCompleteExcel = async (params = {}) => {
    const res = await api.get("/admin/reports/export/complete", {
        params,
        responseType: "blob"
    });
    downloadExcelBlob(res.data, "MotoRent_Admin_Report.xlsx");
    return true;
};

const adminReportService = {
    getReportSummary,
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

export default adminReportService;
