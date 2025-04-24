// File: services/WebRTC/WebRTCConnectionManager.js
/**
 * Manages WebRTC peer connection
 */
class WebRTCConnectionManager {
  constructor(signalingService, mediaManager, eventEmitter, logger, updateCallState) {
    this.signalingService = signalingService;
    this.mediaManager = mediaManager;
    this.eventEmitter = eventEmitter;
    this.logger = logger;
    this.updateCallState = updateCallState;
    
    // Connection
    this.peerConnection = null;
    this.remoteStream = null;
    this.isCallInitiator = false;
    this.targetUserId = null; // Add explicit tracking of target user
    
    // Call reconnection state
    this.pendingOffer = null;
    this.pendingCandidates = []; // Add storage for pending candidates
    this.reconnectionAttempts = 0;
    this.maxReconnectionAttempts = 3;
    this.iceConnectionState = null;
      
      // Timers
      this.disconnectionTimer = null;
      this.disconnectionFailureTimer = null;
      this.failureTimeout = null;
      
      // Callbacks
      this.callbacks = {
        onRemoteStream: null,
        onICEConnectionStateChange: null
      };
    }
    
    /**
     * Set callbacks for the connection manager
     * @param {object} callbacks - Callback functions
     */
    setCallbacks(callbacks) {
      this.callbacks = {
        ...this.callbacks,
        ...callbacks
      };
    }
    
    /**
     * Set pending offer for incoming call
     * @param {RTCSessionDescriptionInit} offer - SDP offer
     */
    setPendingOffer(offer) {
      this.pendingOffer = offer;
    }
    
    /**
     * Set local stream to use for the call
     * @param {MediaStream} stream - Local media stream
     */
    setLocalStream(stream) {
      this.localStream = stream;
      
      // Add tracks to peer connection if it exists
      if (this.peerConnection && stream) {
        stream.getTracks().forEach(track => {
          this.logger.log('Adding local track to peer connection:', track.kind);
          this.peerConnection.addTrack(track, stream);
        });
      }
    }
    
    /**
     * Initialize a call to another user
     * @param {string} userId - Current user ID
     * @param {string} targetUserId - Target user ID
     */
    async initiateCall(userId, targetUserId) {
      this.isCallInitiator = true;
      this.targetUserId = targetUserId;
      
      // Create peer connection
      this.createPeerConnection();
      
      // Create an offer (SDP)
      this.logger.log('Creating offer...');
      const offer = await this.peerConnection.createOffer();
      
      // Set the offer as our local description
      await this.peerConnection.setLocalDescription(offer);
      
      // Send the offer to the other user via signaling server
      this.signalingService.send('call-user', {
        targetUserId,
        offerSDP: offer,
        callerUserId: userId
      });
      
      this.logger.log('Call offer sent');
    }
    
    /**
     * Accept an incoming call
     * @param {string} targetUserId - ID of the caller
     */
    async acceptCall(targetUserId) {
      this.targetUserId = targetUserId; // Set target ID here too
      // Create peer connection
      this.createPeerConnection();
      
      // Set the remote description from the stored offer
      this.logger.log('Setting remote description from offer');
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(this.pendingOffer)
      );
      
      // Create an answer
      this.logger.log('Creating answer...');
      const answer = await this.peerConnection.createAnswer();
      
      // Set the answer as our local description
      await this.peerConnection.setLocalDescription(answer);
      
      // Send the answer to the caller
      this.signalingService.send('call-accepted', {
        targetUserId,
        answerSDP: answer
      });
      
      this.logger.log('Call accepted, answer sent');
      this.sendPendingCandidates();
    }
    
    /**
     * Set remote description for the peer connection
     * @param {RTCSessionDescriptionInit} description - Remote description
     */
    async setRemoteDescription(description) {
      try {
        if (this.peerConnection) {
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(description)
          );
          
          // Apply any queued ICE candidates after remote description is set
          this.logger.log('Remote description set, applying queued ICE candidates');
          if (this.pendingCandidates && this.pendingCandidates.length > 0) {
            this.logger.log(`Processing ${this.pendingCandidates.length} queued ICE candidates`);
            
            const candidates = [...this.pendingCandidates];
            this.pendingCandidates = [];
            
            for (const candidate of candidates) {
              try {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                this.logger.log('Added queued ICE candidate');
              } catch (err) {
                this.logger.error('Error adding queued ICE candidate', err.message);
              }
            }
          }
        }
      } catch (error) {
        this.logger.error('Error setting remote description', error.message);
        throw error;
      }
    }
    
    /**
     * Add a remote ICE candidate
     * @param {RTCIceCandidateInit} candidate - ICE candidate
     */
    async addRemoteIceCandidate(candidate) {
      try {
        // If peer connection doesn't exist yet or remote description is not set, 
        // store candidates for later
        if (!this.peerConnection || 
            !this.peerConnection.remoteDescription || 
            !this.peerConnection.remoteDescription.type) {
          
          this.logger.log('Remote description not set yet, queueing ICE candidate');
          if (!this.pendingCandidates) this.pendingCandidates = [];
          this.pendingCandidates.push(candidate);
          return;
        }
        
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        this.logger.log('Added ICE candidate');
      } catch (error) {
        this.logger.error('Error adding ICE candidate', error.message);
      }
    }
    
    /**
     * Create WebRTC peer connection
     */
    createPeerConnection() {
      // Enhanced ICE servers configuration with multiple STUN servers and free TURN servers
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          // Free TURN server (replace with your own in production)
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          // If environment variables exist, add them too
          ...(process.env.REACT_APP_TURN_SERVER ? [{
            urls: process.env.REACT_APP_TURN_SERVER,
            username: process.env.REACT_APP_TURN_USERNAME || '',
            credential: process.env.REACT_APP_TURN_CREDENTIAL || ''
          }] : [])
        ],
        iceCandidatePoolSize: 10,
        // The following helps with connection stability
        sdpSemantics: 'unified-plan'
      };
      
      this.logger.log('Initializing peer connection with configuration:', configuration);
      
      // Create the RTCPeerConnection
      this.peerConnection = new RTCPeerConnection(configuration);
      
      // Add local media tracks to the connection if we have them
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.logger.log('Adding local track to peer connection:', track.kind);
          this.peerConnection.addTrack(track, this.localStream);
        });
      }
      
      // Set up event handlers
      this.setupPeerConnectionEventHandlers();
    }
    
    /**
     * Set up all event handlers for the peer connection
     */
    setupPeerConnectionEventHandlers() {
      // Handle receiving remote media
      this.peerConnection.ontrack = this.handleTrackEvent.bind(this);
      
      // Handle ICE candidates
      this.peerConnection.onicecandidate = this.handleIceCandidateEvent.bind(this);
      
      // ICE gathering state
      this.peerConnection.onicegatheringstatechange = () => {
        this.logger.log('ICE gathering state changed:', this.peerConnection.iceGatheringState);
      };
      
      // Signaling state
      this.peerConnection.onsignalingstatechange = () => {
        this.logger.log('Signaling state changed:', this.peerConnection.signalingState);
      };
      
      // Connection state
      this.peerConnection.onconnectionstatechange = () => {
        this.logger.log('Connection state changed:', this.peerConnection.connectionState);
      };
      
      // ICE connection state
      this.peerConnection.oniceconnectionstatechange = this.handleIceConnectionStateChange.bind(this);
    }
    
    /**
     * Handle track event (receiving remote tracks)
     * @param {RTCTrackEvent} event - Track event
     */
    // Add to WebRTCConnectionManager.js
    handleTrackEvent(event) {
      this.logger.log('Received remote track:', event.track.kind);
      
      // Always log received track details
      this.logger.log(`Track details - ID: ${event.track.id}, Kind: ${event.track.kind}, Enabled: ${event.track.enabled}, ReadyState: ${event.track.readyState}`);
      
      // Create remote stream if it doesn't exist
      if (!this.remoteStream) {
        this.logger.log('Creating new MediaStream for remote tracks');
        this.remoteStream = new MediaStream();
        
        // IMPORTANT: Always update call state to active when we get tracks
        this.logger.log('Setting call state to active due to received tracks');
        this.updateCallState('active');
        
        if (this.callbacks.onRemoteStream) {
          this.callbacks.onRemoteStream(this.remoteStream);
        }
      }
      
      // IMPROVED: Check if track already exists in the stream before adding
      const existingTrack = this.remoteStream.getTracks().find(t => t.id === event.track.id);
      if (!existingTrack) {
        // Add the track to our remote stream
        this.remoteStream.addTrack(event.track);
        this.logger.log(`Added new track to remote stream: ${event.track.kind}`);
      } else {
        this.logger.log(`Track already exists in remote stream: ${event.track.kind}`);
      }
      
      // Force update the call state again
      this.logger.log('Force updating call state to active after handling tracks');
      this.updateCallState('active');
      
      // IMPROVED: Add delay before notification to ensure state is updated
      setTimeout(() => {
        // Make sure we still have a valid remote stream with tracks
        if (this.remoteStream && this.remoteStream.getTracks().length > 0) {
          // Notify the other peer that we've received their media
          if (this.targetUserId && this.signalingService) {
            this.signalingService.send('media-connected', {
              targetUserId: this.targetUserId
            });
          }
          
          // Also notify again after a longer delay as a fallback
          setTimeout(() => {
            if (this.targetUserId && this.signalingService) {
              this.logger.log('Sending delayed media-connected notification');
              this.signalingService.send('media-connected', {
                targetUserId: this.targetUserId
              });
            }
          }, 2000);
        }
      }, 500);
      
      // Verify video is working by checking tracks
      const videoTracks = this.remoteStream.getVideoTracks();
      if (videoTracks.length > 0) {
        this.logger.log(`Remote stream has ${videoTracks.length} video tracks`);
        videoTracks.forEach(track => {
          this.logger.log(`Video track: Enabled=${track.enabled}, ReadyState=${track.readyState}`);
          
          // Ensure video track is enabled
          if (!track.enabled) {
            this.logger.log('Enabling disabled video track');
            track.enabled = true;
          }
        });
      } else {
        this.logger.log('WARNING: Remote stream has no video tracks, only audio may be working');
      }    
    }
    
    /**
     * Handle ICE candidate event
     * @param {RTCPeerConnectionIceEvent} event - ICE event
     */
    handleIceCandidateEvent(event) {
      if (event.candidate && this.targetUserId) { // Check if targetUserId exists
        const candidateStr = event.candidate.candidate || '';
        const candidateType = candidateStr.split(' ')[7] || 'unknown';
        this.logger.log('Generated ICE candidate of type:', candidateType);
        
        this.signalingService.send('ice-candidate', {
          targetUserId: this.targetUserId,
          candidate: event.candidate
        });
      } else if (event.candidate) {
        // Store candidates temporarily if connection not ready
        if (!this.pendingCandidates) this.pendingCandidates = [];
        this.pendingCandidates.push(event.candidate);
        this.logger.log('Storing ICE candidate for later');
      }
    }

    sendPendingCandidates() {
      if (this.pendingCandidates && this.pendingCandidates.length > 0 && this.targetUserId) {
        this.logger.log(`Sending ${this.pendingCandidates.length} pending ICE candidates`);
        this.pendingCandidates.forEach(candidate => {
          this.signalingService.send('ice-candidate', {
            targetUserId: this.targetUserId,
            candidate: candidate
          });
        });
        this.pendingCandidates = [];
      }
    }
    
    /**
     * Handle ICE connection state change
     */
    handleIceConnectionStateChange() {
      const state = this.peerConnection.iceConnectionState;
      this.logger.log('ICE connection state changed to:', state);
      const previousState = this.iceConnectionState;
      this.iceConnectionState = state;
      
      this.logger.log('ICE connection state changed to:', state, 'from:', previousState);
      
      // Notify callbacks
      if (this.callbacks.onICEConnectionStateChange) {
        this.callbacks.onICEConnectionStateChange(state);
      }
      
      // Handle connection establishment
      if (state === 'connected' || state === 'completed') {
        this.handleConnectionEstablished();
      } 
      // Handle connection failure with more aggressive behavior
      else if (state === 'failed') {
        this.handleConnectionFailure();
        
        // Force end after a timeout if still in failed state
        setTimeout(() => {
          if (this.peerConnection && 
              this.peerConnection.iceConnectionState === 'failed') {
            this.logger.log('Connection remains failed, forcing call end');
            this.forceEndCall();
          }
        }, 5000);
      }
      // Handle disconnection with more aggressive behavior
      else if (state === 'disconnected') {
        this.handleConnectionDisconnected();
        
        // Force end after a timeout if still disconnected
        setTimeout(() => {
          if (this.peerConnection && 
              this.peerConnection.iceConnectionState === 'disconnected') {
            this.logger.log('Connection remains disconnected, forcing call end');
            this.forceEndCall();
          }
        }, 8000);
      }
      // Clear timers if state improves
      else if ((state === 'checking' || state === 'connected') && 
              (this.failureTimeout || this.disconnectionTimer || this.disconnectionFailureTimer)) {
        this.clearConnectionTimers();
      }
    }
    
    /**
     * Handle successful connection establishment
     */
    handleConnectionEstablished() {
      this.logger.log('Call connected successfully!');
      this.updateCallState('active');
      
      // Reset reconnection attempts
      this.reconnectionAttempts = 0;
      
      // Clear any pending timers
      this.clearConnectionTimers();
      
      // Notify the other peer that media is flowing on our side
      if (this.signalingService && this.targetUserId) {
        this.signalingService.send('media-connected', {
          targetUserId: this.targetUserId
        });
      }
    }
    
    /**
     * Handle connection failure
     */
    handleConnectionFailure() {
      this.logger.log('Connection failed');
      
      if (!this.failureTimeout) {
        this.failureTimeout = setTimeout(() => {
          if (this.peerConnection && this.peerConnection.iceConnectionState === 'failed') {
            // Attempt to restart ICE if possible before ending the call
            if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
              this.reconnectionAttempts++;
              this.logger.log(`Trying to reconnect (attempt ${this.reconnectionAttempts}/${this.maxReconnectionAttempts})...`);
              
              // Try to reconnect using our enhanced method
              this.attemptReconnection(true);
            } else {
              this.logger.log('Max reconnection attempts reached, ending call');
              this.updateCallState('ended');
              // This would trigger call end in the main service
            }
          }
          this.failureTimeout = null;
        }, 1000);
      }
    }
    
    /**
     * Handle temporary disconnection
     */
    handleConnectionDisconnected() {
      this.logger.log('Connection temporarily disconnected');
      
      // Clear any existing timers first
      if (this.disconnectionTimer) {
        clearTimeout(this.disconnectionTimer);
      }
      
      if (this.disconnectionFailureTimer) {
        clearTimeout(this.disconnectionFailureTimer);
      }
      
      // Start with a short timer for normal recovery
      this.disconnectionTimer = setTimeout(() => {
        // If still disconnected after short period, try recovery
        if (this.peerConnection && this.peerConnection.iceConnectionState === 'disconnected') {
          this.logger.log('Connection still disconnected, attempting recovery...');
          this.attemptReconnection(false);
        }
        this.disconnectionTimer = null;
      }, 2000); // Try recovery after 2 seconds
      
      // Also set a longer timeout for full failure
      this.disconnectionFailureTimer = setTimeout(() => {
        if (this.peerConnection && 
            (this.peerConnection.iceConnectionState === 'disconnected' || 
             this.peerConnection.iceConnectionState === 'failed')) {
          this.logger.log('Connection remained disconnected for too long');
          this.updateCallState('ended');
          // This would trigger call end in the main service
        }
        this.disconnectionFailureTimer = null;
      }, 15000); // End call after 15 seconds of disconnection
    }
    
    /**
     * Clear all connection timers
     */
    clearConnectionTimers() {
      if (this.failureTimeout) {
        clearTimeout(this.failureTimeout);
        this.failureTimeout = null;
      }
      
      if (this.disconnectionTimer) {
        clearTimeout(this.disconnectionTimer);
        this.disconnectionTimer = null;
      }
      
      if (this.disconnectionFailureTimer) {
        clearTimeout(this.disconnectionFailureTimer);
        this.disconnectionFailureTimer = null;
      }
    }
    
    /**
     * Attempt to reconnect during call problems
     * @param {boolean} aggressive - Whether to use more aggressive reconnection tactics
     */
    async attemptReconnection(aggressive = false) {
      this.logger.log(`Attempting ${aggressive ? 'aggressive' : 'standard'} reconnection`);
      
      try {
        if (!this.peerConnection) {
          this.logger.log('No peer connection to reconnect');
          return;
        }
        
        // First try to restart ICE
        this.peerConnection.restartIce();
        
        // For more aggressive reconnection, try recreating the offer
        if (aggressive || this.isCallInitiator) {
          this.logger.log('Creating new offer with ICE restart');
          const offer = await this.peerConnection.createOffer({ 
            iceRestart: true,
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
          });
          
          await this.peerConnection.setLocalDescription(offer);
          
          // Send the new offer to the other user
          this.signalingService.send('call-user', {
            targetUserId: this.targetUserId,
            offerSDP: offer,
            callerUserId: this.userId
          });
          
          this.logger.log('Sent new offer for reconnection');
        }
      } catch (error) {
        this.logger.error('Error during reconnection attempt', error.message);
      }
    }
    
    /**
     * Close the peer connection
     */
    closeConnection() {
      // Clear all timers first
      this.clearConnectionTimers();
      
      // Check if we have a peer connection to close
      if (this.peerConnection) {
        try {
          // Close any remaining data channels
          if (this.peerConnection.dataChannel) {
            this.peerConnection.dataChannel.close();
          }
          
          // Stop all transceivers if supported
          if (this.peerConnection.getTransceivers) {
            const transceivers = this.peerConnection.getTransceivers();
            transceivers.forEach(transceiver => {
              if (transceiver.stop) {
                try {
                  transceiver.stop();
                } catch (e) {
                  this.logger.log('Error stopping transceiver:', e);
                }
              }
            });
          }
          
          // Stop all tracks from remote stream
          if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => {
              this.logger.log(`Stopping remote track: ${track.kind}`);
              track.stop();
            });
          }
          
          // Cleanup listeners first to prevent any callbacks
          this.peerConnection.onicecandidate = null;
          this.peerConnection.ontrack = null;
          this.peerConnection.oniceconnectionstatechange = null;
          this.peerConnection.onicegatheringstatechange = null;
          this.peerConnection.onsignalingstatechange = null;
          this.peerConnection.onconnectionstatechange = null;
          
          // Close the connection
          this.peerConnection.close();
          this.logger.log('Peer connection closed successfully');
        } catch (error) {
          this.logger.error('Error during connection close:', error.message);
        }
        
        this.peerConnection = null;
      }
      
      // Clear the remote stream
      if (this.remoteStream) {
        try {
          const tracks = this.remoteStream.getTracks();
          tracks.forEach(track => {
            track.stop();
            this.remoteStream.removeTrack(track);
          });
        } catch (e) {
          this.logger.error('Error cleaning up remote stream:', e.message);
        }
        
        this.remoteStream = null;
      }
      
      // Notify that the connection is fully closed
      if (this.updateCallState) {
        this.updateCallState('ended');
      }
    }
    
    forceEndCall() {
      this.logger.log('Forcing call end due to potential lingering connection');
      
      // Close peer connection
      this.closeConnection();
      
      // Ensure call state is updated
      if (this.updateCallState) {
        this.updateCallState('ended');
      }
    }

    /**
     * Reset the connection manager state
     */
    reset() {
      this.remoteStream = null;
      this.reconnectionAttempts = 0;
      this.iceConnectionState = null;
      this.pendingOffer = null;
      this.isCallInitiator = false;
      
      this.clearConnectionTimers();
    }
    
    /**
     * Clean up all resources
     */
    cleanup() {
      this.closeConnection();
      this.reset();
    }
  }
  
  export default WebRTCConnectionManager;
  
  