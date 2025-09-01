// features/Admin/Employee/components/common/DeleteConfirmModal.jsx
import React from 'react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card rounded-lg shadow-xl w-full max-w-md p-6 animate-modal-appear">
                <div className="text-center">
                    <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-exclamation-triangle text-2xl text-red-500"></i>
                    </div>
                    <h3 className="text-lg font-medium text-dark-text mb-2">
                        {title || 'Xác nhận xóa'}
                    </h3>
                    <p className="text-dark-textSecondary">
                        {message || 'Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác.'}
                    </p>
                    <div className="mt-6 flex justify-center space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-dark-text bg-secondary-700 border border-dark-border rounded-md hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Xóa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;