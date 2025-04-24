import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import useGlobalCallStore from '../services/GlobalCallService';
import VideoCallScreen from './Connect/VideoCallScreen';

/**
 * Global Call UI component that handles incoming/outgoing calls from anywhere in the app
 */
const GlobalCallUI = () => {
  const { colors, isDarkMode } = useTheme();
  const { 
    incomingCall, 
    acceptIncomingCall, 
    declineIncomingCall, 
    showCallUI,
    closeCallUI,
    selectedDoctor,
    callState
  } = useGlobalCallStore();
  
  const [ringtoneAudio, setRingtoneAudio] = useState(null);
  const [autoAcceptTimer, setAutoAcceptTimer] = useState(null);
  
  // Handle incoming call notifications
  useEffect(() => {
    if (incomingCall) {
      // Play ringtone
      const playRingtone = () => {
        try {
          // Try to use a ringtone from public folder
          const audio = new Audio('/song1.mp3');
          audio.loop = true;
          audio.volume = 0.7;
          
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              setRingtoneAudio(audio);
            }).catch(e => {
              console.log('Could not play notification sound:', e);
            });
          }
        } catch (error) {
          console.log('Could not initialize ringtone:', error);
        }
      };
      
      // Start playing ringtone
      playRingtone();
      
      // Auto-accept call after 15 seconds if not interacted with
      const timer = setTimeout(() => {
        if (incomingCall) {
          handleAcceptCall();
        }
      }, 15000);
      
      setAutoAcceptTimer(timer);
      
      return () => {
        // Clean up
        if (autoAcceptTimer) {
          clearTimeout(autoAcceptTimer);
        }
      };
    }
  }, [incomingCall]);
  
  // Clean up ringtone when call is handled
  useEffect(() => {
    return () => {
      if (ringtoneAudio) {
        ringtoneAudio.pause();
        ringtoneAudio.currentTime = 0;
      }
    };
  }, []);
  
  const handleAcceptCall = () => {
    // Stop ringtone
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
      setRingtoneAudio(null);
    }
    
    // Clear auto-accept timer
    if (autoAcceptTimer) {
      clearTimeout(autoAcceptTimer);
      setAutoAcceptTimer(null);
    }
    
    // Accept the call
    acceptIncomingCall();
  };
  
  const handleDeclineCall = () => {
    // Stop ringtone
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
      setRingtoneAudio(null);
    }
    
    // Clear auto-accept timer
    if (autoAcceptTimer) {
      clearTimeout(autoAcceptTimer);
      setAutoAcceptTimer(null);
    }
    
    // Decline the call
    declineIncomingCall();
  };
  
  // Render the incoming call UI
  if (incomingCall) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl max-w-md w-full mx-4 animate-bounce-in">
          <div className="p-6 text-center">
            <div className="w-28 h-28 rounded-full mx-auto mb-4 relative overflow-hidden border-4 animate-pulse" 
                style={{ borderColor: colors.primary }}>
              <img 
                src={incomingCall.doctor.image} 
                alt={incomingCall.doctor.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full bg-black bg-opacity-20 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-4 border-white border-opacity-60 border-t-transparent animate-spin"></div>
                </div>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-2 dark:text-white">{incomingCall.doctor.name}</h3>
            <p className="text-md text-gray-500 dark:text-gray-300 mb-6 animate-pulse">Incoming video call...</p>
            
            <div className="flex justify-center space-x-6">
              <button 
                className="w-18 h-18 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110"
                style={{ backgroundColor: colors.danger }}
                onClick={handleDeclineCall}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-600">
                  <Phone size={30} className="text-white transform rotate-135" />
                </div>
              </button>
              
              <button 
                className="w-18 h-18 rounded-full flex items-center justify-center shadow-lg transform transition-transform hover:scale-110"
                style={{ backgroundColor: colors.success }}
                onClick={handleAcceptCall}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-600 animate-pulse">
                  <Phone size={30} className="text-white" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render the video call UI when a call is active
  if (showCallUI && selectedDoctor) {
    return (
      <VideoCallScreen 
        isOpen={true}
        onClose={closeCallUI}
        colors={colors}
        doctor={selectedDoctor}
      />
    );
  }
  
  // Render a calling animation when trying to connect
  if (callState === 'connecting' && selectedDoctor) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="w-28 h-28 rounded-full mx-auto mb-4 relative overflow-hidden border-4 animate-pulse" 
                style={{ borderColor: colors.primary }}>
              <img 
                src={selectedDoctor.image} 
                alt={selectedDoctor.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full bg-black bg-opacity-20 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-4 border-white border-opacity-60 border-t-transparent animate-spin"></div>
                </div>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-2 dark:text-white">{selectedDoctor.name}</h3>
            <p className="text-md text-gray-500 dark:text-gray-300 mb-6 animate-pulse">Calling doctor...</p>
            
            <button 
              className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg mx-auto"
              style={{ backgroundColor: colors.danger }}
              onClick={closeCallUI}
            >
              <PhoneOff size={24} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Nothing to render if no call activity
  return null;
};

export default GlobalCallUI;