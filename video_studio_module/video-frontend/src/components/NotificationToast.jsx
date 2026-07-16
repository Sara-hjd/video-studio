import React, { useEffect, useState } from 'react';

const NotificationToast = ({ 
  isVisible, 
  onClose, 
  type = 'success', // 'success', 'error', 'warning', 'info'
  title, 
  message, 
  duration = 5000,
  position = 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          bgColor: 'bg-green-500',
          borderColor: 'border-green-500',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          titleColor: 'text-green-800'
        };
      case 'error':
        return {
          icon: '❌',
          bgColor: 'bg-red-500',
          borderColor: 'border-red-500',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          titleColor: 'text-red-800'
        };
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: 'bg-orange-500',
          borderColor: 'border-orange-500',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          titleColor: 'text-orange-800'
        };
      default:
        return {
          icon: 'ℹ️',
          bgColor: 'bg-blue-500',
          borderColor: 'border-blue-500',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800'
        };
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  const typeStyles = getTypeStyles();
  const positionStyles = getPositionStyles();

  return (
    <div className={`fixed ${positionStyles} z-[9998] ${
      isAnimating ? 'toast-enter' : 'toast-exit'
    }`}>
      <div className={`toast-enhanced rounded-lg border-l-4 ${typeStyles.borderColor} max-w-sm w-full`}>
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <div className={`p-1 rounded-full ${typeStyles.iconBg} ${type === 'success' ? 'success-icon' : ''}`}>
              <span className={`text-lg ${typeStyles.iconColor}`}>
                {typeStyles.icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-semibold ${typeStyles.titleColor}`}>
                {title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {message}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div 
            className={`h-full ${typeStyles.bgColor} transition-all duration-100 ease-linear`}
            style={{ 
              width: '100%',
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
