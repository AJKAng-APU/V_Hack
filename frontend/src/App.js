import React, { useEffect } from 'react';
import './App.css';
import HealthAssistantUI from './components';
import GlobalCallUI from './components/screens/GlobalCallUI';
import DoctorAvailabilityIndicator from './components/screens/DoctorAvailabilityIndicator';
import FloatingCallButton from './components/shared/FloatingCallButton.jsx';
import { useAuth } from './components/AuthProvider';
import useGlobalCallStore from './components/services/GlobalCallService';
import webRTCService from './components/services/WebRTCService';
import { HealthDataProvider } from './components/HealthDataContext';
import { ApiMiddlewareProvider } from './components/ApiMiddleware';
import { useTheme } from './components/ThemeContext';

// Theme color configuration
const themeColors = {
  light: {
    primary: '#2563EB',
    accent: '#0EA5E9',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#6366F1',
    gradientAlt1: '#7C3AED',
    gradientAlt2: '#3B82F6',
    accentAlt: '#EC4899',
    primaryLight: '#DBEAFE',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    cardBg: 'white',
    darkBg: 'white'
  },
  dark: {
    primary: '#3B82F6',
    accent: '#0EA5E9',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#818CF8',
    gradientAlt1: '#8B5CF6',
    gradientAlt2: '#3B82F6',
    accentAlt: '#EC4899',
    primaryLight: '#1E3A8A',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    cardBg: '#1F2937',
    darkBg: '#111827'
  }
};

function App() {
  const { user, isAuthenticated } = useAuth();
  const { loadAvailableDoctors, setIncomingCall } = useGlobalCallStore();
  const { isDarkMode } = useTheme();
  
  // Get the appropriate color theme based on dark mode setting
  const colors = isDarkMode ? themeColors.dark : themeColors.light;
  
  // Set up WebRTC event listeners for incoming calls
  useEffect(() => {
    if (isAuthenticated && !user?.isDoctor) {
      // Load available doctors on app start
      loadAvailableDoctors();
      
      // Only set up incoming call handling for patients (not doctors)
      const setupIncomingCallHandler = () => {
        // Generate a unique user ID if not already set
        const userId = localStorage.getItem('user_instance_id') ||
                      `user-${Math.random().toString(36).substring(2, 15)}`;
        
        // Store the ID for future use
        if (!localStorage.getItem('user_instance_id')) {
          localStorage.setItem('user_instance_id', userId);
        }
        
        // Initialize WebRTC with callbacks
        webRTCService.initialize(userId, {
          onIncomingCall: (callerId) => {
            console.log('App received incoming call from:', callerId);
            
            // Try to find the doctor in our data
            useGlobalCallStore.getState().loadAvailableDoctors().then(() => {
              const doctors = useGlobalCallStore.getState().availableDoctors;
              const callerDoctorId = parseInt(callerId.replace('doctor-', ''));
              
              // Find the doctor or create a placeholder
              const callingDoctor = doctors.find(doc => doc.id === callerDoctorId) || {
                id: callerDoctorId,
                name: `Doctor ${callerId.replace('doctor-', '')}`,
                specialty: "Medical Professional",
                image: "https://randomuser.me/api/portraits/men/32.jpg",
                availability: "Available now",
                rating: 5
              };
              
              // Set incoming call in global store
              setIncomingCall({
                doctor: callingDoctor,
                timestamp: Date.now(),
                id: `call-${Date.now()}`
              });
            });
          }
        });
        
        // Register with signaling server
        setTimeout(() => {
          if (webRTCService.signalingService && 
              webRTCService.signalingService.isConnected()) {
            webRTCService.signalingService.send('register', userId);
            console.log('Registered with signaling server as:', userId);
          }
        }, 1000);
      };
      
      setupIncomingCallHandler();
      
      // Set up interval to ensure registration with signaling server
      const registrationInterval = setInterval(() => {
        const userId = localStorage.getItem('user_instance_id');
        if (userId && webRTCService.signalingService && 
            webRTCService.signalingService.isConnected()) {
          webRTCService.signalingService.send('register', userId);
        }
      }, 30000); // Re-register every 30 seconds
      
      return () => {
        clearInterval(registrationInterval);
      };
    }
  }, [isAuthenticated, user, loadAvailableDoctors, setIncomingCall]);
  
  return (
    <div className="App">
      {/* Wrap with providers in the correct order */}
      <ApiMiddlewareProvider colors={colors}>
        <HealthDataProvider>
          <HealthAssistantUI colors={colors} />
          
          {/* Only show call-related UI components for authenticated patients */}
          {isAuthenticated && !user?.isDoctor && (
            <>
              <DoctorAvailabilityIndicator />
              <GlobalCallUI />
              <FloatingCallButton />
            </>
          )}
        </HealthDataProvider>
      </ApiMiddlewareProvider>
    </div>
  );
}

export default App;