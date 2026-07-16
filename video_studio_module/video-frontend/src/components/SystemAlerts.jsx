import React, { useState, useEffect } from 'react';

const SystemAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [cameraErrors, setCameraErrors] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'https://192.168.1.168/api/videos/system';

  useEffect(() => {
    fetchSystemData();
    // Actualiser toutes les 30 secondes
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les données en parallèle
      const [alertsResponse, cameraErrorsResponse, healthResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/recent_alerts/`),
        fetch(`${API_BASE_URL}/camera_errors/`),
        fetch(`${API_BASE_URL}/health_status/`)
      ]);

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.recent_alerts || []);
      }

      if (cameraErrorsResponse.ok) {
        const cameraErrorsData = await cameraErrorsResponse.json();
        setCameraErrors(cameraErrorsData.recent_camera_errors || []);
      }

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setSystemHealth(healthData);
      }

      setError(null);
    } catch (err) {
      console.error('Error retrieving system data:', err);
      setError('Connection error to monitoring system');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100';
      case 'ERROR': return 'text-red-500 bg-red-50';
      case 'OK': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CRITICAL': return '🚨';
      case 'WARNING': return '⚠️';
      case 'ERROR': return '❌';
      case 'OK': return '✅';
      default: return 'ℹ️';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Monitoring Système</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statut de santé du système */}
      {systemHealth && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            {getStatusIcon(systemHealth.overall_status)} Statut Système
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${getStatusColor(systemHealth.overall_status)}`}>
              <h3 className="font-semibold">Statut Général</h3>
              <p className="text-sm">{systemHealth.overall_status}</p>
            </div>
            
            {systemHealth.disk_status && (
              <>
                <div className={`p-4 rounded-lg ${getStatusColor(systemHealth.disk_status.status)}`}>
                  <h3 className="font-semibold">Espace Disque</h3>
                  <p className="text-sm">{systemHealth.disk_status.message}</p>
                  {systemHealth.disk_status.free_gb && (
                    <p className="text-xs mt-1">
                      {systemHealth.disk_status.free_gb}GB libre / {systemHealth.disk_status.total_gb}GB total
                    </p>
                  )}
                </div>
                
                <div className="p-4 rounded-lg bg-blue-100 text-blue-600">
                  <h3 className="font-semibold">Utilisation</h3>
                  <p className="text-sm">
                    {systemHealth.disk_status.usage_percent?.toFixed(1)}% utilisé
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Alertes critiques */}
      {alerts.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-red-600">🚨 Alertes Critiques</h2>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className="p-3 bg-red-50 border-l-4 border-red-400 rounded">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{alert.log_entry}</p>
                    <p className="text-xs text-red-600 mt-1">{alert.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Erreurs de caméra/micro */}
      {cameraErrors.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-orange-600">📹 Erreurs Caméra/Micro</h2>
          <div className="space-y-3">
            {cameraErrors.map((error, index) => (
              <div key={index} className="p-3 bg-orange-50 border-l-4 border-orange-400 rounded">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm text-orange-800">{error.log_entry}</p>
                    <p className="text-xs text-orange-600 mt-1">{error.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si aucune alerte */}
      {alerts.length === 0 && cameraErrors.length === 0 && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-green-600">✅ Système Opérationnel</h2>
          <p className="text-gray-600">Aucune alerte ou erreur détectée. Le système fonctionne normalement.</p>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-bold mb-2 text-red-600">❌ Erreur de Connexion</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchSystemData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Bouton de rafraîchissement */}
      <div className="flex justify-center">
        <button 
          onClick={fetchSystemData}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Actualiser
        </button>
      </div>
    </div>
  );
};

export default SystemAlerts;
