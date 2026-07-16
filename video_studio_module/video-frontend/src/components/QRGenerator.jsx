import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRGenerator = () => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [polling, setPolling] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://192.168.1.168/api';

  const generateQR = async () => {
    setLoading(true);
    setError(null);
    setQrData(null);
    setSessionStatus(null);

    try {
      const response = await fetch(`${API_BASE}/videos/sessions/create_qr_session/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setQrData(data);
      
      // Start polling for video status
      startPolling(data.session_id);

    } catch (err) {
      setError(`Erreur lors de la génération du QR: ${err.message}`);
      console.error('QR Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (sessionId) => {
    setPolling(true);
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/videos/sessions/${sessionId}/status/`);
        
        if (response.ok) {
          const status = await response.json();
          setSessionStatus(status);
          
          // Stop polling if video is ready
          if (status.video_ready) {
            clearInterval(pollInterval);
            setPolling(false);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setPolling(false);
    }, 600000);
  };

  const resetSession = () => {
    setQrData(null);
    setSessionStatus(null);
    setPolling(false);
    setError(null);
  };

  return (
    <div className="qr-generator">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📱 Enregistrement Mobile</h3>
          <p className="card-subtitle">
            Générez un QR code pour permettre l'enregistrement depuis un téléphone
            <br />
            <small style={{color: 'orange'}}>⚠️ Mode HTTP - Accès caméra limité sur mobile</small>
          </p>
        </div>

        {!qrData && (
          <div className="text-center">
            <button
              onClick={generateQR}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? '⏳ Génération...' : '📱 Générer QR Code'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800">
              <strong>Erreur:</strong> {error}
            </div>
            <button
              onClick={resetSession}
              className="mt-2 btn btn-secondary btn-sm"
            >
              Réessayer
            </button>
          </div>
        )}

        {qrData && (
          <div className="mt-4">
            <div className="text-center mb-4">
              <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
                <QRCodeCanvas
                  value={qrData.url}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-800 mb-2">Instructions:</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Scannez le QR code avec votre téléphone</li>
                <li>2. Enregistrez votre vidéo de présentation</li>
                <li>3. Validez et uploadez depuis votre mobile</li>
                <li>4. La vidéo apparaîtra automatiquement ici</li>
              </ol>
            </div>

            {/* Session Status */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-800">Statut de la session</h4>
                  <p className="text-sm text-gray-600">
                    Session ID: {qrData.session_id.substring(0, 8)}...
                  </p>
                </div>
                <div className="text-right">
                  {polling && !sessionStatus?.video_ready && (
                    <div className="flex items-center text-orange-600">
                      <span className="animate-spin mr-2">⏳</span>
                      En attente...
                    </div>
                  )}
                  {sessionStatus?.video_ready && (
                    <div className="flex items-center text-green-600">
                      <span className="mr-2">✅</span>
                      Vidéo reçue !
                    </div>
                  )}
                  {!polling && !sessionStatus?.video_ready && (
                    <div className="text-gray-500">
                      Prêt à recevoir
                    </div>
                  )}
                </div>
              </div>

              {sessionStatus?.video_ready && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.href = '/my-videos'}
                      className="btn btn-primary btn-sm"
                    >
                      📹 Voir mes vidéos
                    </button>
                    <button
                      onClick={resetSession}
                      className="btn btn-secondary btn-sm"
                    >
                      🔄 Nouvelle session
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile URL for manual access */}
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">URL mobile (si QR ne fonctionne pas):</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={qrData.url}
                  readOnly
                  className="flex-1 text-xs p-2 border rounded bg-white"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(qrData.url)}
                  className="btn btn-secondary btn-sm text-xs"
                >
                  📋 Copier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRGenerator;