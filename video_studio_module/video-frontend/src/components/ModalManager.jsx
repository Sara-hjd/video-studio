import React, { useEffect } from 'react';

const ModalManager = ({ children }) => {
  useEffect(() => {
    // Empêcher le scroll du body quand un modal est ouvert
    const handleBodyScroll = (e) => {
      e.preventDefault();
    };

    // Ajouter un listener pour empêcher le scroll
    document.addEventListener('wheel', handleBodyScroll, { passive: false });
    document.addEventListener('touchmove', handleBodyScroll, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleBodyScroll);
      document.removeEventListener('touchmove', handleBodyScroll);
    };
  }, []);

  return (
    <div className="modal-manager">
      {children}
    </div>
  );
};

// Hook pour gérer l'état global des modals
export const useModalManager = () => {
  const [activeModals, setActiveModals] = React.useState([]);

  const openModal = (modalId) => {
    setActiveModals(prev => [...prev, modalId]);
    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';
  };

  const closeModal = (modalId) => {
    setActiveModals(prev => prev.filter(id => id !== modalId));
    // Restaurer le scroll si plus de modals
    if (activeModals.length <= 1) {
      document.body.style.overflow = 'auto';
    }
  };

  const closeAllModals = () => {
    setActiveModals([]);
    document.body.style.overflow = 'auto';
  };

  const isModalOpen = (modalId) => {
    return activeModals.includes(modalId);
  };

  return {
    activeModals,
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen
  };
};

export default ModalManager;
