import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../ThemeContext';
import webRTCService from '../../services/WebRTCService';
import { reconnectSocket, setupGlobalSocketHealthCheck } from '../../services/ConnectionRecoveryUtils';
import CallControls from './CallControls';
import ConnectionStatus from './ConnectionStatus'; 
import CallHeader from './CallHeader';
import ConnectingState from './ConnectingState';
import EndedState from './EndedState';
import VideoDisplay from './VideoDisplay';
import { Users } from 'lucide-react';

const VideoCallScreen = ({ isOpen, onClose, colors, doctor }) => {
  const { isDarkMode } = useTheme();
  
  // State variables
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, active, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [alwaysShowControls, setAlwaysShowControls] = useState(false); // New state for control preference
  const [connectionQuality, setConnectionQuality] = useState('good'); // good, poor, unstable
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [streamReady, setStreamReady] = useState(false);
  
  // Use a ref for forceActive to avoid re-renders
  const forceActiveRef = useRef(false);
  const endingCallRef = useRef(false); // Track if we're in the process of ending call
  
  // Refs for video elements and timers
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const lastMoveTimeRef = useRef(0);
  const callDurationTimer = useRef(null);
  const stateCheckerInterval = useRef(null);
  const stateCheckTimeouts = useRef([]);
  const activeSinceRef = useRef(null);
  const callStatusRef = useRef('connecting');
  const mouseMoveTimerRef = useRef(null); // Added ref for the timer
  const endCheckIntervalRef = useRef(null); // New ref for checking if call has ended
  const autoCloseTimerRef = useRef(null); // Timer for auto-closing the call UI
  
  // Update the ref when state changes
  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);
  
  // Enhanced logging for debugging
  const log = (message) => {
    console.log(`[VideoCall] ${message}`);
  };
  
  // When call becomes active, ensure controls are visible and reset timer
  useEffect(() => {
    if (callStatus === 'active') {
      // Show controls when call becomes active
      setShowControls(true);
      
      // Reset the timer for a better experience
      if (mouseMoveTimerRef.current) {
        clearTimeout(mouseMoveTimerRef.current);
      }
      
      // Set a longer initial timeout (15 seconds) when call first becomes active
      mouseMoveTimerRef.current = setTimeout(() => {
        if (!alwaysShowControls) {
          setShowControls(false);
        }
      }, 15000); // 15 seconds for initial call activation
    }
  }, [callStatus, alwaysShowControls]);

  // Create a synchronized end call function that ensures both sides end at the same time
  const synchronizedEndCall = () => {
    // Prevent multiple calls
    if (endingCallRef.current) return;
    endingCallRef.current = true;
    
    log('Performing synchronized call end');
    
    // Store the target user ID before doing anything else
    const targetUserId = webRTCService.targetUserId;
    
    // 1. Immediately set local state to ended for UI
    setCallStatus('ended');
    callStatusRef.current = 'ended';
    
    // 2. First send end-call signals BEFORE cleaning up resources
    if (webRTCService.signalingService && targetUserId) {
      try {
        log('Sending end-call signals before cleanup');
        
        // Send standard end-call signal immediately
        webRTCService.signalingService.send('end-call', { targetUserId });
        webRTCService.signalingService.send('direct-call-ended', { targetUserId });
      } catch (err) {
        log('Error sending initial end call signals: ' + err.message);
      }
    }
    
    // 3. Wait to give signals time to be sent before cleaning up
    setTimeout(() => {
      // 4. Stop local media tracks
      if (localVideoRef.current?.srcObject) {
        log('Stopping local video tracks');
        const stream = localVideoRef.current.srcObject;
        stream.getTracks().forEach(track => {
          try {
            log(`Stopping ${track.kind} track`);
            track.stop();
          } catch (e) {
            log(`Error stopping track: ${e.message}`);
          }
        });
        localVideoRef.current.srcObject = null;
      }
      
      // 5. Clean up remote video
      if (remoteVideoRef.current?.srcObject) {
        remoteVideoRef.current.srcObject = null;
      }
      
      // 6. Clear call duration timer
      if (callDurationTimer.current) {
        clearInterval(callDurationTimer.current);
        callDurationTimer.current = null;
      }
      
      // 7. Send additional signals with delays for redundancy
      if (webRTCService.signalingService && targetUserId) {
        [300, 600, 1000].forEach(delay => {
          setTimeout(() => {
            try {
              if (webRTCService.signalingService) {
                log(`Sending additional end-call signal (${delay}ms delay)`);
                webRTCService.signalingService.send('end-call', { targetUserId });
              }
            } catch (err) {
              log(`Error sending delayed end call signal: ${err.message}`);
            }
          }, delay);
        });
      }
      
      // 8. Tell WebRTCService to end the call AFTER signals have been sent
      // Use a delay to ensure signals go out first
      setTimeout(() => {
        if (webRTCService.endCall) {
          // Pass false to avoid sending duplicate signals
          webRTCService.endCall(false);
        }
        
        // 9. Schedule UI close after a fixed delay
        if (autoCloseTimerRef.current) {
          clearTimeout(autoCloseTimerRef.current);
        }
        
        autoCloseTimerRef.current = setTimeout(() => {
          log('Auto-closing call UI after ended state');
          onClose();
          
          // 10. After closing UI, try to reconnect to signaling server
          setTimeout(() => {
            try {
              if (webRTCService.signalingService && 
                  !webRTCService.signalingService.isConnected()) {
                log('Attempting to reconnect to signaling server after UI closed');
                
                // Use the reconnectSocket utility function
                if (typeof reconnectSocket === 'function') {
                  reconnectSocket(webRTCService.signalingService, webRTCService.userId)
                    .then(success => {
                      log('Reconnection result: ' + (success ? 'success' : 'failure'));
                      
                      // Re-register if successful
                      if (success && webRTCService.userId) {
                        webRTCService.signalingService.send('register', webRTCService.userId);
                        log('Re-registered with signaling server');
                      }
                    });
                }
              }
            } catch (err) {
              log('Error during reconnection attempt: ' + err.message);
            }
          }, 1000);
        }, 2000);
      }, 1000); // Wait 1 second after stopping media before ending the call
    }, 500); // Wait 500ms to allow initial signals to be sent before media cleanup
  };

  // NEW: Specifically handle call-ended events more aggressively
  useEffect(() => {
    if (!isOpen) return;
    
    // Helper function to check and fix socket connection
    const checkSocketConnection = () => {
      try {
        if (webRTCService && webRTCService.signalingService) {
          const isConnected = webRTCService.signalingService.isConnected();
          
          if (!isConnected) {
            log('Detected disconnected socket, attempting to reconnect');
            
            if (typeof webRTCService.signalingService.reconnect === 'function') {
              webRTCService.signalingService.reconnect()
                .then(success => {
                  log('Socket reconnection ' + (success ? 'successful' : 'failed'));
                  
                  // Re-register if reconnection was successful
                  if (success) {
                    const userId = webRTCService.userId;
                    if (userId) {
                      webRTCService.signalingService.send('register', userId);
                      log('Re-registered with signaling server');
                    }
                  }
                });
            } else if (webRTCService.signalingService.socket && 
                       webRTCService.signalingService.socket.connect) {
              log('Using socket.connect() to reconnect');
              webRTCService.signalingService.socket.connect();
              
              // Re-register after a small delay
              setTimeout(() => {
                if (webRTCService.signalingService.isConnected() && webRTCService.userId) {
                  webRTCService.signalingService.send('register', webRTCService.userId);
                  log('Re-registered with signaling server after connection');
                }
              }, 1000);
            }
          }
        }
      } catch (err) {
        log('Error in socket connection check: ' + err.message);
      }
    };
    
    // Check socket connection regularly
    const socketCheckInterval = setInterval(checkSocketConnection, 5000);
    
    // Run an immediate check
    checkSocketConnection();
    
    // Enhanced call end event listener
    const handleGlobalCallEnded = (event) => {
      log('Global call-ended event received - forcing ended state');
      if (callStatusRef.current !== 'ended') {
        synchronizedEndCall();
      }
    };
    
    // Add global event listener for call end events
    window.addEventListener('webrtc-call-ended', handleGlobalCallEnded);
    
    return () => {
      clearInterval(socketCheckInterval);
      window.removeEventListener('webrtc-call-ended', handleGlobalCallEnded);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    // Create direct event listener for direct-call-ended
    const handleDirectCallEndedEvent = (data) => {
      log('Direct-call-ended event received - forcing ended state');
      synchronizedEndCall();
    };
    
    // Subscribe to the direct-call-ended event
    const unsubscribeDirectCallEnded = webRTCService.on('direct-call-ended', handleDirectCallEndedEvent);
    
    return () => {
      if (typeof unsubscribeDirectCallEnded === 'function') {
        unsubscribeDirectCallEnded();
      }
    };
  }, [isOpen]);
  
  // Force check and update UI state - FIXED to prevent infinite loops
  const forceVideoStateCheck = () => {
    // Only run when component is mounted and call isn't ended
    if (callStatusRef.current === 'ended') return;
    
    log('Performing forced video state check');
    let shouldSetActive = false;
    
    // IMPROVED: Better remote video stream checking
    if (remoteVideoRef.current) {
      // Check if we need to attach the remote stream from webRTCService
      if (!remoteVideoRef.current.srcObject && webRTCService.connectionManager?.remoteStream) {
        log('Remote video has no srcObject but webRTCService has remote stream, attaching it now');
        remoteVideoRef.current.srcObject = webRTCService.connectionManager.remoteStream;
        
        try {
          remoteVideoRef.current.play().catch(e => {
            log(`Remote video play error: ${e.message}`);
          });
        } catch (err) {
          log(`Error playing remote video: ${err.message}`);
        }
        
        // Since we found and attached a stream, we should be active
        shouldSetActive = true;
      }
      
      // Check existing stream for tracks
      if (remoteVideoRef.current.srcObject) {
        const tracks = remoteVideoRef.current.srcObject.getTracks();
        log(`Remote video has ${tracks.length} tracks`);
        
        // Log specific track info for debugging
        tracks.forEach(track => {
          log(`Track: ${track.kind}, ID: ${track.id}, Enabled: ${track.enabled}, Ready: ${track.readyState}`);
        });
        
        if (tracks.length > 0) {
          log('Tracks detected, should force active UI state');
          shouldSetActive = true;
          
          // Try to play the video if paused
          if (remoteVideoRef.current.paused) {
            log('Video is paused, attempting to play');
            remoteVideoRef.current.play().catch(e => {
              log(`Auto-play failed: ${e.message}`);
            });
          }
        }
      }
    }
    
    // Check WebRTC service state as well
    if (webRTCService.isCallActive() && callStatusRef.current !== 'active') {
      log('WebRTC reports active call but UI shows connecting, should force update');
      shouldSetActive = true;
    }
    
    // IMPROVED: More aggressive check for remote stream
    if (webRTCService.connectionManager?.remoteStream) {
      log('WebRTC has remote stream, force attaching to video element and setting active state');
      
      // Always re-attach the stream to ensure it's the latest
      if (remoteVideoRef.current) {
        if (remoteVideoRef.current.srcObject !== webRTCService.connectionManager.remoteStream) {
          log('Updating remote video with current stream from connectionManager');
          remoteVideoRef.current.srcObject = webRTCService.connectionManager.remoteStream;
          
          try {
            remoteVideoRef.current.play().catch(e => {
              log(`Remote video play error: ${e.message}`);
            });
          } catch (err) {
            log(`Error playing remote video: ${err.message}`);
          }
        }
      }
      
      shouldSetActive = true;
    }
    
    // Track active time with refs to avoid renders
    if (!activeSinceRef.current && callStatusRef.current === 'active') {
      activeSinceRef.current = Date.now();
    }
    
    // If we've been "active" for more than 5 seconds but still no video
    if (activeSinceRef.current && (Date.now() - activeSinceRef.current > 5000)) {
      log('Active for 5+ seconds, forcing active display state');
      forceActiveRef.current = true;
    }
    
    // Only update state if needed, and do it in one batch
    if (shouldSetActive && callStatusRef.current !== 'active') {
      setCallStatus('active');
      setStreamReady(true);
      
      // Also ensure controls are visible when call becomes active
      setShowControls(true);
    }
  
    // IMPROVED: Local video checking and attachment
    if (localVideoRef.current) {
      if (!localVideoRef.current.srcObject && webRTCService.mediaManager?.localStream) {
        log('Local video element has no srcObject, setting it now');
        localVideoRef.current.srcObject = webRTCService.mediaManager.localStream;
        
        // Trigger a play with better error handling
        try {
          localVideoRef.current.play().catch(e => {
            log(`Local play error: ${e.message}`);
            // Try muted playback as a fallback (helps with autoplay restrictions)
            localVideoRef.current.muted = true;
            localVideoRef.current.play().catch(innerErr => {
              log(`Local muted play also failed: ${innerErr.message}`);
            });
          });
        } catch (err) {
          log(`Error during local play: ${err.message}`);
        }
      } else if (localVideoRef.current.srcObject) {
        // Check if tracks are enabled
        const videoTracks = localVideoRef.current.srcObject.getVideoTracks();
        if (videoTracks.length > 0) {
          log(`Local video has ${videoTracks.length} video tracks`);
          videoTracks.forEach(track => {
            log(`Local track: ${track.kind}, Enabled: ${track.enabled}, Ready: ${track.readyState}`);
            
            // If video is not disabled by user but track is disabled, enable it
            if (!isVideoOff && !track.enabled) {
              log('Local track was disabled but should be enabled, enabling it now');
              track.enabled = true;
            }
          });
        } else {
          log('Local video has no video tracks, only audio');
        }
      }
    }  
  };
  
  // Function to safely toggle video state
  const toggleVideo = (videoOff) => {
    log(`Toggle video: ${videoOff}`);
    setIsVideoOff(videoOff);
    
    // Force controls to show when toggling video
    setShowControls(true);
    
    // Clear any hide timer
    if (mouseMoveTimerRef.current) {
      clearTimeout(mouseMoveTimerRef.current);
      mouseMoveTimerRef.current = null;
    }
    
    // Set a longer timeout or don't hide controls when video is off
    if (videoOff && !alwaysShowControls) {
      mouseMoveTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 30000); // 30 seconds instead of 10 when video is off
    } else if (!videoOff && !alwaysShowControls) {
      // Normal timeout when video is on
      mouseMoveTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 10000);
    }
    
    if (webRTCService && webRTCService.mediaManager.hasLocalStream()) {
      webRTCService.toggleVideo(videoOff);
    }
  };
  
  // Toggle always showing controls
  const toggleAlwaysShowControls = () => {
    try {
      // Use functional state update to ensure we work with the latest state
      setAlwaysShowControls(prevValue => {
        const newValue = !prevValue;
        
        // If enabling always show, make sure controls are visible
        if (newValue) {
          setShowControls(true);
          
          // Clear any hide timer
          if (mouseMoveTimerRef.current) {
            clearTimeout(mouseMoveTimerRef.current);
            mouseMoveTimerRef.current = null;
          }
        }
        
        // Save preference
        try {
          localStorage.setItem('always_show_controls', newValue ? 'true' : 'false');
        } catch (e) {
          // Ignore storage errors
        }
        
        return newValue;
      });
      
      // Log the action for debugging
      console.log('Toggle always show controls button clicked');
    } catch (err) {
      console.error('Error in toggleAlwaysShowControls:', err);
    }
  };
  
  // Load saved preference for always showing controls
  useEffect(() => {
    try {
      const savedPreference = localStorage.getItem('always_show_controls');
      if (savedPreference === 'true') {
        setAlwaysShowControls(true);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    
    // Set up socket health check
    const stopHealthCheck = setupGlobalSocketHealthCheck(
      webRTCService.signalingService, 
      webRTCService.userId,
      5000 // Check every 5 seconds
    );
    
    // Listen for connection issues
    const handleSocketIssue = async () => {
      log('Detected socket connection issue, attempting recovery');
      
      // Show reconnecting UI
      setConnectionQuality('unstable');
      
      // Attempt reconnection
      const success = await reconnectSocket(
        webRTCService.signalingService, 
        webRTCService.userId
      );
      
      if (success) {
        log('Socket connection recovered');
        setConnectionQuality('good');
      } else {
        log('Socket connection recovery failed');
        // If call was active, end it
        if (callStatusRef.current === 'active') {
          synchronizedEndCall();
        }
      }
    };
    
    // Listen for global socket events
    window.addEventListener('socket-recovery-failed', handleSocketIssue);
    
    return () => {
      stopHealthCheck();
      window.removeEventListener('socket-recovery-failed', handleSocketIssue);
    };
  }, [isOpen, webRTCService]);
  
  // Handle ending call using the synchronized end function
  const handleEndCall = () => {
    log('User ending call');
    
    // Check if we're in doctor mode
    const isDoctorMode = localStorage.getItem('is_doctor') === 'true';
    log(`Ending call in ${isDoctorMode ? 'doctor' : 'patient'} mode`);
    
    // Get the current targetUserId from webRTCService (important for proper ending)
    const currentTargetId = webRTCService.targetUserId;
    log(`Current target user ID: ${currentTargetId}`);
    
    // Special handling for doctor mode
    if (isDoctorMode && currentTargetId) {
      log('Doctor mode special handling for end call');
      
      // In doctor mode, send extra direct signal to the patient
      try {
        // Try multiple times to ensure delivery
        webRTCService.signalingService.send('end-call', { targetUserId: currentTargetId });
        webRTCService.signalingService.send('direct-call-ended', { targetUserId: currentTargetId });
        
        // Also send delayed messages
        setTimeout(() => {
          webRTCService.signalingService.send('end-call', { targetUserId: currentTargetId });
        }, 300);
        
        setTimeout(() => {
          webRTCService.signalingService.send('direct-call-ended', { targetUserId: currentTargetId });
        }, 1000);
      } catch (e) {
        log(`Error sending end-call signal: ${e.message}`);
      }
    }
    
    // Proceed with synchronized call end
    synchronizedEndCall();
  };
  
  // Initialize WebRTC when component mounts
  useEffect(() => {
    if (!isOpen || !doctor) return;
    
    log(`Opening call with ${doctor.name}`);
    endingCallRef.current = false; // Reset ending call flag
    activeSinceRef.current = null;
    forceActiveRef.current = false;
    
    // Reset state when opening
    setCallStatus('connecting');
    callStatusRef.current = 'connecting';
    setStreamReady(false);
    
    // Define handleLocalStream function first before using in callbacks
    const handleLocalStream = (stream) => {
      log(`Got local stream with ${stream.getTracks().length} tracks`);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        log('Set local video source');
        
        // Force play immediately
        try {
          localVideoRef.current.play().catch(err => {
            log(`Local video play error: ${err.message}`);
          });
        } catch (err) {
          log(`Error playing local video: ${err.message}`);
        }
        
        // Check again after delay in case it didn't stick
        setTimeout(() => {
          if (localVideoRef.current) {
            if (!localVideoRef.current.srcObject) {
              log('Local video lost srcObject, resetting');
              localVideoRef.current.srcObject = stream;
            }
            
            if (localVideoRef.current.paused) {
              log('Local video paused, trying to play again');
              localVideoRef.current.play().catch(e => log(`Error: ${e.message}`));
            }
          }
        }, 1000);
      }
    };
    
    // Set up callbacks with handleLocalStream defined first
    const callbacks = {
      onLocalStream: handleLocalStream,
      
      onRemoteStream: (stream) => {
        log(`Got remote stream with ${stream.getTracks().length} tracks`);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.muted = isSpeakerOff;
          log('Set remote video source');
          
          // Set flag to indicate stream is ready
          setStreamReady(true);
          
          // Force transition to active state
          log('Remote stream received, forcing active state');
          setCallStatus('active');
          callStatusRef.current = 'active';
          
          // Try to play immediately
          try {
            remoteVideoRef.current.play().catch(err => {
              log(`Initial play failed: ${err.message}`);
            });
          } catch (err) {
            log(`Error during initial play: ${err.message}`);
          }
          
          // Start call timer
          if (callDurationTimer.current) {
            clearInterval(callDurationTimer.current);
          }
          
          callDurationTimer.current = setInterval(() => {
            log('Call timer tick, updating duration');
            setCallDuration(prev => prev + 1);
          }, 1000);
        }
      },
      
      onCallStarted: () => {
        log('Call started callback fired');
        setCallStatus('active');
        callStatusRef.current = 'active';
        setReconnectAttempt(0);
        setErrorMessage('');
        
        // Make sure controls are visible when call starts
        setShowControls(true);
        
        // Start call timer if not already started
        if (!callDurationTimer.current) {
          callDurationTimer.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
          }, 1000);
        }
      },
      
      onCallEnded: () => {
        log('Call ended callback fired');
        synchronizedEndCall();
      },
      
      onICEConnectionStateChange: (state) => {
        log(`ICE connection state changed to: ${state}`);
        
        if (state === 'checking') {
          setConnectionQuality('unstable');
        } else if (state === 'connected' || state === 'completed') {
          setConnectionQuality('good');
          setCallStatus('active');
          callStatusRef.current = 'active';
          
          // Show controls when connection established
          setShowControls(true);
        } else if (state === 'disconnected') {
          setConnectionQuality('poor');
          setReconnectAttempt(prev => prev + 1);
          
          // Show controls during connection issues
          setShowControls(true);
        } else if (state === 'failed') {
          setConnectionQuality('unstable');
          setReconnectAttempt(prev => prev + 1);
          
          // Show controls during connection issues
          setShowControls(true);
          
          // If connection completely fails, transition to ended state after a short timeout
          setTimeout(() => {
            if (callStatusRef.current !== 'ended' && 
                webRTCService.connectionManager?.peerConnection?.iceConnectionState === 'failed') {
              log('ICE connection failed, forcing ended state');
              synchronizedEndCall();
            }
          }, 5000);
        }
      }
    };
    
    // Register callbacks
    webRTCService.updateCallbacks(callbacks);
    
    // Ensure we have local media
    if (!webRTCService.mediaManager.hasLocalStream()) {
      log('Requesting camera and microphone access');
      webRTCService.getLocalMedia(true, true)
        .then(stream => {
          log(`Local media access granted with ${stream.getTracks().length} tracks`);
          // Explicitly set local video source here as well for redundancy
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.play().catch(e => log(`Play error: ${e.message}`));
          }
        })
        .catch(error => {
          log(`Media access error: ${error.message}`);
          setErrorMessage(`Camera/mic access failed: ${error.message}`);
        });
    } else {
      // We already have local stream, make sure it's connected to video element
      const stream = webRTCService.mediaManager.localStream;
      log(`Using existing local stream with ${stream.getTracks().length} tracks`);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(e => log(`Play error: ${e.message}`));
      }
    }
    
    // Set up state checker at regular intervals
    stateCheckerInterval.current = setInterval(() => {
      forceVideoStateCheck();
    }, 1000);
    
    // Add specific timeouts for critical checks (use refs to avoid loops)
    stateCheckTimeouts.current = [
      setTimeout(() => forceVideoStateCheck(), 2000),
      setTimeout(() => forceVideoStateCheck(), 5000),
      setTimeout(() => forceVideoStateCheck(), 8000),
      // Force active state after 10 seconds
      setTimeout(() => {
        if (callStatusRef.current === 'connecting') {
          log('10 seconds passed, forcing active state');
          setCallStatus('active');
          callStatusRef.current = 'active';
          forceActiveRef.current = true;
          
          // Show controls again when forcing active state
          setShowControls(true);
        }
      }, 10000)
    ];
    
    // Listen for call state changes with enhanced logging
    const unsubscribeCallState = webRTCService.on('callStateChanged', (state) => {
      log(`Call state event: ${state}, current UI state: ${callStatusRef.current}`);
      
      // Always handle 'ended' state immediately regardless of current state
      if (state === 'ended') {
        log('Call ended event received, closing call immediately');
        synchronizedEndCall();
      } 
      // Handle other state changes as before...
    });
    
    const unsubscribeCallEnded = webRTCService.on('call-ended', () => {
      log('Direct call-ended event received');
      synchronizedEndCall();
    });
    
    // Listen for errors
    const unsubscribeError = webRTCService.on('error', (error) => {
      log(`WebRTC error: ${error.message}`);
      setErrorMessage(error.message || 'Call error');
      
      // Show controls during errors
      setShowControls(true);
      
      if (error.fatal) {
        synchronizedEndCall();
      }
    });
    
    // Listen for remote tracks added
    const unsubscribeTrackAdded = webRTCService.on('remoteTrackAdded', () => {
      log('Remote track added event received');
      setCallStatus('active');
      callStatusRef.current = 'active';
      setStreamReady(true);
      
      // Show controls when tracks are added
      setShowControls(true);
    });
    
    // Set up improved mouse movement tracker for controls with touch support
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastMoveTimeRef.current > 150) {
        lastMoveTimeRef.current = now;
        
        if (!showControls) {
          setShowControls(true);
        }
        
        // Don't hide controls if always show is enabled
        if (!alwaysShowControls) {
          clearTimeout(mouseMoveTimerRef.current);
          mouseMoveTimerRef.current = setTimeout(() => {
            setShowControls(false);
          }, 10000); // Increased from 5000 to 10000 (10 seconds)
        }
      }
    };
    
    // Add both mouse and touch event listeners
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    
    // Double-tap handler to toggle persistent controls
    let lastTapTime = 0;
    const handleDoubleTap = (e) => {
      const now = Date.now();
      const DOUBLE_TAP_THRESHOLD = 300; // ms
      
      if (now - lastTapTime < DOUBLE_TAP_THRESHOLD) {
        // Double tap detected
        toggleAlwaysShowControls();
        e.preventDefault(); // Prevent zoom on double tap
      }
      
      lastTapTime = now;
    };
    
    // Add double tap listener for mobile
    window.addEventListener('touchend', handleDoubleTap);
    
    // Force active after a delay (resolves UI inconsistency)
    setTimeout(() => {
      if (webRTCService.isCallActive()) {
        log('Force activating call after delay');
        setCallStatus('active');
        callStatusRef.current = 'active';
        
        // Show controls after forcing active
        setShowControls(true);
      }
    }, 1000);
    
    // Clean up
    return () => {
      log('Cleaning up call resources');
      
      unsubscribeCallState();
      unsubscribeError();
      unsubscribeTrackAdded();
      unsubscribeCallEnded();
      
      if (stateCheckerInterval.current) {
        clearInterval(stateCheckerInterval.current);
        stateCheckerInterval.current = null;
      }
      
      if (endCheckIntervalRef.current) {
        clearInterval(endCheckIntervalRef.current);
        endCheckIntervalRef.current = null;
      }
      
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
      
      stateCheckTimeouts.current.forEach(timeout => clearTimeout(timeout));
      stateCheckTimeouts.current = [];
      
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('touchend', handleDoubleTap);
      
      if (mouseMoveTimerRef.current) {
        clearTimeout(mouseMoveTimerRef.current);
      }
      
      if (callDurationTimer.current) {
        clearInterval(callDurationTimer.current);
        callDurationTimer.current = null;
      }
      
      // Clean up video elements
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
        localVideoRef.current.srcObject = null;
      }
      
      if (remoteVideoRef.current?.srcObject) {
        remoteVideoRef.current.srcObject = null;
      }
      
      // End the call
      webRTCService.endCall(true);
    };
  }, [isOpen, doctor, onClose, alwaysShowControls]);
  
  // Update WebRTC when audio mute state changes
  useEffect(() => {
    if (webRTCService && webRTCService.mediaManager.hasLocalStream()) {
      webRTCService.toggleAudio(isMuted);
    }
  }, [isMuted]);

  useEffect(() => {
    if (callStatus === 'active' && !callDurationTimer.current) {
      log('Starting call duration timer based on active call status');
      callDurationTimer.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (callDurationTimer.current && callStatus !== 'active') {
        clearInterval(callDurationTimer.current);
        callDurationTimer.current = null;
      }
    };
  }, [callStatus]);
  
  // Update remote video muted state when isSpeakerOff changes
  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = isSpeakerOff;
    }
  }, [isSpeakerOff]);
  
  // Update WebRTC when video state changes
  useEffect(() => {
    if (webRTCService && webRTCService.mediaManager.hasLocalStream()) {
      webRTCService.toggleVideo(isVideoOff);
    }
  }, [isVideoOff]);
  
  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Additional effect to handle active state when remote video is detected
  useEffect(() => {
    if (remoteVideoRef.current?.srcObject) {
      const checkForTracks = () => {
        const tracks = remoteVideoRef.current.srcObject.getTracks();
        if (tracks.length > 0) {
          log(`Remote video has ${tracks.length} tracks, forcing active state`);
          setCallStatus('active');
          callStatusRef.current = 'active';
          setStreamReady(true);
          
          // Show controls when tracks are detected
          setShowControls(true);
          return true;
        }
        return false;
      };
      
      if (checkForTracks()) return; // Tracks already present
      
      // If no tracks yet, set up listeners
      const handleCanPlay = () => {
        log('Remote video can play event fired');
        setStreamReady(true);
        setCallStatus('active');
        callStatusRef.current = 'active';
        
        // Show controls when video can play
        setShowControls(true);
      };
      
      const handleLoadedMetadata = () => {
        log('Remote video loadedmetadata event fired');
        checkForTracks();
      };
      
      remoteVideoRef.current.addEventListener('canplay', handleCanPlay);
      remoteVideoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      // Play video when ready
      if (remoteVideoRef.current.readyState >= 3) { // HAVE_FUTURE_DATA or better
        remoteVideoRef.current.play().catch(e => {
          log('Error auto-playing video: ' + e.message);
        });
      }
      
      return () => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.removeEventListener('canplay', handleCanPlay);
          remoteVideoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        }
      };
    }
  }, [remoteVideoRef.current?.srcObject]);
  
  // Force active state after a timeout - with refs to prevent loops
  useEffect(() => {
    if (callStatus === 'connecting') {
      const timeout = setTimeout(() => {
        log('Timeout reached, forcing active state');
        setCallStatus('active');
        callStatusRef.current = 'active';
        forceActiveRef.current = true;
        
        // Make sure controls are visible
        setShowControls(true);
      }, 15000); // Force active after 15 seconds max
      
      return () => clearTimeout(timeout);
    }
  }, [callStatus]);
  
  // ADDED: Special effect to ensure local video is displayed
  useEffect(() => {
    if (isOpen && localVideoRef.current) {
      // Check if we have local media but it's not connected to video element
      if (webRTCService.mediaManager.hasLocalStream() && !localVideoRef.current.srcObject) {
        log('Connecting existing local stream to video element');
        localVideoRef.current.srcObject = webRTCService.mediaManager.localStream;
        
        // Try to play it
        localVideoRef.current.play().catch(err => {
          log(`Failed to play local video: ${err.message}`);
        });
      }
      
      // Check again after a delay to be sure
      const checkTimer = setTimeout(() => {
        if (webRTCService.mediaManager.hasLocalStream() && 
            (!localVideoRef.current.srcObject || localVideoRef.current.paused)) {
          log('Delayed local video check - reconnecting stream');
          localVideoRef.current.srcObject = webRTCService.mediaManager.localStream;
          localVideoRef.current.play().catch(e => log(`Play error: ${e.message}`));
        }
      }, 2000);
      
      return () => clearTimeout(checkTimer);
    }
  }, [isOpen, callStatus]);

  // Enhanced detection of ended calls through peer connection state
  useEffect(() => {
    if (!isOpen) return;

    const checkConnectionState = () => {
      // Check the peer connection state
      const peerConnection = webRTCService.connectionManager?.peerConnection;
      
      if (peerConnection) {
        const connState = peerConnection.connectionState;
        const iceState = peerConnection.iceConnectionState;
        
        // If peer connection is closed, disconnected, or failed
        if ((connState === 'closed' || connState === 'failed' || 
            (connState === 'disconnected' && Date.now() - lastMoveTimeRef.current > 5000)) &&
            callStatusRef.current !== 'ended') {
          log(`Detected peer connection in ${connState} state, forcing ended state`);
          synchronizedEndCall();
        }
        
        // If ICE connection is failed and has been for a while
        if (iceState === 'failed' && callStatusRef.current !== 'ended') {
          log('Detected ICE connection failure, forcing ended state');
          synchronizedEndCall();
        }
      }
    };
    
    // Check connection state periodically
    const connectionCheckInterval = setInterval(checkConnectionState, 2000);
    
    return () => {
      clearInterval(connectionCheckInterval);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    // Setup global event listener as a backup mechanism to catch call end events
    const handleGlobalCallEnded = (event) => {
      log('Global call-ended event received - forcing ended state');
      if (callStatusRef.current !== 'ended') {
        synchronizedEndCall();
      }
    };
  
    // Add the global event listener
    window.addEventListener('webrtc-call-ended', handleGlobalCallEnded);
    
    return () => {
      window.removeEventListener('webrtc-call-ended', handleGlobalCallEnded);
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full h-full max-w-md relative overflow-hidden">
        {callStatus === 'ended' ? (
          <EndedState 
            doctor={doctor}
            errorMessage={errorMessage} 
            callDuration={callDuration} 
            formatTime={formatTime}
            colors={colors}
            isDarkMode={isDarkMode}
          />
        ) : callStatus === 'connecting' ? (
          <ConnectingState doctor={doctor} colors={colors} />
        ) : (
          // Using the improved VideoDisplay component for active call
          <VideoDisplay
            remoteVideoRef={remoteVideoRef}
            localVideoRef={localVideoRef}
            isSpeakerOff={isSpeakerOff}
            isVideoOff={isVideoOff}
            doctor={doctor}
            connectionQuality={connectionQuality}
            reconnectAttempt={reconnectAttempt}
            showControls={showControls}
            isDarkMode={isDarkMode}
            colors={colors}
            callStatus={callStatus}
            forceActiveState={forceActiveRef.current}
            onClick={() => {
              // Toggle controls on video click
              setShowControls(prev => !prev);
              
              // Reset hide timer if showing controls
              if (!showControls && !alwaysShowControls) {
                if (mouseMoveTimerRef.current) {
                  clearTimeout(mouseMoveTimerRef.current);
                }
                mouseMoveTimerRef.current = setTimeout(() => {
                  setShowControls(false);
                }, 10000);
              }
            }}
          >
            {/* Render header and connection status inside VideoDisplay */}
            <CallHeader 
              doctor={doctor}
              callDuration={callDuration}
              formatTime={formatTime}
              showControls={showControls}
            />
            
            <ConnectionStatus
              connectionQuality={connectionQuality}
              showControls={showControls || connectionQuality !== 'good'} // Always show when connection is not good
            />
            
            {/* Active call visual indicator */}
            <div 
              className={`absolute top-4 right-24 px-2 py-1 bg-green-500 bg-opacity-50 text-white text-xs rounded-full transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-50'}`}
              style={{ zIndex: 500 }}
            >
              Active
            </div>
          </VideoDisplay>
        )}
        
        {/* Controls - with improved visibility and state handling */}
        <CallControls
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          isVideoOff={isVideoOff}
          setIsVideoOff={toggleVideo} 
          isSpeakerOff={isSpeakerOff}
          setIsSpeakerOff={setIsSpeakerOff}
          handleEndCall={handleEndCall}
          showControls={showControls}
          colors={colors}
          callStatus={callStatus}
          resetControlsTimer={() => {
            if (mouseMoveTimerRef.current) {
              clearTimeout(mouseMoveTimerRef.current);
            }
            if (!alwaysShowControls) {
              mouseMoveTimerRef.current = setTimeout(() => {
                setShowControls(false);
              }, 10000);
            }
          }}
          setShowControls={setShowControls}
        />
      </div>
    </div>
  );
};

export default VideoCallScreen;