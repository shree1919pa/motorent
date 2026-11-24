import { useState, useEffect } from "react";
import { AlertOctagon, X } from "lucide-react";
import "./BlockReasonModal.css";

const CLIENT_REASONS = [
    "Complaint received",
    "Policy violation",
    "Suspicious activity",
    "Payment issue",
    "Harassment / Misconduct",
    "Other"
];

const OWNER_REASONS = [
    "Complaint received",
    "Policy violation",
    "Vehicle condition issues",
    "Unresponsive to bookings",
    "Pricing malpractice",
    "Other"
];

const BIKE_REASONS = [
    "Customer complaint",
    "Bike condition issue",
    "Invalid information",
    "Safety issue",
    "Owner violation",
    "Other"
];

const BlockReasonModal = ({
    isOpen,
    targetType = "client", // "client" | "owner" | "bike"
    targetName = "",
    onConfirm,
    onCancel,
    loading = false
}) => {
    const reasonsList =
        targetType === "client"
            ? CLIENT_REASONS
            : targetType === "owner"
            ? OWNER_REASONS
            : BIKE_REASONS;

    const [selectedReason, setSelectedReason] = useState(reasonsList[0]);
    const [customReason, setCustomReason] = useState("");

    useEffect(() => {
        if (isOpen) {
            setSelectedReason(reasonsList[0]);
            setCustomReason("");
        }
    }, [isOpen, targetType]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        const finalReason =
            selectedReason === "Other"
                ? customReason.trim() || "Administrative action"
                : customReason.trim()
                ? `${selectedReason}: ${customReason.trim()}`
                : selectedReason;

        onConfirm(finalReason);
    };

    const isUser = targetType === "client" || targetType === "owner";

    return (
        <div className="block-modal-backdrop" onClick={onCancel}>
            <div className="block-modal-card" onClick={(e) => e.stopPropagation()}>
                <button className="block-modal-close" onClick={onCancel} disabled={loading}>
                    <X size={18} />
                </button>

                <div className="block-modal-header">
                    <div className="block-icon-wrapper">
                        <AlertOctagon size={26} />
                    </div>
                    <div className="block-header-text">
                        <h3>Block {targetType === "client" ? "Client" : targetType === "owner" ? "Bike Owner" : "Bike Listing"}</h3>
                        <p>Are you sure you want to block <strong>{targetName || "this record"}</strong>?</p>
                    </div>
                </div>

                <div className="block-modal-body">
                    <div className="block-warning-box">
                        {isUser
                            ? "⚠️ Blocking this account will prevent them from logging in and accessing any application features immediately."
                            : "⚠️ Blocking this bike listing will make it unavailable and remove it from the customer marketplace immediately."}
                    </div>

                    <div className="block-form-group">
                        <label>Reason for Blocking</label>
                        <select
                            className="block-select"
                            value={selectedReason}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            disabled={loading}
                        >
                            {reasonsList.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="block-form-group">
                        <label>Additional Notes / Details</label>
                        <textarea
                            className="block-textarea"
                            placeholder="Enter specific details or notes for this block action..."
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="block-modal-actions">
                    <button
                        type="button"
                        className="btn-block-cancel"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn-block-confirm"
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : `Confirm & Block`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BlockReasonModal;
