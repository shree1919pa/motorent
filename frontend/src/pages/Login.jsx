
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    User,
    LockKeyhole,
    Eye,
    EyeOff,
    Store,
    UserRound,
    ArrowRight,
    Check,
    ShieldCheck
} from "lucide-react";

import useAuth from "../context/useAuth";

import "./Login.css";


const Login = () => {

    const navigate = useNavigate();

    const { login, user, isAuthenticated } = useAuth();

    // If user is already authenticated, redirect them directly to their role dashboard
    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === "admin") {
                navigate("/admin/dashboard", { replace: true });
            } else if (user.role === "owner") {
                navigate("/owner/dashboard", { replace: true });
            } else {
                navigate("/dashboard", { replace: true });
            }
        }
    }, [isAuthenticated, user, navigate]);


    // ==========================================
    // LOGIN TYPE
    // ==========================================

    const [loginType, setLoginType] =
        useState("client");


    // ==========================================
    // FORM DATA
    // ==========================================

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });


    const [showPassword, setShowPassword] =
        useState(false);

    const [rememberMe, setRememberMe] =
        useState(false);

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    // FEATURE 1: Clear persisted login values on mount
    useEffect(() => {
        setFormData({
            email: "",
            password: ""
        });
        setError("");
    }, [loginType]);


    // ==========================================
    // HANDLE INPUT
    // ==========================================

    const handleChange = (e) => {

        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));

        setError("");
    };


    // ==========================================
    // CHANGE CLIENT / OWNER
    // ==========================================

    const handleLoginTypeChange = (type) => {

        setLoginType(type);

        setFormData({
            email: "",
            password: ""
        });

        setError("");

        setShowPassword(false);
    };


    // ==========================================
    // LOGIN
    // ==========================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");


        // --------------------------------------
        // EMAIL VALIDATION
        // --------------------------------------

        if (!formData.email.trim()) {

            setError(
                "Please enter your email address."
            );

            return;
        }


        // --------------------------------------
        // PASSWORD VALIDATION
        // --------------------------------------

        if (!formData.password) {

            setError(
                "Please enter your password."
            );

            return;
        }


        try {

            setLoading(true);


            // ==================================
            // LOGIN THROUGH AUTH CONTEXT
            // ==================================

            const data = await login(
                formData.email.trim(),
                formData.password
            );


            console.log(
                "Login Response:",
                data
            );


            // ==================================
            // CHECK RESPONSE
            // ==================================

            if (!data || !data.user) {

                throw new Error(
                    "Invalid login response."
                );
            }


            const userRole =
                data.user.role;


            // ==================================
            // ADMIN LOGIN
            // ==================================
            if (userRole === "admin") {
                navigate("/admin/dashboard", { replace: true });
                return;
            }

            // ==================================
            // OWNER LOGIN
            // ==================================

            if (loginType === "owner") {

                if (
                    userRole !== "owner"
                ) {

                    throw new Error(
                        "This account is not registered as a bike owner."
                    );
                }


                // Owner Dashboard
                navigate(
                    "/owner/dashboard",
                    { replace: true }
                );

                return;
            }


            // ==================================
            // CLIENT LOGIN
            // ==================================

            if (loginType === "client") {

                if (
                    userRole !== "customer" &&
                    userRole !== "client"
                ) {

                    throw new Error(
                        "This account is not registered as a client."
                    );
                }


                // Client Dashboard / Home
                navigate("/dashboard", { replace: true });

                return;
            }


        } catch (err) {

            console.error(
                "Login error:",
                err
            );


            setError(
                err.response?.data?.message ||
                err.message ||
                "Login failed. Please check your credentials."
            );


        } finally {

            setLoading(false);
        }
    };


    const isOwner =
        loginType === "owner";


    // ==========================================
    // UI
    // ==========================================

    return (

        <div className="login-page">

            <div className="login-container">


                {/* =================================
                    LEFT BRAND PANEL
                ================================= */}

                <div className="login-left">

                    <div className="brand-content">


                        {/* LOGO */}

                        <div className="motorent-logo">

                            <div className="motorent-bike">
                                🏍️
                            </div>

                            <div className="motorent-name">

                                <span className="moto">
                                    Moto
                                </span>

                                <span className="rent">
                                    Rent
                                </span>

                            </div>

                        </div>


                        {/* HEADING */}

                        <div className="brand-heading">

                            <h1>

                                {isOwner
                                    ? "Grow your bike rental business."
                                    : "Your ride, your way."
                                }

                            </h1>


                            <p>

                                {isOwner
                                    ? "List your bikes, manage bookings and grow your rental business with MotoRent."
                                    : "Discover and rent the perfect bike for your next journey."
                                }

                            </p>

                        </div>


                        {/* FEATURES */}

                        <div className="brand-features">


                            {/* FEATURE 1 */}

                            <div className="brand-feature">

                                <div className="feature-check">

                                    <Check size={14} />

                                </div>


                                <div>

                                    <strong>

                                        {isOwner
                                            ? "Manage Your Bikes"
                                            : "Wide Selection"
                                        }

                                    </strong>


                                    <span>

                                        {isOwner
                                            ? "Add and manage all your rental bikes easily."
                                            : "Choose from high quality bikes near you."
                                        }

                                    </span>

                                </div>

                            </div>


                            {/* FEATURE 2 */}

                            <div className="brand-feature">

                                <div className="feature-check">

                                    <Check size={14} />

                                </div>


                                <div>

                                    <strong>

                                        {isOwner
                                            ? "Fast Setup & Direct Bookings"
                                            : "Easy Booking & Transparent Pricing"
                                        }

                                    </strong>


                                    <span>

                                        {isOwner
                                            ? "Control availability, pricing, and specs in real time."
                                            : "No hidden charges, rent seamlessly by the day."
                                        }

                                    </span>

                                </div>

                            </div>


                            {/* FEATURE 3 */}

                            <div className="brand-feature">

                                <div className="feature-check">

                                    <Check size={14} />

                                </div>


                                <div>

                                    <strong>

                                        {isOwner
                                            ? "Trusted Platform"
                                            : "Secure & Verified"
                                        }

                                    </strong>


                                    <span>

                                        {isOwner
                                            ? "Reach genuine riders across your city."
                                            : "Safe, inspected and verified rides."
                                        }

                                    </span>

                                </div>

                            </div>

                        </div>


                        {/* FOOTER */}

                        <div className="brand-footer">

                            <span>
                                © 2026 MotoRent
                            </span>

                            <span>
                                Bike Rental Platform
                            </span>

                        </div>

                    </div>

                </div>


                {/* =================================
                    RIGHT LOGIN PANEL
                ================================= */}

                <div className="login-right">


                    <div className="login-form-container">


                        {/* HEADING */}

                        <div className="login-heading">

                            <h2>
                                Welcome Back
                            </h2>

                            <p>
                                Sign in to continue to MotoRent
                            </p>

                        </div>


                        {/* =================================
                            LOGIN TYPE
                        ================================= */}

                        <div className="login-type-section">

                            <label className="section-label">
                                Login as
                            </label>


                            <div className="login-type-container">


                                {/* CLIENT */}

                                <button
                                    type="button"

                                    className={`login-type-card ${
                                        !isOwner
                                            ? "active"
                                            : ""
                                    }`}

                                    onClick={() =>
                                        handleLoginTypeChange(
                                            "client"
                                        )
                                    }
                                >

                                    <div className="login-type-icon">

                                        <UserRound size={21} />

                                    </div>


                                    <div className="login-type-info">

                                        <strong>
                                            Client
                                        </strong>

                                        <span>
                                            Rent a bike
                                        </span>

                                    </div>


                                    {!isOwner && (

                                        <div className="type-check">

                                            <Check size={13} />

                                        </div>

                                    )}

                                </button>


                                {/* OWNER */}

                                <button
                                    type="button"

                                    className={`login-type-card ${
                                        isOwner
                                            ? "active"
                                            : ""
                                    }`}

                                    onClick={() =>
                                        handleLoginTypeChange(
                                            "owner"
                                        )
                                    }
                                >

                                    <div className="login-type-icon">

                                        <Store size={21} />

                                    </div>


                                    <div className="login-type-info">

                                        <strong>
                                            Bike Owner
                                        </strong>

                                        <span>
                                            Manage your bikes
                                        </span>

                                    </div>


                                    {isOwner && (

                                        <div className="type-check">

                                            <Check size={13} />

                                        </div>

                                    )}

                                </button>

                            </div>

                        </div>


                        {/* =================================
                            ERROR
                        ================================= */}

                        {error && (

                            <div className="login-error">

                                {error}

                            </div>

                        )}


                        {/* =================================
                            FORM
                        ================================= */}

                        <form
                            onSubmit={handleSubmit}
                            className="login-form"
                            autoComplete="off"
                        >


                            {/* EMAIL */}

                            <div className="form-group">

                                <label htmlFor="email">
                                    Email Address
                                </label>


                                <div className="input-box">

                                    <User
                                        size={19}
                                        className="input-icon"
                                    />


                                    <input

                                        id="email"

                                        name="email"

                                        type="email"

                                        value={
                                            formData.email
                                        }

                                        onChange={
                                            handleChange
                                        }

                                        placeholder="Enter your email address"

                                        autoComplete="off"
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                        spellCheck="false"

                                        required

                                    />

                                </div>

                            </div>


                            {/* PASSWORD */}

                            <div className="form-group">


                                <div className="password-label">

                                    <label htmlFor="password">

                                        Password

                                    </label>


                                    <button

                                        type="button"

                                        className="forgot-password"

                                        onClick={() =>
                                            alert(
                                                "Password reset link will be sent to your registered email."
                                            )
                                        }

                                    >

                                        Forgot Password?

                                    </button>

                                </div>


                                <div className="input-box">


                                    <LockKeyhole
                                        size={19}
                                        className="input-icon"
                                    />


                                    <input

                                        id="password"

                                        name="password"

                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }

                                        value={
                                            formData.password
                                        }

                                        onChange={
                                            handleChange
                                        }

                                        placeholder="Enter your password"

                                        autoComplete="new-password"

                                        required

                                    />


                                    <button

                                        type="button"

                                        className="password-eye"

                                        onClick={() =>
                                            setShowPassword(
                                                !showPassword
                                            )
                                        }

                                    >

                                        {showPassword
                                            ? <EyeOff size={19} />
                                            : <Eye size={19} />
                                        }

                                    </button>

                                </div>

                            </div>


                            {/* REMEMBER */}

                            <div className="remember-row">

                                <label>

                                    <input

                                        type="checkbox"

                                        checked={
                                            rememberMe
                                        }

                                        onChange={(e) =>
                                            setRememberMe(
                                                e.target.checked
                                            )
                                        }

                                    />

                                    <span>
                                        Remember me
                                    </span>

                                </label>

                            </div>


                            {/* LOGIN BUTTON */}

                            <button

                                type="submit"

                                className="login-button"

                                disabled={loading}

                            >

                                {loading ? (

                                    <>

                                        <span className="spinner"></span>

                                        Signing in...

                                    </>

                                ) : (

                                    <>

                                        Sign In

                                        <ArrowRight
                                            size={18}
                                        />

                                    </>

                                )}

                            </button>

                        </form>


                        {/* =================================
                            CLIENT / OWNER REGISTRATION
                        ================================= */}

                        <div className="register-section">

                            <span>
                                Don't have an account?
                            </span>


                            <Link to="/register">
                                Create Account
                            </Link>

                        </div>


                        {/* =================================
                            OWNER QUICK SWITCH
                        ================================= */}

                        {!isOwner ? (

                            <div className="owner-register">

                                <span>
                                    Want to rent out your bikes?
                                </span>


                                <button

                                    type="button"

                                    onClick={() =>
                                        handleLoginTypeChange(
                                            "owner"
                                        )
                                    }

                                >

                                    Login as Bike Owner

                                </button>

                            </div>

                        ) : (

                            <div className="owner-register">

                                <span>
                                    Looking to rent a bike?
                                </span>


                                <button

                                    type="button"

                                    onClick={() =>
                                        handleLoginTypeChange(
                                            "client"
                                        )
                                    }

                                >

                                    Login as Client

                                </button>

                            </div>

                        )}

                    </div>


                    {/* =====================================
                        ADMIN LOGIN
                    ===================================== */}

                    <div className="admin-login-area">

                        <button

                            type="button"

                            className="admin-login-button"

                            onClick={() =>
                                navigate("/admin/login")
                            }

                        >

                            <ShieldCheck
                                size={16}
                            />

                            <span>
                                Admin Login
                            </span>

                        </button>

                    </div>


                </div>

            </div>

        </div>
    );
};


export default Login;