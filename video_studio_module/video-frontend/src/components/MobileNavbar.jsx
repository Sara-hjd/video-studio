import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const MobileNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.mobile-navbar')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Don't render on desktop
  if (!isMobile) {
    return null;
  }

  return (
    <div className="mobile-navbar fixed top-0 left-0 right-0 z-50 bg-white shadow-lg">
      {/* Header with hamburger */}
      <div className="flex items-center justify-between p-4">
        <Link to="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">JG</span>
          </div>
          <span className="font-bold text-blue-600">Job Gate</span>
        </Link>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <div className="w-6 h-6 flex flex-col justify-center space-y-1">
            <div className={`w-full h-0.5 bg-gray-600 transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
            <div className={`w-full h-0.5 bg-gray-600 transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></div>
            <div className={`w-full h-0.5 bg-gray-600 transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
          </div>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsOpen(false)}>
          <div className="bg-white shadow-xl max-w-sm w-full h-full">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Menu</h3>
              
              <nav className="space-y-2">
                <Link
                  to="/"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">📊</span>
                  <span>Dashboard</span>
                </Link>
                
                <Link
                  to="/record"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive('/record') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">🎬</span>
                  <span>Record</span>
                </Link>
                
                <Link
                  to="/my-videos"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive('/my-videos') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">📹</span>
                  <span>My Videos</span>
                </Link>
                
                <Link
                  to="/qr-generator"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive('/qr-generator') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">📱</span>
                  <span>QR Mobile</span>
                </Link>
                
                <Link
                  to="/profile"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive('/profile') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">👤</span>
                  <span>Profile</span>
                </Link>
                
                <Link
                  to="/upload"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive('/upload') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">⬆️</span>
                  <span>Upload</span>
                </Link>
                
                <Link
                  to="/feedback"
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive('/feedback') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">💬</span>
                  <span>Feedback</span>
                </Link>
              </nav>
              
              {/* Mobile Studio Access */}
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-gray-800 mb-2">📱 Studio Mobile</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Accédez au studio mobile optimisé pour votre téléphone
                </p>
                <Link
                  to="/qr-generator"
                  className="inline-flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  <span>📱</span>
                  <span>Générer QR Code</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileNavbar;
