import React from 'react';

const ConfirmationModal = ({ 
  isVisible, 
  onClose, 
  onConfirm,
  title = "Confirm action",
  message = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning" // 'warning', 'danger', 'info'
}) => {
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isVisible) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      return () => {
        // Restore original scroll
        document.body.style.overflow = originalStyle;
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      };
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'auto';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const typeStyles = {
    warning: {
      icon: '⚠️',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-800',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
    },
    danger: {
      icon: '🗑️',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      titleColor: 'text-red-800',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
      cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
    },
    info: {
      icon: 'ℹ️',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
      cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
    }
  };

  const styles = typeStyles[type];

  return (
    <div 
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        padding: '1rem'
      }}
    >
      <div 
        className={`${styles.bgColor} ${styles.borderColor} border-2`}
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '28rem',
          width: '100%',
          margin: '1rem',
          animation: 'modalFadeIn 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div className={`p-6 border-b ${styles.borderColor}`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${styles.iconBg}`}>
              <span className={`text-3xl ${styles.iconColor}`}>{styles.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold ${styles.titleColor}`}>{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-center mb-6">{message}</p>
        </div>

        {/* Footer */}
        <div className="p-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${styles.cancelButton}`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
