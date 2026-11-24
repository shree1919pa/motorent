import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ShieldCheck,
    Lock,
    Mail,
    Eye,
    EyeOff,
    ArrowRight,
    ArrowLeft,
    AlertCircle,
    KeyRound
} from "lucide-react";
import useAuth from "../../context/useAuth";
import "./AdminLogin.css";

const AdminLogin = () => {
    const navigate = useNavigate();
    const { login, user } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // If already logged in as admin, redirect to dashboard
    useEffect(() => {
        const storedUser = user || (() => {
            try {
                const raw = localStorage.getItem("user") || localStorage.getItem("motorent_user");
                return raw ? JSON.parse(raw) : null;
            } catch {
                return null;
            }
        })();

        const token = localStorage.getItem("token") || localStorage.getItem("motorent_token");

        if (token && storedUser?.role === "admin") {
            navigate("/admin/dashboard", { replace: true });
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.email.trim()) {
            setError("Please enter your admin email address.");
            return;
        }

        if (!formData.password) {
            setError("Please enter your admin password.");
            return;
        }

        try {
            setLoading(true);
            const data = await login(formData.email.trim(), formData.password);

            if (!data || !data.user) {
                throw new Error("Invalid response from authentication server.");
            }

            if (data.user.role !== "admin") {
                // If a non-admin attempts login here
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("motorent_token");
                localStorage.removeItem("motorent_user");
                throw new Error("Access denied. This portal is restricted to system administrators.");
            }

            navigate("/admin/dashboard");
        } catch (err) {
            console.error("Admin Login Error:", err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Admin authentication failed. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-card">
                {/* BACK TO MAIN LOGIN NAVIGATION */}
                <div className="admin-login-top-bar">
                    <Link to="/login" className="admin-back-btn" title="Return to Main Login page">
                        <ArrowLeft size={16} />
                        <span>Back to Main Login</span>
                    </Link>
                </div>

                {/* BRAND HEADER */}
                <div className="admin-login-header">
                    <div className="admin-login-badge">
                        <ShieldCheck size={28} />
                    </div>
                    <div className="admin-logo-text">
                        <span className="logo-moto">Moto</span>
                        <span className="logo-rent">Rent</span>
                    </div>
                    <h2>Admin Portal</h2>
                    <p>Secure system control & fleet management</p>
                </div>

                {/* ERROR ALERT */}
                {error && (
                    <div className="admin-login-error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* LOGIN FORM */}
                <form onSubmit={handleSubmit} className="admin-login-form">
                    {/* EMAIL */}
                    <div className="admin-form-group">
                        <label htmlFor="adminEmail">Admin Email</label>
                        <div className="admin-input-wrapper">
                            <Mail size={18} className="admin-field-icon" />
                            <input
                                id="adminEmail"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="e.g. admin@motorent.com"
                                autoComplete="email"
                                required
                            />
                        </div>
                    </div>

                    {/* PASSWORD */}
                    <div className="admin-form-group">
                        <label htmlFor="adminPassword">Password</label>
                        <div className="admin-input-wrapper">
                            <Lock size={18} className="admin-field-icon" />
                            <input
                                id="adminPassword"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter secure password"
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                className="admin-toggle-pwd"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        className="admin-login-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="admin-spinner"></span>
                                Authenticating...
                            </>
                        ) : (
                            <>
                                Sign In to Admin Console
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                {/* FOOTER NOTICE */}
                <div className="admin-login-footer">
                    <div className="admin-return-nav">
                        <span>Not logging in as Admin?</span>
                        <Link to="/login" className="admin-return-link">
                            Go to Main Login (Customer & Owner)
                        </Link>
                    </div>

                    <div className="admin-security-note">
                        <KeyRound size={14} />
                        <span>Protected administrative interface. All actions are logged.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
