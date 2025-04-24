/**
 * Manages media streams for WebRTC
 */
class WebRTCMediaManager {
  constructor(logger) {
    this.logger = logger;
    this.localStream = null;
    this.callbacks = {
      onLocalStream: null
    };
  }
  
  /**
   * Set callbacks
   * @param {object} callbacks - Callback functions
   */
  setCallbacks(callbacks) {
    this.callbacks = {
      ...this.callbacks,
      ...callbacks
    };
  }
  
  /**
   * Check if local stream is available
   * @returns {boolean} - Whether local stream is available
   */
  hasLocalStream() {
    return !!this.localStream;
  }
  
  /**
   * Get access to local camera and microphone
   * @param {boolean|object} videoConstraints - Constraints for video
   * @param {boolean|object} audioConstraints - Constraints for audio
   * @returns {Promise<MediaStream>} - Local media stream
   */
  async getLocalMedia(videoConstraints = true, audioConstraints = true) {
    try {
      // First try with both video and audio
      const stream = await this._tryGetUserMedia(videoConstraints, audioConstraints);
      
      // Debug log all tracks
      this.logger.log('Got local stream with tracks:', 
        stream.getTracks().map(t => `${t.kind}: ${t.enabled ? 'enabled' : 'disabled'}`).join(', '));
      
      // Store stream in window for debugging
      window.myLocalStream = stream;
      
      return stream;
    } catch (error) {
      // If both fail, try audio only
      if (videoConstraints && audioConstraints) {
        this.logger.log('Failed to get video+audio, trying audio only');
        try {
          return await this._tryGetUserMedia(false, true);
        } catch (audioError) {
          this.logger.error('Failed to get audio-only access:', audioError.message);
          throw audioError;
        }
      } else {
        throw error;
      }
    }
  }

  async _tryGetUserMedia(video, audio) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video, audio
      });
      
      this.logger.log(`Access granted to media: video=${!!video}, audio=${!!audio}`);
      this.localStream = stream;
      
      if (this.callbacks.onLocalStream) {
        this.callbacks.onLocalStream(stream);
      }
      
      return stream;
    } catch (error) {
      this.logger.error(`Media access error (video=${!!video}, audio=${!!audio}):`, error.message);
      // Re-throw with more user-friendly message
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera/microphone access was denied by the user');
      } else if (error.name === 'NotFoundError') {
        throw new Error(video ? 'Camera not found or disconnected' : 'Microphone not found');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Media device is in use by another application');
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Toggle audio mute state
   * @param {boolean} muted - Whether to mute audio
   */
  toggleAudio(muted) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        this.logger.log(muted ? 'Muting audio' : 'Unmuting audio');
        track.enabled = !muted;
      });
    }
  }
  
  /**
   * Toggle video on/off - IMPROVED VERSION
   * @param {boolean} videoOff - Whether to turn off video
   */
  toggleVideo(videoOff) {
    console.log('MediaManager:toggleVideo called with videoOff:', videoOff);
    
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      console.log('Video tracks found:', videoTracks.length);
      
      if (videoTracks.length > 0) {
        videoTracks.forEach(track => {
          console.log('Video track before toggle, enabled:', track.enabled);
          
          // MODIFIED: Just disable the track but don't stop it
          // This keeps the video stream running but makes it "invisible" to the recipient
          track.enabled = !videoOff;
          
          console.log('Video track after toggle, readyState:', track.readyState, 'enabled:', track.enabled);
        });
      } else if (!videoOff) {
        this.logger.log('No video tracks found in local stream, but video requested');
        
        // If video should be on but no tracks exist, try to get video
        this._getNewVideoTrack();
      }
    } else if (!videoOff) {
      this.logger.log('No local stream available for video toggle, but video requested');
      
      // Try to initialize stream if it doesn't exist and video should be on
      this.getLocalMedia(true, true)
        .catch(err => this.logger.error('Failed to initialize media:', err));
    }
  }
  
  /**
   * Helper method to get a new video track when needed
   * @private
   */
  _getNewVideoTrack() {
    this.logger.log('Attempting to add new video track');
    
    // Use saved constraints if available, otherwise use default
    const constraints = this._savedVideoConstraints || { video: true };
    
    navigator.mediaDevices.getUserMedia({ video: constraints })
      .then(videoStream => {
        const videoTrack = videoStream.getVideoTracks()[0];
        if (videoTrack) {
          // Remove any existing video tracks first
          const existingTracks = this.localStream.getVideoTracks();
          existingTracks.forEach(track => {
            this.localStream.removeTrack(track);
            track.stop();
          });
          
          // Add the new track
          this.localStream.addTrack(videoTrack);
          this.logger.log('Added new video track to local stream');
          
          // If we have callbacks set up, notify about the updated stream
          if (this.callbacks.onLocalStream) {
            this.callbacks.onLocalStream(this.localStream);
          }
        }
      })
      .catch(err => {
        this.logger.error('Failed to get new video track:', err);
        // Notify user about camera access failure
        if (this.callbacks.onError) {
          this.callbacks.onError({ 
            message: 'Could not access camera. Please check permissions.', 
            fatal: false 
          });
        }
      });
  }
  
  /**
   * Stop all tracks in the local stream
   */
  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.logger.log('Stopping track:', track.kind);
        track.stop();
      });
      this.localStream = null;
    }
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    this.stopLocalStream();
  }
}

export default WebRTCMediaManager;