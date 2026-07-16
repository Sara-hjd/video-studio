import React from 'react';

const CustomModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'info', 'success', 'warning', 'error'
  primaryButton = { text: 'OK', onClick: null },
  secondaryButton = null,
  icon = null,
  showCloseButton = true
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          borderColor: 'border-green-200',
          titleColor: 'text-green-800'
        };
      case 'warning':
        return {
          icon: '⚠️',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          borderColor: 'border-orange-200',
          titleColor: 'text-orange-800'
        };
      case 'error':
        return {
          icon: '❌',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200',
          titleColor: 'text-red-800'
        };
      default:
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-800'
        };
    }
  };

  const typeStyles = getTypeStyles();
  const displayIcon = icon || typeStyles.icon;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4"
      onClick={handleBackdropClick}
      style={{ backdropFilter: 'blur(2px)' }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full modal-enter">
        {/* Header */}
        <div className={`p-6 border-b ${typeStyles.borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${typeStyles.iconBg}`}>
                <span className={`text-xl ${typeStyles.iconColor}`}>
                  {displayIcon}
                </span>
              </div>
              <h3 className={`text-lg font-semibold ${typeStyles.titleColor}`}>
                {title}
              </h3>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            {secondaryButton && (
              <button
                onClick={secondaryButton.onClick || onClose}
                className="btn btn-secondary btn-sm"
              >
                {secondaryButton.text}
              </button>
            )}
            <button
              onClick={primaryButton.onClick || onClose}
              className="btn btn-primary btn-sm"
            >
              {primaryButton.text}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
