import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import supabase from '../supabaseClient';
import { useAuth } from '../AuthProvider';
import webRTCService from '../services/WebRTCService';
import { Loader, Eye, EyeOff } from 'lucide-react';

// Sign In Screen with email verification and 2FA handling
const SignInScreen = ({ colors, setActiveScreen, setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const { isDarkMode } = useTheme();
  const { sendVerificationEmail } = useAuth();
  
  // States for email verification flow
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  
  // States for 2FA handling
  const [tfaRequired, setTfaRequired] = useState(false);
  const [tfaCode, setTfaCode] = useState('');
  const [factorId, setFactorId] = useState(null);
  const [challengeId, setChallengeId] = useState(null);
  const [tfaCodeFocused, setTfaCodeFocused] = useState(false);
  
  // Floating elements effect with mouse position
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth) - 0.5;
      const y = (clientY / window.innerHeight) - 0.5;
      setMousePosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setNeedsVerification(false);
    
    try {
      // Check if it's a demo login
      if (email.toLowerCase() === 'demo@healthsync.com' && password === 'demo') {
        // Set demo session
        localStorage.setItem('healthsync_auth', 'true');
        localStorage.setItem('healthsync_user', JSON.stringify({ 
          id: 999,
          name: 'Demo User',
          email: 'demo@healthsync.com',
          isPremium: true,
          emailVerified: true
        }));
        
        setIsAuthenticated(true);
        setActiveScreen('dashboard');
        return;
      }
      
      // Check if it's a doctor demo login
      if (email.toLowerCase() === 'doctor@healthsync.com' && password === 'doctor') {
        // Set doctor demo session
        const doctorId = 1;
        localStorage.setItem('healthsync_auth', 'true');
        localStorage.setItem('is_doctor', 'true');
        localStorage.setItem('doctor_id', `doctor-${doctorId}`);
        localStorage.setItem('healthsync_user', JSON.stringify({ 
          id: 1001,
          name: 'Dr. Johnson',
          email: 'doctor@healthsync.com',
          isPremium: true,
          emailVerified: true,
          isDoctor: true,
          doctorId: doctorId,
          specialty: 'Cardiologist',
          doctorAvailability: true,
          doctorRating: 5
        }));
        
        // Initialize WebRTC with doctor ID
        const doctorSocketId = `doctor-${doctorId}`;
        setTimeout(() => {
          if (webRTCService) {
            webRTCService.initialize(doctorSocketId);
            
            // Register with signaling server
            setTimeout(() => {
              if (webRTCService.signalingService && 
                  webRTCService.signalingService.isConnected()) {
                webRTCService.signalingService.send('register', doctorSocketId);
                console.log(`Demo doctor registered with socket: ${doctorSocketId}`);
              }
            }, 1000);
          }
        }, 500);
        
        setIsAuthenticated(true);
        setActiveScreen('dashboard');
        return;
      }
      
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.user) {
        // Check if email is verified
        const isEmailVerified = data.user.email_confirmed_at !== null;
        
        if (!isEmailVerified) {
          // Email not verified - show verification message
          setNeedsVerification(true);
          setIsLoading(false);
          return;
        }
        
        // Check if MFA is required - 2FA HANDLING
        if (data.user.factors && data.user.factors.length > 0) {
          setFactorId(data.user.factors[0].id);
          setTfaRequired(true);
          setIsLoading(false);
          
          // Create a challenge for verification
          const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
            factorId: data.user.factors[0].id
          });
          
          if (challengeError) {
            throw challengeError;
          }
          
          setChallengeId(challengeData.id);
          return;
        }
        
        // Email is verified and no 2FA required - proceed with login
        // Get user profile from the users table with doctor info
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*, doctor:doctors(*)')
          .eq('email', email)
          .single();
          
        if (userError) {
          throw userError;
        }
        
        // Get 2FA status from user preferences
        const { data: prefsData } = await supabase
          .from('user_preferences')
          .select('two_factor_enabled, factor_id')
          .eq('user_id', userData.user_id)
          .single();
          
        // Build user info object with potential doctor details
        const userInfo = {
          id: userData.user_id,
          name: userData.name,
          email: userData.email,
          isPremium: userData.is_premium,
          avatar: userData.avatar_url,
          emailVerified: true,
          isDoctor: userData.is_doctor || false,
          twoFactorEnabled: prefsData?.two_factor_enabled || false,
          factorId: prefsData?.factor_id || null
        };
        
        // If user is a doctor, add doctor details
        if (userData.is_doctor && userData.doctor) {
          userInfo.doctorId = userData.doctor_id;
          userInfo.specialty = userData.doctor.specialty;
          userInfo.doctorAvailability = userData.doctor.availability;
          userInfo.doctorRating = userData.doctor.rating;
          
          // Store doctor info in localStorage
          localStorage.setItem('is_doctor', 'true');
          localStorage.setItem('doctor_id', `doctor-${userData.doctor_id}`);
          
          // Initialize WebRTC with doctor ID if it's a doctor
          const doctorSocketId = `doctor-${userData.doctor_id}`;
          setTimeout(() => {
            if (webRTCService) {
              webRTCService.initialize(doctorSocketId);
              
              // Register with signaling server
              setTimeout(() => {
                if (webRTCService.signalingService && 
                    webRTCService.signalingService.isConnected()) {
                  webRTCService.signalingService.send('register', doctorSocketId);
                  console.log(`Doctor logged in and registered with socket: ${doctorSocketId}`);
                }
              }, 1000);
            }
          }, 500);
        } else {
          // Clear doctor flags for non-doctor users
          localStorage.setItem('is_doctor', 'false');
          localStorage.removeItem('doctor_id');
        }
        
        // Store user data in localStorage for app state
        localStorage.setItem('healthsync_auth', 'true');
        localStorage.setItem('healthsync_user', JSON.stringify(userInfo));
        
        // Get user preferences for dark mode
        const { data: prefsData2 } = await supabase
          .from('user_preferences')
          .select('enable_dark_mode')
          .eq('user_id', userData.user_id)
          .single();
          
        if (prefsData2) {
          localStorage.setItem('healthsync_dark_mode', prefsData2.enable_dark_mode);
        }
        
        // Update state and redirect
        setIsAuthenticated(true);
        setActiveScreen('dashboard');
      }
    } catch (error) {
      console.error('Error signing in:', error.message);
      setLoginAttempts(loginAttempts + 1);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handler for 2FA verification
  const handleVerifyMFA = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Validate the code
      if (!/^\d{6}$/.test(tfaCode)) {
        throw new Error('Please enter a valid 6-digit code. It\'s not rocket science!');
      }
      
      // Check if we're dealing with a development factor
      const isDevFactor = factorId && factorId.startsWith('dev-factor-');
      let verificationSuccessful = false;
      
      if (isDevFactor) {
        // For development factors, accept any valid 6-digit code
        console.log('Development factor detected, accepting code without verification');
        verificationSuccessful = true;
      } else {
        // For real factors, verify the challenge
        const { data, error } = await supabase.auth.mfa.verify({
          factorId: factorId,
          challengeId: challengeId,
          code: tfaCode
        });
        
        if (error) {
          throw error;
        }
        
        verificationSuccessful = true;
      }
      
      if (!verificationSuccessful) {
        throw new Error('Verification failed. Please try again with a new code.');
      }
      
      // MFA verification successful, proceed with login
      // Get user profile from the users table with doctor info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, doctor:doctors(*)')
        .eq('email', email)
        .single();
        
      if (userError) {
        throw userError;
      }
      
      // Get 2FA status from user preferences (including the factorId)
      const { data: prefsData } = await supabase
        .from('user_preferences')
        .select('two_factor_enabled, factor_id')
        .eq('user_id', userData.user_id)
        .single();
      
      // Build user info object with potential doctor details
      const userInfo = {
        id: userData.user_id,
        name: userData.name,
        email: userData.email,
        isPremium: userData.is_premium,
        avatar: userData.avatar_url,
        emailVerified: true,
        isDoctor: userData.is_doctor || false,
        twoFactorEnabled: true,
        factorId: prefsData?.factor_id || factorId
      };
      
      // If user is a doctor, add doctor details
      if (userData.is_doctor && userData.doctor) {
        userInfo.doctorId = userData.doctor_id;
        userInfo.specialty = userData.doctor.specialty;
        userInfo.doctorAvailability = userData.doctor.availability;
        userInfo.doctorRating = userData.doctor.rating;
        
        // Store doctor info in localStorage
        localStorage.setItem('is_doctor', 'true');
        localStorage.setItem('doctor_id', `doctor-${userData.doctor_id}`);
        
        // Initialize WebRTC with doctor ID
        const doctorSocketId = `doctor-${userData.doctor_id}`;
        setTimeout(() => {
          if (webRTCService) {
            webRTCService.initialize(doctorSocketId);
            
            // Register with signaling server
            setTimeout(() => {
              if (webRTCService.signalingService && 
                  webRTCService.signalingService.isConnected()) {
                webRTCService.signalingService.send('register', doctorSocketId);
                console.log(`Doctor logged in and registered with socket: ${doctorSocketId}`);
              }
            }, 1000);
          }
        }, 500);
      } else {
        // Clear doctor flags for non-doctor users
        localStorage.setItem('is_doctor', 'false');
        localStorage.removeItem('doctor_id');
      }
      
      // Store user data in localStorage for app state
      localStorage.setItem('healthsync_auth', 'true');
      localStorage.setItem('healthsync_user', JSON.stringify(userInfo));
      
      // Get user preferences for dark mode
      const { data: prefsData2 } = await supabase
        .from('user_preferences')
        .select('enable_dark_mode')
        .eq('user_id', userData.user_id)
        .single();
        
      if (prefsData2) {
        localStorage.setItem('healthsync_dark_mode', prefsData2.enable_dark_mode);
      }
      
      // Update state and redirect
      setIsAuthenticated(true);
      setActiveScreen('dashboard');
    } catch (error) {
      console.error('Error verifying 2FA:', error.message);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to request a verification email
  const handleResendVerification = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const result = await sendVerificationEmail(email);
      
      if (result.success) {
        setVerificationSent(true);
        setErrorMessage(result.message);
      } else {
        setErrorMessage(result.error || 'Failed to send verification email');
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get sassy message based on login attempts or error
  const getSassyMessage = () => {
    if (errorMessage && !needsVerification && !tfaRequired) {
      return errorMessage;
    }
    
    if (loginAttempts === 0) return null;
    
    const messages = [
      "Hmm, that's not quite right. Give it another shot!",
      "Nope! Are you sure you're you? 🤔",
      "Still not working, bestie. Maybe try 'password123'? (Kidding, don't)",
      "OK seriously, do you need the 'forgot password' link? It's right there 👆",
      "At this point, I'm impressed by your persistence. Very admirable."
    ];
    
    return messages[Math.min(loginAttempts - 1, messages.length - 1)];
  };
  
  // Calculate dynamic colors for dark mode compatibility
  const bgGradientStart = isDarkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.1)';
  const bgGradientEnd = isDarkMode ? 'rgba(15, 23, 42, 0.1)' : 'rgba(255, 255, 255, 0.1)';
  const cardBg = isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.1)';
  const cardBorder = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.2)';
  const inputBg = isDarkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.1)';
  const textColor = isDarkMode ? colors.textPrimary : '#0F172A';
  const sassyMsgBg = isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.1)';
  
  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMessage('Please enter your email first');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      alert(`Password reset link sent to ${email}`);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Email verification needed component
  const VerificationNeededMessage = () => (
    <div className="space-y-6 py-2">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 dark-mode-transition"
           style={{ backgroundColor: colors.warning + '30' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
      </div>
      
      <div className="text-center">
        <h3 className="text-xl font-bold bg-gradient-to-r from-yellow-200 to-yellow-100 bg-clip-text text-transparent mb-2">
          Email Verification Required
        </h3>
        <p className="text-sm text-white text-opacity-80 mb-6">
          Your account exists, but you need to verify your email address <strong>{email}</strong> before you can sign in.
        </p>
        
        {verificationSent ? (
          <div className="p-4 rounded-xl animate-pulse mb-4" style={{ backgroundColor: colors.success + '20' }}>
            <p className="text-sm" style={{ color: colors.success }}>
              Verification email sent! Please check your inbox (including spam folder).
            </p>
          </div>
        ) : (
          <button
            onClick={handleResendVerification}
            disabled={isLoading}
            className="w-full py-3 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center dark-mode-transition"
            style={{ 
              backgroundColor: colors.warning,
              boxShadow: `0 4px 12px -2px ${colors.warning}60`
            }}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>Sending email...</span>
              </div>
            ) : (
              'Resend Verification Email'
            )}
          </button>
        )}
        
        {errorMessage && verificationSent && (
          <p className="mt-4 text-sm" style={{ color: colors.success }}>
            {errorMessage}
          </p>
        )}
        
        {errorMessage && !verificationSent && (
          <p className="mt-4 text-sm" style={{ color: colors.danger }}>
            {errorMessage}
          </p>
        )}
        
        <div className="mt-6 pt-6 border-t border-white border-opacity-10">
          <button
            onClick={() => {
              setNeedsVerification(false);
              setVerificationSent(false);
              setErrorMessage('');
            }}
            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
  
  // 2FA verification component
  const TwoFactorVerificationForm = () => (
    <div className="space-y-6 py-2">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 dark-mode-transition"
           style={{ backgroundColor: colors.accent + '30' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      
      <div className="text-center">
        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent mb-2">
          Two-Factor Authentication Required
        </h3>
        <p className="text-sm text-white text-opacity-80 mb-6">
          Please enter the 6-digit code from your authenticator app to complete the sign-in process.
        </p>
        
        {errorMessage && (
          <div className="p-3 rounded-xl backdrop-blur-md mb-4 animate-bounce-once text-center"
               style={{ backgroundColor: sassyMsgBg }}>
            <p className="text-sm" style={{ color: colors.danger }}>
              {errorMessage}
            </p>
          </div>
        )}
        
        <form onSubmit={handleVerifyMFA} className="space-y-4">
          <div className={`relative rounded-xl overflow-hidden transition-all duration-300 
                      ${tfaCodeFocused ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-sm'}`}
               style={{ 
                 boxShadow: tfaCodeFocused 
                  ? `0 0 15px ${colors.primary}40` 
                  : `0 4px 6px -1px ${colors.primary}10` 
               }}>
            <input
              type="text"
              value={tfaCode}
              onChange={(e) => setTfaCode(e.target.value.replace(/[^0-9]/g, '').substring(0, 6))}
              onFocus={() => setTfaCodeFocused(true)}
              onBlur={() => setTfaCodeFocused(false)}
              className="w-full px-4 py-4 bg-transparent backdrop-blur-md border-none focus:outline-none dark-mode-transition text-center text-2xl tracking-widest font-mono"
              style={{ color: colors.textPrimary }}
              placeholder="000000"
              maxLength={6}
              required
              inputMode="numeric"
              autoFocus
            />
            <div className="absolute inset-0 -z-10 dark-mode-transition" 
                 style={{ background: `linear-gradient(to right, ${colors.primary}15, ${colors.accent}10)` }}></div>
          </div>
          
          <button
            type="submit"
            className="w-full py-4 rounded-xl text-white font-medium transition-all duration-500 hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center overflow-hidden relative"
            style={{ 
              background: `linear-gradient(45deg, ${colors.primary}, ${colors.accent}, ${colors.accentAlt}, ${colors.primary})`,
              backgroundSize: '300% 300%',
              animation: 'gradientShift 5s ease infinite',
              boxShadow: `0 10px 25px -5px ${colors.primary}60, 0 0 15px ${colors.neonAccent}30`
            }}
            disabled={isLoading || tfaCode.length !== 6}
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                 style={{ 
                   transform: 'translateX(-100%)',
                   animation: 'shimmerEffect 2.5s infinite'
                 }}></div>
            {isLoading ? (
              <div className="flex items-center">
                <Loader className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                <span>Verifying code...</span>
              </div>
            ) : (
              'Verify & Sign In'
            )}
          </button>
        </form>
        
        <div className="mt-6 pt-6 border-t border-white border-opacity-10">
          <button
            onClick={() => {
              setTfaRequired(false);
              setTfaCode('');
              setErrorMessage('');
            }}
            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="p-6 pb-8 h-full flex flex-col overflow-hidden relative dark-mode-transition"
         style={{
           background: `radial-gradient(circle at 30% 50%, ${colors.primary}05, transparent 35%),
                       radial-gradient(circle at 70% 80%, ${colors.accent}05, transparent 35%)`,
         }}>
      {/* Animated floating orbs in background - adjusted for dark mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full opacity-20 dark-mode-transition"
            style={{
              width: Math.random() * 80 + 40 + 'px',
              height: Math.random() * 80 + 40 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              background: `linear-gradient(135deg, ${colors.primary}80, ${colors.accent}60)`,
              filter: 'blur(20px)',
              animation: `float ${Math.random() * 8 + 12}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              transform: `translate3d(${mousePosition.x * -20}px, ${mousePosition.y * -20}px, 0)`
            }}
          />
        ))}
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center z-10">
        {/* Logo and app name with enhanced animations */}
        <div className="mb-12 text-center transform-gpu" 
             style={{ 
               transform: `translate3d(${mousePosition.x * 10}px, ${mousePosition.y * 10}px, 0)`,
               transition: 'transform 0.1s ease-out'
             }}>
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute -inset-8 rounded-full animate-pulse opacity-40"
                 style={{ 
                   background: `radial-gradient(circle, ${colors.neonAccent}, transparent 50%)`,
                   filter: 'blur(1px)'
                 }}></div>
            
             <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center shadow-lg dark-mode-transition" 
                 style={{ 
                   boxShadow: `0 10px 25px -5px ${colors.primary}50, 0 0 15px ${colors.neonAccent}40`
                 }}>
              {/* Import the logo correctly in your component or use from public folder */}
              <img 
                src="/logo.jpg" 
                alt="Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-br from-white via-blue-400 to-blue-600 bg-clip-text text-transparent mb-2">
            HealthSync
          </h1>
          <p className="text-base dark-mode-transition" style={{ color: colors.textSecondary }}>
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">AI Health Assistant</span>
          </p>
        </div>
        
        {/* Sign in form with enhanced glass effects and animations */}
        <div className="w-full max-w-sm relative" 
             style={{ 
               transform: `translate3d(${mousePosition.x * -5}px, ${mousePosition.y * -5}px, 0)`,
               transition: 'transform 0.2s ease-out' 
             }}>
          <div className="absolute -inset-6 rounded-3xl opacity-20 bg-blue-500 blur-xl dark-mode-transition"></div>
          <div className="relative p-6 rounded-2xl backdrop-blur-md border dark-mode-transition"
               style={{ 
                 background: cardBg, 
                 borderColor: cardBorder,
                 boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 10px ${colors.primary}20`
               }}>
            
            {/* Error/Sassy message that appears on failed logins */}
            {getSassyMessage() && !needsVerification && !tfaRequired && (
              <div className="p-3 rounded-xl backdrop-blur-md mb-4 animate-bounce-once text-center dark-mode-transition"
                   style={{ backgroundColor: sassyMsgBg }}>
                <p className="text-sm dark-mode-transition" style={{ color: isDarkMode ? colors.textPrimary : textColor }}>
                  {getSassyMessage()}
                </p>
              </div>
            )}
            
            {needsVerification ? (
              <VerificationNeededMessage />
            ) : tfaRequired ? (
              <TwoFactorVerificationForm />
            ) : (
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className={`block text-sm font-medium transition-all duration-300 ${emailFocused ? 'text-blue-500' : ''}`}
                           style={{ color: emailFocused ? colors.accent : colors.textPrimary }}>
                      Email
                    </label>
                    
                    <span className="text-xs cursor-pointer dark-mode-transition" style={{ color: colors.textSecondary }}>
                      Try demo@healthsync.com
                    </span>
                  </div>
                  <div className={`relative rounded-xl overflow-hidden transition-all duration-300 
                      ${emailFocused ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-sm'}`}
                       style={{ 
                         boxShadow: emailFocused 
                          ? `0 0 15px ${colors.primary}40` 
                          : `0 4px 6px -1px ${colors.primary}10` 
                       }}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      className="w-full px-4 py-4 bg-transparent backdrop-blur-md border-none focus:outline-none dark-mode-transition"
                      style={{ color: colors.textPrimary }}
                      placeholder="name@example.com"
                      required
                    />
                    <div className="absolute inset-0 -z-10 dark-mode-transition" 
                         style={{ background: `linear-gradient(to right, ${colors.primary}15, ${colors.accent}10)` }}></div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className={`block text-sm font-medium transition-all duration-300 ${passwordFocused ? 'text-blue-500' : ''}`}
                           style={{ color: passwordFocused ? colors.accent : colors.textPrimary }}>
                      Password
                    </label>
                    <button 
                      type="button" 
                      onClick={handleForgotPassword}
                      className="text-xs font-medium transition-all duration-300 hover:text-blue-400"
                      style={{ color: colors.primary }}>
                      Forgot password?
                    </button>
                  </div>
                  <div className={`relative rounded-xl overflow-hidden transition-all duration-300 
                      ${passwordFocused ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-sm'}`}
                       style={{ 
                         boxShadow: passwordFocused 
                          ? `0 0 15px ${colors.primary}40` 
                          : `0 4px 6px -1px ${colors.primary}10` 
                       }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      className="w-full px-4 py-4 bg-transparent backdrop-blur-md border-none focus:outline-none pr-12 dark-mode-transition"
                      placeholder={loginAttempts > 2 ? "Hint: try 'demo'" : "••••••••"}
                      required
                      style={{ color: colors.textPrimary }}
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity dark-mode-transition"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ color: colors.textPrimary }}
                    >
                      {showPassword ? (
                        <Eye size={20} />
                      ) : (
                        <EyeOff size={20} />
                      )}
                    </button>
                    <div className="absolute inset-0 -z-10 dark-mode-transition" 
                         style={{ background: `linear-gradient(to right, ${colors.primary}15, ${colors.accent}10)` }}></div>
                  </div>
                </div>

                {/* Demo logins with explanation */}
                <div className="bg-blue-500 bg-opacity-10 p-2 rounded-md text-xs">
                  <p className="mb-1 text-blue-300">Quick Login Options:</p>
                  <p className="mb-1">• Patient: <strong>demo@healthsync.com</strong> / <strong>demo</strong></p>
                  <p>• Doctor: <strong>doctor@healthsync.com</strong> / <strong>doctor</strong></p>
                </div>
                
                <button
                  type="submit"
                  className="w-full py-4 rounded-xl text-white font-medium transition-all duration-500 hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center overflow-hidden relative"
                  style={{ 
                    background: `linear-gradient(45deg, ${colors.primary}, ${colors.accent}, ${colors.accentAlt}, ${colors.primary})`,
                    backgroundSize: '300% 300%',
                    animation: 'gradientShift 5s ease infinite',
                    boxShadow: `0 10px 25px -5px ${colors.primary}60, 0 0 15px ${colors.neonAccent}30`
                  }}
                  disabled={isLoading}
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                       style={{ 
                         transform: 'translateX(-100%)',
                         animation: 'shimmerEffect 2.5s infinite'
                       }}></div>
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader size={20} className="animate-spin mr-2" />
                      <span>{loginAttempts > 1 ? "Let's hope it works this time..." : "Signing in..."}</span>
                    </div>
                  ) : (
                    loginAttempts > 2 ? "Oh alright, let me in" : "Sign in"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center z-10">
        <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
          Need an account? {' '}
          <button 
            onClick={() => setActiveScreen('register')}
            className="font-medium transition-all duration-300 hover:text-blue-300 relative"
            style={{ color: colors.accent }}
          >
            Create one in 10 seconds
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 transform scale-x-0 origin-left transition-transform duration-300 hover:scale-x-100"></span>
          </button>
        </p>
      </div>
      
      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        @keyframes shimmerEffect {
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        .animate-bounce-once {
          animation: bounce-once 0.8s ease;
        }
      `}</style>
    </div>
  );
};

export default SignInScreen;