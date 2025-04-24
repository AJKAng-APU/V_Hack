// WebRTCService.js - Fixed version with improved call stability and proper resource cleanup
import WebRTCEventEmitter from './WebRTCEventEmitter';
import WebRTCConnectionManager from './WebRTCConnectionManager';
import WebRTCMediaManager from './WebRTCMediaManager';
import WebRTCLogger from './WebRTCLogger';
import { createSignalingService } from './SignalingService';

/**
 * Service that handles WebRTC connections for video calling
 * Enhanced with better state management, error handling, and resource cleanup
 */
class WebRTCService {
  constructor() {
    // Create logger
    this.logger = new WebRTCLogger();
    
    // Create event emitter
    this.eventEmitter = new WebRTCEventEmitter();
    
    // Create media manager
    this.mediaManager = new WebRTCMediaManager(this.logger);
    
    // User identifiers
    this.userId = null;
    this.targetUserId = null;
    
    // Call state
    this.callState = 'idle'; // idle, connecting, active, ended
    
    // Initialize subsystems
    this.connectionManager = null;
    this.signalingService = null;
    
    // Initialization state
    this.isInitialized = false;
    
    // Track state change timestamps to prevent rapid transitions
    this.lastStateChangeTime = 0;
    this.stateChangeDebounceMs = 300; // Minimum time between state changes
    
    // Periodic state check
    this.stateCheckInterval = null;
    
    // Connection monitoring
    this.connectionMonitorInterval = null;
    this._disconnectionStartTime = undefined;
    this._noMediaStartTime = undefined;
    
    // Call end handling flag
    this._handlingCallEnd = false;
    
    // IMPORTANT: Add a flag to track if media has been properly released
    this._mediaReleased = true;
    
    // Track if we're a demo account for special handling
    this._isDemoAccount = false;
    this._isDoctorAccount = false;
  }
  
  // Public API: State Checking Methods
  isCallActive = () => ['connecting', 'active'].includes(this.callState);
  isCallConnected = () => this.callState === 'active';
  hasRemoteStream = () => this.connectionManager && !!this.connectionManager.remoteStream;
  
  // Public API: Event Management
  on(event, callback) {
    return this.eventEmitter.on(event, callback);
  }
  
  // Public API: Call State Management with debouncing
  updateCallState(newState) {
    const now = Date.now();
    
    // Always log state change requests
    this.logger.log(`Call state change requested from ${this.callState} to ${newState}`);
    
    // Prevent rapid state changes (except for 'ended' which should always happen)
    if (newState !== 'ended' && now - this.lastStateChangeTime < this.stateChangeDebounceMs) {
      this.logger.log(`Call state change debounced (${now - this.lastStateChangeTime}ms < ${this.stateChangeDebounceMs}ms)`);
      
      // For 'active' state, schedule a delayed check to ensure it happens
      if (newState === 'active' && this.callState !== 'active') {
        setTimeout(() => {
          if (this.callState !== 'active') {
            this.logger.log('Delayed active state check - forcing state update');
            this.forceStateUpdate('active');
          }
        }, this.stateChangeDebounceMs);
      }
      return;
    }
    
    // Prevent going backwards from active to connecting
    if (this.callState === 'active' && newState === 'connecting') {
      this.logger.log('Preventing state regression from active to connecting');
      return;
    }
    
    if (this.callState !== newState) {
      this.logger.log(`Call state changing from ${this.callState} to ${newState}`);
      
      // Set the state immediately
      this.callState = newState;
      this.lastStateChangeTime = now;
      
      // Sync the UI immediately
      this.eventEmitter.emit('callStateChanged', newState);
      
      // For 'active' state, make extra sure all UI components know about it
      if (newState === 'active') {
        // Send additional update after short delay to ensure UI catches it
        setTimeout(() => {
          this.logger.log('Re-emitting active state after delay');
          this.eventEmitter.emit('callStateChanged', 'active');
          
          // Notify all callbacks
          if (this.callbacks && this.callbacks.onCallStarted) {
            this.callbacks.onCallStarted();
          }
        }, 500);
        
        // Also notify after longer delay as backup
        setTimeout(() => {
          this.eventEmitter.emit('callStateChanged', 'active');
        }, 2000);
      }
      
      // Trigger appropriate callbacks
      if (this.callbacks) {
        if (newState === 'active' && this.callbacks.onCallStarted) this.callbacks.onCallStarted();
        if (newState === 'ended' && this.callbacks.onCallEnded) this.callbacks.onCallEnded();
        if (newState === 'connecting' && this.callbacks.onCallConnecting) this.callbacks.onCallConnecting();
      }
    } else if (newState === 'active') {
      // Even if already in active state, re-emit to ensure UI sync
      this.logger.log('Already in active state, but re-emitting to ensure UI sync');
      this.eventEmitter.emit('callStateChanged', 'active');
      
      if (this.callbacks && this.callbacks.onCallStarted) {
        this.callbacks.onCallStarted();
      }
    }
  }

  // Force state update without debouncing
  forceStateUpdate(newState) {
    if (this.callState !== newState) {
      this.logger.log(`Forcing call state from ${this.callState} to ${newState}`);
      this.callState = newState;
      this.lastStateChangeTime = Date.now();
      this.eventEmitter.emit('callStateChanged', newState);
      
      // Trigger appropriate callbacks
      if (this.callbacks) {
        if (newState === 'active' && this.callbacks.onCallStarted) this.callbacks.onCallStarted();
        if (newState === 'ended' && this.callbacks.onCallEnded) this.callbacks.onCallEnded();
      }
    }
  }

  logCallState() {
    this.logger.log(`Current call state: ${this.callState}`);
    this.logger.log(`Is call active according to isCallActive(): ${this.isCallActive()}`);
    this.logger.log(`Is call connected according to isCallConnected(): ${this.isCallConnected()}`);
    
    if (this.connectionManager) {
      this.logger.log(`Connection manager remote stream: ${!!this.connectionManager.remoteStream}`);
      if (this.connectionManager.remoteStream) {
        this.logger.log(`Remote stream tracks: ${this.connectionManager.remoteStream.getTracks().length}`);
      }
      this.logger.log(`ICE Connection state: ${this.connectionManager.iceConnectionState}`);
    }
    
    // Forced re-emission of state
    this.eventEmitter.emit('callStateChanged', this.callState);
  }
  
  /**
   * Initialize the WebRTC service with user information and callbacks
   * @param {string} userId - The current user's ID
   * @param {object} callbacks - Callback functions to handle events
   * @param {string} serverUrl - The URL of the signaling server (optional)
   */
  initialize(userId, callbacks = {}, serverUrl = null) {
    // If already initialized with the same ID, just update callbacks
    if (this.isInitialized && this.userId === userId) {
      this.logger.log('WebRTC service already initialized for user:', userId, '- updating callbacks only');
      this.updateCallbacks(callbacks);
      return;
    }

    // If initialized with a different ID, disconnect first
    if (this.isInitialized && this.userId !== userId) {
      this.logger.log('Reinitializing with new user ID - disconnecting first');
      this.disconnect();
    }
    
    this.logger.log('Initializing WebRTC service for user:', userId);
    this.userId = userId;
    
    // Detect demo account or doctor account
    this._isDemoAccount = userId === 'demo@healthsync.com' || userId.includes('demo');
    this._isDoctorAccount = userId.startsWith('doctor-') || localStorage.getItem('is_doctor') === 'true';
    
    this.logger.log(`Account type: ${this._isDemoAccount ? 'Demo' : 'Regular'}, ${this._isDoctorAccount ? 'Doctor' : 'Patient'}`);
    
    // Set up callbacks
    this.callbacks = {};
    this.updateCallbacks(callbacks);
    
    // Create signaling service - ONLY ONCE
    this.signalingService = createSignalingService(
      serverUrl || process.env.REACT_APP_SIGNALING_SERVER || 'http://localhost:3001',
      userId,
      this.handleSignalingEvents.bind(this)
    );
    
    // Configure socket settings for better reliability
    if (this.signalingService && this.signalingService.socket) {
      // Prevent disconnections
      this.signalingService.socket.io.reconnection(true);
      this.signalingService.socket.io.reconnectionAttempts(10);
      this.signalingService.socket.io.reconnectionDelay(1000);
      this.signalingService.socket.io.timeout(10000);
      
      // Debug connection issues
      this.signalingService.socket.on('connect', () => {
        this.logger.log('Socket connected successfully!');
        // Immediately register user ID again after reconnection
        this.signalingService.send('register', userId);
      });
      
      this.signalingService.socket.on('disconnect', (reason) => {
        this.logger.log('Socket disconnected, reason:', reason);
      });
    }
    
    // Create connection manager with enhanced track handling
    this.connectionManager = new WebRTCConnectionManager(
      this.signalingService,
      this.mediaManager,
      this.eventEmitter,
      this.logger,
      this.updateCallState.bind(this)
    );
    
    // Set up enhanced track detection
    if (this.connectionManager) {
      // Original handleTrackEvent had issues; patch it to ensure it emits events
      const originalTrackHandler = this.connectionManager.handleTrackEvent;
      this.connectionManager.handleTrackEvent = (event) => {
        // Call the original handler
        originalTrackHandler.call(this.connectionManager, event);
        
        // Additional logging
        this.logger.log(`Track received: ${event.track.kind}`);
        
        // Emit track added event
        this.eventEmitter.emit('remoteTrackAdded', {
          kind: event.track.kind,
          enabled: event.track.enabled,
          id: event.track.id
        });
        
        // Force call to active state when tracks are received
        this.updateCallState('active');
      };
    }
    
    // Set up periodic state check
    this.startStateCheck();
    
    // Set up connection monitoring with less aggressive timeouts
    this.startConnectionStateMonitoring();
    
    // Mark media as not released so we know to clean it up later
    this._mediaReleased = false;
    
    this.isInitialized = true;
  }

  // Start periodic state check
  startStateCheck() {
    if (this.stateCheckInterval) {
      clearInterval(this.stateCheckInterval);
    }
    
    this.stateCheckInterval = setInterval(() => {
      // Check if we should be in active state but aren't
      if (this.connectionManager && 
          this.connectionManager.remoteStream && 
          this.connectionManager.remoteStream.getTracks().length > 0 && 
          this.callState !== 'active') {
        this.logger.log('State check: Remote tracks detected but state is not active, forcing update');
        this.forceStateUpdate('active');
      }
      
      // Check ICE connection state
      if (this.connectionManager && 
          this.connectionManager.peerConnection &&
          ['connected', 'completed'].includes(this.connectionManager.peerConnection.iceConnectionState) &&
          this.callState !== 'active') {
        this.logger.log('State check: ICE connected but state is not active, forcing update');
        this.forceStateUpdate('active');
      }
    }, 1000);
  }

  /**
   * Start monitoring connection state with LESS AGGRESSIVE timeouts
   * This adds an extra layer of reliability for detecting disconnections
   */
  startConnectionStateMonitoring() {
    // Clear any existing interval
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
    }
    
    this.connectionMonitorInterval = setInterval(() => {
      // Only check when in an active call
      if (this.callState !== 'active' && this.callState !== 'connecting') {
        return;
      }
      
      // Check peer connection state
      if (this.connectionManager && this.connectionManager.peerConnection) {
        const connection = this.connectionManager.peerConnection;
        const iceState = connection.iceConnectionState;
        const connState = connection.connectionState;
        
        // Less frequent logging to reduce noise
        if (Math.random() < 0.2) { // Log only ~20% of the time
          this.logger.log(`Connection monitor - ICE: ${iceState}, Connection: ${connState}`);
        }
        
        // Detect disconnected or failed states
        if ((iceState === 'disconnected' || iceState === 'failed' || 
             connState === 'disconnected' || connState === 'failed') && 
            this._disconnectionStartTime === undefined) {
          
          // Start tracking disconnection time
          this._disconnectionStartTime = Date.now();
          this.logger.log('Detected potential disconnection, starting timer');
          
        } else if ((iceState === 'disconnected' || iceState === 'failed' || 
                   connState === 'disconnected' || connState === 'failed') && 
                  this._disconnectionStartTime !== undefined) {
          
          // LESS AGGRESSIVE: Check if disconnection has lasted too long (15 seconds instead of 8)
          const disconnectionDuration = Date.now() - this._disconnectionStartTime;
          
          // For demo/doctor accounts, be even more lenient
          const disconnectionThreshold = (this._isDemoAccount || this._isDoctorAccount) ? 20000 : 15000;
          
          if (disconnectionDuration > disconnectionThreshold) {
            this.logger.log(`Disconnection lasted ${disconnectionDuration}ms, ending call`);
            this._disconnectionStartTime = undefined;
            
            // Force end the call
            this.handleCallEnded();
          }
          
        } else if ((iceState === 'connected' || iceState === 'completed' || 
                   connState === 'connected') && 
                  this._disconnectionStartTime !== undefined) {
          
          // Connection restored
          this.logger.log('Connection restored after temporary disconnection');
          this._disconnectionStartTime = undefined;
        }
        
        // Also check if we have any media flowing
        if (this.connectionManager.remoteStream) {
          const hasActiveTracks = this.connectionManager.remoteStream.getTracks().some(
            track => track.readyState === 'live'
          );
          
          if (!hasActiveTracks && this._noMediaStartTime === undefined) {
            this._noMediaStartTime = Date.now();
            this.logger.log('No active media tracks detected, starting timer');
          } else if (!hasActiveTracks && this._noMediaStartTime !== undefined) {
            const noMediaDuration = Date.now() - this._noMediaStartTime;
            
            // LESS AGGRESSIVE: Longer timeout for no media (15 seconds instead of 10)
            const noMediaThreshold = (this._isDemoAccount || this._isDoctorAccount) ? 20000 : 15000;
            
            if (noMediaDuration > noMediaThreshold) {
              this.logger.log(`No media for ${noMediaDuration}ms, ending call`);
              this._noMediaStartTime = undefined;
              this.handleCallEnded();
            }
          } else if (hasActiveTracks && this._noMediaStartTime !== undefined) {
            this.logger.log('Media tracks restored');
            this._noMediaStartTime = undefined;
          }
        }
      }
    }, 3000); // Check every 3 seconds instead of 2 to reduce processing overhead
  }

  /**
   * End call with improved resource cleanup
   * @param {boolean} notifyOther - Whether to notify the other party that the call is ending
   */
  endCall(notifyOther = true) {
    const wasActive = this.callState !== 'idle' && this.callState !== 'ended';
    
    // First set call state to ended
    this.callState = 'ended';
    
    // Update UI state immediately
    this.eventEmitter.emit('callStateChanged', 'ended');
    
    // Clean up connection
    if (this.connectionManager) {
      this.connectionManager.closeConnection();
    }
    
    // Make sure we notify the other user about call ending
    if (notifyOther && wasActive && this.signalingService && this.targetUserId) {
      this.logger.log('Sending end-call signal to:', this.targetUserId);
      
      // Send the end call signal - retry up to 3 times
      let attempts = 0;
      const sendEndCall = () => {
        attempts++;
        this.signalingService.send('end-call', {
          targetUserId: this.targetUserId
        });
        
        // Also send direct-call-ended as backup
        this.signalingService.send('direct-call-ended', {
          targetUserId: this.targetUserId
        });
        
        if (attempts < 3) {
          setTimeout(sendEndCall, 500); // Retry after 500ms
        }
      };
      
      sendEndCall();
    }
    
    // IMPROVED: Stop the camera and microphone to release resources with better error handling
    this.ensureCameraReleased();
    
    // Reset state
    this.pendingOffer = null;
    this.targetUserId = null;
    this.isCallInitiator = false;
  }

  /**
   * CRITICAL: Ensure camera is released properly in all scenarios
   */
  ensureCameraReleased() {
    if (!this._mediaReleased) {
      this.logger.log('Ensuring camera and microphone resources are properly released');
      
      try {
        if (this.mediaManager) {
          this.mediaManager.stopLocalStream();
          this.logger.log('Successfully stopped local media stream');
        }
        
        // Also try to stop any tracks we might have in the connection manager
        if (this.connectionManager && this.connectionManager.localStream) {
          try {
            const tracks = this.connectionManager.localStream.getTracks();
            for (const track of tracks) {
              track.stop();
              this.logger.log(`Stopped connection manager track: ${track.kind}`);
            }
          } catch (err) {
            this.logger.error('Error stopping connection manager tracks:', err.message);
          }
        }
        
        // Double check with direct access to navigator.mediaDevices
        try {
          // This is a brute force approach to make absolutely sure all tracks are stopped
          if (navigator.mediaDevices && navigator.mediaDevices.getTracks) {
            const allTracks = navigator.mediaDevices.getTracks();
            for (const track of allTracks) {
              track.stop();
              this.logger.log(`Stopped system track: ${track.kind}`);
            }
          }
        } catch (e) {
          this.logger.log('Navigator media devices direct access not available');
        }
        
        // For demo/doctor accounts, add a special alert if available
        if ((this._isDemoAccount || this._isDoctorAccount) && typeof window !== 'undefined') {
          try {
            if (window.electronAPI && window.electronAPI.forceReleaseCamera) {
              window.electronAPI.forceReleaseCamera();
              this.logger.log('Forced camera release via electron API');
            }
          } catch (e) {
            this.logger.log('Electron API not available for forced camera release');
          }
        }
        
        this._mediaReleased = true;
      } catch (error) {
        this.logger.error('Error during camera cleanup:', error.message);
        
        // Last resort: Try to access tracks directly from window object if they're stored there
        try {
          if (window.myLocalStream) {
            const tracks = window.myLocalStream.getTracks();
            for (const track of tracks) {
              track.stop();
              this.logger.log(`Stopped window-level track: ${track.kind}`);
            }
            window.myLocalStream = null;
          }
        } catch (e) {
          this.logger.error('Error during last-resort camera cleanup:', e.message);
        }
      }
    } else {
      this.logger.log('Media already released, skipping cleanup');
    }
  }

  /**
   * Handle call ended event with improved connection management
   */
  handleCallEnded() {
    this.logger.log('Call ended remotely');
    
    // Set a flag to prevent multiple handlers
    if (this._handlingCallEnd) {
      this.logger.log('Already handling call end, ignoring duplicate event');
      return;
    }
    this._handlingCallEnd = true;
    
    // Immediately update UI state
    this.forceStateUpdate('ended');
    
    // IMPROVED: Make absolutely sure camera resources are released
    this.ensureCameraReleased();
    
    // Clean up connection
    if (this.connectionManager) {
      this.connectionManager.closeConnection();
      this.logger.log('Connection closed after remote end');
    }
    
    // Broadcast end event to UI with guaranteed delivery
    this.eventEmitter.emit('callStateChanged', 'ended');
    this.eventEmitter.emit('call-ended');
    
    // Multiple attempts to ensure UI updates
    [100, 500, 1000].forEach(delay => {
      setTimeout(() => {
        this.eventEmitter.emit('callStateChanged', 'ended');
      }, delay);
    });
    
    // IMPORTANT: Add reconnection to signaling server if disconnected
    setTimeout(() => {
      if (this.signalingService && !this.signalingService.isConnected()) {
        this.logger.log('Reconnecting to signaling server after call ended');
        
        // Attempt to reconnect the socket
        if (this.signalingService.socket && this.signalingService.socket.connect) {
          this.signalingService.socket.connect();
          
          // Re-register user ID after reconnection
          setTimeout(() => {
            if (this.signalingService.isConnected() && this.userId) {
              this.signalingService.send('register', this.userId);
              this.logger.log('Re-registered with signaling server');
            }
          }, 1000);
        }
      }
      
      // Reset the handling flag after delay
      this._handlingCallEnd = false;
    }, 1500);
    
    // Reset state
    this.targetUserId = null;
    this.pendingOffer = null;
    this.isCallInitiator = false;
  }
  
  /**
   * Handle all signaling events
   */
  handleSignalingEvents(event, data) {
    this.logger.log(`Received signaling event: ${event}`, data);
    switch (event) {
      case 'incoming-call':
        this.handleIncomingCall(data);
        break;
      case 'call-answered':
        this.handleCallAnswered(data);
        break;
      case 'call-declined':
        this.handleCallDeclined();
        break;
      case 'call-in-progress':
        this.updateCallState('ended'); 
        if (this.callbacks && this.callbacks.onCallInProgress) {
          this.callbacks.onCallInProgress(data.callerUserId, data.message);
        }
        break;
      case 'direct-call-ended':
        this.logger.log('Received direct call ended signal');
        this.handleCallEnded();
        break;
      case 'ice-candidate':
        if (this.connectionManager) {
          this.connectionManager.addRemoteIceCandidate(data.candidate);
        }
        break;
      case 'media-connected':
        this.logger.log('Remote peer reports media connected');
        this.forceStateUpdate('active'); // Use force update to bypass debouncing
        
        // Force update UI regardless of previous state
        if (this.callbacks && this.callbacks.onCallStarted) {
          this.callbacks.onCallStarted();
        }
        
        // Ensure connection manager is also updated
        if (this.connectionManager && this.connectionManager.remoteStream) {
          this.logger.log('We have remote media and received media-connected signal, enforcing active state');
          this.forceStateUpdate('active');
        }
        break;
      case 'call-ended':
        this.handleCallEnded();
        break;
      case 'call-failed':
        this.handleCallFailed(data);
        break;
      default:
        this.logger.log('Unknown signaling event:', event, data);
    }
  }
  
  /**
   * Handle incoming call event
   */
  handleIncomingCall(data) {
    const { callerUserId, offerSDP } = data;
    this.logger.log('Incoming call from:', callerUserId);
    
    // If there's already an active call, ignore this one
    if (this.isCallActive() || this.callState === 'active' || this.callState === 'connecting') {
      this.logger.log('Already in a call, ignoring incoming call');
      // Explicitly decline the call so the caller knows
      this.signalingService.send('call-declined', { targetUserId: callerUserId });
      return;
    }
    
    this.targetUserId = callerUserId;
    
    // Store the offer to use when call is accepted
    if (this.connectionManager) {
      this.connectionManager.setPendingOffer(offerSDP);
    }
    
    // Update call state
    this.updateCallState('connecting');
    
    // Notify the application of the incoming call
    if (this.callbacks && this.callbacks.onIncomingCall) {
      this.callbacks.onIncomingCall(callerUserId);
    }
  }
  
  /**
   * Handle call answered event
   */
  handleCallAnswered(data) {
    const { answerSDP } = data;
    this.logger.log('Call was answered, setting remote description');
    
    if (this.connectionManager) {
      this.connectionManager.setRemoteDescription(answerSDP);
    }
    
    // Start connection status checker
    this.checkConnectionStatus();
  }
  
  /**
   * Handle call declined event
   */
  handleCallDeclined() {
    this.logger.log('Call was declined by the recipient');
    this.updateCallState('ended');
    
    // IMPROVED: Make sure camera is released when call is declined
    this.ensureCameraReleased();
    
    // Notify the application
    if (this.callbacks && this.callbacks.onCallDeclined) {
      this.callbacks.onCallDeclined();
    }
    
    // Reset state
    this.targetUserId = null;
    this.pendingOffer = null;
    this.isCallInitiator = false;
  }

  checkConnectionStatus() {
    let checkCount = 0;
    const maxChecks = 10;
    
    const interval = setInterval(() => {
      checkCount++;
      
      // If we have a remote stream but UI still shows connecting
      if (this.connectionManager && 
          this.connectionManager.remoteStream &&
          this.connectionManager.remoteStream.getTracks().length > 0 &&
          this.callState === 'connecting') {
        
        this.logger.log('Media detected but call not active, forcing state update');
        this.forceStateUpdate('active');
      }
      
      if (checkCount >= maxChecks || this.callState === 'active' || this.callState === 'ended') {
        clearInterval(interval);
      }
    }, 1000);
  }
  
  /**
   * Handle call failed event
   */
  handleCallFailed(data) {
    const { message, targetUserId } = data;
    this.logger.log('Call failed:', message);
    
    // Handle user not online case
    if (message === 'User is not online') {
      if (this.callbacks && this.callbacks.onUserNotOnline) {
        this.callbacks.onUserNotOnline(targetUserId);
      } else {
        this.updateCallState('ended');
      }
    } else {
      this.updateCallState('ended');
    }
    
    // IMPROVED: Ensure camera is released on call failure
    this.ensureCameraReleased();
    
    // Reset call state
    this.targetUserId = null;
    this.pendingOffer = null;
    this.isCallInitiator = false;
  }
  
  /**
   * Update callback functions
   * @param {object} callbacks - Callback functions to update
   */
  updateCallbacks(callbacks = {}) {
    this.callbacks = {
      ...this.callbacks,
      ...callbacks
    };
    
    // Initialize default callback functions if not already set
    this.callbacks.onLocalStream = this.callbacks.onLocalStream || (() => {});
    this.callbacks.onRemoteStream = this.callbacks.onRemoteStream || (() => {});
    this.callbacks.onCallStarted = this.callbacks.onCallStarted || (() => {});
    this.callbacks.onCallEnded = this.callbacks.onCallEnded || (() => {});
    this.callbacks.onCallConnecting = this.callbacks.onCallConnecting || (() => {});
    this.callbacks.onIncomingCall = this.callbacks.onIncomingCall || (() => {});
    this.callbacks.onICEConnectionStateChange = this.callbacks.onICEConnectionStateChange || (() => {});
    this.callbacks.onUserNotOnline = this.callbacks.onUserNotOnline || (() => {});
    this.callbacks.onCallDeclined = this.callbacks.onCallDeclined || (() => {});
    this.callbacks.onCallInProgress = this.callbacks.onCallInProgress || (() => {});
    
    // Pass appropriate callbacks to managers
    if (this.connectionManager) {
      this.connectionManager.setCallbacks({
        onRemoteStream: stream => {
          // Ensure we update state to active when stream is received
          this.forceStateUpdate('active');
          this.callbacks.onRemoteStream(stream);
        },
        onICEConnectionStateChange: this.callbacks.onICEConnectionStateChange
      });
    }
    
    if (this.mediaManager) {
      this.mediaManager.setCallbacks({
        onLocalStream: this.callbacks.onLocalStream
      });
    }
  }
  
  /**
   * Check if a user is online with request ID for reliable responses
   * @param {string} userId - ID of the user to check
   * @returns {Promise<boolean>} - Whether the user is online
   */
  async checkUserOnline(userId) {
    if (!this.signalingService || !this.signalingService.isConnected()) {
      this.logger.log('Socket not connected, user is offline');
      return false;
    }
    
    try {
      return await this.signalingService.checkUserOnline(userId);
    } catch (error) {
      this.logger.log('Error checking if user is online:', error);
      return false;
    }
  }
  
  /**
   * Attempt to reconnect during call problems
   * @param {boolean} aggressive - Whether to use more aggressive reconnection tactics
   */
  async attemptReconnection(aggressive = false) {
    if (this.connectionManager) {
      return this.connectionManager.attemptReconnection(aggressive);
    }
    return false;
  }
  
  /**
   * Initiate a call to another user
   * @param {string} targetUserId - ID of the user to call
   */
  async makeCall(targetUserId) {
    try {
      // Mark media as not released since we're starting a call
      this._mediaReleased = false;
      
      // Check if the user is online first
      const isOnline = await this.checkUserOnline(targetUserId);
      
      if (!isOnline) {
        this.logger.log('Cannot make call - user is not online:', targetUserId);
        
        if (this.callbacks && this.callbacks.onUserNotOnline) {
          this.callbacks.onUserNotOnline(targetUserId);
        } else {
          this.updateCallState('ended');
        }
        
        return;
      }
      
      // If there's already an active call, end it first
      if (this.isCallActive()) {
        this.logger.log('Ending current call before starting a new one');
        this.endCall(true);
      }
      
      this.logger.log('Making call to user:', targetUserId);
      this.targetUserId = targetUserId;
      this.updateCallState('connecting');
      
      // Make sure we have camera and microphone access
      if (!this.mediaManager.hasLocalStream()) {
        await this.getLocalMedia();
      }
      
      // Initialize the call
      if (this.connectionManager) {
        await this.connectionManager.initiateCall(this.userId, targetUserId);
      }
    } catch (error) {
      this.handleError('making call', error, true);
    }
  }
  
  /**
   * Accept an incoming call
   */
  async acceptCall() {
    if (!this.targetUserId) {
      this.logger.log('No incoming call to accept');
      return;
    }
    
    try {
      // Mark media as not released since we're accepting a call
      this._mediaReleased = false;
      
      this.logger.log('Accepting incoming call from:', this.targetUserId);
      this.updateCallState('connecting');
      
      // Make sure we have camera and microphone access
      if (!this.mediaManager.hasLocalStream()) {
        await this.getLocalMedia();
      }
      
      // Accept the call
      if (this.connectionManager) {
        await this.connectionManager.acceptCall(this.targetUserId);
      }
    } catch (error) {
      this.handleError('accepting call', error, true);
    }
  }
  
  /**
   * Decline an incoming call
   */
  declineCall() {
    if (!this.targetUserId) {
      this.logger.log('No incoming call to decline');
      return;
    }
    
    this.logger.log('Declining call from:', this.targetUserId);
    if (this.signalingService) {
      this.signalingService.send('call-declined', { targetUserId: this.targetUserId });
    }
    
    // Ensure camera resources are released on decline
    this.ensureCameraReleased();
    
    // Reset state
    this.targetUserId = null;
    this.pendingOffer = null;
    this.callState = 'idle';
  }
  
  /**
   * Get access to local camera and microphone
   * @param {boolean|object} videoConstraints - Constraints for video
   * @param {boolean|object} audioConstraints - Constraints for audio
   * @returns {Promise<MediaStream>} - Local media stream
   */
  async getLocalMedia(videoConstraints = true, audioConstraints = true) {
    try {
      // Reset media released flag since we're getting new media
      this._mediaReleased = false;
      
      const stream = await this.mediaManager.getLocalMedia(videoConstraints, audioConstraints);
      
      // Add local stream to connection manager if it exists
      if (this.connectionManager) {
        this.connectionManager.setLocalStream(stream);
      }
      
      return stream;
    } catch (error) {
      this.handleError('accessing media devices', error, true);
      throw error;
    }
  }
  
  /**
   * Toggle audio mute state
   * @param {boolean} muted - Whether to mute audio
   */
  toggleAudio(muted) {
    if (this.mediaManager) {
      this.mediaManager.toggleAudio(muted);
    }
  }
  
  /**
   * Toggle video on/off
   * @param {boolean} videoOff - Whether to turn off video
   */
  toggleVideo(videoOff) {
    if (this.mediaManager) {
      this.mediaManager.toggleVideo(videoOff);
    }
  }
  
  /**
   * Unified error handling method
   */
  handleError(context, error, fatal = false) {
    this.logger.error(`Error in ${context}:`, error.message);
    console.error(`Error in ${context}:`, error);
    
    // Emit error event for UI components to handle
    this.eventEmitter.emit('error', {
      context,
      message: error.message,
      fatal
    });
    
    // If it's a fatal error, end the call
    if (fatal) {
      this.updateCallState('ended');
      this.endCall(true);
    }
  }
  
  /**
   * Disconnect from signaling server and clean up resources
   */
  disconnect() {
    this.logger.log('Disconnecting WebRTC service');
    
    // End any active call
    this.endCall(true);
    
    // Clear state check interval
    if (this.stateCheckInterval) {
      clearInterval(this.stateCheckInterval);
      this.stateCheckInterval = null;
    }
    
    // Clear connection monitor interval
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
      this.connectionMonitorInterval = null;
    }
    
    // Ensure camera is released before disconnecting
    this.ensureCameraReleased();
    
    // Disconnect from signaling server
    if (this.signalingService) {
      this.signalingService.disconnect();
    }
    
    // Clean up managers
    if (this.connectionManager) {
      this.connectionManager.cleanup();
    }
    
    if (this.mediaManager) {
      this.mediaManager.cleanup();
    }
    
    // Reset initialization status
    this.isInitialized = false;
    
    // Clear user ID
    this.userId = null;
  }
}

// Create a singleton instance
const webRTCService = new WebRTCService();
export default webRTCService;