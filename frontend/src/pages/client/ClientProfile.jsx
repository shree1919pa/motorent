import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    Phone,
    CreditCard,
    Calendar,
    Shield,
    CheckCircle2,
    AlertCircle,
    Save,
    Lock,
    ArrowLeft,
    LogOut,
    Camera,
    Upload,
    FileText,
    CalendarDays,
    Eye,
    X,
    Check
} from "lucide-react";
import useAuth from "../../context/useAuth";
import authService from "../../services/authService";
import { getImageUrl } from "../../services/api";
import NotificationBell from "../../components/NotificationBell";
import CustomerNavbar from "../../components/common/CustomerNavbar";
import "./ClientProfile.css";

const ClientProfile = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();

    const [profile, setProfile] = useState({
        name: "",
        email: "",
        mobile: "",
        role: "customer",
        status: "pending",
        drivingLicenseNumber: "",
        drivingLicenseImage: "",
        createdAt: ""
    });

    const [formData, setFormData] = useState({
        name: "",
        mobile: "",
        drivingLicenseNumber: "",
        password: ""
    });

    const [licenseFile, setLicenseFile] = useState(null);
    const [licensePreview, setLicensePreview] = useState(null);
    const [viewFullImage, setViewFullImage] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await authService.getProfile();
            if (data && data.user) {
                const u = data.user;
                setProfile(u);
                setFormData({
                    name: u.name || "",
                    mobile: u.mobile || "",
                    drivingLicenseNumber: u.drivingLicenseNumber || "",
                    password: ""
                });
            }
        } catch (err) {
            console.error("Fetch Client Profile Error:", err);
            setError("Failed to load profile details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token") || localStorage.getItem("motorent_token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchProfile();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        setError("");
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                setError("Please upload an image file (PNG, JPG, JPEG, WEBP).");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError("Licence image file size cannot exceed 5MB.");
                return;
            }
            setLicenseFile(file);
            setLicensePreview(URL.createObjectURL(file));
            setError("");
        }
    };

    const handleRemoveFile = () => {
        setLicenseFile(null);
        if (licensePreview) {
            URL.revokeObjectURL(licensePreview);
            setLicensePreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!formData.name.trim() || !formData.mobile.trim()) {
            setError("Full name and mobile phone number are required.");
            return;
        }

        try {
            setSaving(true);

            // Prepare payload
            let res;
            if (licenseFile) {
                const data = new FormData();
                data.append("name", formData.name.trim());
                data.append("mobile", formData.mobile.trim());
                if (formData.drivingLicenseNumber.trim()) {
                    data.append("drivingLicenseNumber", formData.drivingLicenseNumber.trim());
                }
                if (formData.password.trim()) {
                    if (formData.password.length < 6) {
                        setError("New password must be at least 6 characters long.");
                        setSaving(false);
                        return;
                    }
                    data.append("password", formData.password);
                }
                data.append("drivingLicenseImage", licenseFile);

                res = await authService.updateProfile(data);
            } else {
                const payload = {
                    name: formData.name.trim(),
                    mobile: formData.mobile.trim(),
                    drivingLicenseNumber: formData.drivingLicenseNumber.trim()
                };

                if (formData.password.trim()) {
                    if (formData.password.length < 6) {
                        setError("New password must be at least 6 characters long.");
                        setSaving(false);
                        return;
                    }
                    payload.password = formData.password;
                }

                res = await authService.updateProfile(payload);
            }

            if (res && res.user) {
                setProfile(res.user);
                // Update local storage user
                const saved = localStorage.getItem("user");
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        const updated = { ...parsed, ...res.user };
                        localStorage.setItem("user", JSON.stringify(updated));
                        localStorage.setItem("motorent_user", JSON.stringify(updated));
                    } catch (err) {
                        // ignore
                    }
                }
                setSuccess("Profile and driving licence details updated successfully!");
                setFormData((prev) => ({ ...prev, password: "" }));
                setLicenseFile(null);
                setLicensePreview(null);
            }
        } catch (err) {
            console.error("Update Profile Error:", err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to update profile."
            );
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        });
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case "active":
                return {
                    label: "Verified & Approved",
                    badgeClass: "active",
                    desc: "Your account and driving licence are verified. You can book any bike instantly."
                };
            case "pending":
                return {
                    label: "Pending Verification",
                    badgeClass: "pending",
                    desc: "Your driving licence is currently awaiting verification by platform administrators."
                };
            case "rejected":
                return {
                    label: "Registration Rejected",
                    badgeClass: "rejected",
                    desc: "Your licence verification was rejected. Please review your licence details and re-upload."
                };
            case "blocked":
                return {
                    label: "Account Suspended",
                    badgeClass: "blocked",
                    desc: "Your account is temporarily suspended. Please reach out to customer support."
                };
            default:
                return {
                    label: status?.toUpperCase() || "PENDING",
                    badgeClass: "pending",
                    desc: "Verification status is pending review."
                };
        }
    };

    const statusInfo = getStatusInfo(profile.status);
    const dlImageUrl = licensePreview || (profile.drivingLicenseImage ? getImageUrl(profile.drivingLicenseImage) : null);

    return (
        <div className="client-profile-page">
            {/* TOP NAVIGATION BAR (FEATURE 2) */}
            <CustomerNavbar activePage="profile" />

            {/* MAIN CONTENT AREA */}
            <main className="client-profile-container">
                {/* PAGE HEADER */}
                <div className="client-profile-header">
                    <div>
                        <Link to="/" className="back-to-browse">
                            <ArrowLeft size={16} /> Back to Marketplace
                        </Link>
                        <h1>Rider Profile & Licence Verification</h1>
                        <p>Manage your account credentials, contact information, and government driving licence verification.</p>
                    </div>

                    <div className={`status-pill-large ${statusInfo.badgeClass}`}>
                        <Shield size={16} />
                        <span>{statusInfo.label}</span>
                    </div>
                </div>

                {/* ALERTS */}
                {success && (
                    <div className="profile-alert success">
                        <CheckCircle2 size={18} />
                        <span>{success}</span>
                    </div>
                )}
                {error && (
                    <div className="profile-alert error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="profile-loading-box">
                        <div className="spinner"></div>
                        <p>Loading your profile details...</p>
                    </div>
                ) : (
                    <div className="client-profile-grid">
                        {/* =========================================
                            LEFT COLUMN: ACCOUNT & LICENCE SUMMARY
                        ========================================= */}
                        <div className="profile-summary-column">
                            <div className="profile-summary-card">
                                <div className="profile-avatar-large">
                                    {profile.name?.charAt(0)?.toUpperCase() || "R"}
                                </div>

                                <div className="profile-name-area">
                                    <h2>{profile.name}</h2>
                                    <span className="profile-role-tag">Customer / Rider</span>
                                </div>

                                <div className="status-notice-box">
                                    <div className="status-notice-header">
                                        <Shield size={15} className={`status-icon ${statusInfo.badgeClass}`} />
                                        <strong>Verification Status</strong>
                                    </div>
                                    <p>{statusInfo.desc}</p>
                                </div>

                                <div className="profile-details-list">
                                    <div className="profile-detail-item">
                                        <Mail size={16} />
                                        <div>
                                            <span>Email Address</span>
                                            <strong>{profile.email}</strong>
                                        </div>
                                    </div>

                                    <div className="profile-detail-item">
                                        <Phone size={16} />
                                        <div>
                                            <span>Mobile Phone</span>
                                            <strong>{profile.mobile}</strong>
                                        </div>
                                    </div>

                                    <div className="profile-detail-item">
                                        <CreditCard size={16} />
                                        <div>
                                            <span>Driving Licence No.</span>
                                            <strong className="dl-number-highlight">
                                                {profile.drivingLicenseNumber || "Not Registered"}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="profile-detail-item">
                                        <Calendar size={16} />
                                        <div>
                                            <span>Member Since</span>
                                            <strong>{formatDate(profile.createdAt)}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DRIVING LICENCE DOCUMENT CARD */}
                            <div className="licence-doc-preview-card">
                                <div className="doc-card-header">
                                    <div className="doc-header-title">
                                        <FileText size={16} />
                                        <h4>Driving Licence Document</h4>
                                    </div>
                                    {dlImageUrl && (
                                        <button
                                            type="button"
                                            className="btn-zoom-licence"
                                            onClick={() => setViewFullImage(true)}
                                        >
                                            <Eye size={13} /> View Full
                                        </button>
                                    )}
                                </div>

                                <div className="doc-preview-body">
                                    {dlImageUrl ? (
                                        <div
                                            className="doc-image-wrapper"
                                            onClick={() => setViewFullImage(true)}
                                            title="Click to view full size"
                                        >
                                            <img
                                                src={dlImageUrl}
                                                alt="Driving Licence Preview"
                                                className="dl-doc-img"
                                            />
                                            <div className="doc-hover-overlay">
                                                <Eye size={20} />
                                                <span>Click to inspect</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="doc-empty-box">
                                            <Camera size={32} />
                                            <p>No driving licence image uploaded yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* =========================================
                            RIGHT COLUMN: EDIT PROFILE & LICENCE FORM
                        ========================================= */}
                        <div className="profile-edit-column">
                            <div className="profile-edit-card">
                                <div className="edit-card-header">
                                    <h3>Update Personal & Licence Info</h3>
                                    <p>Ensure your driving licence number and document are up-to-date for seamless booking approvals.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="profile-form">
                                    <div className="form-row-2">
                                        <div className="form-group-field">
                                            <label>Full Name <span>*</span></label>
                                            <div className="input-icon-box">
                                                <User size={16} />
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="Your full name"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group-field">
                                            <label>Mobile Number <span>*</span></label>
                                            <div className="input-icon-box">
                                                <Phone size={16} />
                                                <input
                                                    type="tel"
                                                    name="mobile"
                                                    value={formData.mobile}
                                                    onChange={handleChange}
                                                    placeholder="10-digit phone number"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group-field">
                                        <label>Email Address (Read-only)</label>
                                        <div className="input-icon-box disabled">
                                            <Mail size={16} />
                                            <input
                                                type="email"
                                                value={profile.email}
                                                disabled
                                            />
                                        </div>
                                        <small className="field-hint">Your email is tied to your account identity and cannot be changed.</small>
                                    </div>

                                    {/* DRIVING LICENCE SECTION */}
                                    <div className="licence-form-section">
                                        <div className="section-divider-title">
                                            <CreditCard size={16} />
                                            <span>Driving Licence Details</span>
                                        </div>

                                        <div className="form-group-field">
                                            <label>Driving Licence Number (DL No.) <span>*</span></label>
                                            <div className="input-icon-box">
                                                <CreditCard size={16} />
                                                <input
                                                    type="text"
                                                    name="drivingLicenseNumber"
                                                    value={formData.drivingLicenseNumber}
                                                    onChange={handleChange}
                                                    placeholder="e.g. MH12 20200012345"
                                                    style={{ fontFamily: "monospace", letterSpacing: "1px" }}
                                                    required
                                                />
                                            </div>
                                            <small className="field-hint">Enter your valid Indian State RTO Driving Licence number.</small>
                                        </div>

                                        {/* LICENCE IMAGE UPLOAD */}
                                        <div className="form-group-field">
                                            <label>Driving Licence Document Photo</label>

                                            {licensePreview ? (
                                                <div className="licence-selected-preview">
                                                    <div className="preview-media-box">
                                                        <img src={licensePreview} alt="Selected Licence" />
                                                    </div>
                                                    <div className="preview-meta-box">
                                                        <span className="selected-indicator">
                                                            <Check size={14} /> New image selected
                                                        </span>
                                                        <span className="file-name-tag">{licenseFile?.name}</span>
                                                        <button
                                                            type="button"
                                                            className="btn-change-image"
                                                            onClick={handleRemoveFile}
                                                        >
                                                            <X size={14} /> Remove & Change
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="licence-upload-dropzone">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                        style={{ display: "none" }}
                                                    />
                                                    <div className="dropzone-inner">
                                                        <div className="upload-icon-circle">
                                                            <Upload size={22} />
                                                        </div>
                                                        <p className="dropzone-main-text">
                                                            <strong>Click to upload new licence image</strong> or drag and drop
                                                        </p>
                                                        <span className="dropzone-sub-text">PNG, JPG, JPEG or WEBP (Max 5MB)</span>
                                                    </div>
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* PASSWORD UPDATE */}
                                    <div className="form-group-field">
                                        <label>New Password (Optional)</label>
                                        <div className="input-icon-box">
                                            <Lock size={16} />
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="Leave blank to keep current password"
                                                minLength={6}
                                            />
                                        </div>
                                        <small className="field-hint">Minimum 6 characters. Leave empty if you don't want to change it.</small>
                                    </div>

                                    <div className="form-save-btn-row">
                                        <button
                                            type="submit"
                                            className="btn-save-profile"
                                            disabled={saving}
                                        >
                                            <Save size={16} />
                                            {saving ? "Saving Changes..." : "Save Profile Details"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* FULL IMAGE MODAL */}
                {viewFullImage && dlImageUrl && (
                    <div className="modal-overlay" onClick={() => setViewFullImage(false)}>
                        <div className="image-zoom-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="zoom-modal-header">
                                <h3>Driving Licence Document</h3>
                                <button className="zoom-close-btn" onClick={() => setViewFullImage(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="zoom-modal-body">
                                <img src={dlImageUrl} alt="Full Driving Licence" />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ClientProfile;
