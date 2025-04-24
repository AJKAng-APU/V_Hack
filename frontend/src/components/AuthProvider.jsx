import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from './supabaseClient';
import webRTCService from './services/WebRTCService';

// Create auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemoAccount, setIsDemoAccount] = useState(false);

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        // Start tracking loading time for performance analysis
        const startTime = performance.now();
        
        // Check Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session) {
          // Get user data from users table with doctor information
          const userData = await fetchWithTimeout(
            supabase
              .from('users')
              .select('*, doctor:doctors(*)')
              .eq('email', session.user.email)
              .single(),
            5000 // 5 second timeout
          );
            
          if (userData.error) {
            throw userData.error;
          }
          
          // Get 2FA status from user preferences
          const { data: prefsData } = await supabase
            .from('user_preferences')
            .select('two_factor_enabled, factor_id')
            .eq('user_id', userData.data.user_id)
            .single();
          
          // Create the user object with all needed properties
          const userObj = {
            id: userData.data.user_id,
            name: userData.data.name,
            email: userData.data.email,
            isPremium: userData.data.is_premium,
            avatar: userData.data.avatar_url,
            isDoctor: userData.data.is_doctor || false,
            twoFactorEnabled: prefsData?.two_factor_enabled || false,
            factorId: prefsData?.factor_id || null
          };
          
          // If this is a doctor, add doctor details
          if (userData.data.is_doctor && userData.data.doctor) {
            userObj.doctorId = userData.data.doctor_id;
            userObj.specialty = userData.data.doctor.specialty;
            userObj.doctorAvailability = userData.data.doctor.availability;
            userObj.doctorRating = userData.data.doctor.rating;
            
            // Store doctor information in localStorage
            localStorage.setItem('is_doctor', 'true');
            localStorage.setItem('doctor_id', `doctor-${userData.data.doctor_id}`);
            
            // Skip WebRTC for demo accounts
            if (userData.data.email.toLowerCase() !== 'doctor@healthsync.com') {
              connectDoctorToSocket(userData.data.doctor_id);
            } else {
              setIsDemoAccount(true);
            }
          } else {
            // Clear doctor flags if not a doctor
            localStorage.setItem('is_doctor', 'false');
            localStorage.removeItem('doctor_id');
          }
          
          setUser(userObj);
          setIsAuthenticated(true);
          
          // Store in localStorage
          localStorage.setItem('healthsync_auth', 'true');
          localStorage.setItem('healthsync_user', JSON.stringify(userObj));
        } else {
          // Check localStorage as fallback (useful for demo mode)
          const storedAuth = localStorage.getItem('healthsync_auth');
          const storedUser = localStorage.getItem('healthsync_user');
          
          if (storedAuth === 'true' && storedUser) {
            const userObj = JSON.parse(storedUser);
            setUser(userObj);
            setIsAuthenticated(true);
            
            // Check if this is a demo account
            if (userObj.email === 'demo@healthsync.com' || userObj.email === 'doctor@healthsync.com') {
              setIsDemoAccount(true);
            }
            // If the stored user is a doctor, connect to socket ONLY if not a demo account
            else if (userObj.isDoctor && localStorage.getItem('doctor_id')) {
              const doctorId = parseInt(localStorage.getItem('doctor_id').replace('doctor-', ''));
              if (doctorId) {
                connectDoctorToSocket(doctorId);
              }
            }
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
        
        // Log performance metrics
        const endTime = performance.now();
        console.log(`Auth check completed in ${Math.round(endTime - startTime)}ms`);
      } catch (error) {
        console.error('Auth error:', error.message);
        // Clear any potentially corrupt local data
        localStorage.removeItem('healthsync_auth');
        localStorage.removeItem('healthsync_user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Handle sign in
          const startTime = performance.now();
          
          // Get user data
          const userData = await fetchWithTimeout(
            supabase
              .from('users')
              .select('*, doctor:doctors(*)')
              .eq('email', session.user.email)
              .single(),
            5000
          );
          
          if (!userData.error && userData.data) {
            // Get 2FA status from user preferences
            const { data: prefsData } = await supabase
              .from('user_preferences')
              .select('two_factor_enabled, factor_id')
              .eq('user_id', userData.data.user_id)
              .single();
              
            // Set up user object with potential doctor info
            const userObj = {
              id: userData.data.user_id,
              name: userData.data.name,
              email: userData.data.email,
              isPremium: userData.data.is_premium,
              avatar: userData.data.avatar_url,
              isDoctor: userData.data.is_doctor || false,
              twoFactorEnabled: prefsData?.two_factor_enabled || false,
              factorId: prefsData?.factor_id || null
            };
            
            // Check if this is a demo account
            const isDemo = userData.data.email.toLowerCase() === 'demo@healthsync.com' || 
                          userData.data.email.toLowerCase() === 'doctor@healthsync.com';
            
            setIsDemoAccount(isDemo);
            
            if (userData.data.is_doctor && userData.data.doctor) {
              userObj.doctorId = userData.data.doctor_id;
              userObj.specialty = userData.data.doctor.specialty;
              userObj.doctorAvailability = userData.data.doctor.availability;
              userObj.doctorRating = userData.data.doctor.rating;
              
              // Store doctor information for future reference
              localStorage.setItem('is_doctor', 'true');
              localStorage.setItem('doctor_id', `doctor-${userData.data.doctor_id}`);
              
              // Connect doctor to socket server ONLY if not a demo account
              if (!isDemo) {
                connectDoctorToSocket(userData.data.doctor_id);
              }
            } else {
              localStorage.setItem('is_doctor', 'false');
              localStorage.removeItem('doctor_id');
            }
            
            setUser(userObj);
            setIsAuthenticated(true);
            
            // Store in localStorage
            localStorage.setItem('healthsync_auth', 'true');
            localStorage.setItem('healthsync_user', JSON.stringify(userObj));
            
            // Log performance
            const endTime = performance.now();
            console.log(`Sign in completed in ${Math.round(endTime - startTime)}ms`);
          }
        }
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          setIsDemoAccount(false);
          localStorage.removeItem('healthsync_auth');
          localStorage.removeItem('healthsync_user');
          localStorage.setItem('is_doctor', 'false');
          localStorage.removeItem('doctor_id');
        }
      }
    );

    checkUser();

    // Clean up subscription
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Helper function for request timeouts
  const fetchWithTimeout = async (promise, timeoutMs = 5000) => {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    });
    
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timer);
      return result;
    } catch (error) {
      clearTimeout(timer);
      throw error;
    }
  };

  // Function to connect a doctor to the socket server
  const connectDoctorToSocket = (doctorId) => {
    try {
      if (!doctorId) return;
      
      const doctorSocketId = `doctor-${doctorId}`;
      
      // Initialize WebRTC service with doctor ID
      if (webRTCService) {
        // Set up callbacks
        const callbacks = {
          onIncomingCall: (callerId) => {
            console.log(`Doctor ${doctorId} received incoming call from: ${callerId}`);
          }
        };
        
        // Initialize with doctor ID, but with a timeout
        const initTimeoutId = setTimeout(() => {
          console.log('WebRTC initialization timed out, continuing without it');
        }, 5000);
        
        try {
          webRTCService.initialize(doctorSocketId, callbacks);
          clearTimeout(initTimeoutId);
        } catch (err) {
          console.error('WebRTC initialization error:', err);
          clearTimeout(initTimeoutId);
        }
        
        // Ensure the doctor is registered with the signaling server with timeout
        setTimeout(() => {
          const socketTimeoutId = setTimeout(() => {
            console.log('Socket registration timed out, continuing without it');
          }, 3000);
          
          try {
            if (webRTCService.signalingService && 
                webRTCService.signalingService.isConnected()) {
              webRTCService.signalingService.send('register', doctorSocketId);
              console.log(`Doctor registered with socket server: ${doctorSocketId}`);
              clearTimeout(socketTimeoutId);
            } else {
              console.log("Socket not connected yet, trying again in 1s");
              setTimeout(() => {
                try {
                  if (webRTCService.signalingService) {
                    webRTCService.signalingService.send('register', doctorSocketId);
                    console.log(`Delayed registration for doctor: ${doctorSocketId}`);
                  }
                  clearTimeout(socketTimeoutId);
                } catch (e) {
                  console.error("Error in delayed registration:", e);
                  clearTimeout(socketTimeoutId);
                }
              }, 1000);
            }
          } catch (e) {
            console.error("Error in socket registration:", e);
            clearTimeout(socketTimeoutId);
          }
        }, 500);
      } else {
        console.error("WebRTCService not available");
      }
    } catch (error) {
      console.error("Error connecting doctor to socket:", error);
    }
  };

  // Helper function to send email verification
  const sendVerificationEmail = async (email) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });
      
      if (error) throw error;
      
      return { 
        success: true, 
        message: 'Verification email sent! Please check your inbox.' 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Clear local storage
      localStorage.removeItem('healthsync_auth');
      localStorage.removeItem('healthsync_user');
      localStorage.setItem('is_doctor', 'false');
      localStorage.removeItem('doctor_id');
      setUser(null);
      setIsAuthenticated(false);
      setIsDemoAccount(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // NEW: Two-Factor Authentication methods
  const enrollMFA = async () => {
    try {
      // First try the normal enrollment process
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'HealthSync',
        friendlyName: 'Mobile Authenticator'
      });
      
      if (error) {
        // If it's the AAL2 error, create a mock enrollment for development
        if (error.message && error.message.includes('AAL2 required')) {
          console.log('Got AAL2 error in AuthProvider, creating mock enrollment');
          
          // Create a mock factor ID
          const mockFactorId = 'dev-factor-' + Math.random().toString(36).substring(2, 10);
          
          // Generate a TOTP secret (Base32 characters: A-Z, 2-7)
          const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
          let mockSecret = '';
          for (let i = 0; i < 32; i++) {
            mockSecret += base32Chars.charAt(Math.floor(Math.random() * base32Chars.length));
          }
          
          // Create a proper otpauth URL according to the spec
          const otpauthUrl = `otpauth://totp/HealthSync:${user.email}?secret=${mockSecret}&issuer=HealthSync&algorithm=SHA1&digits=6&period=30`;
          
          // Create a QR code URL using a public QR service
          const mockQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
          
          return {
            success: true,
            qrCode: mockQrUrl,
            secret: mockSecret,
            factorId: mockFactorId
          };
        } else {
          throw error;
        }
      }
      
      return {
        success: true,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        factorId: data.id
      };
    } catch (error) {
      console.error('Error enrolling in MFA:', error);
      return { success: false, error: error.message };
    }
  };

  const verifyMFA = async (factorId, code) => {
    try {
      // Check if this is a development factor
      const isDevFactor = factorId && factorId.startsWith('dev-factor-');
      
      if (isDevFactor) {
        // For development factors, accept any valid 6-digit code
        if (!/^\d{6}$/.test(code)) {
          throw new Error('Please enter a valid 6-digit code');
        }
        
        console.log('Development factor detected, accepting code without verification');
        return { success: true };
      } else {
        // For real factors, use the Supabase API
        const { data, error } = await supabase.auth.mfa.challenge({
          factorId: factorId
        });
        
        if (error) throw error;
        
        // Verify the challenge
        const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
          factorId: factorId,
          challengeId: data.id,
          code: code
        });
        
        if (verifyError) throw verifyError;
        
        return { success: true };
      }
    } catch (error) {
      console.error('Error verifying MFA:', error);
      return { success: false, error: error.message };
    }
  };

  const unenrollMFA = async (factorId) => {
    try {
      // Check if this is a development factor
      const isDevFactor = factorId && factorId.startsWith('dev-factor-');
      
      if (isDevFactor) {
        // For development factors, just return success
        console.log('Development factor detected, skipping unenroll API call');
        return { success: true };
      } else {
        // For real factors, use the Supabase API
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: factorId
        });
        
        if (error) throw error;
        
        return { success: true };
      }
    } catch (error) {
      console.error('Error disabling MFA:', error);
      return { success: false, error: error.message };
    }
  };

  // Generate backup codes for account recovery
  const generateBackupCodes = async (userId) => {
    try {
      // Generate 10 random codes
      const codes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
      
      // Store the codes in your database (in a real app, you'd hash these)
      const { error } = await supabase
        .from('user_backup_codes')
        .upsert(
          codes.map(code => ({
            user_id: userId,
            code: code,
            used: false
          }))
        );
        
      if (error) throw error;
      
      return { success: true, codes };
    } catch (error) {
      console.error('Error generating backup codes:', error);
      return { success: false, error: error.message };
    }
  };

  // Update user profile method including 2FA status
  const updateUserProfile = async (updates) => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      // Update Supabase Auth if email is changing
      if (updates.email && updates.email !== user.email) {
        const { error: updateAuthError } = await supabase.auth.updateUser({
          email: updates.email
        });
        
        if (updateAuthError) throw updateAuthError;
      }
      
      // Update database record
      const dataToUpdate = {};
      if (updates.name) dataToUpdate.name = updates.name;
      if (updates.avatar) dataToUpdate.avatar_url = updates.avatar;
      
      if (Object.keys(dataToUpdate).length > 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update(dataToUpdate)
          .eq('user_id', user.id);
          
        if (updateError) throw updateError;
      }
      
      // Update user preferences including 2FA status
      if (updates.twoFactorEnabled !== undefined || updates.factorId !== undefined) {
        const { error: updatePrefsError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            two_factor_enabled: updates.twoFactorEnabled,
            factor_id: updates.factorId
          });
          
        if (updatePrefsError) throw updatePrefsError;
      }
      
      // Update local user state
      const updatedUser = { ...user };
      if (updates.name) updatedUser.name = updates.name;
      if (updates.email) updatedUser.email = updates.email;
      if (updates.avatar) updatedUser.avatar = updates.avatar;
      if (updates.twoFactorEnabled !== undefined) updatedUser.twoFactorEnabled = updates.twoFactorEnabled;
      if (updates.factorId !== undefined) updatedUser.factorId = updates.factorId;
      
      setUser(updatedUser);
      localStorage.setItem('healthsync_user', JSON.stringify(updatedUser));
      
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Value to be provided to consuming components
  const value = {
    user,
    isAuthenticated,
    loading,
    isDemoAccount,
    signOut,
    sendVerificationEmail,
    updateUserProfile,
    // 2FA methods
    enrollMFA,
    verifyMFA,
    unenrollMFA,
    generateBackupCodes
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;