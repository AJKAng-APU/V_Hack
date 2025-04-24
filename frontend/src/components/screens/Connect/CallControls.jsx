import React from 'react';
import { Mic, MicOff, Video, VideoOff, Phone, Volume2, Volume, MessageSquare } from 'lucide-react';

const CallControls = ({
  isMuted,
  setIsMuted,
  isVideoOff,
  setIsVideoOff,
  isSpeakerOff,
  setIsSpeakerOff,
  handleEndCall,
  showControls,
  setShowControls, // Add this prop to directly control visibility
  colors,
  callStatus,
  resetControlsTimer // Add this prop to reset the hide timer
}) => {
  
  // Handle video toggle with control visibility management
  const handleVideoToggle = (e) => {
    // Prevent event propagation to stop the click from reaching the VideoDisplay
    if (e) e.stopPropagation();
    
    // Toggle video state
    setIsVideoOff(!isVideoOff);
    
    // Always show controls when toggling video
    setShowControls(true);
    
    // Reset the auto-hide timer
    if (resetControlsTimer) {
      resetControlsTimer();
    }
    
    // When turning video off, force controls to stay visible longer
    if (!isVideoOff) {
      // We're turning video OFF, so apply a longer timeout
      setTimeout(() => {
        // Double-check that controls are still visible after state updates
        setShowControls(true);
      }, 500);
    }
  };
  
  // Handle audio toggle with control visibility management
  const handleAudioToggle = (e) => {
    // Prevent event propagation
    if (e) e.stopPropagation();
    
    setIsMuted(!isMuted);
    
    // Always show controls when toggling audio
    setShowControls(true);
    
    // Reset the auto-hide timer
    if (resetControlsTimer) {
      resetControlsTimer();
    }
  };
  
  return (
    <div className={`absolute bottom-0 left-0 right-0 p-6 transition-all duration-500 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
         style={{ zIndex: 50 }}>
      <div className="flex justify-center items-center space-x-4 mb-2">
        <button 
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
          style={{ 
            backgroundColor: isMuted ? colors.danger : 'rgba(255, 255, 255, 0.2)',
            transform: isMuted ? 'scale(1.1)' : 'scale(1)'
          }}
          onClick={handleAudioToggle}
        >
          {isMuted ? (
            <MicOff size={20} className="text-white" />
          ) : (
            <Mic size={20} className="text-white" />
          )}
        </button>
        
        <button 
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300"
          style={{ 
            backgroundColor: colors.danger,
            boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)'
          }}
          onClick={(e) => {
            if (e) e.stopPropagation();
            handleEndCall();
          }}
        >
          <Phone size={24} className="text-white transform rotate-135" />
        </button>
        
        <button 
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
          style={{ 
            backgroundColor: isVideoOff ? colors.danger : 'rgba(255, 255, 255, 0.2)',
            transform: isVideoOff ? 'scale(1.1)' : 'scale(1)'
          }}
          onClick={handleVideoToggle}
        >
          {isVideoOff ? (
            <VideoOff size={20} className="text-white" />
          ) : (
            <Video size={20} className="text-white" />
          )}
        </button>
      </div>
      
      <div className="flex justify-center items-center space-x-6">
        <button 
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
          onClick={(e) => {
            if (e) e.stopPropagation();
            setIsSpeakerOff(!isSpeakerOff);
            setShowControls(true);
            if (resetControlsTimer) resetControlsTimer();
          }}
        >
          {isSpeakerOff ? (
            <Volume size={18} className="text-white" />
          ) : (
            <Volume2 size={18} className="text-white" />
          )}
        </button>
        
        <button 
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
          onClick={(e) => {
            if (e) e.stopPropagation();
            // Toggle always show controls
            if (resetControlsTimer) resetControlsTimer();
            setShowControls(true);
          }}
        >
          <MessageSquare size={18} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default CallControls;