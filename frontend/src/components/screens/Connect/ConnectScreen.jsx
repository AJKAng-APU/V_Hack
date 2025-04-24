import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../ThemeContext'; 
import webRTCService from '../../services/WebRTCService';
import supabase from '../../supabaseClient';
import { useAuth } from '../../AuthProvider';
import MessageDialog from './MessageDialog';
import VideoCallScreen from './VideoCallScreen';
import ConnectHeader from './ConnectHeader';
import SearchBar from './SearchBar';
import FilterChips from './FilterChips';
import DoctorsTeam from './DoctorsTeam';
import QuickConnectActions from './QuickConnectActions';
import RecentMessages from './RecentMessages';
import IncomingCallUI from './IncomingCallUI';
import ToastNotification from './ToastNotification';

const ConnectScreen = ({ colors, setActiveScreen }) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(3);
  const [filterActive, setFilterActive] = useState(false);
  
  // Doctors data from Supabase
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [connectingDoctor, setConnectingDoctor] = useState(null);
  const [schedulingDoctor, setSchedulingDoctor] = useState(null);
  const [readyToConnect, setReadyToConnect] = useState(false);
  
  // Doctor mode toggle for testing
  const [isDoctorMode, setIsDoctorMode] = useState(
    localStorage.getItem('is_doctor') === 'true'
  );

  // Enhanced notification system
  const [toastQueue, setToastQueue] = useState([]);
  const [activeToast, setActiveToast] = useState(null);
  
  // Incoming call notification
  const [incomingCallInfo, setIncomingCallInfo] = useState(null);
  const [ringtoneAudio, setRingtoneAudio] = useState(null);
  const [autoAcceptTimer, setAutoAcceptTimer] = useState(null);
  
  // Debug counter for incoming calls
  const [incomingCallCounter, setIncomingCallCounter] = useState(0);
  
  // Ref to track previous video call state
  const prevShowVideoCall = useRef(showVideoCall);

  // Fetch doctors from Supabase
  useEffect(() => {
    async function fetchDoctors() {
      try {
        setIsLoading(true);
        
        let query = supabase
          .from('doctors')
          .select('*');
          
        // Apply filter if active
        if (filterActive) {
          query = query.eq('availability', true);
        }
        
        const { data, error } = await query;
          
        if (error) {
          throw error;
        }
        
        // Map Supabase data to our app's expected format
        const formattedDoctors = data.map(doctor => ({
          id: doctor.doctor_id,
          name: doctor.name,
          specialty: doctor.specialty,
          image: doctor.image_url,
          availability: doctor.availability ? "Available now" : "Available in 2h",
          rating: doctor.rating || 5
        }));
        
        console.log('Fetched doctors from Supabase:', formattedDoctors);
        setDoctors(formattedDoctors);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        displayToast('Failed to load doctors. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDoctors();
  }, [filterActive]); // Refetch when filter changes
  
  // IMPROVED: Doctor Mode Toggle useEffect
  useEffect(() => {
    localStorage.setItem('is_doctor', isDoctorMode ? 'true' : 'false');
    
    if (isDoctorMode) {
      const registerAsDoctor = () => {
        try {
          if (webRTCService.signalingService && 
              webRTCService.signalingService.isConnected()) {
            // Get doctor ID from user object or localStorage
            let doctorId;
            
            if (user && user.isDoctor && user.doctorId) {
              doctorId = `doctor-${user.doctorId}`;
            } else {
              // Fallback to stored ID or generate one
              doctorId = localStorage.getItem('doctor_id') || 
                        `doctor-${Math.floor(1000 + Math.random() * 9000)}`;
            }
            
            localStorage.setItem('doctor_id', doctorId);
            webRTCService.signalingService.send('register', doctorId);
            console.log(`🩺 Successfully registered as ${doctorId}`);
            displayToast(`Registered as Doctor (ID: ${doctorId.replace('doctor-', '')})`);
          } else {
            console.log("Socket not connected, retrying in 1 second...");
            setTimeout(registerAsDoctor, 1000);
          }
        } catch (error) {
          console.error("Error registering as doctor:", error);
          setTimeout(registerAsDoctor, 1000);
        }
      };
      
      registerAsDoctor();
    } else {
      try {
        if (webRTCService.signalingService && 
            webRTCService.signalingService.isConnected()) {
          const userId = localStorage.getItem('user_instance_id') || 'user-default';
          webRTCService.signalingService.send('register', userId);
          console.log(`Registered back as patient: ${userId}`);
        }
      } catch (error) {
        console.error("Error switching to patient mode:", error);
      }
    }
  }, [isDoctorMode, user]);
  
  // WebRTC initialization
  useEffect(() => {
    const generateUniqueId = () => {
      const storedId = localStorage.getItem('user_instance_id');
      if (storedId) {
        return storedId;
      }
      
      const newId = 'user-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('user_instance_id', newId);
      return newId;
    };
    
    const currentUserId = generateUniqueId();
    console.log('Initializing with user ID:', currentUserId);
    
    const callbacks = {
      onIncomingCall: (callerId) => {
        console.log('Incoming call received from:', callerId);
        setIncomingCallCounter(prev => prev + 1)
        
        // Try to find the doctor in our list based on the caller ID
        const callerDoctorId = parseInt(callerId.replace('doctor-', ''));
        const callingDoctor = doctors.find(doc => doc.id === callerDoctorId) || {
          id: callerDoctorId || 999,
          name: `Doctor ${callerId.replace('doctor-', '')}`,
          specialty: "Medical Professional",
          image: "https://randomuser.me/api/portraits/men/32.jpg",
          availability: "Available now",
          rating: 5
        };
        
        setSelectedDoctor(callingDoctor);
        setConnectingDoctor(callingDoctor);
        
        setTimeout(() => {
          displayIncomingCallAlert(callingDoctor);
        }, 10);
      },
      
      onUserNotOnline: (userId) => {
        const doctorId = userId.replace('doctor-', '');
        const doctor = doctors.find(doc => doc.id.toString() === doctorId);
        
        if (doctor) {
          displayToast(`${doctor.name} is not available right now. Please try again later.`);
        } else {
          displayToast('The selected doctor is not available right now.');
        }
        
        setConnectingDoctor(null);
      },
    
      onCallInProgress: (callerUserId, message) => {
        displayToast(message || `Call with ${callerUserId} is already in progress`);
        setConnectingDoctor(null);
        setIncomingCallInfo(null);
        
        // Stop ringtone if it's playing
        if (ringtoneAudio) {
          try {
            ringtoneAudio.pause();
            ringtoneAudio.currentTime = 0;
          } catch (e) { /* handle error */ }
          setRingtoneAudio(null);
        }
      },
      
      onCallDeclined: () => {
        console.log('Call was declined by the doctor');
        
        // Get the doctor name if available
        const doctorName = connectingDoctor ? connectingDoctor.name : 'doctor';
        
        // Display a toast notification to the user
        displayToast(`Call declined by ${doctorName}`);
        
        // Reset the connecting state
        setConnectingDoctor(null);
        
        // Make sure the video call screen is closed
        setShowVideoCall(false);
      }
    };
    
    const serverUrl = process.env.REACT_APP_SIGNALING_SERVER || null;
    
    webRTCService.initialize(currentUserId, callbacks, serverUrl);

    // Handle doctor mode initialization
    if (localStorage.getItem('is_doctor') === 'true') {
      setTimeout(() => {
        if (webRTCService.signalingService && webRTCService.signalingService.isConnected()) {
          const doctorId = localStorage.getItem('doctor_id') || 'doctor-1';
          webRTCService.signalingService.send('register', doctorId);
          console.log(`Registered as ${doctorId} on initialization`);
        }
      }, 1000);
    }
    
    setTimeout(() => {
      setReadyToConnect(true);
    }, 2000);

    // Registration interval with proper signaling service access
    const registerInterval = setInterval(() => {
      if (webRTCService.signalingService && 
          webRTCService.signalingService.isConnected() && 
          !webRTCService.isCallActive() && 
          !showVideoCall) {
        
        webRTCService.signalingService.send('register', currentUserId);
        
        if (localStorage.getItem('is_doctor') === 'true') {
          const doctorId = localStorage.getItem('doctor_id') || 'doctor-1';
          webRTCService.signalingService.send('register', doctorId);
          console.log(`Re-registering as ${doctorId}`);
        }
      }
    }, 5000);
    
    let unsubscribeError = () => {};
    if (typeof webRTCService.on === 'function') {
      unsubscribeError = webRTCService.on('error', (error) => {
        console.log('WebRTC error received:', error);
        displayToast(`Connection error: ${error.message}`);
        
        if (error.fatal) {
          setConnectingDoctor(null);
        }
      });
    }
    
    return () => {
      console.log('Cleaning up ConnectScreen resources');
      
      clearInterval(registerInterval);
      
      if (autoAcceptTimer) {
        clearTimeout(autoAcceptTimer);
      }
      
      if (ringtoneAudio) {
        try {
          ringtoneAudio.pause();
          ringtoneAudio.currentTime = 0;
        } catch (e) { /* handle error */ }
      }
      
      setIncomingCallInfo(null);
      
      if (typeof unsubscribeError === 'function') {
        unsubscribeError();
      }
      
      webRTCService.disconnect();
    };
  }, []);
  
  // Helpers for Call Management
  const callHandlers = {
    displayIncomingCallAlert: (doctor) => {
      console.log('Displaying incoming call alert for doctor:', doctor.name);
      
      // Clean up before setting new call
      const cleanupPreviousCall = () => {
        setActiveToast(null);
        setToastQueue([]);
        
        if (ringtoneAudio) {
          try {
            ringtoneAudio.pause();
            ringtoneAudio.currentTime = 0;
          } catch (e) {
            console.error('Error stopping previous ringtone:', e);
          }
          setRingtoneAudio(null);
        }
        
        if (autoAcceptTimer) {
          clearTimeout(autoAcceptTimer);
          setAutoAcceptTimer(null);
        }
      };
      
      cleanupPreviousCall();
      
      const callNotificationId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      setIncomingCallInfo({
        doctor: doctor,
        timestamp: Date.now(),
        id: callNotificationId
      });
      
      const playRingtone = () => {
        try {
          const audio = new Audio('/song1.mp3');
          audio.loop = true;
          audio.volume = 0.7;
          
          audio.addEventListener('error', (e) => {
            console.error('Ringtone error:', e);
          });
          
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              setRingtoneAudio(audio);
            }).catch(e => {
              console.log('Could not play notification sound:', e);
              if (e.name === 'NotAllowedError') {
                displayToast('Incoming call (sound muted)');
              }
            });
          }
        } catch (error) {
          console.log('Could not initialize ringtone:', error);
        }
      };
      
      playRingtone();
      
      const timer = setTimeout(() => {
        if (incomingCallInfo && incomingCallInfo.id === callNotificationId) {
          acceptIncomingCall(doctor);
        }
      }, 15000);
      
      setAutoAcceptTimer(timer);
      
      displayToast(`Incoming call from ${doctor.name}`);
    },
    
    acceptIncomingCall: (doctor) => {
      console.log('Accepting incoming call from:', doctor?.name);
      
      if (ringtoneAudio) {
        ringtoneAudio.pause();
        ringtoneAudio.currentTime = 0;
        setRingtoneAudio(null);
      }
      
      if (autoAcceptTimer) {
        clearTimeout(autoAcceptTimer);
        setAutoAcceptTimer(null);
      }
      
      setIncomingCallInfo(null);
      setIncomingCallCounter(0); // Reset the counter when accepting a call
      
      webRTCService.acceptCall();
      setShowVideoCall(true);
      
      // Make this message more obvious
      displayToast(`Connected with ${doctor.name}`);
    },
    
    rejectIncomingCall: () => {
      console.log('Rejecting incoming call');
      
      if (ringtoneAudio) {
        ringtoneAudio.pause();
        ringtoneAudio.currentTime = 0;
        setRingtoneAudio(null);
      }
      
      if (autoAcceptTimer) {
        clearTimeout(autoAcceptTimer);
        setAutoAcceptTimer(null);
      }
      
      webRTCService.declineCall();
      
      setIncomingCallInfo(null);
      setIncomingCallCounter(0); // Reset the counter when rejecting a call
      setConnectingDoctor(null);
      setSelectedDoctor(null);
      
      // Make this message more obvious
      displayToast('Call rejected');
    },
    
    checkDoctorOnline: async (doctorId) => {
      // First check in Supabase if doctor is available
      try {
        const { data, error } = await supabase
          .from('doctors')
          .select('availability')
          .eq('doctor_id', doctorId)
          .single();
          
        if (error) {
          console.error('Error checking doctor availability in database:', error);
          return false;
        }
        
        // If not marked as available in database, don't even check socket
        if (!data.availability) {
          console.log(`Doctor ${doctorId} is marked as unavailable in database`);
          return false;
        }
        
        // Doctor is available in database, now check socket connection
        console.log(`Doctor ${doctorId} is available in database, checking socket connection...`);
      } catch (error) {
        console.error('Error in database check:', error);
      }
      
      // Check socket connection with retry logic
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          console.log(`Checking if doctor-${doctorId} is online (attempt ${attempt + 1})`);
          const isOnline = await webRTCService.checkUserOnline(`doctor-${doctorId}`);
          return isOnline;
        } catch (error) {
          console.log(`Error checking doctor online status (attempt ${attempt + 1}):`, error);
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      return false;
    },
    
    initiateCall: async (doctor) => {
      if (!webRTCService || !doctor) return;
    
      try {
        // Check active call status properly
        if (webRTCService.isCallActive()) {
          console.log('Call already active or connecting, not initiating a new one');
          setShowVideoCall(true);
          return;
        }
        
        // Try to get media with error handling
        try {
          await webRTCService.getLocalMedia();
        } catch (error) {
          console.error('Failed to get media:', error);
          displayToast(`Camera/microphone access failed: ${error.message}`);
          return;
        }
        
        webRTCService.makeCall(`doctor-${doctor.id}`);
        setShowVideoCall(true);
      } catch (error) {
        console.error('Failed to initiate call:', error);
        displayToast(`Error starting call: ${error.message}`);
      }
    },
      
    handleConnectDoctor: async (doctor) => {
      if (!readyToConnect) {
        displayToast('Please wait while connecting to the service...');
        return;
      }
      
      if (connectingDoctor && connectingDoctor.id === doctor.id) {
        setConnectingDoctor(null);
        setSelectedDoctor(null);
        
        setActiveToast(null);
        setToastQueue([]);
        displayToast(`Disconnected from ${doctor.name}`);
      } else {
        // Update doctor availability in real-time from Supabase
        try {
          const { data, error } = await supabase
            .from('doctors')
            .select('availability')
            .eq('doctor_id', doctor.id)
            .single();
            
          if (error) throw error;
          
          // Update the local doctor data with real-time availability
          if (data) {
            doctor.availability = data.availability ? "Available now" : "Available in 2h";
          }
        } catch (error) {
          console.error('Error fetching doctor availability:', error);
        }
        
        const isOnline = await callHandlers.checkDoctorOnline(doctor.id);
        
        if (!isOnline) {
          displayToast(`${doctor.name} is not online right now. Please try again later.`);
          return;
        }
        
        if (connectingDoctor) {
          displayToast(`Disconnected from ${connectingDoctor.name}`);
        }
        
        setConnectingDoctor(doctor);
        setSelectedDoctor(doctor);
        
        setActiveToast(null);
        setToastQueue([]);
        displayToast(`Connecting to ${doctor.name}...`);
      }
    }
  };
  
  const { displayIncomingCallAlert, acceptIncomingCall, rejectIncomingCall, initiateCall, handleConnectDoctor } = callHandlers;
  
  // Reset connection when video call ends, but only if previous state was true
  useEffect(() => {
    if (prevShowVideoCall.current && !showVideoCall && connectingDoctor) {
      displayToast(`Call with ${connectingDoctor.name} ended`);
      setConnectingDoctor(null);
      setIncomingCallCounter(0); // Reset the counter when a call ends
    }
    
    prevShowVideoCall.current = showVideoCall;
  }, [showVideoCall, connectingDoctor]);
  
  // Handle search filtering
  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  // Filter doctors based on search query and availability filter
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = searchQuery 
      ? (doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
      
    const matchesAvailability = filterActive 
      ? doctor.availability.includes('Available') && !doctor.availability.includes('in')
      : true;
      
    return matchesSearch && matchesAvailability;
  });
  
  // Improved toast display function
  const displayToast = (message) => {
    console.log('Displaying toast:', message);
    setToastQueue(prev => [...prev, message]);
  };
  
  // Process toast queue with improved timing
  useEffect(() => {
    if (toastQueue.length > 0 && !activeToast) {
      // Show the next toast in queue
      setActiveToast(toastQueue[0]);
      setToastQueue(prev => prev.slice(1));
      
      // Set a timer to clear the active toast after display time
      const timer = setTimeout(() => {
        setActiveToast(null);
        
        // Add a small delay before processing next toast
        setTimeout(() => {
          // Check if there are more toasts in queue and trigger reprocessing
          if (toastQueue.length > 0) {
            // Create a temporary state update to trigger the useEffect again
            setToastQueue(prev => [...prev]);
          }
        }, 300); // Small delay between toasts
      }, 3500); // Display duration reduced to 3.5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [toastQueue, activeToast]);
  
  // Animation for header
  const [headerVisible, setHeaderVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setHeaderVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 pb-24 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-500">Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 dark-mode-transition" style={{ 
      backgroundColor: isDarkMode ? colors.background : 'transparent',
      backgroundImage: isDarkMode 
        ? `radial-gradient(circle at 70% 30%, ${colors.primary}10, transparent 50%), 
           radial-gradient(circle at 30% 70%, ${colors.accent}10, transparent 50%)`
        : 'none'
    }}>
      <ConnectHeader 
        headerVisible={headerVisible}
        notifications={notifications}
        setNotifications={setNotifications}
        colors={colors}
        isDoctorMode={isDoctorMode}
        setIsDoctorMode={setIsDoctorMode}
      />
      
      {incomingCallCounter > 0 && (
      <div className="mb-2 p-2 bg-red-100 rounded-md text-xs">
        Incoming call events received: {incomingCallCounter}
      </div>
    )}
      
      <SearchBar 
        headerVisible={headerVisible}
        searchFocused={searchFocused}
        setSearchFocused={setSearchFocused}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        colors={colors}
        isDarkMode={isDarkMode}
      />
      
      <FilterChips 
        headerVisible={headerVisible}
        filterActive={filterActive}
        setFilterActive={setFilterActive}
        colors={colors}
        isDarkMode={isDarkMode}
      />
      
      <DoctorsTeam 
        headerVisible={headerVisible}
        doctors={filteredDoctors}
        colors={colors}
        connectingDoctor={connectingDoctor}
        handleConnectDoctor={handleConnectDoctor}
        setSelectedDoctor={setSelectedDoctor}
        setSchedulingDoctor={setSchedulingDoctor}
        setShowMessageDialog={setShowMessageDialog}
        isDarkMode={isDarkMode}
      />
      
      <QuickConnectActions 
        headerVisible={headerVisible}
        colors={colors}
        connectingDoctor={connectingDoctor}
        setShowMessageDialog={setShowMessageDialog}
        initiateCall={initiateCall}
        displayToast={displayToast}
        isDarkMode={isDarkMode}
      />
      
      <RecentMessages 
        headerVisible={headerVisible}
        colors={colors}
      />
      
      {/* Message Dialog */}
      <MessageDialog 
        isOpen={showMessageDialog}
        onClose={() => {
          setShowMessageDialog(false);
          setSchedulingDoctor(null);
        }}
        colors={colors}
        recipient={schedulingDoctor || connectingDoctor}
        doctors={doctors}
      />
      
      {/* Video Call Screen */}
      <VideoCallScreen 
        isOpen={showVideoCall}
        onClose={() => setShowVideoCall(false)}
        colors={colors}
        doctor={connectingDoctor}
      />
      
      {/* Incoming Call UI */}
      {incomingCallInfo && (
        <IncomingCallUI 
          incomingCallInfo={incomingCallInfo}
          colors={colors}
          acceptIncomingCall={acceptIncomingCall}
          rejectIncomingCall={rejectIncomingCall}
        />
      )}
      
      {/* Toast Notification */}
      <ToastNotification 
        activeToast={activeToast}
        colors={colors}
        isDarkMode={isDarkMode}
      />
      
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        
        .shimmer-effect {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.4) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }
        
        .dark .shimmer-effect {
          background: linear-gradient(
            90deg,
            rgba(30, 41, 59, 0) 0%,
            rgba(30, 41, 59, 0.4) 50%,
            rgba(30, 41, 59, 0) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0.8); opacity: 0; }
          70% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out forwards;
        }
        
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ConnectScreen;