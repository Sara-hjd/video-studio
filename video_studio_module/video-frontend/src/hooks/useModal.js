import { useState, useCallback, useEffect } from 'react';

export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [isAnimating, setIsAnimating] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
    setIsAnimating(true);
    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';
  }, []);

  const closeModal = useCallback(() => {
    setIsAnimating(false);
    // Restaurer le scroll du body
    document.body.style.overflow = 'auto';
    // Délai pour l'animation de sortie
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
  }, []);

  const toggleModal = useCallback(() => {
    if (isOpen) {
      closeModal();
    } else {
      openModal();
    }
  }, [isOpen, openModal, closeModal]);

  // Cleanup au unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return {
    isOpen,
    isAnimating,
    openModal,
    closeModal,
    toggleModal
  };
};

export const useNotification = () => {
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'info',
    title: '',
    message: '',
    duration: 5000
  });

  const showNotification = useCallback(({ type, title, message, duration = 5000 }) => {
    setNotification({
      isVisible: true,
      type,
      title,
      message,
      duration
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const showSuccess = useCallback((title, message, duration) => {
    showNotification({ type: 'success', title, message, duration });
  }, [showNotification]);

  const showError = useCallback((title, message, duration) => {
    showNotification({ type: 'error', title, message, duration });
  }, [showNotification]);

  const showWarning = useCallback((title, message, duration) => {
    showNotification({ type: 'warning', title, message, duration });
  }, [showNotification]);

  const showInfo = useCallback((title, message, duration) => {
    showNotification({ type: 'info', title, message, duration });
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};
