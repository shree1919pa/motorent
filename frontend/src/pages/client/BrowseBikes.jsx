import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Search,
    MapPin,
    Bike as BikeIcon,
    ArrowRight,
    Star,
    Shield,
    Clock,
    User,
    CheckCircle2,
    Calendar,
    Phone,
    X,
    LogOut,
    CalendarDays,
    AlertCircle,
    AlertTriangle,
    QrCode,
    CreditCard,
    UploadCloud,
    ArrowLeft,
    Check,
    Info,
    ShieldAlert
} from "lucide-react";
import useAuth from "../../context/useAuth";
import bikeService from "../../services/bikeService";
import bookingService from "../../services/bookingService";
import { getImageUrl } from "../../services/api";
import NotificationBell from "../../components/NotificationBell";
import CustomerNavbar from "../../components/common/CustomerNavbar";
import "./BrowseBikes.css";

const CATEGORIES = ["All", "Scooter", "Cruiser", "Sports", "Adventure", "Street", "Electric"];

const BrowseBikes = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isOwner, logout } = useAuth();

    const [bikes, setBikes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedLocation, setSelectedLocation] = useState("All");
    const [maxPrice, setMaxPrice] = useState(5000);

    // Filter by dates in catalog
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");

    // Booking Modal State
    const [selectedBike, setSelectedBike] = useState(null);
    const [bookingStep, setBookingStep] = useState(1); // 1 = Details & Policy, 2 = Payment & Screenshot, 3 = Success
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingSubmitting, setBookingSubmitting] = useState(false);
    const [bookingError, setBookingError] = useState("");
    const [dateConflictError, setDateConflictError] = useState("");

    const [bookingData, setBookingData] = useState({
        startDate: "",
        endDate: "",
        customerName: "",
        customerMobile: "",
        notes: "",
        paymentTransactionId: "",
        policyAccepted: false
    });

    const [paymentScreenshotFile, setPaymentScreenshotFile] = useState(null);
    const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState("");

    const fetchBikes = async () => {
        try {
            setLoading(true);
            const queryParams = {};
            if (filterStartDate && filterEndDate) {
                queryParams.startDate = filterStartDate;
                queryParams.endDate = filterEndDate;
            }
            const data = await bikeService.searchBikes(queryParams);
            setBikes(data.bikes || []);
        } catch (err) {
            console.error("Failed to load bikes:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBikes();
    }, [filterStartDate, filterEndDate]);

    // Unique locations from fetched bikes
    const availableLocations = ["All", ...new Set((bikes || []).map((b) => b?.location).filter(Boolean))];

    // Client-side filtering logic
    const filteredBikes = (bikes || []).filter((b) => {
        if (!b) return false;
        const query = (searchQuery || "").toLowerCase().trim();
        const matchesQuery =
            !query ||
            (b.bikeName && b.bikeName.toLowerCase().includes(query)) ||
            (b.brand && b.brand.toLowerCase().includes(query)) ||
            (b.model && b.model.toLowerCase().includes(query)) ||
            (b.location && b.location.toLowerCase().includes(query));

        const matchesCat =
            selectedCategory === "All" ||
            (b.type && b.type.toLowerCase() === selectedCategory.toLowerCase());

        const matchesLoc =
            selectedLocation === "All" ||
            (b.location && b.location.toLowerCase() === selectedLocation.toLowerCase());

        const matchesPrice = !b.pricePerDay || Number(b.pricePerDay) <= maxPrice;

        return matchesQuery && matchesCat && matchesLoc && matchesPrice;
    });

    const handleOpenBooking = async (bike) => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }

        try {
            // Fetch complete bike data to ensure ownerId is fully populated (including qrCode)
            const freshData = await bikeService.getBikeById(bike._id);
            const fullBike = freshData?.bike || bike;

            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const initialStart = filterStartDate || today.toISOString().split("T")[0];
            const initialEnd = filterEndDate || tomorrow.toISOString().split("T")[0];

            setSelectedBike(fullBike);
            setBookingStep(1);
            setBookingSuccess(false);
            setBookingError("");
            setDateConflictError("");
            setPaymentScreenshotFile(null);
            setPaymentScreenshotPreview("");

            setBookingData({
                startDate: initialStart,
                endDate: initialEnd,
                customerName: user?.name || "",
                customerMobile: user?.mobile || "",
                notes: "",
                paymentTransactionId: "",
                policyAccepted: false
            });

            // Instant availability verification for selected dates
            try {
                const avail = await bikeService.checkBikeAvailability(fullBike._id, initialStart, initialEnd);
                if (avail && !avail.available) {
                    setDateConflictError(
                        avail.message ||
                        "Sorry! This bike is already booked for some of your selected dates. Please select another date range or choose another bike."
                    );
                } else {
                    setDateConflictError("");
                }
            } catch (availErr) {
                if (availErr.response?.data?.message) {
                    setDateConflictError(availErr.response.data.message);
                }
            }
        } catch (err) {
            console.error("Failed to fetch bike details:", err);
            setSelectedBike(bike);
        }
    };

    // Live date change & conflict check
    const handleDateChange = async (field, value) => {
        const updated = { ...bookingData, [field]: value };
        setBookingData(updated);
        setBookingError("");

        if (updated.startDate && updated.endDate && selectedBike) {
            const start = new Date(updated.startDate);
            const end = new Date(updated.endDate);

            if (start >= end) {
                setDateConflictError("Rental start date must be before return date.");
                return;
            }

            try {
                const avail = await bikeService.checkBikeAvailability(
                    selectedBike._id,
                    updated.startDate,
                    updated.endDate
                );
                if (avail && !avail.available) {
                    setDateConflictError(
                        avail.message ||
                        "Sorry! This bike is already booked for some of your selected dates. Please select another date range or choose another bike."
                    );
                } else {
                    // Remove the warning automatically when valid available dates are selected
                    setDateConflictError("");
                }
            } catch (err) {
                setDateConflictError(
                    err.response?.data?.message ||
                    "Sorry! This bike is already booked for some of your selected dates. Please select another date range or choose another bike."
                );
            }
        } else {
            setDateConflictError("");
        }
    };

    // FEATURE 3: Dynamic 20% advance calculation
    const calculatePricing = () => {
        if (!bookingData.startDate || !bookingData.endDate || !selectedBike) {
            const price = Number(selectedBike?.pricePerDay) || 0;
            const adv = Math.round(price * 0.20);
            return {
                days: 1,
                pricePerDay: price,
                total: price,
                advancePercentage: 20,
                advanceAmount: adv,
                remainingAmount: price - adv
            };
        }

        const s = new Date(bookingData.startDate);
        const e = new Date(bookingData.endDate);
        const diffTime = Math.abs(e - s);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const days = diffDays === 0 ? 1 : diffDays;

        const pricePerDay = Number(selectedBike.pricePerDay) || 0;
        const total = days * pricePerDay;
        const advancePercentage = 20;
        const advanceAmount = Math.round(total * 0.20);
        const remainingAmount = total - advanceAmount;

        return {
            days,
            pricePerDay,
            total,
            advancePercentage,
            advanceAmount,
            remainingAmount
        };
    };

    const handleProceedToPayment = async (e) => {
        e.preventDefault();
        setBookingError("");

        if (!bookingData.startDate || !bookingData.endDate) {
            setBookingError("Please select both start and end rental dates.");
            return;
        }

        if (new Date(bookingData.startDate) >= new Date(bookingData.endDate)) {
            setBookingError("Rental start date must be before end date.");
            return;
        }

        if (dateConflictError) {
            return;
        }

        if (!bookingData.customerName.trim() || !bookingData.customerMobile.trim()) {
            setBookingError("Please provide your name and contact phone number.");
            return;
        }

        if (!bookingData.policyAccepted) {
            setBookingError("You must read and accept the Cancellation Policy to continue.");
            return;
        }

        // Live backend availability verification before advancing to payment QR step
        try {
            const avail = await bikeService.checkBikeAvailability(
                selectedBike._id,
                bookingData.startDate,
                bookingData.endDate
            );
            if (!avail || !avail.available) {
                setDateConflictError(
                    avail?.message ||
                    "Sorry! This bike is already booked for some of your selected dates. Please select another date range or choose another bike."
                );
                return;
            }
        } catch (err) {
            setDateConflictError(
                err.response?.data?.message ||
                "Sorry! This bike is already booked for some of your selected dates. Please select another date range or choose another bike."
            );
            return;
        }

        setBookingStep(2);
    };

    const handleScreenshotChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowed.includes(file.mimetype || file.type)) {
            setBookingError("Only JPG, JPEG, PNG and WEBP payment screenshot images are allowed.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setBookingError("Payment screenshot size must be less than 5MB.");
            return;
        }

        setBookingError("");
        setPaymentScreenshotFile(file);
        setPaymentScreenshotPreview(URL.createObjectURL(file));
    };

    const handleSubmitBookingWithPayment = async (e) => {
        e.preventDefault();
        setBookingError("");

        if (!paymentScreenshotFile) {
            setBookingError("Please upload your payment transaction screenshot before submitting.");
            return;
        }

        const { advanceAmount, total } = calculatePricing();

        try {
            setBookingSubmitting(true);
            const formData = new FormData();
            formData.append("bikeId", selectedBike._id);
            formData.append("startDate", bookingData.startDate);
            formData.append("endDate", bookingData.endDate);
            formData.append("customerName", bookingData.customerName.trim());
            formData.append("customerMobile", bookingData.customerMobile.trim());
            formData.append("notes", bookingData.notes.trim());
            formData.append("submittedAdvanceAmount", advanceAmount);
            formData.append("paymentTransactionId", bookingData.paymentTransactionId.trim());
            formData.append("policyAccepted", "true");
            formData.append("paymentScreenshot", paymentScreenshotFile);

            await bookingService.createBooking(formData);

            setBookingSuccess(true);
            setBookingStep(3);
        } catch (err) {
            console.error("Booking Creation Error:", err);
            setBookingError(
                err.response?.data?.message ||
                err.message ||
                "Failed to submit booking request. Please check dates or payment evidence."
            );
        } finally {
            setBookingSubmitting(false);
        }
    };

    const pricing = calculatePricing();

    // Owner info for selected bike
    const owner = selectedBike?.ownerId || {};
    const ownerQrUrl = getImageUrl(owner.qrCode);

    return (
        <div className="browse-page">
            {/* =========================================
                NAVBAR (FEATURE 2)
            ========================================= */}
            <CustomerNavbar activePage="explore" />

            {/* =========================================
                HERO SECTION
            ========================================= */}
            <section className="browse-hero">
                <div className="hero-content">
                    <div className="hero-badge">
                        <Star size={14} fill="#f59e0b" color="#f59e0b" /> Premium Bike Rentals
                    </div>
                    <h1>Rent Your Dream Ride in Minutes</h1>
                    <p>
                        Discover top-rated motorcycles and scooters from verified local owners. Pay minimum 20% advance via owner UPI QR, verify booking, and ride away.
                    </p>

                    {/* HERO SEARCH BAR WITH DATE FILTER */}
                    <div className="hero-search-bar updated-search-bar">
                        <div className="search-input-field">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search by bike name, brand, or model..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="location-select-field">
                            <MapPin size={18} />
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                            >
                                <option value="All">All Locations</option>
                                {availableLocations.filter((l) => l !== "All").map((loc) => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>

                        <div className="hero-date-field" title="Select rental pickup date">
                            <Calendar size={18} />
                            <div className="hero-date-input-wrap">
                                <span className="hero-date-label">Pickup Date</span>
                                <input
                                    type="date"
                                    value={filterStartDate}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="hero-date-field" title="Select rental return date">
                            <Calendar size={18} />
                            <div className="hero-date-input-wrap">
                                <span className="hero-date-label">Return Date</span>
                                <input
                                    type="date"
                                    value={filterEndDate}
                                    min={filterStartDate || new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {(filterStartDate || filterEndDate) && (
                            <button
                                type="button"
                                className="hero-clear-dates-btn"
                                onClick={() => {
                                    setFilterStartDate("");
                                    setFilterEndDate("");
                                }}
                                title="Clear date filters"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* ACTIVE DATES BADGE */}
                    {filterStartDate && filterEndDate && (
                        <div className="active-dates-indicator">
                            <CalendarDays size={15} />
                            <span>
                                Filtering for available dates: <strong>{filterStartDate}</strong> to <strong>{filterEndDate}</strong>
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setFilterStartDate("");
                                    setFilterEndDate("");
                                }}
                            >
                                Clear Dates
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* =========================================
                MAIN CATALOG & FILTERS
            ========================================= */}
            <main className="catalog-container">
                {/* CATEGORY TABS */}
                <div className="category-pills">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* FILTER TOOLBAR */}
                <div className="catalog-toolbar">
                    <div className="results-count">
                        Showing <strong>{filteredBikes.length}</strong> available bikes
                    </div>

                    <div className="price-slider-group">
                        <span>Max Price: <strong>₹{maxPrice}/day</strong></span>
                        <input
                            type="range"
                            min="200"
                            max="5000"
                            step="100"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(Number(e.target.value))}
                        />
                    </div>
                </div>

                {/* BIKE GRID */}
                {loading ? (
                    <div className="catalog-loading">
                        <div className="spinner" style={{ width: 40, height: 40, borderColor: "#2563eb", borderTopColor: "transparent" }}></div>
                        <p>Loading available bikes...</p>
                    </div>
                ) : filteredBikes.length === 0 ? (
                    <div className="catalog-empty">
                        <div className="empty-icon">🏍️</div>
                        <h3>No bikes found</h3>
                        <p>Try clearing your search filters or adjusting the price range.</p>
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedCategory("All");
                                setSelectedLocation("All");
                                setMaxPrice(5000);
                                setFilterStartDate("");
                                setFilterEndDate("");
                            }}
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="bikes-catalog-grid">
                        {filteredBikes.map((bike) => {
                            const imgUrl = getImageUrl(bike.image);

                            return (
                                <div className="client-bike-card" key={bike._id}>
                                    <div className="bike-card-media">
                                        {imgUrl ? (
                                            <img
                                                src={imgUrl}
                                                alt={bike.bikeName}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = "none";
                                                    if (e.currentTarget.nextElementSibling) {
                                                        e.currentTarget.nextElementSibling.style.display = "flex";
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className="media-placeholder"
                                            style={{ display: imgUrl ? "none" : "flex" }}
                                        >
                                            <span>🏍️</span>
                                        </div>

                                        <span className={`status-badge ${bike.status}`}>
                                            {bike.status === "available" ? "Available Now" : "Temporarily Reserved"}
                                        </span>
                                    </div>

                                    <div className="bike-card-body">
                                        <div className="bike-header">
                                            <h3>{bike.bikeName}</h3>
                                            <span className="bike-brand-model">
                                                {bike.brand} • {bike.model}
                                            </span>
                                        </div>

                                        <div className="bike-specs-row">
                                            <span className="spec-item">
                                                <BikeIcon size={14} /> {bike.type}
                                            </span>
                                            <span className="spec-item">
                                                <MapPin size={14} /> {bike.location}
                                            </span>
                                        </div>

                                        <div className="bike-card-footer">
                                            <div className="price-tag">
                                                <span className="currency">₹</span>
                                                <span className="amount">{bike.pricePerDay}</span>
                                                <span className="unit">/day</span>
                                            </div>

                                            <button
                                                className="rent-btn"
                                                onClick={() => handleOpenBooking(bike)}
                                            >
                                                Book Bike <ArrowRight size={15} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* =========================================
                FEATURES & TRUST BANNER
            ========================================= */}
            <section className="trust-section">
                <div className="trust-grid">
                    <div className="trust-card">
                        <div className="trust-icon blue"><Shield size={24} /></div>
                        <h4>Direct Owner QR Payments</h4>
                        <p>Pay only 20% advance directly to the verified bike owner. Remaining 80% payable on bike pickup.</p>
                    </div>

                    <div className="trust-card">
                        <div className="trust-icon orange"><Clock size={24} /></div>
                        <h4>Date-Based Reservations</h4>
                        <p>Temporary hold placed immediately on screenshot submission to prevent duplicate bookings.</p>
                    </div>

                    <div className="trust-card">
                        <div className="trust-icon green"><Star size={24} /></div>
                        <h4>Clear Cancellation Policy</h4>
                        <p>Know your refund and deduction terms up front before booking confirmation.</p>
                    </div>
                </div>
            </section>

            {/* =========================================
                UPDATED BOOKING MODAL (FEATURES 3, 4, 7)
            ========================================= */}
            {selectedBike && (
                <div className="booking-modal-backdrop" onClick={() => setSelectedBike(null)}>
                    <div
                        className="booking-modal-card updated-booking-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="modal-close-btn" onClick={() => setSelectedBike(null)}>
                            <X size={20} />
                        </button>

                        {/* STEP 1: DATES, RIDER INFO & CANCELLATION POLICY */}
                        {bookingStep === 1 && (
                            <>
                                <div className="modal-step-badge">Step 1 of 2: Reservation Details</div>
                                <h2>Book {selectedBike.bikeName}</h2>
                                <p className="modal-subtitle">
                                    {selectedBike.brand} {selectedBike.model} • Owner: <strong>{owner.businessName || owner.name || "Verified Owner"}</strong>
                                </p>

                                {/* FEATURE 1: PROMINENT RED HIGHLIGHTED DATE CONFLICT ALERT */}
                                {dateConflictError && (
                                    <div className="booking-conflict-alert" role="alert">
                                        <div className="conflict-alert-icon-wrap">
                                            <AlertTriangle className="conflict-alert-icon" size={24} />
                                        </div>
                                        <div className="conflict-alert-content">
                                            <div className="conflict-alert-title">
                                                [ ! ] BOOKING DATE CONFLICT
                                            </div>
                                            <p className="conflict-alert-message">
                                                Sorry! This bike is already booked for some of your selected dates.
                                            </p>
                                            <p className="conflict-alert-subtext">
                                                Please select another date range or choose another bike.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {bookingError && !dateConflictError && (
                                    <div className="booking-general-alert">
                                        <AlertCircle size={18} />
                                        <span>{bookingError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleProceedToPayment} className="booking-form">
                                    {/* DATES GRID */}
                                    <div className="form-date-grid">
                                        <div className="form-field">
                                            <label><Calendar size={14} /> Rental Start Date *</label>
                                            <input
                                                type="date"
                                                value={bookingData.startDate}
                                                onChange={(e) => handleDateChange("startDate", e.target.value)}
                                                min={new Date().toISOString().split("T")[0]}
                                                required
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label><Calendar size={14} /> Rental End Date *</label>
                                            <input
                                                type="date"
                                                value={bookingData.endDate}
                                                onChange={(e) => handleDateChange("endDate", e.target.value)}
                                                min={bookingData.startDate || new Date().toISOString().split("T")[0]}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* RIDER DETAILS */}
                                    <div className="form-date-grid">
                                        <div className="form-field">
                                            <label><User size={14} /> Rider Full Name *</label>
                                            <input
                                                type="text"
                                                value={bookingData.customerName}
                                                onChange={(e) => setBookingData({ ...bookingData, customerName: e.target.value })}
                                                placeholder="Your full name"
                                                required
                                            />
                                        </div>

                                        <div className="form-field">
                                            <label><Phone size={14} /> Contact Phone *</label>
                                            <input
                                                type="tel"
                                                value={bookingData.customerMobile}
                                                onChange={(e) => setBookingData({ ...bookingData, customerMobile: e.target.value })}
                                                placeholder="Phone for pickup coordination"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-field">
                                        <label>Special Requests / Notes (Optional)</label>
                                        <input
                                            type="text"
                                            value={bookingData.notes}
                                            onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                                            placeholder="e.g. Extra helmet required, pickup around 10:00 AM"
                                        />
                                    </div>

                                    {/* FEATURE 3: DYNAMIC 20% ADVANCE PAYMENT SUMMARY */}
                                    <div className="payment-summary-table-box">
                                        <div className="summary-title">
                                            <CreditCard size={15} />
                                            <span>Rental & Advance Payment Summary</span>
                                        </div>

                                        <div className="summary-line-item">
                                            <span>Bike Name:</span>
                                            <strong>{selectedBike.bikeName}</strong>
                                        </div>
                                        <div className="summary-line-item">
                                            <span>Rental Dates:</span>
                                            <strong>{bookingData.startDate} to {bookingData.endDate} ({pricing.days} {pricing.days === 1 ? "day" : "days"})</strong>
                                        </div>
                                        <div className="summary-line-item">
                                            <span>Price Per Day:</span>
                                            <strong>₹{pricing.pricePerDay}</strong>
                                        </div>
                                        <div className="summary-line-item highlight">
                                            <span>Total Rental Amount:</span>
                                            <strong>₹{pricing.total}</strong>
                                        </div>
                                        <div className="summary-line-item advance-row">
                                            <span>Required Advance (20%):</span>
                                            <strong className="text-blue">₹{pricing.advanceAmount}</strong>
                                        </div>
                                        <div className="summary-line-item remaining-row">
                                            <span>Remaining Amount (Pay on Pickup):</span>
                                            <strong>₹{pricing.remainingAmount}</strong>
                                        </div>
                                    </div>

                                    {/* FEATURE 7: CANCELLATION POLICY */}
                                    <div className="cancellation-policy-box">
                                        <div className="policy-header">
                                            <Info size={15} />
                                            <strong>Cancellation Policy</strong>
                                        </div>
                                        <p className="policy-text">
                                            If you cancel your confirmed booking, the owner may deduct a cancellation charge from your advance payment according to the applicable cancellation policy. The refundable amount depends on the owner's cancellation terms and the time of cancellation.
                                        </p>
                                        <label className="policy-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={bookingData.policyAccepted}
                                                onChange={(e) => setBookingData({ ...bookingData, policyAccepted: e.target.checked })}
                                                required
                                            />
                                            <span>I have read and agree to the Cancellation Policy.</span>
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        className={`confirm-booking-btn ${dateConflictError ? "disabled" : ""}`}
                                        disabled={bookingSubmitting || !!dateConflictError}
                                    >
                                        Proceed to Advance Payment (₹{pricing.advanceAmount}) →
                                    </button>
                                </form>
                            </>
                        )}

                        {/* STEP 2: OWNER QR CODE & PAYMENT EVIDENCE UPLOAD (FEATURE 4) */}
                        {bookingStep === 2 && (
                            <>
                                <div className="step-back-row">
                                    <button
                                        type="button"
                                        className="btn-back-step"
                                        onClick={() => { setBookingStep(1); setBookingError(""); }}
                                    >
                                        <ArrowLeft size={16} /> Edit Dates / Details
                                    </button>
                                    <span className="modal-step-badge">Step 2 of 2: Pay & Upload</span>
                                </div>

                                <h2>Pay Advance & Upload Screenshot</h2>
                                <p className="modal-subtitle">
                                    Pay ₹<strong>{pricing.advanceAmount}</strong> (20% advance) using the bike owner's UPI QR Code.
                                </p>

                                {bookingError && (
                                    <div className="booking-error-box">
                                        <AlertCircle size={16} />
                                        <span>{bookingError}</span>
                                    </div>
                                )}

                                {/* OWNER QR CODE CARD */}
                                <div className="owner-qr-container">
                                    <div className="owner-qr-header">
                                        <QrCode size={18} />
                                        <span>{owner.businessName || owner.name || "Bike Owner"}'s UPI QR Code</span>
                                    </div>

                                    {ownerQrUrl ? (
                                        <div className="qr-image-display">
                                            <img src={ownerQrUrl} alt="Owner UPI QR Code" />
                                            <span className="qr-scan-instruction">
                                                Scan with Google Pay, PhonePe, Paytm, or any UPI / Banking App
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="qr-fallback-box">
                                            <QrCode size={36} color="#94a3b8" />
                                            <p>Owner UPI QR code is on file with account.</p>
                                            <span>Contact Owner: {owner.mobile || "Via MotoRent support"}</span>
                                        </div>
                                    )}

                                    {/* PAYMENT INSTRUCTIONS (FEATURE 4 REQUIREMENT 7) */}
                                    <div className="payment-instructions-alert">
                                        <p>
                                            "Please pay a minimum advance amount of 20% of the total rental amount using the owner's QR code. After completing the payment, upload the transaction screenshot for verification."
                                        </p>
                                    </div>
                                </div>

                                {/* PAYMENT SUMMARY PILL */}
                                <div className="advance-pill-grid">
                                    <div className="pill-item">
                                        <span>Total Amount</span>
                                        <strong>₹{pricing.total}</strong>
                                    </div>
                                    <div className="pill-item blue">
                                        <span>Advance (20%)</span>
                                        <strong>₹{pricing.advanceAmount}</strong>
                                    </div>
                                    <div className="pill-item">
                                        <span>Remaining on Pickup</span>
                                        <strong>₹{pricing.remainingAmount}</strong>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmitBookingWithPayment} className="screenshot-upload-form">
                                    {/* TRANSACTION UTR / REFERENCE (OPTIONAL) */}
                                    <div className="form-field">
                                        <label>UPI Transaction ID / UTR Number (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 324567891234"
                                            value={bookingData.paymentTransactionId}
                                            onChange={(e) => setBookingData({ ...bookingData, paymentTransactionId: e.target.value })}
                                        />
                                    </div>

                                    {/* PAYMENT SCREENSHOT UPLOAD */}
                                    <div className="form-field">
                                        <label>Upload Payment Screenshot *</label>
                                        {!paymentScreenshotPreview ? (
                                            <label className="screenshot-dropzone">
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    style={{ display: "none" }}
                                                    onChange={handleScreenshotChange}
                                                    required
                                                />
                                                <UploadCloud size={28} className="dropzone-cloud" />
                                                <strong>Click to choose payment screenshot</strong>
                                                <span>JPG, JPEG, PNG, or WEBP (Max 5MB)</span>
                                            </label>
                                        ) : (
                                            <div className="screenshot-preview-card">
                                                <div className="preview-card-header">
                                                    <span className="badge-selected">
                                                        <Check size={14} /> Screenshot Selected
                                                    </span>
                                                    <label className="btn-reupload">
                                                        Change Screenshot
                                                        <input
                                                            type="file"
                                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                                            style={{ display: "none" }}
                                                            onChange={handleScreenshotChange}
                                                        />
                                                    </label>
                                                </div>
                                                <div className="screenshot-img-wrap">
                                                    <img src={paymentScreenshotPreview} alt="Payment Screenshot" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* IMPORTANT NOTICE */}
                                    <div className="verification-warning-alert">
                                        <ShieldAlert size={16} />
                                        <span>
                                            IMPORTANT: Uploading a screenshot does not automatically mean payment is successful. The owner must verify the transaction before confirming the booking.
                                        </span>
                                    </div>

                                    <button
                                        type="submit"
                                        className="confirm-booking-btn"
                                        disabled={bookingSubmitting || !paymentScreenshotFile}
                                    >
                                        {bookingSubmitting ? "Submitting Booking Request..." : "Submit Booking Request"}
                                    </button>
                                </form>
                            </>
                        )}

                        {/* STEP 3: SUCCESS VIEW */}
                        {bookingStep === 3 && (
                            <div className="booking-success-view">
                                <div className="success-icon"><CheckCircle2 size={54} /></div>
                                <h2>Booking Request Submitted!</h2>
                                <p className="success-subtitle">
                                    Status: <span className="status-highlight">Pending Owner Verification</span>
                                </p>
                                <p className="success-desc">
                                    Your payment screenshot of <strong>₹{pricing.advanceAmount}</strong> has been forwarded to the bike owner (<strong>{owner.businessName || owner.name || "Owner"}</strong>) for verification.
                                    <br /><br />
                                    The bike is now temporarily reserved for your rental dates (<strong>{bookingData.startDate}</strong> to <strong>{bookingData.endDate}</strong>). Once verified by the owner, your booking will be confirmed!
                                </p>

                                <div className="success-actions">
                                    <button
                                        className="btn-primary"
                                        onClick={() => {
                                            setSelectedBike(null);
                                            navigate("/bookings");
                                        }}
                                    >
                                        View in My Bookings →
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => setSelectedBike(null)}
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <footer className="browse-footer">
                <div className="footer-content">
                    <p>© 2026 MotoRent. All rights reserved. Ride safe, explore more.</p>
                </div>
            </footer>
        </div>
    );
};

export default BrowseBikes;
