import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Upload,
    CheckCircle2,
    AlertCircle,
    Info,
    X,
    Bike,
    IndianRupee,
    MapPin
} from "lucide-react";
import bikeService from "../../services/bikeService";
import { getImageUrl } from "../../services/api";
import OwnerLayout from "../../components/owner/OwnerLayout";
import "./AddBike.css";

const BIKE_TYPES = [
    "Scooter",
    "Cruiser",
    "Sports",
    "Street",
    "Adventure",
    "Electric",
    "Other"
];

const AddBike = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState({
        bikeName: "",
        brand: "",
        model: "",
        type: "",
        pricePerDay: "",
        location: "",
        status: "available"
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [existingImage, setExistingImage] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Fetch existing bike if in edit mode
    useEffect(() => {
        if (!id) return;

        let isMounted = true;
        const fetchBike = async () => {
            try {
                setFetching(true);
                const data = await bikeService.getBikeById(id);
                if (data && data.bike && isMounted) {
                    const b = data.bike;
                    setFormData({
                        bikeName: b.bikeName || "",
                        brand: b.brand || "",
                        model: b.model || "",
                        type: b.type || "",
                        pricePerDay: b.pricePerDay || "",
                        location: b.location || "",
                        status: b.status || "available"
                    });
                    if (b.image) {
                        setExistingImage(b.image);
                        setImagePreview(getImageUrl(b.image));
                    }
                }
            } catch (err) {
                console.error("Failed to load bike details:", err);
                if (isMounted) {
                    setError("Failed to load bike details for editing.");
                }
            } finally {
                if (isMounted) {
                    setFetching(false);
                }
            }
        };

        fetchBike();
        return () => {
            isMounted = false;
        };
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        setError("");
    };

    const handleImageFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file (JPG, PNG, WEBP).");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Image file size must be less than 5 MB.");
            e.target.value = "";
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview("");
        setExistingImage("");
        const input = document.getElementById("bikeImageFileInput");
        if (input) input.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (
            !formData.bikeName.trim() ||
            !formData.brand.trim() ||
            !formData.model.trim() ||
            !formData.type ||
            !formData.pricePerDay ||
            !formData.location.trim()
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        if (Number(formData.pricePerDay) <= 0) {
            setError("Price per day must be greater than zero.");
            return;
        }

        try {
            setLoading(true);

            // Construct multipart FormData payload
            const data = new FormData();
            data.append("bikeName", formData.bikeName.trim());
            data.append("brand", formData.brand.trim());
            data.append("model", formData.model.trim());
            data.append("type", formData.type);
            data.append("pricePerDay", String(formData.pricePerDay));
            data.append("location", formData.location.trim());
            data.append("status", formData.status);

            if (imageFile) {
                data.append("image", imageFile);
            }

            if (isEditMode) {
                await bikeService.updateBike(id, data);
                setSuccess("Bike details updated successfully!");
            } else {
                await bikeService.createBike(data);
                setSuccess("Bike added successfully! It is now pending Admin approval.");
            }

            setTimeout(() => {
                navigate("/owner/bikes");
            }, 1400);
        } catch (err) {
            console.error("Save Bike Error:", err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to save bike details."
            );
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <OwnerLayout activePage="add-bike">
                <div className="add-bike-loading-state">
                    <div className="spinner"></div>
                    <p>Loading bike information...</p>
                </div>
            </OwnerLayout>
        );
    }

    return (
        <OwnerLayout activePage="add-bike">
            <div className="add-bike-container">
                {/* PAGE HEADER */}
                <div className="add-bike-page-header">
                    <button
                        className="btn-back-header"
                        onClick={() => navigate("/owner/bikes")}
                        title="Back to My Bikes"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <span className="owner-role-tag">
                            {isEditMode ? "EDIT LISTING" : "NEW LISTING"}
                        </span>
                        <h1>{isEditMode ? "Edit Bike Listing" : "Add New Rental Bike"}</h1>
                        <p>
                            {isEditMode
                                ? "Update your rental bike specs, daily pricing, and availability."
                                : "List your bike on MotoRent. Your submission will be reviewed by admin for approval."}
                        </p>
                    </div>
                </div>

                {/* INFO BANNER ABOUT APPROVAL */}
                {!isEditMode && (
                    <div className="approval-info-banner">
                        <Info size={20} className="info-icon" />
                        <div>
                            <strong>Approval Notice:</strong>
                            <p>
                                Newly added bikes are set to <code>pending</code> status. Once reviewed and approved by MotoRent administrators, your bike will immediately become visible to clients on the marketplace.
                            </p>
                        </div>
                    </div>
                )}

                {/* ERROR / SUCCESS ALERTS */}
                {error && (
                    <div className="form-alert-banner error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="form-alert-banner success">
                        <CheckCircle2 size={18} />
                        <span>{success}</span>
                    </div>
                )}

                {/* FORM */}
                <form className="add-bike-form-grid" onSubmit={handleSubmit}>
                    {/* SECTION 1: SPECIFICATIONS */}
                    <div className="form-card-block">
                        <div className="form-card-title">
                            <div className="card-title-icon blue">
                                <Bike size={20} />
                            </div>
                            <div>
                                <h3>Bike Specifications</h3>
                                <p>Provide details about the bike model and category</p>
                            </div>
                        </div>

                        <div className="form-inputs-grid">
                            {/* Bike Name */}
                            <div className="form-input-field full">
                                <label>Bike Name / Title <span>*</span></label>
                                <input
                                    type="text"
                                    name="bikeName"
                                    value={formData.bikeName}
                                    onChange={handleChange}
                                    placeholder="e.g. Royal Enfield Classic 350 Stealth"
                                    required
                                />
                            </div>

                            {/* Brand */}
                            <div className="form-input-field">
                                <label>Brand <span>*</span></label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    placeholder="e.g. Royal Enfield, Honda, Yamaha"
                                    required
                                />
                            </div>

                            {/* Model */}
                            <div className="form-input-field">
                                <label>Model <span>*</span></label>
                                <input
                                    type="text"
                                    name="model"
                                    value={formData.model}
                                    onChange={handleChange}
                                    placeholder="e.g. Classic 350, Activa 6G, R15"
                                    required
                                />
                            </div>

                            {/* Bike Type */}
                            <div className="form-input-field">
                                <label>Bike Type / Category <span>*</span></label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {BIKE_TYPES.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Availability */}
                            <div className="form-input-field">
                                <label>Availability Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="available">Available for Rent</option>
                                    <option value="unavailable">Unavailable (Maintenance / Personal)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: RENTAL PRICING & LOCATION */}
                    <div className="form-card-block">
                        <div className="form-card-title">
                            <div className="card-title-icon orange">
                                <IndianRupee size={20} />
                            </div>
                            <div>
                                <h3>Rental Rates & Location</h3>
                                <p>Set your daily rental rate and pickup hub city</p>
                            </div>
                        </div>

                        <div className="form-inputs-grid">
                            {/* Price per day */}
                            <div className="form-input-field">
                                <label>Price Per Day (₹) <span>*</span></label>
                                <div className="input-affix">
                                    <span className="affix-symbol">₹</span>
                                    <input
                                        type="number"
                                        name="pricePerDay"
                                        value={formData.pricePerDay}
                                        onChange={handleChange}
                                        placeholder="e.g. 750"
                                        min="1"
                                        required
                                    />
                                </div>
                                <span className="input-hint">Standard rate for 24 hours</span>
                            </div>

                            {/* Location */}
                            <div className="form-input-field">
                                <label>Pickup Location / City <span>*</span></label>
                                <div className="input-affix">
                                    <span className="affix-symbol"><MapPin size={16} /></span>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="e.g. Pune, Mumbai, Bangalore"
                                        required
                                    />
                                </div>
                                <span className="input-hint">Riders will collect and return the bike here</span>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: IMAGE UPLOAD (FILE INPUT) */}
                    <div className="form-card-block">
                        <div className="form-card-title">
                            <div className="card-title-icon purple">
                                <Upload size={20} />
                            </div>
                            <div>
                                <h3>Bike Image</h3>
                                <p>Select an image file from your computer or device</p>
                            </div>
                        </div>

                        {!imagePreview ? (
                            <div
                                className="file-dropzone"
                                onClick={() => document.getElementById("bikeImageFileInput").click()}
                            >
                                <input
                                    id="bikeImageFileInput"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/jpg"
                                    onChange={handleImageFileChange}
                                    style={{ display: "none" }}
                                />
                                <div className="dropzone-icon">📷</div>
                                <h4>Select Bike Photo</h4>
                                <p>Click to browse and upload image from your device</p>
                                <span className="dropzone-hint">JPG, JPEG, PNG, WEBP • Max 5 MB</span>
                            </div>
                        ) : (
                            <div className="image-preview-card">
                                <div className="preview-img-box">
                                    <img src={imagePreview} alt="Bike Preview" />
                                    <button
                                        type="button"
                                        className="btn-remove-preview"
                                        onClick={handleRemoveImage}
                                        title="Remove image"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="preview-info">
                                    <strong>{imageFile ? imageFile.name : (existingImage ? "Current Image" : "Image Selected")}</strong>
                                    <p>{imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : "Uploaded on server"}</p>
                                    <button
                                        type="button"
                                        className="btn-change-img"
                                        onClick={() => document.getElementById("bikeImageFileInput").click()}
                                    >
                                        Choose Different Photo
                                    </button>
                                    <input
                                        id="bikeImageFileInput"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/jpg"
                                        onChange={handleImageFileChange}
                                        style={{ display: "none" }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ACTIONS */}
                    <div className="form-bottom-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => navigate("/owner/bikes")}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-submit-bike"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    {isEditMode ? "Saving..." : "Adding Bike..."}
                                </>
                            ) : (
                                <>{isEditMode ? "Save Changes" : "+ Submit Bike"}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </OwnerLayout>
    );
};

export default AddBike;