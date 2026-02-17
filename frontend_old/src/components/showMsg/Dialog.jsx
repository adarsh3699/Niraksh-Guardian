import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "./Dialog.css";

const Dialog = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = "OK", 
  cancelText = "Cancel", 
  onConfirm, 
  onCancel, 
  type = "confirm" // Types: confirm, alert, warning, error
}) => {
  const dialogRef = useRef(null);

  // Handle ESC key press and click outside to close
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape" && isOpen && onCancel) {
        onCancel();
      }
    };

    const handleClickOutside = (e) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target) && isOpen && onCancel) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onCancel]);

  // Focus trap within the dialog
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "confirm":
        return "❓";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className="dialog-overlay">
      <div className={`dialog-container ${type}`} ref={dialogRef} role="dialog" aria-modal="true">
        <div className="dialog-header">
          <span className="dialog-icon">{getIcon()}</span>
          <h2 className="dialog-title">{title}</h2>
        </div>
        <div className="dialog-content">
          <p>{message}</p>
        </div>
        <div className="dialog-actions">
          {type !== "alert" && onCancel && (
            <button 
              className="dialog-button dialog-cancel-button" 
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
          <button 
            className="dialog-button dialog-confirm-button" 
            onClick={onConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

Dialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  type: PropTypes.oneOf(["confirm", "alert", "warning", "error"])
};

export default Dialog; 