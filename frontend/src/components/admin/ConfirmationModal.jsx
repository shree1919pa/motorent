import { X, AlertTriangle, CheckCircle, AlertOctagon, HelpCircle } from "lucide-react";
import "./ConfirmationModal.css";

const ConfirmationModal = ({
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "info", // "approve" | "reject" | "suspend" | "activate" | "info"
    onConfirm,
    onCancel,
    loading = false
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case "approve":
            case "activate":
                return <CheckCircle className="modal-icon text-green" size={28} />;
            case "reject":
                return <AlertOctagon className="modal-icon text-red" size={28} />;
            case "suspend":
                return <AlertTriangle className="modal-icon text-amber" size={28} />;
            default:
                return <HelpCircle className="modal-icon text-blue" size={28} />;
        }
    };

    const getButtonClass = () => {
        switch (type) {
            case "approve":
            case "activate":
                return "btn-confirm-approve";
            case "reject":
                return "btn-confirm-reject";
            case "suspend":
                return "btn-confirm-suspend";
            default:
                return "btn-confirm-primary";
        }
    };

    return (
        <div className="admin-modal-backdrop" onClick={onCancel}>
            <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
                <button className="admin-modal-close" onClick={onCancel} disabled={loading}>
                    <X size={18} />
                </button>

                <div className="admin-modal-header">
                    <div className={`modal-icon-wrapper type-${type}`}>
                        {getIcon()}
                    </div>
                    <div className="modal-header-text">
                        <h3>{title}</h3>
                        <p>{message}</p>
                    </div>
                </div>

                <div className="admin-modal-actions">
                    <button
                        type="button"
                        className="btn-modal-cancel"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className={`btn-modal-confirm ${getButtonClass()}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="modal-spinner"></span>
                                Processing...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
