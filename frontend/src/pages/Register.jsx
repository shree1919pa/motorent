import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    UserRound,
    Store,
    Mail,
    Phone,
    LockKeyhole,
    MapPin,
    Building2,
    Eye,
    EyeOff,
    Check,
    ArrowRight,
    CreditCard,
    UploadCloud,
    CheckCircle2,
    AlertCircle,
    FileText,
    QrCode
} from "lucide-react";
import authService from "../services/authService";
import "./Register.css";

const Register = () => {
    const navigate = useNavigate();

    const [accountType, setAccountType] = useState("customer");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        password: "",
        confirmPassword: "",
        businessName: "",
        address: "",
        drivingLicenseNumber: ""
    });

    // Client Driving Licence
    const [drivingLicenseFile, setDrivingLicenseFile] = useState(null);
    const [drivingLicensePreview, setDrivingLicensePreview] = useState("");

    // Owner UPI / Bank QR Code (Feature 2)
    const [qrCodeFile, setQrCodeFile] = useState(null);
    const [qrCodePreview, setQrCodePreview] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const isOwner = accountType === "owner";

    const handleAccountTypeChange = (type) => {
        setAccountType(type);
        setError("");
        setSuccess("");
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError("");
    };

    const validateImageFile = (file, label) => {
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.mimetype || file.type)) {
            setError(`Only JPG, JPEG, PNG, and WEBP formats are supported for ${label}.`);
            return false;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError(`${label} file size must be under 5MB.`);
            return false;
        }

        return true;
    };

    const handleLicenseFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!validateImageFile(file, "Driving Licence")) return;

        setError("");
        setDrivingLicenseFile(file);
        setDrivingLicensePreview(URL.createObjectURL(file));
    };

    const handleQrCodeFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!validateImageFile(file, "UPI / Bank QR Code")) return;

        setError("");
        setQrCodeFile(file);
        setQrCodePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        // Basic validations
        if (!formData.name.trim() || !formData.email.trim() || !formData.mobile.trim()) {
            setError("Please fill in all mandatory personal details.");
            return;
        }

        // Password validation
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must contain at least 6 characters.");
            return;
        }

        // Owner validation (Feature 2)
        if (isOwner) {
            if (!formData.businessName.trim()) {
                setError("Business / rental name is required for owner registration.");
                return;
            }
            if (!formData.address.trim()) {
                setError("Business address is required for owner registration.");
                return;
            }
            if (!qrCodeFile) {
                setError("Please upload your UPI / Bank QR Code for receiving customer advance payments.");
                return;
            }
        }

        // Client validation
        if (!isOwner) {
            if (!formData.drivingLicenseNumber.trim()) {
                setError("Driving licence number is required for client account.");
                return;
            }
            if (!drivingLicenseFile) {
                setError("Please upload a clear image of your driving licence.");
                return;
            }
        }

        setLoading(true);

        try {
            const submitData = new FormData();
            submitData.append("name", formData.name.trim());
            submitData.append("email", formData.email.toLowerCase().trim());
            submitData.append("mobile", formData.mobile.trim());
            submitData.append("password", formData.password);
            submitData.append("accountType", accountType);

            if (isOwner) {
                submitData.append("businessName", formData.businessName.trim());
                submitData.append("address", formData.address.trim());
                submitData.append("qrCode", qrCodeFile);
            } else {
                submitData.append("drivingLicenseNumber", formData.drivingLicenseNumber.trim());
                if (drivingLicenseFile) {
                    submitData.append("drivingLicenseImage", drivingLicenseFile);
                }
            }

            await authService.register(submitData);

            setSuccess(
                isOwner
                    ? "Owner account registered successfully! Awaiting Admin verification."
                    : "Client account registered successfully! Awaiting Admin verification."
            );

            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                {/* =========================================
                    LEFT BRAND PANEL
                ========================================= */}
                <section className="register-brand-panel">
                    <div className="register-brand-content">
                        <Link to="/" className="motorent-logo">
                            <div className="logo-icon">🏍️</div>
                            <span className="logo-moto">Moto</span>
                            <span className="logo-rent">Rent</span>
                        </Link>

                        <div className="register-introduction">
                            <h1>Join MotoRent</h1>
                            <p>
                                Whether you want to rent top-rated bikes or grow your bike rental business, MotoRent connects riders and verified bike owners seamlessly.
                            </p>
                            <div className="brand-line"></div>
                        </div>

                        <div className="register-features">
                            <div className="register-feature">
                                <div className="feature-check"><Check size={14} /></div>
                                <span>Verified riders and trusted bike owners</span>
                            </div>
                            <div className="register-feature">
                                <div className="feature-check"><Check size={14} /></div>
                                <span>Secure 20% advance payment via owner UPI QR</span>
                            </div>
                            <div className="register-feature">
                                <div className="feature-check"><Check size={14} /></div>
                                <span>Transparent rental booking and owner verification</span>
                            </div>
                            <div className="register-feature">
                                <div className="feature-check"><Check size={14} /></div>
                                <span>Clear cancellation policy & real-time updates</span>
                            </div>
                        </div>
                    </div>

                    <div className="register-brand-footer">
                        <span>© 2026 MotoRent • Bike Rental Platform</span>
                    </div>
                </section>

                {/* =========================================
                    RIGHT FORM PANEL
                ========================================= */}
                <section className="register-form-panel">
                    <div className="register-form-container">
                        <div className="register-heading">
                            <div className="register-badge">Create Account</div>
                            <h2>Get started with MotoRent</h2>
                            <p>Choose your account type and fill in your details to create your account.</p>
                        </div>

                        {/* ACCOUNT TYPE SELECTOR */}
                        <div className="account-type-section">
                            <label className="section-label">I want to register as</label>
                            <div className="account-type-options">
                                <button
                                    type="button"
                                    className={`account-type-option ${!isOwner ? "selected-client" : ""}`}
                                    onClick={() => handleAccountTypeChange("customer")}
                                >
                                    <div className="account-option-icon client-option-icon">
                                        <UserRound size={20} />
                                    </div>
                                    <div className="account-option-text">
                                        <strong>Customer / Client</strong>
                                        <span>Rent bikes & ride anywhere</span>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    className={`account-type-option ${isOwner ? "selected-owner" : ""}`}
                                    onClick={() => handleAccountTypeChange("owner")}
                                >
                                    <div className="account-option-icon owner-option-icon">
                                        <Store size={20} />
                                    </div>
                                    <div className="account-option-text">
                                        <strong>Bike Owner</strong>
                                        <span>List bikes & receive bookings</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* ERROR & SUCCESS MESSAGES */}
                        {error && (
                            <div className="register-alert error">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="register-alert success">
                                <CheckCircle2 size={18} />
                                <span>{success}</span>
                            </div>
                        )}

                        {/* REGISTRATION FORM */}
                        <form className="register-form" onSubmit={handleSubmit} autoComplete="off">
                            {/* FULL NAME */}
                            <div className="register-input-group">
                                <label htmlFor="name">Full Name *</label>
                                <div className="register-input-wrapper">
                                    <UserRound size={18} className="register-input-icon" />
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* EMAIL & MOBILE GRID */}
                            <div className="register-form-row">
                                <div className="register-input-group">
                                    <label htmlFor="email">Email Address *</label>
                                    <div className="register-input-wrapper">
                                        <Mail size={18} className="register-input-icon" />
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            autoComplete="off"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="register-input-group">
                                    <label htmlFor="mobile">Mobile Number *</label>
                                    <div className="register-input-wrapper">
                                        <Phone size={18} className="register-input-icon" />
                                        <input
                                            id="mobile"
                                            name="mobile"
                                            type="tel"
                                            placeholder="10-digit mobile number"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* OWNER-SPECIFIC FIELDS */}
                            {isOwner && (
                                <div className="owner-fields-box">
                                    <div className="box-section-title">
                                        <Store size={18} />
                                        <span>Business & Payment Information</span>
                                    </div>

                                    <div className="register-form-row">
                                        <div className="register-input-group">
                                            <label htmlFor="businessName">Business / Rental Name *</label>
                                            <div className="register-input-wrapper">
                                                <Building2 size={18} className="register-input-icon" />
                                                <input
                                                    id="businessName"
                                                    name="businessName"
                                                    type="text"
                                                    placeholder="e.g. Patle Bike Rentals"
                                                    value={formData.businessName}
                                                    onChange={handleChange}
                                                    required={isOwner}
                                                />
                                            </div>
                                        </div>

                                        <div className="register-input-group">
                                            <label htmlFor="address">Business Address *</label>
                                            <div className="register-input-wrapper">
                                                <MapPin size={18} className="register-input-icon" />
                                                <input
                                                    id="address"
                                                    name="address"
                                                    type="text"
                                                    placeholder="City, Area, Address"
                                                    value={formData.address}
                                                    onChange={handleChange}
                                                    required={isOwner}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* FEATURE 2: Upload UPI / Bank QR Code */}
                                    <div className="register-input-group upload-group">
                                        <label htmlFor="qrCodeUpload">
                                            Upload UPI / Bank QR Code *
                                        </label>
                                        <span className="field-hint">
                                            Customers will scan this QR code to pay the required 20% advance payment for booking your bikes.
                                        </span>

                                        {!qrCodePreview ? (
                                            <label className="image-dropzone" htmlFor="qrCodeUpload">
                                                <input
                                                    id="qrCodeUpload"
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    style={{ display: "none" }}
                                                    onChange={handleQrCodeFileChange}
                                                />
                                                <div className="dropzone-icon">
                                                    <QrCode size={26} />
                                                </div>
                                                <span className="dropzone-title">Upload UPI / Bank QR Code</span>
                                                <span className="dropzone-sub">
                                                    JPG, JPEG, PNG, or WEBP (Max size: 5MB)
                                                </span>
                                            </label>
                                        ) : (
                                            <div className="image-preview-box">
                                                <div className="preview-top">
                                                    <span className="badge-preview-ok">
                                                        <CheckCircle2 size={14} /> QR Code Selected
                                                    </span>
                                                    <label className="btn-change-file" htmlFor="qrCodeUploadChange">
                                                        Change QR Code
                                                        <input
                                                            id="qrCodeUploadChange"
                                                            type="file"
                                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                                            style={{ display: "none" }}
                                                            onChange={handleQrCodeFileChange}
                                                        />
                                                    </label>
                                                </div>
                                                <div className="preview-img-container qr-preview">
                                                    <img src={qrCodePreview} alt="Owner QR Code Preview" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* CLIENT-SPECIFIC FIELDS */}
                            {!isOwner && (
                                <div className="licence-verification-box">
                                    <div className="licence-header-row">
                                        <div className="licence-header-icon">
                                            <CreditCard size={18} />
                                        </div>
                                        <span className="licence-header-title">Driving Licence Verification</span>
                                    </div>

                                    <div className="licence-note-alert">
                                        <AlertCircle size={15} />
                                        <span>Your driving licence is required for verification before renting bikes on MotoRent.</span>
                                    </div>

                                    <div className="register-input-group">
                                        <label htmlFor="drivingLicenseNumber">Driving Licence Number *</label>
                                        <div className="register-input-wrapper">
                                            <FileText size={18} className="register-input-icon" />
                                            <input
                                                id="drivingLicenseNumber"
                                                name="drivingLicenseNumber"
                                                type="text"
                                                placeholder="Enter driving licence number"
                                                value={formData.drivingLicenseNumber}
                                                onChange={handleChange}
                                                required={!isOwner}
                                            />
                                        </div>
                                    </div>

                                    <div className="register-input-group upload-group">
                                        <label htmlFor="drivingLicenseUpload">Driving Licence Image *</label>
                                        {!drivingLicensePreview ? (
                                            <label className="image-dropzone" htmlFor="drivingLicenseUpload">
                                                <input
                                                    id="drivingLicenseUpload"
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    style={{ display: "none" }}
                                                    onChange={handleLicenseFileChange}
                                                />
                                                <div className="dropzone-icon">
                                                    <UploadCloud size={26} />
                                                </div>
                                                <span className="dropzone-title">Upload Driving Licence Image</span>
                                                <span className="dropzone-sub">JPG, JPEG, PNG, or WEBP (Max 5MB)</span>
                                            </label>
                                        ) : (
                                            <div className="image-preview-box">
                                                <div className="preview-top">
                                                    <span className="badge-preview-ok">
                                                        <CheckCircle2 size={14} /> Licence Image Selected
                                                    </span>
                                                    <label className="btn-change-file" htmlFor="drivingLicenseUploadChange">
                                                        Change Image
                                                        <input
                                                            id="drivingLicenseUploadChange"
                                                            type="file"
                                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                                            style={{ display: "none" }}
                                                            onChange={handleLicenseFileChange}
                                                        />
                                                    </label>
                                                </div>
                                                <div className="preview-img-container">
                                                    <img src={drivingLicensePreview} alt="Driving Licence Preview" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* PASSWORD & CONFIRM PASSWORD */}
                            <div className="register-form-row">
                                <div className="register-input-group">
                                    <label htmlFor="password">Password *</label>
                                    <div className="register-input-wrapper">
                                        <LockKeyhole size={18} className="register-input-icon" />
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="At least 6 characters"
                                            value={formData.password}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="register-password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="register-input-group">
                                    <label htmlFor="confirmPassword">Confirm Password *</label>
                                    <div className="register-input-wrapper">
                                        <LockKeyhole size={18} className="register-input-icon" />
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            autoComplete="new-password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="register-password-toggle"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* SUBMIT BUTTON */}
                            <button
                                type="submit"
                                className="register-submit-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Creating Account..."
                                    : isOwner
                                        ? "Create Owner Account"
                                        : "Create Client Account"}
                                {!loading && <ArrowRight size={18} />}
                            </button>
                        </form>

                        {/* ALREADY HAVE AN ACCOUNT */}
                        <div className="already-account">
                            <span>Already have an account?</span>
                            <Link to="/login">Sign In</Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Register;
