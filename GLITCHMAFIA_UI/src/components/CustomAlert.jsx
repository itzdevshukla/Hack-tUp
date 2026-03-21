import React from 'react';
import { createPortal } from 'react-dom';
import './CustomAlert.css'; // We'll add some specific CSS for the modal

function CustomAlert({ isOpen, title, message, confirmText, onConfirm, onCancel, type = 'alert' }) {
    if (!isOpen) return null;

    const alertContent = (
        <div className="custom-alert-overlay">
            <div className={`custom-alert-box ${type === 'danger' ? 'danger' : 'info'}`}>
                <h3 className="custom-alert-title">{title}</h3>
                <p className="custom-alert-message">{message}</p>

                <div className="custom-alert-actions">
                    {onCancel && (
                        <button className="custom-alert-btn cancel" onClick={onCancel}>
                            CANCEL
                        </button>
                    )}
                    <button
                        className={`custom-alert-btn ${type === 'danger' ? 'confirm-danger' : 'confirm-info'}`}
                        onClick={onConfirm}
                    >
                        {confirmText ? confirmText : (type === 'danger' ? 'CONFIRM' : 'OK')}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(alertContent, document.body);
}

export default CustomAlert;
