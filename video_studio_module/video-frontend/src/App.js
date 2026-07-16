import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileNavbar from './components/MobileNavbar';
import Home from './components/Home';
import Upload from './components/Upload';
import Feedback from './components/Feedback';
import VideoRecording from './components/VideoRecording';
import MyVideos from './components/MyVideos';
import VideoProfile from './components/VideoProfile';
import QRGenerator from './components/QRGenerator';
import MobileStudio from './components/MobileStudio';
import SystemAlerts from './components/SystemAlerts';

function App() {
  return (
    <BrowserRouter>
      {/* Mobile Navigation (only shows on mobile) */}
      <MobileNavbar />
      
      <Routes>
        {/* Mobile Studio Route (no navbar) */}
        <Route path="/mobile-studio/session/:sessionId" element={<MobileStudio />} />
        
        {/* Desktop Routes (with navbar) */}
        <Route path="/" element={
          <>
            <Navbar />
            <div style={{ padding: '2rem' }}>
              <Home />
            </div>
          </>
        } />
        
        <Route path="/upload" element={
          <>
            <Navbar />
            <div style={{ padding: '2rem' }}>
              <Upload />
            </div>
          </>
        } />
        
        <Route path="/feedback" element={
          <>
            <Navbar />
            <div style={{ padding: '2rem' }}>
              <Feedback />
            </div>
          </>
        } />
        
        <Route path="/record" element={
          <>
            <Navbar />
            <div style={{ padding: '2rem' }}>
              <VideoRecording />
            </div>
          </>
        } />
        
        <Route path="/my-videos" element={
          <>
            <Navbar />
            <div style={{ padding: '2rem' }}>
              <MyVideos />
            </div>
          </>
        } />
        
        <Route path="/profile" element={
          <>
            <Navbar />
            <div style={{ padding: '2rem' }}>
              <VideoProfile />
            </div>
          </>
        } />
        
        <Route path="/qr-generator" element={
          <>
            <Navbar />
            <div style={{ padding: '2rem' }}>
              <QRGenerator />
            </div>
          </>
        } />
        
        <Route path="/system-alerts" element={
          <>
            <Navbar />
            <div style={{ padding: '2rem' }}>
              <SystemAlerts />
            </div>
          </>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;