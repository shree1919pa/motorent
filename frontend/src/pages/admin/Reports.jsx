import { useState, useEffect, useCallback } from "react";
import {
    BarChart3,
    Users,
    Store,
    Bike,
    CalendarCheck,
    IndianRupee,
    Download,
    Calendar,
    Filter,
    ShieldAlert,
    UserX,
    Clock,
    CheckCircle2,
    XCircle,
    AlertOctagon,
    RefreshCw,
    FileSpreadsheet,
    Layers,
    Award,
    Sparkles,
    Check
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    CartesianGrid
} from "recharts";

import AdminLayout from "../../components/admin/AdminLayout";
import adminReportService from "../../services/adminReportService";
import "./Reports.css";

const Reports = () => {
    // Global Date Filter State
    const [datePreset, setDatePreset] = useState("all"); // "all" | "today" | "7days" | "thisMonth" | "6months" | "thisYear" | "custom"
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [exportAll, setExportAll] = useState(false);

    // Data States
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    // Report Datasets
    const [summary, setSummary] = useState(null);
    const [clientData, setClientData] = useState(null);
    const [ownerData, setOwnerData] = useState(null);
    const [approvalData, setApprovalData] = useState(null);
    const [bikeData, setBikeData] = useState(null);
    const [bookingData, setBookingData] = useState(null);
    const [paymentData, setPaymentData] = useState(null);
    const [blockedRejectedData, setBlockedRejectedData] = useState(null);

    // Active subtab for Blocked/Rejected
    const [blockedTab, setBlockedTab] = useState("blocked"); // "blocked" | "rejected"

    // Export Loading State
    const [exportLoading, setExportLoading] = useState({
        clients: false,
        owners: false,
        complete: false
    });

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, 4500);
    };

    // Build query params
    const getQueryParams = useCallback(() => {
        const params = {};
        if (exportAll) {
            params.exportAll = "true";
            return params;
        }
        if (datePreset !== "custom") {
            params.range = datePreset;
        } else {
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
        }
        return params;
    }, [datePreset, startDate, endDate, exportAll]);

    // Fetch all analytics datasets
    const loadAllReports = useCallback(async () => {
        try {
            setError("");
            const params = getQueryParams();

            const [
                summaryRes,
                clientRes,
                ownerRes,
                approvalRes,
                bikeRes,
                bookingRes,
                paymentRes,
                blockedRejectedRes
            ] = await Promise.all([
                adminReportService.getReportSummary(params),
                adminReportService.getClientReports(params),
                adminReportService.getOwnerReports(params),
                adminReportService.getApprovalAnalytics(params),
                adminReportService.getBikeReports(params),
                adminReportService.getBookingReports(params),
                adminReportService.getPaymentReports(params),
                adminReportService.getBlockedAndRejectedReports(params)
            ]);

            setSummary(summaryRes);
            setClientData(clientRes);
            setOwnerData(ownerRes);
            setApprovalData(approvalRes);
            setBikeData(bikeRes);
            setBookingData(bookingRes);
            setPaymentData(paymentRes);
            setBlockedRejectedData(blockedRejectedRes);
        } catch (err) {
            console.error("Failed to load reports:", err);
            setError("Unable to load reports. Please verify database connection and retry.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getQueryParams]);

    useEffect(() => {
        setLoading(true);
        loadAllReports();
    }, [loadAllReports]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadAllReports();
    };

    // Excel Export Handlers
    const handleExport = async (type) => {
        try {
            setExportLoading((prev) => ({ ...prev, [type]: true }));
            const params = getQueryParams();

            if (type === "clients") {
                await adminReportService.exportClientsExcel(params);
            } else if (type === "owners") {
                await adminReportService.exportOwnersExcel(params);
            } else if (type === "complete") {
                await adminReportService.exportCompleteExcel(params);
            }

            showToast("Report generated and downloaded successfully!", "success");
        } catch (err) {
            console.error("Export error:", err);
            showToast(err.response?.data?.message || "Failed to generate Excel export.", "error");
        } finally {
            setExportLoading((prev) => ({ ...prev, [type]: false }));
        }
    };

    const formatINR = (amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Custom Tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="report-chart-tooltip">
                    <p className="tooltip-label">{label || payload[0]?.name}</p>
                    {payload.map((entry, index) => (
                        <p key={`item-${index}`} className="tooltip-entry" style={{ color: entry.color || entry.fill }}>
                            <span>{entry.name}:</span> <strong>{entry.value}</strong>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <AdminLayout title="Reports & Analytics">
            <div className="admin-reports-page">
                {/* TOAST ALERT */}
                {toast.show && (
                    <div className={`report-toast ${toast.type}`}>
                        {toast.type === "success" ? <Check size={18} /> : <AlertOctagon size={18} />}
                        <span>{toast.message}</span>
                    </div>
                )}

                {/* ===================================================
                    PAGE HEADER & GLOBAL DATE FILTER
                =================================================== */}
                <div className="report-header-card">
                    <div className="report-header-top">
                        <div className="report-header-text">
                            <div className="report-header-badge">
                                <Sparkles size={14} />
                                <span>EXECUTIVE INTELLIGENCE</span>
                            </div>
                            <h2>Reports & Analytics</h2>
                            <p>Monitor users, bike owners, bikes, bookings and platform performance.</p>
                        </div>

                        <div className="report-header-actions">
                            <button
                                className="btn-report-refresh"
                                onClick={handleRefresh}
                                disabled={refreshing || loading}
                                title="Refresh all report metrics"
                            >
                                <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
                                <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
                            </button>

                            <button
                                className="btn-export-quick-complete"
                                onClick={() => handleExport("complete")}
                                disabled={exportLoading.complete}
                            >
                                <FileSpreadsheet size={16} />
                                <span>{exportLoading.complete ? "Generating..." : "Export Complete Report"}</span>
                            </button>
                        </div>
                    </div>

                    {/* GLOBAL FILTER TOOLBAR */}
                    <div className="report-filter-toolbar">
                        <div className="filter-presets-group">
                            <span className="filter-label">
                                <Filter size={14} /> Date Range:
                            </span>

                            {[
                                { id: "all", label: "All Time" },
                                { id: "today", label: "Today" },
                                { id: "7days", label: "Last 7 Days" },
                                { id: "thisMonth", label: "This Month" },
                                { id: "6months", label: "Last 6 Months" },
                                { id: "thisYear", label: "This Year" },
                                { id: "custom", label: "Custom Date" }
                            ].map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    className={`preset-btn ${datePreset === preset.id ? "active" : ""}`}
                                    onClick={() => {
                                        setDatePreset(preset.id);
                                        setExportAll(false);
                                    }}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* CUSTOM DATE INPUTS */}
                        {datePreset === "custom" && (
                            <div className="custom-date-inputs">
                                <div className="date-input-wrap">
                                    <label>From Date:</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="date-input-wrap">
                                    <label>To Date:</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* EXPORT ALL TOGGLE */}
                        <div className="export-all-toggle">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={exportAll}
                                    onChange={(e) => setExportAll(e.target.checked)}
                                />
                                <span>Export All Data (Ignore filter)</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* ERROR STATE */}
                {error && (
                    <div className="report-error-banner">
                        <AlertOctagon size={20} />
                        <div>
                            <strong>Error Loading Analytics</strong>
                            <p>{error}</p>
                        </div>
                        <button onClick={handleRefresh}>Retry</button>
                    </div>
                )}

                {/* LOADING STATE */}
                {loading && (
                    <div className="report-loading-state">
                        <div className="report-spinner"></div>
                        <p>Aggregating platform intelligence & generating charts...</p>
                    </div>
                )}

                {!loading && (
                    <>
                        {/* ===================================================
                            1. SUMMARY METRIC CARDS (19 METRICS)
                        =================================================== */}
                        <div className="report-section">
                            <div className="report-section-title">
                                <Layers size={18} />
                                <h3>Platform Overview Summary</h3>
                            </div>

                            {/* CLIENTS METRICS */}
                            <div className="metrics-group-wrapper">
                                <div className="metrics-group-header">
                                    <span className="badge-pill bg-blue">CLIENT METRICS</span>
                                </div>
                                <div className="report-cards-grid">
                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-blue-light text-blue">
                                            <Users size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Total Clients</span>
                                            <strong className="metric-val">{summary?.clients?.total || 0}</strong>
                                            <span className="metric-sub">Registered accounts</span>
                                        </div>
                                    </div>

                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-green-light text-green">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Active Clients</span>
                                            <strong className="metric-val text-green">{summary?.clients?.active || 0}</strong>
                                            <span className="metric-sub">Approved & active</span>
                                        </div>
                                    </div>

                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-orange-light text-orange">
                                            <Clock size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Pending Clients</span>
                                            <strong className="metric-val text-orange">{summary?.clients?.pending || 0}</strong>
                                            <span className="metric-sub">Waiting review</span>
                                        </div>
                                    </div>

                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-red-light text-red">
                                            <AlertOctagon size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Blocked Clients</span>
                                            <strong className="metric-val text-red">{summary?.clients?.blocked || 0}</strong>
                                            <span className="metric-sub">Access suspended</span>
                                        </div>
                                    </div>

                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-slate-light text-slate">
                                            <XCircle size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Rejected Clients</span>
                                            <strong className="metric-val text-slate">{summary?.clients?.rejected || 0}</strong>
                                            <span className="metric-sub">Disapproved</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BIKE OWNERS METRICS */}
                            <div className="metrics-group-wrapper">
                                <div className="metrics-group-header">
                                    <span className="badge-pill bg-purple">BIKE OWNER METRICS</span>
                                </div>
                                <div className="report-cards-grid">
                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-purple-light text-purple">
                                            <Store size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Total Bike Owners</span>
                                            <strong className="metric-val">{summary?.owners?.total || 0}</strong>
                                            <span className="metric-sub">Rental partners</span>
                                        </div>
                                    </div>

                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-green-light text-green">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Active Owners</span>
                                            <strong className="metric-val text-green">{summary?.owners?.active || 0}</strong>
                                            <span className="metric-sub">Verified & listing</span>
                                        </div>
                                    </div>

                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-orange-light text-orange">
                                            <Clock size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Pending Owners</span>
                                            <strong className="metric-val text-orange">{summary?.owners?.pending || 0}</strong>
                                            <span className="metric-sub">Awaiting vetting</span>
                                        </div>
                                    </div>

                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-red-light text-red">
                                            <AlertOctagon size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Blocked Owners</span>
                                            <strong className="metric-val text-red">{summary?.owners?.blocked || 0}</strong>
                                            <span className="metric-sub">Temporarily blocked</span>
                                        </div>
                                    </div>

                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-slate-light text-slate">
                                            <XCircle size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Rejected Owners</span>
                                            <strong className="metric-val text-slate">{summary?.owners?.rejected || 0}</strong>
                                            <span className="metric-sub">Application rejected</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BIKES METRICS */}
                            <div className="metrics-group-wrapper">
                                <div className="metrics-group-header">
                                    <span className="badge-pill bg-emerald">FLEET & BIKE METRICS</span>
                                </div>
                                <div className="report-cards-grid">
                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-emerald-light text-emerald">
                                            <Bike size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Total Bikes</span>
                                            <strong className="metric-val">{summary?.bikes?.total || 0}</strong>
                                            <span className="metric-sub">Platform fleet</span>
                                        </div>
                                    </div>

                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-green-light text-green">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Approved Bikes</span>
                                            <strong className="metric-val text-green">{summary?.bikes?.approved || 0}</strong>
                                            <span className="metric-sub">Live on marketplace</span>
                                        </div>
                                    </div>

                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-orange-light text-orange">
                                            <Clock size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Pending Bikes</span>
                                            <strong className="metric-val text-orange">{summary?.bikes?.pending || 0}</strong>
                                            <span className="metric-sub">Awaiting moderation</span>
                                        </div>
                                    </div>

                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-red-light text-red">
                                            <AlertOctagon size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Blocked Bikes</span>
                                            <strong className="metric-val text-red">{summary?.bikes?.blocked || 0}</strong>
                                            <span className="metric-sub">Delisted</span>
                                        </div>
                                    </div>

                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-slate-light text-slate">
                                            <XCircle size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Rejected Bikes</span>
                                            <strong className="metric-val text-slate">{summary?.bikes?.rejected || 0}</strong>
                                            <span className="metric-sub">Declined listings</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BOOKINGS & REVENUE METRICS */}
                            <div className="metrics-group-wrapper">
                                <div className="metrics-group-header">
                                    <span className="badge-pill bg-amber">BOOKINGS & FINANCIALS</span>
                                </div>
                                <div className="report-cards-grid grid-4-col">
                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-blue-light text-blue">
                                            <CalendarCheck size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Total Bookings</span>
                                            <strong className="metric-val">{summary?.bookings?.total || 0}</strong>
                                            <span className="metric-sub">Lifetime reservations</span>
                                        </div>
                                    </div>

                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-green-light text-green">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Completed Bookings</span>
                                            <strong className="metric-val text-green">{summary?.bookings?.completed || 0}</strong>
                                            <span className="metric-sub">Successful trips</span>
                                        </div>
                                    </div>

                                    <div className="report-metric-card">
                                        <div className="metric-icon-box bg-red-light text-red">
                                            <XCircle size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Cancelled Bookings</span>
                                            <strong className="metric-val text-red">{summary?.bookings?.cancelled || 0}</strong>
                                            <span className="metric-sub">Cancelled by user/owner</span>
                                        </div>
                                    </div>

                                    <div className="report-metric-card highlight-revenue-card">
                                        <div className="metric-icon-box bg-orange-light text-orange">
                                            <IndianRupee size={20} />
                                        </div>
                                        <div className="metric-info">
                                            <span className="metric-title">Total Platform Revenue</span>
                                            <strong className="metric-val text-orange">
                                                {formatINR(summary?.revenue?.total || 0)}
                                            </strong>
                                            <span className="metric-sub">Gross earnings</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===================================================
                            2. CLIENT REPORTS
                        =================================================== */}
                        <div className="report-section">
                            <div className="report-section-title">
                                <Users size={18} />
                                <h3>Client Registration Report</h3>
                            </div>

                            <div className="charts-split-grid">
                                {/* DOUGHNUT: CLIENT STATUS */}
                                <div className="report-chart-card">
                                    <div className="chart-card-header">
                                        <div>
                                            <h4>Client Registration Statistics</h4>
                                            <p>Total Registered Clients: <strong>{clientData?.totalRegistered || 0}</strong></p>
                                        </div>
                                    </div>
                                    <div className="chart-wrapper">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <PieChart>
                                                <Pie
                                                    data={clientData?.statusDistribution || []}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={95}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                >
                                                    {(clientData?.statusDistribution || []).map((entry, index) => (
                                                        <Cell key={`client-cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="chart-summary-pills">
                                        {(clientData?.statusDistribution || []).map((s) => (
                                            <div key={s.name} className="pill-item">
                                                <span className="pill-dot" style={{ background: s.color }}></span>
                                                <span className="pill-name">{s.name}:</span>
                                                <strong>{s.value}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* BAR: MONTHLY CLIENT REGISTRATIONS */}
                                <div className="report-chart-card">
                                    <div className="chart-card-header">
                                        <div>
                                            <h4>Monthly Client Registrations</h4>
                                            <p>New rider account signups over time</p>
                                        </div>
                                    </div>
                                    <div className="chart-wrapper">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={clientData?.monthlyRegistrations || []}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                                                <YAxis stroke="#64748B" fontSize={12} allowDecimals={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="count" name="New Clients" fill="#2563EB" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===================================================
                            3. BIKE OWNER REPORTS
                        =================================================== */}
                        <div className="report-section">
                            <div className="report-section-title">
                                <Store size={18} />
                                <h3>Bike Owner Registration Report</h3>
                            </div>

                            <div className="charts-split-grid">
                                {/* DOUGHNUT: OWNER STATUS */}
                                <div className="report-chart-card">
                                    <div className="chart-card-header">
                                        <div>
                                            <h4>Bike Owner Registration Statistics</h4>
                                            <p>Total Registered Partners: <strong>{ownerData?.totalRegistered || 0}</strong></p>
                                        </div>
                                    </div>
                                    <div className="chart-wrapper">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <PieChart>
                                                <Pie
                                                    data={ownerData?.statusDistribution || []}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={95}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                >
                                                    {(ownerData?.statusDistribution || []).map((entry, index) => (
                                                        <Cell key={`owner-cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="chart-summary-pills">
                                        {(ownerData?.statusDistribution || []).map((s) => (
                                            <div key={s.name} className="pill-item">
                                                <span className="pill-dot" style={{ background: s.color }}></span>
                                                <span className="pill-name">{s.name}:</span>
                                                <strong>{s.value}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* BAR: MONTHLY OWNER REGISTRATIONS */}
                                <div className="report-chart-card">
                                    <div className="chart-card-header">
                                        <div>
                                            <h4>Monthly Owner Registrations</h4>
                                            <p>New partner onboardings by month</p>
                                        </div>
                                    </div>
                                    <div className="chart-wrapper">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={ownerData?.monthlyRegistrations || []}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                                                <YAxis stroke="#64748B" fontSize={12} allowDecimals={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="count" name="New Owners" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===================================================
                            4. APPROVAL ANALYTICS (COMPARISON)
                        =================================================== */}
                        <div className="report-section">
                            <div className="report-section-title">
                                <BarChart3 size={18} />
                                <h3>Approval Analytics & Comparison</h3>
                            </div>

                            <div className="report-chart-card full-width-card">
                                <div className="chart-card-header">
                                    <div>
                                        <h4>Clients vs. Bike Owners Status Comparison</h4>
                                        <p>Side-by-side grouped evaluation of registration pipeline status</p>
                                    </div>
                                </div>
                                <div className="chart-wrapper">
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart data={approvalData?.comparison || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="category" stroke="#475569" fontSize={13} fontWeight={600} />
                                            <YAxis stroke="#64748B" fontSize={12} allowDecimals={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar dataKey="Clients" fill="#2563EB" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="Owners" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* ===================================================
                            5. BIKE FLEET REPORT
                        =================================================== */}
                        <div className="report-section">
                            <div className="report-section-title">
                                <Bike size={18} />
                                <h3>Bike Fleet Report</h3>
                            </div>

                            <div className="charts-triple-grid">
                                {/* 1. BIKE STATUS */}
                                <div className="report-chart-card">
                                    <div className="chart-card-header">
                                        <h4>Bike Status Overview</h4>
                                        <p>Fleet moderation status</p>
                                    </div>
                                    <div className="chart-wrapper">
                                        <ResponsiveContainer width="100%" height={240}>
                                            <PieChart>
                                                <Pie
                                                    data={bikeData?.statusDistribution || []}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {(bikeData?.statusDistribution || []).map((entry, index) => (
                                                        <Cell key={`bike-cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* 2. TOP BRANDS */}
                                <div className="report-chart-card">
                                    <div className="chart-card-header">
                                        <h4>Most Listed Bike Brands</h4>
                                        <p>Brand fleet composition</p>
                                    </div>
                                    <div className="chart-wrapper">
                                        <ResponsiveContainer width="100%" height={240}>
                                            <BarChart data={bikeData?.brandDistribution || []} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                                <XAxis type="number" stroke="#64748B" fontSize={11} allowDecimals={false} />
                                                <YAxis type="category" dataKey="brand" stroke="#475569" fontSize={12} width={75} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="count" name="Bikes" fill="#10B981" radius={[0, 6, 6, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* 3. BIKE TYPES */}
                                <div className="report-chart-card">
                                    <div className="chart-card-header">
                                        <h4>Bike Type Distribution</h4>
                                        <p>Category segmentation</p>
                                    </div>
                                    <div className="chart-wrapper">
                                        <ResponsiveContainer width="100%" height={240}>
                                            <PieChart>
                                                <Pie
                                                    data={bikeData?.typeDistribution || []}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                >
                                                    {(bikeData?.typeDistribution || []).map((entry, index) => (
                                                        <Cell key={`type-cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===================================================
                            6. BOOKING REPORT
                        =================================================== */}
                        <div className="report-section">
                            <div className="report-section-title">
                                <CalendarCheck size={18} />
                                <h3>Booking Report & Leaderboards</h3>
                            </div>

                            <div className="charts-split-grid">
                                {/* MONTHLY BOOKINGS */}
                                <div className="report-chart-card">
                                    <div className="chart-card-header">
                                        <div>
                                            <h4>Monthly Bookings Trend</h4>
                                            <p>Reservation volume over time</p>
                                        </div>
                                    </div>
                                    <div className="chart-wrapper">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <AreaChart data={bookingData?.monthlyBookings || []}>
                                                <defs>
                                                    <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                                                <YAxis stroke="#64748B" fontSize={12} allowDecimals={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area type="monotone" dataKey="bookings" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#bookingGrad)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* MOST RENTED BIKES TABLE */}
                                <div className="report-chart-card">
                                    <div className="chart-card-header">
                                        <div>
                                            <h4>Most Rented Bikes</h4>
                                            <p>Top performing fleet vehicles</p>
                                        </div>
                                    </div>
                                    <div className="report-table-responsive">
                                        <table className="report-data-table">
                                            <thead>
                                                <tr>
                                                    <th>Rank</th>
                                                    <th>Bike Details</th>
                                                    <th>Owner</th>
                                                    <th>Bookings</th>
                                                    <th style={{ textAlign: "right" }}>Revenue</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(!bookingData?.mostRentedBikes || bookingData.mostRentedBikes.length === 0) ? (
                                                    <tr>
                                                        <td colSpan="5" className="text-center text-muted py-6">
                                                            No completed booking transactions yet
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    bookingData.mostRentedBikes.map((bike) => (
                                                        <tr key={bike.bikeId}>
                                                            <td>
                                                                <span className="rank-badge">#{bike.rank}</span>
                                                            </td>
                                                            <td>
                                                                <strong>{bike.bikeName}</strong>
                                                                <span className="table-sub">{bike.brand}</span>
                                                            </td>
                                                            <td>{bike.ownerName}</td>
                                                            <td>
                                                                <span className="count-chip">{bike.totalBookings}</span>
                                                            </td>
                                                            <td style={{ textAlign: "right" }}>
                                                                <strong className="text-green">{formatINR(bike.totalRevenue)}</strong>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===================================================
                            7. REVENUE & PAYMENT REPORT
                        =================================================== */}
                        <div className="report-section">
                            <div className="report-section-title">
                                <IndianRupee size={18} />
                                <h3>Revenue & Payment Report</h3>
                            </div>

                            {/* REVENUE OVERVIEW CARDS */}
                            <div className="revenue-summary-row">
                                <div className="rev-card">
                                    <span>Total Platform Revenue</span>
                                    <strong>{formatINR(paymentData?.summary?.totalRevenue || 0)}</strong>
                                </div>
                                <div className="rev-card">
                                    <span>Total Transactions</span>
                                    <strong>{paymentData?.summary?.totalPayments || 0}</strong>
                                </div>
                                <div className="rev-card text-green">
                                    <span>Successful Payments</span>
                                    <strong>{paymentData?.summary?.successfulPayments || 0}</strong>
                                </div>
                                <div className="rev-card text-orange">
                                    <span>Pending Payments</span>
                                    <strong>{paymentData?.summary?.pendingPayments || 0}</strong>
                                </div>
                                <div className="rev-card text-red">
                                    <span>Failed Payments</span>
                                    <strong>{paymentData?.summary?.failedPayments || 0}</strong>
                                </div>
                            </div>

                            <div className="charts-split-grid">
                                {/* MONTHLY REVENUE CHART */}
                                <div className="report-chart-card">
                                    <div className="chart-card-header">
                                        <div>
                                            <h4>Monthly Revenue Timeline</h4>
                                            <p>Platform gross revenue trends (₹)</p>
                                        </div>
                                    </div>
                                    <div className="chart-wrapper">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={paymentData?.monthlyRevenue || []}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                                                <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `₹${v}`} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="revenue" name="Revenue (₹)" fill="#F97316" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* TOP EARNING PARTNERS */}
                                <div className="report-chart-card">
                                    <div className="chart-card-header">
                                        <div>
                                            <h4>Top Earning Bike Owners</h4>
                                            <p>Partner revenue leaders</p>
                                        </div>
                                    </div>
                                    <div className="report-table-responsive">
                                        <table className="report-data-table">
                                            <thead>
                                                <tr>
                                                    <th>Owner Name</th>
                                                    <th>Email</th>
                                                    <th>Bookings</th>
                                                    <th style={{ textAlign: "right" }}>Total Revenue</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(!paymentData?.topOwners || paymentData.topOwners.length === 0) ? (
                                                    <tr>
                                                        <td colSpan="4" className="text-center text-muted py-6">
                                                            No partner revenue records yet
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paymentData.topOwners.map((owner) => (
                                                        <tr key={owner.ownerId}>
                                                            <td>
                                                                <strong>{owner.ownerName}</strong>
                                                            </td>
                                                            <td className="table-sub">{owner.email}</td>
                                                            <td>
                                                                <span className="count-chip">{owner.totalBookings}</span>
                                                            </td>
                                                            <td style={{ textAlign: "right" }}>
                                                                <strong className="text-orange">{formatINR(owner.totalRevenue)}</strong>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===================================================
                            8. BLOCKED & REJECTED ACCOUNTS
                        =================================================== */}
                        <div className="report-section">
                            <div className="report-section-title">
                                <ShieldAlert size={18} />
                                <h3>Security & Compliance Logs</h3>
                            </div>

                            <div className="report-chart-card full-width-card">
                                <div className="blocked-tabs-header">
                                    <button
                                        type="button"
                                        className={`blocked-tab-btn ${blockedTab === "blocked" ? "active" : ""}`}
                                        onClick={() => setBlockedTab("blocked")}
                                    >
                                        <AlertOctagon size={16} />
                                        <span>Blocked Accounts ({blockedRejectedData?.blockedAccounts?.length || 0})</span>
                                    </button>

                                    <button
                                        type="button"
                                        className={`blocked-tab-btn ${blockedTab === "rejected" ? "active" : ""}`}
                                        onClick={() => setBlockedTab("rejected")}
                                    >
                                        <XCircle size={16} />
                                        <span>Rejected Registrations ({blockedRejectedData?.rejectedRegistrations?.length || 0})</span>
                                    </button>
                                </div>

                                <div className="report-table-responsive">
                                    {blockedTab === "blocked" ? (
                                        <table className="report-data-table">
                                            <thead>
                                                <tr>
                                                    <th>Account Name</th>
                                                    <th>Email</th>
                                                    <th>Account Type</th>
                                                    <th>Blocked Date</th>
                                                    <th>Block Reason</th>
                                                    <th>Blocked By</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(!blockedRejectedData?.blockedAccounts || blockedRejectedData.blockedAccounts.length === 0) ? (
                                                    <tr>
                                                        <td colSpan="6" className="text-center text-muted py-6">
                                                            No blocked accounts found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    blockedRejectedData.blockedAccounts.map((item) => (
                                                        <tr key={item.id}>
                                                            <td><strong>{item.name}</strong></td>
                                                            <td>{item.email}</td>
                                                            <td>
                                                                <span className={`badge-pill ${item.accountType === "Client" ? "bg-blue" : "bg-purple"}`}>
                                                                    {item.accountType}
                                                                </span>
                                                            </td>
                                                            <td>{new Date(item.blockedDate).toLocaleDateString("en-IN")}</td>
                                                            <td><span className="reason-tag">{item.blockReason}</span></td>
                                                            <td>{item.blockedBy}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <table className="report-data-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Account Type</th>
                                                    <th>Registration Date</th>
                                                    <th>Rejected Date</th>
                                                    <th>Rejection Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(!blockedRejectedData?.rejectedRegistrations || blockedRejectedData.rejectedRegistrations.length === 0) ? (
                                                    <tr>
                                                        <td colSpan="6" className="text-center text-muted py-6">
                                                            No rejected registrations found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    blockedRejectedData.rejectedRegistrations.map((item) => (
                                                        <tr key={item.id}>
                                                            <td><strong>{item.name}</strong></td>
                                                            <td>{item.email}</td>
                                                            <td>
                                                                <span className={`badge-pill ${item.accountType === "Client" ? "bg-blue" : "bg-purple"}`}>
                                                                    {item.accountType}
                                                                </span>
                                                            </td>
                                                            <td>{new Date(item.registrationDate).toLocaleDateString("en-IN")}</td>
                                                            <td>{new Date(item.rejectedDate).toLocaleDateString("en-IN")}</td>
                                                            <td><span className="reason-tag">{item.rejectionReason}</span></td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ===================================================
                            9. EXCEL EXPORT CENTER
                        =================================================== */}
                        <div className="report-section">
                            <div className="report-section-title">
                                <FileSpreadsheet size={18} />
                                <h3>Export Reports to Excel (.xlsx)</h3>
                            </div>

                            <div className="export-cards-grid">
                                {/* EXPORT CLIENTS */}
                                <div className="export-card">
                                    <div className="export-card-icon bg-blue-light text-blue">
                                        <Users size={28} />
                                    </div>
                                    <div className="export-card-info">
                                        <h4>Client Export Report</h4>
                                        <p>Generates an Excel workbook containing strictly customer accounts, booking tallies, and spending metrics.</p>
                                        <span className="export-file-tag">MotoRent_Client_Report.xlsx</span>
                                    </div>
                                    <button
                                        className="btn-export-action bg-blue"
                                        onClick={() => handleExport("clients")}
                                        disabled={exportLoading.clients}
                                    >
                                        <Download size={16} />
                                        <span>{exportLoading.clients ? "Generating..." : "Export Client Report"}</span>
                                    </button>
                                </div>

                                {/* EXPORT OWNERS */}
                                <div className="export-card">
                                    <div className="export-card-icon bg-purple-light text-purple">
                                        <Store size={28} />
                                    </div>
                                    <div className="export-card-info">
                                        <h4>Bike Owner Export Report</h4>
                                        <p>Generates an Excel workbook containing only bike owner partner profiles, fleet breakdown, and total revenue.</p>
                                        <span className="export-file-tag">MotoRent_BikeOwner_Report.xlsx</span>
                                    </div>
                                    <button
                                        className="btn-export-action bg-purple"
                                        onClick={() => handleExport("owners")}
                                        disabled={exportLoading.owners}
                                    >
                                        <Download size={16} />
                                        <span>{exportLoading.owners ? "Generating..." : "Export Bike Owner Report"}</span>
                                    </button>
                                </div>

                                {/* EXPORT COMPLETE 6-SHEET WORKBOOK */}
                                <div className="export-card master-export-card">
                                    <div className="export-card-icon bg-orange-light text-orange">
                                        <FileSpreadsheet size={28} />
                                    </div>
                                    <div className="export-card-info">
                                        <h4>Complete Master Report (6 Sheets)</h4>
                                        <p>
                                            Generates a comprehensive multi-sheet Excel workbook with separate sheets for <strong>Summary</strong>, <strong>Clients</strong>, <strong>Bike Owners</strong>, <strong>Bikes</strong> (Price Per Day), <strong>Bookings</strong>, and <strong>Payments</strong>.
                                        </p>
                                        <span className="export-file-tag text-orange">MotoRent_Admin_Report.xlsx</span>
                                    </div>
                                    <button
                                        className="btn-export-action bg-orange"
                                        onClick={() => handleExport("complete")}
                                        disabled={exportLoading.complete}
                                    >
                                        <Download size={16} />
                                        <span>{exportLoading.complete ? "Compiling Workbook..." : "Export Complete Report"}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default Reports;
