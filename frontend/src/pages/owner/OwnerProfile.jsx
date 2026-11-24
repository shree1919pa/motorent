import { useEffect, useState } from "react";
import {
    User,
    Mail,
    Phone,
    Building,
    MapPin,
    Calendar,
    Shield,
    CheckCircle2,
    AlertCircle,
    Save,
    Lock,
    QrCode,
    Camera,
    UploadCloud,
    KeyRound,
    Percent,
    FileText,
    Check
} from "lucide-react";
import authService from "../../services/authService";
import { getImageUrl } from "../../services/api";
import OwnerLayout from "../../components/owner/OwnerLayout";
import "./OwnerProfile.css";

const OwnerProfile = () => {
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        mobile: "",
        businessName: "",
        address: "",
        qrCode: "",
        profileImage: "",
        cancellationChargePercentage: 20,
        cancellationTerms: "20% deduction from advance payment upon cancellation.",
        role: "owner",
        status: "active",
        createdAt: ""
    });

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        businessName: "",
        address: "",
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
        cancellationChargePercentage: 20,
        cancellationTerms: ""
    });

    // File Upload States
    const [qrCodeFile, setQrCodeFile] = useState(null);
    const [qrCodePreview, setQrCodePreview] = useState("");
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState("");

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
                    email: u.email || "",
                    mobile: u.mobile || "",
                    businessName: u.businessName || "",
                    address: u.address || "",
                    currentPassword: "",
                    newPassword: "",
                    confirmNewPassword: "",
                    cancellationChargePercentage: u.cancellationChargePercentage ?? 20,
                    cancellationTerms: u.cancellationTerms || "20% deduction from advance payment upon cancellation."
                });
                if (u.qrCode) {
                    setQrCodePreview(getImageUrl(u.qrCode));
                }
                if (u.profileImage) {
                    setProfileImagePreview(getImageUrl(u.profileImage));
                }
            }
        } catch (err) {
            console.error("Fetch Profile Error:", err);
            setError("Failed to load profile details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        setError("");
    };

    const validateFile = (file, label) => {
        const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowed.includes(file.mimetype || file.type)) {
            setError(`Only JPG, JPEG, PNG, and WEBP images are allowed for ${label}.`);
            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError(`${label} file size must be less than 5MB.`);
            return false;
        }
        return true;
    };

    const handleQrChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!validateFile(file, "UPI QR Code")) return;

        setError("");
        setQrCodeFile(file);
        setQrCodePreview(URL.createObjectURL(file));
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!validateFile(file, "Profile Picture")) return;

        setError("");
        setProfileImageFile(file);
        setProfileImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!formData.name.trim() || !formData.mobile.trim() || !formData.email.trim()) {
            setError("Name, email address, and mobile number are required.");
            return;
        }

        // FEATURE 8: Password Change Validation
        if (formData.newPassword || formData.confirmNewPassword) {
            if (!formData.currentPassword) {
                setError("Please enter your current password to authorize password change.");
                return;
            }
            if (formData.newPassword.length < 6) {
                setError("New password must be at least 6 characters long.");
                return;
            }
            if (formData.newPassword !== formData.confirmNewPassword) {
                setError("New password and confirmation password do not match.");
                return;
            }
        }

        try {
            setSaving(true);
            const submitData = new FormData();
            submitData.append("name", formData.name.trim());
            submitData.append("email", formData.email.toLowerCase().trim());
            submitData.append("mobile", formData.mobile.trim());
            submitData.append("businessName", formData.businessName.trim());
            submitData.append("address", formData.address.trim());
            submitData.append("cancellationChargePercentage", formData.cancellationChargePercentage);
            submitData.append("cancellationTerms", formData.cancellationTerms.trim());

            if (formData.newPassword) {
                submitData.append("currentPassword", formData.currentPassword);
                submitData.append("password", formData.newPassword);
            }

            if (qrCodeFile) {
                submitData.append("qrCode", qrCodeFile);
            }

            if (profileImageFile) {
                submitData.append("profileImage", profileImageFile);
            }

            const data = await authService.updateProfile(submitData);
            if (data && data.user) {
                setProfile(data.user);

                // Update local storage user
                const saved = localStorage.getItem("user");
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        const updated = { ...parsed, ...data.user };
                        localStorage.setItem("user", JSON.stringify(updated));
                        localStorage.setItem("motorent_user", JSON.stringify(updated));
                    } catch (e) {
                        // ignore
                    }
                }

                setSuccess("Profile, QR code, and account details updated successfully!");
                setFormData((prev) => ({
                    ...prev,
                    currentPassword: "",
                    newPassword: "",
                    confirmNewPassword: ""
                }));
                setQrCodeFile(null);
                setProfileImageFile(null);
            }
        } catch (err) {
            console.error("Update Profile Error:", err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to update profile. Please verify your inputs."
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

    return (
        <OwnerLayout activePage="profile">
            <div className="owner-profile-page">
                {/* HEADER */}
                <div className="profile-page-header">
                    <div>
                        <span className="owner-role-tag">ACCOUNT SETTINGS & PROFILE</span>
                        <h1>Update Profile</h1>
                        <p>
                            Update your personal information, contact email, business address, UPI/Bank QR code for customer advance payments, and security password.
                        </p>
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
                        <p>Loading profile details...</p>
                    </div>
                ) : (
                    <div className="profile-content-grid">
                        {/* LEFT: CURRENT PROFILE SUMMARY & QR CODE PREVIEW */}
                        <div className="profile-summary-card">
                            <div className="profile-avatar-container">
                                {profileImagePreview ? (
                                    <img
                                        src={profileImagePreview}
                                        alt={profile.name}
                                        className="profile-avatar-img"
                                    />
                                ) : (
                                    <div className="profile-avatar-large">
                                        {profile.name?.charAt(0)?.toUpperCase() || "O"}
                                    </div>
                                )}
                            </div>

                            <div className="profile-name-area">
                                <h2>{profile.name}</h2>
                                <span className="profile-role-badge">Verified Bike Owner</span>
                            </div>

                            {/* CURRENT UPI QR CODE CARD */}
                            <div className="owner-active-qr-card">
                                <div className="qr-card-title">
                                    <QrCode size={16} />
                                    <span>Active UPI / Bank QR Code</span>
                                </div>
                                {qrCodePreview ? (
                                    <div className="qr-card-display">
                                        <img src={qrCodePreview} alt="Owner UPI QR Code" />
                                        <small>Used for 20% advance customer payments</small>
                                    </div>
                                ) : (
                                    <div className="qr-not-uploaded">
                                        <AlertCircle size={20} color="#ea580c" />
                                        <span>No QR code uploaded yet</span>
                                    </div>
                                )}
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
                                        <span>Phone Number</span>
                                        <strong>{profile.mobile}</strong>
                                    </div>
                                </div>

                                <div className="profile-detail-item">
                                    <Building size={16} />
                                    <div>
                                        <span>Business Name</span>
                                        <strong>{profile.businessName || "Not set"}</strong>
                                    </div>
                                </div>

                                <div className="profile-detail-item">
                                    <MapPin size={16} />
                                    <div>
                                        <span>Operating Address</span>
                                        <strong>{profile.address || "Not set"}</strong>
                                    </div>
                                </div>

                                <div className="profile-detail-item">
                                    <Calendar size={16} />
                                    <div>
                                        <span>Member Since</span>
                                        <strong>{formatDate(profile.createdAt)}</strong>
                                    </div>
                                </div>

                                <div className="profile-detail-item">
                                    <Shield size={16} />
                                    <div>
                                        <span>Account Status</span>
                                        <span className={`status-pill ${profile.status}`}>
                                            {profile.status ? profile.status.toUpperCase() : "ACTIVE"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: EDITABLE PROFILE FORM (FEATURE 8) */}
                        <div className="profile-edit-card">
                            <div className="edit-card-header">
                                <h3>Edit Profile & Payment Details</h3>
                                <p>Make modifications to your business profile, replace QR code, or update security credentials.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="profile-form" autoComplete="off">
                                {/* PROFILE PICTURE UPLOAD */}
                                <div className="form-group-field">
                                    <label>Profile Picture</label>
                                    <div className="profile-upload-row">
                                        <label className="btn-file-picker">
                                            <Camera size={16} /> Choose Photo
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                style={{ display: "none" }}
                                                onChange={handleProfileImageChange}
                                            />
                                        </label>
                                        <span className="file-name-hint">
                                            {profileImageFile ? profileImageFile.name : "JPG, PNG or WEBP (Max 5MB)"}
                                        </span>
                                    </div>
                                </div>

                                {/* FULL NAME */}
                                <div className="form-group-field">
                                    <label htmlFor="ownerName">Owner Full Name <span>*</span></label>
                                    <div className="input-icon-box">
                                        <User size={16} />
                                        <input
                                            id="ownerName"
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Your full name"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* EMAIL & MOBILE */}
                                <div className="form-2col-row">
                                    <div className="form-group-field">
                                        <label htmlFor="ownerEmail">Email Address <span>*</span></label>
                                        <div className="input-icon-box">
                                            <Mail size={16} />
                                            <input
                                                id="ownerEmail"
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="owner@example.com"
                                                autoComplete="off"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group-field">
                                        <label htmlFor="ownerMobile">Mobile Number <span>*</span></label>
                                        <div className="input-icon-box">
                                            <Phone size={16} />
                                            <input
                                                id="ownerMobile"
                                                type="tel"
                                                name="mobile"
                                                value={formData.mobile}
                                                onChange={handleChange}
                                                placeholder="10-digit mobile number"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* BUSINESS NAME & ADDRESS */}
                                <div className="form-2col-row">
                                    <div className="form-group-field">
                                        <label htmlFor="ownerBusiness">Business / Rental Name</label>
                                        <div className="input-icon-box">
                                            <Building size={16} />
                                            <input
                                                id="ownerBusiness"
                                                type="text"
                                                name="businessName"
                                                value={formData.businessName}
                                                onChange={handleChange}
                                                placeholder="e.g. City Bike Rentals"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group-field">
                                        <label htmlFor="ownerAddress">Operating Address</label>
                                        <div className="input-icon-box">
                                            <MapPin size={16} />
                                            <input
                                                id="ownerAddress"
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                placeholder="City, Area, Address"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* FEATURE 8: UPI / BANK QR CODE REPLACEMENT */}
                                <div className="form-section-separator">
                                    <h4><QrCode size={18} /> UPI / Bank QR Code Configuration</h4>
                                    <p>Customers will scan this QR code to transfer the required 20% advance payment.</p>
                                </div>

                                <div className="form-group-field">
                                    <label>Upload New QR Code (Replaces Existing QR Code)</label>
                                    <div className="profile-upload-row">
                                        <label className="btn-file-picker">
                                            <UploadCloud size={16} /> Select New QR Code
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                style={{ display: "none" }}
                                                onChange={handleQrChange}
                                            />
                                        </label>
                                        <span className="file-name-hint">
                                            {qrCodeFile ? qrCodeFile.name : "Select a JPG, JPEG, PNG, or WEBP image (Max 5MB)"}
                                        </span>
                                    </div>
                                </div>

                                {/* FEATURE 7: CANCELLATION POLICY CONFIGURATION */}
                                <div className="form-section-separator">
                                    <h4><Percent size={18} /> Cancellation Policy Terms</h4>
                                    <p>Configure the cancellation charge deduction percentage from customer advance payments.</p>
                                </div>

                                <div className="form-2col-row">
                                    <div className="form-group-field">
                                        <label htmlFor="chargePercent">Cancellation Deduction Percentage (%)</label>
                                        <div className="input-icon-box">
                                            <Percent size={16} />
                                            <input
                                                id="chargePercent"
                                                type="number"
                                                min="0"
                                                max="100"
                                                name="cancellationChargePercentage"
                                                value={formData.cancellationChargePercentage}
                                                onChange={handleChange}
                                                placeholder="20"
                                            />
                                        </div>
                                        <small className="field-hint">e.g. 20 means you retain 20% of the advance and refund 80% on cancellation.</small>
                                    </div>

                                    <div className="form-group-field">
                                        <label htmlFor="cancelTerms">Cancellation Policy Description</label>
                                        <div className="input-icon-box">
                                            <FileText size={16} />
                                            <input
                                                id="cancelTerms"
                                                type="text"
                                                name="cancellationTerms"
                                                value={formData.cancellationTerms}
                                                onChange={handleChange}
                                                placeholder="Description shown to customer before booking"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* FEATURE 8: PASSWORD UPDATE WITH CURRENT PASSWORD VERIFICATION */}
                                <div className="form-section-separator">
                                    <h4><Lock size={18} /> Change Password</h4>
                                    <p>Leave fields blank if you do not want to change your current password.</p>
                                </div>

                                <div className="form-group-field">
                                    <label htmlFor="currentPassword">Current Password (Required to change password)</label>
                                    <div className="input-icon-box">
                                        <KeyRound size={16} />
                                        <input
                                            id="currentPassword"
                                            type="password"
                                            name="currentPassword"
                                            value={formData.currentPassword}
                                            onChange={handleChange}
                                            placeholder="Enter your current password"
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>

                                <div className="form-2col-row">
                                    <div className="form-group-field">
                                        <label htmlFor="newPassword">New Password</label>
                                        <div className="input-icon-box">
                                            <Lock size={16} />
                                            <input
                                                id="newPassword"
                                                type="password"
                                                name="newPassword"
                                                value={formData.newPassword}
                                                onChange={handleChange}
                                                placeholder="At least 6 characters"
                                                autoComplete="new-password"
                                                minLength={6}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group-field">
                                        <label htmlFor="confirmNewPassword">Confirm New Password</label>
                                        <div className="input-icon-box">
                                            <Lock size={16} />
                                            <input
                                                id="confirmNewPassword"
                                                type="password"
                                                name="confirmNewPassword"
                                                value={formData.confirmNewPassword}
                                                onChange={handleChange}
                                                placeholder="Re-enter new password"
                                                autoComplete="new-password"
                                                minLength={6}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-save-btn-row">
                                    <button
                                        type="submit"
                                        className="btn-save-profile"
                                        disabled={saving}
                                    >
                                        <Save size={16} />
                                        {saving ? "Saving Changes..." : "Save Profile Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </OwnerLayout>
    );
};

export default OwnerProfile;
