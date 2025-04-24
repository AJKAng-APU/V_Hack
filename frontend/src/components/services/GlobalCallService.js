// services/GlobalCallService.js
import { create } from 'zustand';
import supabase from '../supabaseClient';
import webRTCService from './WebRTCService';

/**
 * Global state store for managing doctor calls from anywhere in the app
 * Uses Zustand for state management
 */
const useGlobalCallStore = create((set, get) => ({
  // Call states
  activeCall: null,
  showCallUI: false,
  incomingCall: null,
  callState: 'idle', // 'idle', 'connecting', 'active', 'ended'
  ringtoneAudio: null,
  
  // Doctor states
  availableDoctors: [],
  selectedDoctor: null,
  loadingDoctors: false,
  error: null,
  
  /**
   * Load available doctors from Supabase
   * @returns {Promise} - Promise resolving to the list of available doctors
   */
  loadAvailableDoctors: async () => {
    try {
      set({ loadingDoctors: true, error: null });
      
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('availability', true);
        
      if (error) throw error;
      
      // Format doctor data for our app
      const doctors = data.map(doc => ({
        id: doc.doctor_id,
        name: doc.name,
        specialty: doc.specialty,
        image: doc.image_url,
        rating: doc.rating,
        availability: 'Available now'
      }));
      
      set({ availableDoctors: doctors, loadingDoctors: false });
      return doctors;
    } catch (error) {
      console.error('Error loading doctors:', error);
      set({ loadingDoctors: false, error: error.message });
      return [];
    }
  },
  
  /**
   * Check if a doctor is currently online via socket
   * @param {number} doctorId - Doctor ID
   * @returns {Promise<boolean>} - Whether the doctor is online
   */
  checkDoctorOnline: async (doctorId) => {
    if (!webRTCService) return false;
    
    try {
      const isOnline = await webRTCService.checkUserOnline(`doctor-${doctorId}`);
      return isOnline;
    } catch (error) {
      console.error('Error checking doctor online status:', error);
      return false;
    }
  },
  
  /**
   * Initiate a call to a doctor
   * @param {Object} doctor - Doctor object
   * @returns {Promise} - Promise resolving when the call is initiated
   */
  callDoctor: async (doctor) => {
    try {
      if (!webRTCService) {
        throw new Error('WebRTC service not available');
      }
      
      // Save the selected doctor
      set({ selectedDoctor: doctor, callState: 'connecting' });
      
      // Initialize WebRTC if needed
      if (!webRTCService.isInitialized) {
        const userId = localStorage.getItem('user_instance_id') || 
                      `user-${Math.random().toString(36).substring(2, 15)}`;
                      
        webRTCService.initialize(userId, {
          onCallStarted: () => set({ callState: 'active' }),
          onCallEnded: () => {
            set({ callState: 'ended' });
            setTimeout(() => set({ 
              showCallUI: false, 
              selectedDoctor: null,
              callState: 'idle'
            }), 3000);
          },
          onCallDeclined: () => {
            set({ callState: 'ended' });
            setTimeout(() => set({ 
              showCallUI: false, 
              selectedDoctor: null,
              callState: 'idle'
            }), 3000);
          }
        });
      }
      
      // Try to get media
      await webRTCService.getLocalMedia();
      
      // Make the call
      await webRTCService.makeCall(`doctor-${doctor.id}`);
      
      // Show call UI
      set({ showCallUI: true });
      
    } catch (error) {
      console.error('Failed to call doctor:', error);
      set({ callState: 'ended', error: error.message });
      setTimeout(() => set({ 
        showCallUI: false, 
        selectedDoctor: null,
        callState: 'idle',
        error: null
      }), 3000);
      
      throw error;
    }
  },
  
  /**
   * End the current call
   */
  endCall: () => {
    if (webRTCService) {
      webRTCService.endCall();
    }
    
    set({ callState: 'ended' });
    
    // After a delay, reset the UI
    setTimeout(() => {
      set({ 
        showCallUI: false, 
        selectedDoctor: null,
        callState: 'idle'
      });
    }, 3000);
  },
  
  /**
   * Handle incoming calls
   * @param {Object} callInfo - Information about the incoming call
   */
  setIncomingCall: (callInfo) => {
    // Stop any existing ringtone
    const { ringtoneAudio } = get();
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
    }
    
    set({ incomingCall: callInfo });
  },
  
  /**
   * Accept incoming call
   */
  acceptIncomingCall: () => {
    const { incomingCall, ringtoneAudio } = get();
    
    if (!incomingCall) return;
    
    // Stop ringtone
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
      set({ ringtoneAudio: null });
    }
    
    // Accept the call via WebRTC service
    if (webRTCService) {
      webRTCService.acceptCall();
    }
    
    set({ 
      showCallUI: true,
      callState: 'connecting',
      selectedDoctor: incomingCall.doctor,
      incomingCall: null
    });
  },
  
  /**
   * Decline incoming call
   */
  declineIncomingCall: () => {
    const { ringtoneAudio } = get();
    
    // Stop ringtone
    if (ringtoneAudio) {
      ringtoneAudio.pause();
      ringtoneAudio.currentTime = 0;
      set({ ringtoneAudio: null });
    }
    
    // Decline the call via WebRTC service
    if (webRTCService) {
      webRTCService.declineCall();
    }
    
    set({ incomingCall: null });
  },
  
  /**
   * Close the call UI
   */
  closeCallUI: () => {
    // End any active call
    if (webRTCService && get().callState !== 'idle') {
      webRTCService.endCall();
    }
    
    set({ 
      showCallUI: false, 
      callState: 'idle',
      selectedDoctor: null
    });
  }
}));

export default useGlobalCallStore;