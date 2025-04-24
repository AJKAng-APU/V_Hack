import React from 'react';
import { Users } from 'lucide-react';

const VideoDisplay = ({
  remoteVideoRef,
  localVideoRef,
  isSpeakerOff,
  isVideoOff,
  doctor,
  connectionQuality,
  reconnectAttempt,
  showControls,
  isDarkMode,
  colors,
  children,
  callStatus,
  forceActiveState,
  onClick  // Add this new parameter
}) => {
  // Dark mode specific colors
  const videoOffBg = isDarkMode 
    ? `linear-gradient(135deg, ${colors.darkBg}, #031838)` 
    : `linear-gradient(135deg, ${colors.primaryDark}, #031838)`;
  
  console.log(`[VideoDisplay] Rendering: callStatus=${callStatus}, forceActive=${forceActiveState}`);

  return (
    <>
      {/* Doctor video (remote) */}
      <div className="absolute inset-0 bg-black dark-mode-transition"
      onClick={onClick}>
        <div className="h-full relative">
          {/* Remote video element - ALWAYS SHOW */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={isSpeakerOff}
            className="w-full h-full object-cover"
            style={{
              display: 'block',
              visibility: 'visible',
              zIndex: 10
            }}
          />
          
          {/* Pass children (call header & connection status) */}
          {children}
          
          {/* Reconnecting indicator */}
          {connectionQuality !== 'good' && reconnectAttempt > 0 && (
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-lg"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                zIndex: 30
              }}
            >
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full border-2 border-white border-opacity-20 border-t-white animate-spin mb-2"></div>
                <span className="text-sm text-white font-medium">Reconnecting{reconnectAttempt > 1 ? ` (${reconnectAttempt})` : ''}...</span>
              </div>
            </div>
          )}
          
          {/* Only show Doctor avatar fallback when video is off */}
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center"
                 style={{ 
                   background: isDarkMode ? colors.darkBg : '#000811',
                   zIndex: 15
                 }}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white border-opacity-20">
                <img src={doctor?.image || '/User_1.png'} alt={doctor?.name || 'Doctor'} className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* User video (local) - FIXED TO ALWAYS BE VISIBLE */}
      <div className="absolute bottom-24 right-4 w-32 h-48 rounded-xl overflow-hidden border-4 border-white"
           style={{ 
             boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
             zIndex: 40,
             backgroundColor: 'black',
             transform: showControls ? 'scale(1)' : 'scale(0.95)',
             transition: 'all 0.3s ease'
           }}>
        {/* Local video element - ALWAYS VISIBLE */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted={true} // Always mute local video
          className="w-full h-full object-cover"
        />
        
        {/* Overlay when video is toggled off - MODIFIED: Just overlay, don't hide video */}
        {isVideoOff && (
          <div className="absolute inset-0 flex items-center justify-center" 
               style={{ background: videoOffBg }}>
            <div className="w-12 h-12 rounded-full bg-white bg-opacity-10 flex items-center justify-center">
              <Users size={18} className="text-white" />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default VideoDisplay;