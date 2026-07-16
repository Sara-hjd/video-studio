import React, { useState } from 'react';

const Upload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
    } else {
      // Use notification system instead of alert
      console.warn('Please select a valid video file.');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
      } else {
        console.warn('Please drop a valid video file.');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      console.warn('Please select a file to upload.');
      return;
    }

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('Video uploaded successfully!');
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Upload de Vidéo</h1>
        <p className="page-subtitle">
          Uploadez votre présentation vidéo pour recevoir des retours détaillés
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📁 Upload de fichier</h3>
            <p className="card-subtitle">Formats supportés: MP4, AVI, MOV</p>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-4xl mb-4">📹</div>
            <p className="text-lg font-medium mb-2">
              {selectedFile ? selectedFile.name : 'Drag your video here'}
            </p>
            <p className="text-gray-500 mb-4">
              or click to select a file
            </p>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="btn btn-primary cursor-pointer">
              Choisir un fichier
            </label>
          </div>

          {selectedFile && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="font-medium">{selectedFile.name}</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Taille: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          {uploadProgress > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progression</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 progress-bar"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploadProgress > 0}
            className="btn btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadProgress > 0 ? 'Uploading...' : 'Upload video'}
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📋 Instructions</h3>
            <p className="card-subtitle">Conseils pour un bon upload</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Préparez votre vidéo</h4>
                <p className="text-sm text-gray-600">
                  Assurez-vous que votre vidéo est de bonne qualité et bien éclairée
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Format recommandé</h4>
                <p className="text-sm text-gray-600">
                  MP4, résolution 720p minimum, durée 2-10 minutes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Analyse IA</h4>
                <p className="text-sm text-gray-600">
                  Recevez des retours détaillés sur votre présentation
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">💡 Astuce</h4>
            <p className="text-sm text-blue-700">
              Parlez clairement et maintenez un contact visuel avec la caméra 
              pour de meilleurs résultats d'analyse.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload; 