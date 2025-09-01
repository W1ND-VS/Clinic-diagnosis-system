import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const ConfirmationDialogModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Xác nhận',
    message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
    confirmButtonText = 'Xác nhận',
    cancelButtonText = 'Hủy',
    icon = 'exclamation-triangle',
    iconColor = 'text-yellow-500',
    confirmButtonColor = 'bg-blue-600 hover:bg-blue-700',
    dangerConfirm = false,
}) => {
    // Xử lý phím ESC để đóng modal
    useEffect(() => {
        const handleEscKey = (event) => {
            if (isOpen && event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscKey);

        // Vô hiệu hóa cuộn trên body khi modal hiển thị
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            {/* Overlay with fade animation */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                onClick={onClose}
            ></div>

            {/* Modal with slide-in animation */}
            <div className="flex items-center justify-center min-h-screen p-4">
                <div
                    className="bg-dark-card rounded-lg shadow-xl w-full max-w-md p-6 border border-dark-border transform transition-all duration-300 ease-in-out translate-y-0 scale-100 opacity-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="mb-6 text-center">
                        {/* Icon */}
                        <div className="inline-flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-secondary-800 mb-6">
                            <i className={`fas fa-${icon} ${iconColor} text-3xl`}></i>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-semibold text-dark-text mb-2" id="modal-title">
                            {title}
                        </h3>

                        {/* Message */}
                        <div className="text-dark-textSecondary">
                            {message}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-dark-border rounded-md text-dark-text hover:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-dark-card transition-colors"
                        >
                            {cancelButtonText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-4 py-2.5 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${dangerConfirm
                                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                    : confirmButtonColor + ' focus:ring-blue-500'
                                }`}
                        >
                            {confirmButtonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

ConfirmationDialogModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    title: PropTypes.string,
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    confirmButtonText: PropTypes.string,
    cancelButtonText: PropTypes.string,
    icon: PropTypes.string,
    iconColor: PropTypes.string,
    confirmButtonColor: PropTypes.string,
    dangerConfirm: PropTypes.bool,
};

export default ConfirmationDialogModal;