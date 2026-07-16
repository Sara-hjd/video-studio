import React, { useEffect, useState } from 'react';

const CenteredPopup = ({ 
  isVisible, 
  onClose, 
  type = 'success', // 'success', 'error', 'warning', 'info'
  title, 
  message, 
  duration = 0, // 0 = no auto-close, user must click
  showCloseButton = true
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Prevent body scroll when popup is open
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => {
          clearTimeout(timer);
          // Restore original scroll
          document.body.style.overflow = originalStyle;
          document.body.style.position = '';
          document.body.style.width = '';
          document.body.style.height = '';
        };
      }
      
      return () => {
        // Restore original scroll
        document.body.style.overflow = originalStyle;
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      };
    } else {
      // Restore body scroll when popup is closed
      document.body.style.overflow = 'auto';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isVisible) return null;

  const typeStyles = {
    success: {
      icon: '✅',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      titleColor: 'text-green-800',
      buttonColor: 'bg-green-600 hover:bg-green-700'
    },
    error: {
      icon: '❌',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      titleColor: 'text-red-800',
      buttonColor: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: '⚠️',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      titleColor: 'text-yellow-800',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      icon: 'ℹ️',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
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
              {message && (
                <p className="text-gray-600 mt-1">{message}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className={`px-6 py-2 text-white rounded-lg font-medium transition-colors ${styles.buttonColor}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default CenteredPopup;
