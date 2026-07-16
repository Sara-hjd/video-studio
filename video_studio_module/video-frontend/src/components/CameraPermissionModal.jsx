import React from 'react';

const CameraPermissionModal = ({ isOpen, onClose, onAllow, onDeny }) => {
  if (!isOpen) return null;

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
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full modal-enter">
        {/* Header */}
        <div className="p-6 border-b border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl text-blue-600">📹</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800">
                Accès à la Caméra et au Microphone
              </h3>
              <p className="text-sm text-gray-600">
                Autorisation requise pour l'enregistrement
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              Pour enregistrer votre vidéo, nous avons besoin d'accéder à votre caméra et à votre microphone.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">🔒 Sécurité et Confidentialité</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Vos données restent privées et sécurisées</li>
                <li>• Aucun enregistrement sans votre autorisation</li>
                <li>• Vous pouvez révoquer l'accès à tout moment</li>
                <li>• Conformité RGPD et standards de sécurité</li>
              </ul>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-800 mb-2">⚠️ Important</h4>
              <p className="text-sm text-orange-700">
                Si vous refusez l'accès, vous ne pourrez pas utiliser la fonctionnalité d'enregistrement vidéo.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex justify-between">
            <button
              onClick={onDeny}
              className="btn btn-secondary"
            >
              Refuser
            </button>
            <button
              onClick={onAllow}
              className="btn btn-primary"
            >
              Autoriser l'accès
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPermissionModal;
