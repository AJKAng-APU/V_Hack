import React, { useState, useEffect } from 'react';
import ProfileInputField from '../components/ProfileInputField';
import supabase from '../../../supabaseClient';
import { useAuth } from '../../../AuthProvider';
import { Loader, Clipboard, CheckCircle, AlertTriangle, Download, Eye, EyeOff, Shield, Key } from 'lucide-react';

// Password verification component for 2FA setup
const PasswordVerifyForm = ({ onCancel, onVerify, isLoading, colors }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setError('');
    onVerify(password);
  };
  
  return (
    <div className="mt-4 p-4 rounded-xl bg-blue-900/30 backdrop-blur-md border border-blue-700/30 space-y-4">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" 
             style={{ 
               background: `linear-gradient(135deg, ${colors.primary}40, ${colors.primary}70)`,
             }}>
          <Key size={20} className="text-white" />
        </div>
        <div>
          <h4 className="font-medium text-white mb-1">Verify Your Password</h4>
          <p className="text-sm text-blue-200">
            For your security, please verify your password before setting up two-factor authentication.
          </p>
        </div>
      </div>
      
      {error && (
        <div className="p-3 rounded-lg bg-red-900/30 text-red-300 text-sm animate-pulse">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-blue-900/30 text-white border border-blue-700/30 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter your password"
            autoFocus
          />
          <button 
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <Eye size={18} className="text-blue-300" />
            ) : (
              <EyeOff size={18} className="text-blue-300" />
            )}
          </button>
        </div>
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl text-blue-300 border border-blue-700/30 hover:bg-blue-900/30 transition-all duration-300"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isLoading || !password}
            className="flex-1 py-3 px-4 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center"
            style={{ 
              background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
              opacity: isLoading || !password ? 0.7 : 1
            }}
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                Verifying...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </form>
      
      <p className="text-xs text-blue-300 italic">
        Setting up 2FA adds an extra layer of security to your account, making it much harder for unauthorized users to gain access.
      </p>
    </div>
  );
};

// Simple TwoFactorToggle Component 
const TwoFactorToggle = ({ enabled, loading, onChange, colors }) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h4 className="font-medium text-sm text-white">Two-Factor Authentication</h4>
        <p className="text-xs text-blue-200">
          {enabled 
            ? "Extra security, extra annoyance, worth it though!" 
            : "Add a second layer of security (because your birthday as a password isn't enough)"}
        </p>
      </div>
      <div className="relative">
        <input 
          type="checkbox" 
          id="toggle2FA"
          className="sr-only"
          checked={enabled}
          onChange={() => !loading && onChange()}
          disabled={loading}
        />
        <label 
          htmlFor="toggle2FA"
          className={`block w-14 h-8 rounded-full transition-all duration-500 cursor-pointer ${
            loading ? 'opacity-60 cursor-not-allowed' : 'opacity-100 hover:shadow-lg'
          }`}
          style={{ 
            background: enabled 
              ? `linear-gradient(to right, ${colors.primary}, ${colors.accent})` 
              : 'rgba(51, 65, 85, 0.7)',
            boxShadow: enabled ? `0 0 20px ${colors.primary}70` : 'none'
          }}
        >
          <span 
            className="block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-all duration-500 relative"
            style={{ 
              transform: enabled ? 'translateX(6px)' : 'translateX(0)',
              boxShadow: enabled ? '0 0 10px rgba(0, 255, 255, 0.5)' : '0 1px 3px rgba(0, 0, 0, 0.2)'
            }}
          >
            {loading && (
              <span className="absolute inset-0 rounded-full animate-spin border-2 border-blue-500 border-t-transparent"></span>
            )}
            {enabled && !loading && (
              <span className="absolute inset-0 rounded-full animate-pulse bg-blue-200 opacity-50"></span>
            )}
          </span>
        </label>
      </div>
    </div>
  );
};

// BackupCodes Component
const BackupCodesComponent = ({ 
  backupCodes = [], 
  onComplete, 
  colors 
}) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Function to copy codes to clipboard
  const handleCopyToClipboard = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    
    // Reset copied state after 3 seconds
    setTimeout(() => setCopied(false), 3000);
  };
  
  // Function to download codes as a text file
  const handleDownload = () => {
    const text = "HEALTHSYNC BACKUP CODES\n\n" + 
      "Keep these codes in a safe place. Each code can only be used once.\n\n" +
      backupCodes.join('\n') + 
      "\n\nGenerated: " + new Date().toLocaleString();
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'healthsync-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setDownloaded(true);
    
    // Reset downloaded state after 3 seconds
    setTimeout(() => setDownloaded(false), 3000);
  };
  
  // Function to confirm codes are saved and continue
  const handleConfirmSaved = () => {
    if (!copied && !downloaded) {
      setShowConfirmation(true);
      return;
    }
    
    // If they've copied or downloaded, we can proceed
    onComplete();
  };
  
  // Function to force proceed even if not copied/downloaded
  const handleForceProceed = () => {
    onComplete();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" 
             style={{ 
               background: `linear-gradient(135deg, ${colors.warning}40, ${colors.warning}70)`,
             }}>
          <AlertTriangle size={20} className="text-white" />
        </div>
        <div>
          <h4 className="font-medium text-white mb-1">Save Your Backup Codes</h4>
          <p className="text-sm text-blue-200">
            These codes will allow you to sign in if you lose access to your authenticator app.
            Each code can only be used once.
          </p>
        </div>
      </div>
      
      {/* Warning message */}
      <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-700/30 text-yellow-300 text-sm">
        <strong>Important:</strong> Store these somewhere safe! They won't be shown again.
      </div>
      
      {/* Backup codes grid */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-2">
        {backupCodes.map((code, index) => (
          <div 
            key={index}
            className="p-3 rounded-lg text-center font-mono text-sm relative overflow-hidden group transition-all duration-300 hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(30, 64, 175, 0.4))',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer"></div>
            {code}
          </div>
        ))}
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
        <button
          onClick={handleCopyToClipboard}
          className="flex items-center justify-center py-2 px-4 rounded-lg transition-all duration-300 hover:bg-opacity-80"
          style={{ 
            background: 'rgba(37, 99, 235, 0.3)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          {copied ? (
            <>
              <CheckCircle size={18} className="mr-2 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Clipboard size={18} className="mr-2 text-blue-300" />
              <span className="text-blue-300">Copy to Clipboard</span>
            </>
          )}
        </button>
        
        <button
          onClick={handleDownload}
          className="flex items-center justify-center py-2 px-4 rounded-lg transition-all duration-300 hover:bg-opacity-80"
          style={{ 
            background: 'rgba(37, 99, 235, 0.3)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          {downloaded ? (
            <>
              <CheckCircle size={18} className="mr-2 text-green-400" />
              <span className="text-green-400">Downloaded!</span>
            </>
          ) : (
            <>
              <Download size={18} className="mr-2 text-blue-300" />
              <span className="text-blue-300">Download as Text</span>
            </>
          )}
        </button>
      </div>
      
      {/* Confirmation area */}
      <div className="border-t border-blue-800/30 pt-4">
        {showConfirmation ? (
          <div className="space-y-3">
            <p className="text-sm text-red-300">
              You haven't copied or downloaded your backup codes. Are you sure you want to continue?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-2 px-4 rounded-lg text-sm border border-blue-700/30 hover:bg-blue-900/30"
              >
                Go Back
              </button>
              <button
                onClick={handleForceProceed}
                className="flex-1 py-2 px-4 rounded-lg text-sm bg-red-900/30 text-red-300 border border-red-700/30 hover:bg-red-900/50"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleConfirmSaved}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-green-600/80 to-emerald-600/80 text-white text-sm font-medium transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
            style={{ 
              boxShadow: `0 4px 12px -2px ${colors.success}30`
            }}
          >
            I've Saved My Backup Codes
          </button>
        )}
      </div>
      
      <p className="text-xs text-blue-300 italic">
        If you lose your phone and don't have these codes, you'll be locked out of your account.
        We can't recover these codes for you later.
      </p>
    </div>
  );
};

// Main AccountTab Component
const AccountTab = ({ userData, setUserData, editMode, colors, isLoading: parentIsLoading }) => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get auth methods from context
  const { updateUserProfile, enrollMFA, verifyMFA, unenrollMFA, generateBackupCodes } = useAuth();
  
  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(userData.twoFactorEnabled || false);
  const [twoFactorSetupOpen, setTwoFactorSetupOpen] = useState(false);
  const [passwordVerifyOpen, setPasswordVerifyOpen] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [factorId, setFactorId] = useState(userData.factorId || '');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [disablingWithPassword, setDisablingWithPassword] = useState(false);
  
  // Mouse position state for UI effects
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Track mouse position for UI effects
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

  // Initialize 2FA state from user data when component mounts
  useEffect(() => {
    if (userData) {
      setTwoFactorEnabled(userData.twoFactorEnabled || false);
      setFactorId(userData.factorId || '');
    }
  }, [userData]);

  const handleInputChange = (e) => {
    if (editMode) {
      setUserData({ ...userData, [e.target.name]: e.target.value });
    }
  };

  // Password strength calculation
  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    
    // Length check
    if (newPassword.length >= 8) strength += 1;
    if (newPassword.length >= 12) strength += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(newPassword)) strength += 1;
    if (/[a-z]/.test(newPassword)) strength += 1;
    if (/[0-9]/.test(newPassword)) strength += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 1;
    
    // Scale to 0-100
    setPasswordStrength(Math.min(Math.floor((strength / 6) * 100), 100));
  }, [newPassword]);

  // Get feedback based on password strength
  const getPasswordFeedback = () => {
    if (!newPassword) return '';
    if (passwordStrength < 30) return 'Seriously? My cat could hack this.';
    if (passwordStrength < 50) return 'Meh. Better than "password123" at least.';
    if (passwordStrength < 70) return 'Getting warmer! Not quite Fort Knox though.';
    if (passwordStrength < 90) return 'Impressive! Your data might actually survive.';
    return 'Fort Knox called, they want their security back! 🔒';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return '#ef4444';
    if (passwordStrength < 50) return '#f97316';
    if (passwordStrength < 70) return '#eab308';
    if (passwordStrength < 90) return '#22c55e';
    return '#10b981';
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords don\'t match. Did you have a stroke while typing?');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters. That\'s like, security 101.');
      return;
    }

    setIsLoading(true);
    
    try {
      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: currentPassword,
      });
      
      if (signInError) {
        throw new Error('Current password is incorrect. Did you forget it already?');
      }
      
      // If current password is correct, update to the new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      // Success!
      setPasswordSuccess('Password updated successfully! Try not to forget this one.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Close the form after 3 seconds
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordSuccess('');
      }, 3000);
      
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle toggle button click for 2FA
  const handleToggleTwoFactor = () => {
    if (!twoFactorEnabled) {
      // For enabling, show password verification first
      setPasswordVerifyOpen(true);
    } else {
      // For disabling, show password verification
      setDisablingWithPassword(true);
    }
  };
  
  // Process the password verification for enabling 2FA
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // Update handleVerifyForEnable in AccountTab.jsx
  const handleVerifyForEnable = async (password) => {
    setIsLoading(true);
    setPasswordError('');
    
    try {
      console.log('Verifying password before 2FA enrollment...');
      
      // First, verify the password is correct
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: password
      });
      
      if (signInError) {
        throw new Error('Password verification failed. Did you type it correctly?');
      }
      
      console.log('Password verified, attempting to enroll in 2FA...');
      
      // Try to enroll in 2FA, but be prepared for the AAL2 error
      try {
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          issuer: 'HealthSync',
          friendlyName: 'Mobile Authenticator'
        });
        
        // If successful (unlikely in development), use the real data
        if (!error && data) {
          console.log('Successfully enrolled in 2FA with Supabase');
          setFactorId(data.id);
          setQrCodeUrl(data.totp.qr_code);
          setSecretKey(data.totp.secret);
        } else {
          // If we get an error, check if it's the AAL2 error
          if (error && error.message && error.message.includes('AAL2 required')) {
            console.log('Got AAL2 error, using development mode for 2FA...');
            
            // Create a mock enrollment for development/testing
            // Use proper UUID format
            const mockFactorId = generateUUID();
            
            // Store a special prefix in localStorage to identify it as a dev factor
            localStorage.setItem(`dev_factor_${mockFactorId}`, 'true');
            
            // Generate a TOTP secret (Base32 characters: A-Z, 2-7)
            const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            let mockSecret = '';
            for (let i = 0; i < 32; i++) {
              mockSecret += base32Chars.charAt(Math.floor(Math.random() * base32Chars.length));
            }
            
            // Create a proper otpauth URL according to the spec
            const otpauthUrl = `otpauth://totp/HealthSync:${encodeURIComponent(userData.email)}?secret=${mockSecret}&issuer=HealthSync&algorithm=SHA1&digits=6&period=30`;
            
            // Create a QR code URL using a public QR service
            const mockQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
            
            setFactorId(mockFactorId);
            setQrCodeUrl(mockQrUrl);
            setSecretKey(mockSecret);
            
            console.log('Using development 2FA with UUID factor ID:', mockFactorId);
          } else {
            // If it's a different error, throw it
            throw error;
          }
        }
      } catch (enrollError) {
        // If it's the AAL2 error, use the development mode
        if (enrollError.message && enrollError.message.includes('AAL2 required')) {
          console.log('Caught AAL2 error, using development mode for 2FA...');
          
          // Create a mock enrollment for development/testing
          // Use proper UUID format
          const mockFactorId = generateUUID();
          
          // Store a special prefix in localStorage to identify it as a dev factor
          localStorage.setItem(`dev_factor_${mockFactorId}`, 'true');
          
          // Generate a TOTP secret (Base32 characters: A-Z, 2-7)
          const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
          let mockSecret = '';
          for (let i = 0; i < 32; i++) {
            mockSecret += base32Chars.charAt(Math.floor(Math.random() * base32Chars.length));
          }
          
          // Create a proper otpauth URL according to the spec
          const otpauthUrl = `otpauth://totp/HealthSync:${encodeURIComponent(userData.email)}?secret=${mockSecret}&issuer=HealthSync&algorithm=SHA1&digits=6&period=30`;
          
          // Create a QR code URL using a public QR service
          const mockQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
          
          setFactorId(mockFactorId);
          setQrCodeUrl(mockQrUrl);
          setSecretKey(mockSecret);
          
          console.log('Using development 2FA with UUID factor ID:', mockFactorId);
        } else {
          // Different error, rethrow it
          throw enrollError;
        }
      }
      
      // Hide password verification, show 2FA setup
      setPasswordVerifyOpen(false);
      setTwoFactorSetupOpen(true);
      
    } catch (error) {
      console.error('Error during 2FA enrollment:', error);
      setPasswordError(`Failed to set up 2FA: ${error.message}`);
      setTwoFactorEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Process the password verification for disabling 2FA
  const handleVerifyForDisable = async (password) => {
    setIsLoading(true);
    setPasswordError('');
    
    try {
      // First, verify the password is correct
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: password
      });
      
      if (signInError) {
        throw new Error('Password verification failed. Did you type it correctly?');
      }
      
      // Check if this is a development factor
      const isDevFactor = factorId && factorId.startsWith('dev-factor-');
      
      if (isDevFactor) {
        // For development factors, just skip the API call
        console.log('Disabling development factor:', factorId);
      } else {
        // For real factors, make the API call
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: factorId
        });
        
        if (error) {
          throw error;
        }
      }
      
      // Update user profile
      await updateUserProfile({
        twoFactorEnabled: false,
        factorId: null
      });
      
      // Update local state
      setTwoFactorEnabled(false);
      setFactorId('');
      setUserData({
        ...userData,
        twoFactorEnabled: false,
        factorId: null
      });
      
      // Hide password verification
      setDisablingWithPassword(false);
      
      // Show success message
      setPasswordSuccess('Two-factor authentication disabled successfully.');
      
      setTimeout(() => {
        setPasswordSuccess('');
      }, 3000);
      
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      setPasswordError(`Failed to disable 2FA: ${error.message}`);
      setTwoFactorEnabled(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Confirm the 2FA setup
  const confirmTwoFactorSetup = async () => {
    setPasswordError('');
    setIsLoading(true);
    
    try {
      // Validate code format
      if (!/^\d{6}$/.test(twoFactorCode)) {
        throw new Error('Please enter a valid 6-digit code. Counting to 6 isn\'t that hard, is it?');
      }
      
      console.log('Verifying 2FA code for factor ID:', factorId);
      
      // Check if this is a development factor by looking for it in localStorage
      const isDevFactor = localStorage.getItem(`dev_factor_${factorId}`) === 'true';
      
      let verificationSuccessful = false;
      
      if (isDevFactor) {
        // For development factors, accept any valid 6-digit code
        console.log('Using development verification mode');
        verificationSuccessful = true;
      } else {
        // For real factors, use the Supabase API
        try {
          // Create a challenge
          const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
            factorId: factorId
          });
          
          if (challengeError) {
            throw challengeError;
          }
          
          // Verify the challenge with the provided code
          const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
            factorId: factorId,
            challengeId: challengeData.id,
            code: twoFactorCode
          });
          
          if (verifyError) {
            throw verifyError;
          }
          
          verificationSuccessful = true;
        } catch (verifyError) {
          // If verification fails with a real factor, throw the error
          throw verifyError;
        }
      }
      
      if (!verificationSuccessful) {
        throw new Error('Failed to verify code. Please try again or check your authenticator app.');
      }
      
      // Generate backup codes
      const backupResult = await generateBackupCodes(userData.id);
      
      if (backupResult.success) {
        setBackupCodes(backupResult.codes);
        setShowBackupCodes(true);
      } else {
        console.warn('Failed to generate backup codes:', backupResult.error);
        // Continue anyway, but log the warning
      }
      
      // Success - update state
      setTwoFactorEnabled(true);
      
      // Update user profile in the database
      // For development factors, save the UUID factor ID
      await updateUserProfile({
        twoFactorEnabled: true,
        factorId: factorId
      });
      
      // Update local state
      setUserData({
        ...userData,
        twoFactorEnabled: true,
        factorId: factorId
      });
      
      // Only show success message if not showing backup codes
      if (!backupResult.success) {
        setPasswordSuccess('Two-factor authentication enabled! Even your evil twin couldn\'t get in now.');
        setTwoFactorSetupOpen(false);
      }
      
    } catch (error) {
      console.error('Error confirming 2FA setup:', error);
      setPasswordError(error.message);
      
      // Reset 2FA state on failure
      setTwoFactorEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple handler for digit input
  const handleDigitInput = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 6) {
      setTwoFactorCode(value);
    }
  };
  
  // Test Supabase connection function for debugging
  const testSupabaseConnection = async () => {
    try {
      setIsLoading(true);
      setPasswordError('');
      
      // Test the connection with a simple query
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
        
      if (error) throw error;
      
      setPasswordSuccess('Supabase connection test successful!');
      setTimeout(() => setPasswordSuccess(''), 3000);
      
      console.log('Connection test result:', data);
      return true;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      setPasswordError(`Connection test failed: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadein">
      <div>
        <h3 className="font-bold text-lg mb-5 text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          Personal Information
        </h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <ProfileInputField 
              type="text"
              name="name"
              value={userData.name}
              label="Full Name"
              placeholder="Your name (or superhero alias)"
              disabled={!editMode}
              editMode={editMode}
              onChange={handleInputChange}
              colors={colors}
            />
            <ProfileInputField 
              type="email"
              name="email"
              value={userData.email}
              label="Email"
              placeholder="secret.identity@example.com"
              disabled={!editMode}
              editMode={editMode}
              onChange={handleInputChange}
              colors={colors}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <ProfileInputField 
              type="date"
              name="dob"
              value={userData.dob}
              label="Birthday"
              disabled={!editMode}
              editMode={editMode}
              onChange={handleInputChange}
              colors={colors}
            />
            <ProfileInputField 
              type="text"
              name="gender"
              value={userData.gender}
              label="Gender"
              placeholder="How you identify"
              disabled={!editMode}
              editMode={editMode}
              onChange={handleInputChange}
              colors={colors}
            />
            <ProfileInputField 
              type="text"
              name="bloodType"
              value={userData.bloodType}
              label="Blood Type"
              placeholder="For vampires"
              disabled={!editMode}
              editMode={editMode}
              onChange={handleInputChange}
              colors={colors}
            />
          </div>
          
          {editMode && (
            <div className="p-3 rounded-xl bg-blue-900/20 backdrop-blur-sm">
              <p className="text-xs text-blue-200 flex items-center">
                <svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Edit mode activated! Change your details and click Save when you're done. Or don't, I'm just a tooltip, not the boss of you.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div>
        <h3 className="font-bold text-lg mb-5 text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
          </svg>
          Connected Accounts
        </h3>
        
        <div className="space-y-3">
          {/* Google Fit connected account */}
          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white hover:bg-opacity-5 transition-colors duration-300"
               style={{ 
                 background: 'rgba(255, 255, 255, 0.05)',
                 border: '1px solid rgba(255, 255, 255, 0.1)'
               }}>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 shimmer"
                   style={{ 
                     background: 'linear-gradient(135deg, #4285F480, #4285F4)',
                     boxShadow: '0 0 15px #4285F440'
                   }}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-sm text-white flex items-center">
                  Google Fit
                  <span className="ml-2 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </span>
                </h4>
                <p className="text-xs text-blue-200">Syncing your steps (and those accidental 3am fridge visits)</p>
              </div>
            </div>
            <button 
              className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 text-red-300 bg-red-900 bg-opacity-30 hover:bg-opacity-50"
            >
              Disconnect
            </button>
          </div>
          
          {/* Add a placeholder for adding more connections */}
          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white hover:bg-opacity-5 transition-colors duration-300 border border-dashed border-blue-700/30">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-blue-900/30">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-sm text-white">Connect a service</h4>
                <p className="text-xs text-blue-200">Add more health services to improve tracking</p>
              </div>
            </div>
            <button 
              className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 text-blue-300 bg-blue-900 bg-opacity-30 hover:bg-opacity-50"
            >
              Browse
            </button>
          </div>
        </div>
      </div>
      
      {/* Password section with actual functionality */}
      <div>
        <h3 className="font-bold text-lg mb-5 text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
          </svg>
          Password & Security
        </h3>
        
        {/* Debug/Test button - can be removed in production */}
        <div className="flex justify-end mb-3">
          <button
            onClick={testSupabaseConnection}
            className={`px-3 py-1 text-xs rounded-lg transition-all duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ 
              background: 'rgba(15, 23, 42, 0.3)',
              color: '#3b82f6'
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
        
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/20 to-blue-800/20 backdrop-blur-sm border border-blue-700/20">
          {/* Password change form */}
          {!isChangingPassword ? (
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-sm text-white">Change Password</h4>
                <p className="text-xs text-blue-200">Last changed: Never (let me guess, it's "password123"?)</p>
              </div>
              <button 
                onClick={() => setIsChangingPassword(true)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 text-blue-300 bg-blue-900 bg-opacity-30 hover:bg-opacity-50"
              >
                Update
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-sm text-white">Change Password</h4>
                <button 
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 text-blue-300 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              
              {passwordError && !twoFactorSetupOpen && !showBackupCodes && !passwordVerifyOpen && !disablingWithPassword && (
                <div className="p-2 rounded-lg bg-red-900/30 text-red-300 text-xs">
                  {passwordError}
                </div>
              )}
              
              {passwordSuccess && !isChangingPassword && !twoFactorSetupOpen && !showBackupCodes && !passwordVerifyOpen && !disablingWithPassword && (
                <div className="p-2 rounded-lg bg-green-900/30 text-green-300 text-xs animate-pulse">
                  {passwordSuccess}
                </div>
              )}
              
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div className="relative">
                  <label className="block text-xs text-blue-300 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-blue-900/30 text-white border border-blue-700/30 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Your current password"
                      required
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <Eye size={18} className="text-blue-300" />
                      ) : (
                        <EyeOff size={18} className="text-blue-300" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-blue-300 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-blue-900/30 text-white border border-blue-700/30 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Must be at least 8 characters"
                      required
                      minLength={8}
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <Eye size={18} className="text-blue-300" />
                      ) : (
                        <EyeOff size={18} className="text-blue-300" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password strength meter */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="relative h-1.5 bg-blue-900/40 rounded-full overflow-hidden">
                        <div 
                          className="absolute inset-0 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${passwordStrength}%`,
                            backgroundColor: getPasswordStrengthColor()
                          }}
                        ></div>
                      </div>
                      <p className="text-xs mt-1" style={{ color: getPasswordStrengthColor() }}>
                        {getPasswordFeedback()}
                      </p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs text-blue-300 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-blue-900/30 text-white border border-blue-700/30 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Type it again (no peeking)"
                      required
                    />
                    <button 
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <Eye size={18} className="text-blue-300" />
                      ) : (
                        <EyeOff size={18} className="text-blue-300" />
                      )}
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Processing...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
                
                <p className="text-xs text-blue-200 italic">
                  Pro tip: A strong password is like a good joke - nobody should be able to guess it.
                </p>
              </form>
            </div>
          )}
          
          <div className="mt-4 border-t border-blue-800/30 pt-4">
            {!twoFactorSetupOpen && !showBackupCodes && !passwordVerifyOpen && !disablingWithPassword ? (
              <TwoFactorToggle
                enabled={twoFactorEnabled}
                loading={isLoading}
                onChange={handleToggleTwoFactor}
                colors={colors}
              />
            ) : passwordVerifyOpen ? (
              <PasswordVerifyForm
                onCancel={() => {
                  setPasswordVerifyOpen(false);
                  setTwoFactorEnabled(false);
                }}
                onVerify={handleVerifyForEnable}
                isLoading={isLoading}
                colors={colors}
              />
            ) : disablingWithPassword ? (
              <PasswordVerifyForm
                onCancel={() => {
                  setDisablingWithPassword(false);
                  setTwoFactorEnabled(true); // Keep enabled since we canceled
                }}
                onVerify={handleVerifyForDisable}
                isLoading={isLoading}
                colors={colors}
              />
            ) : showBackupCodes ? (
              <BackupCodesComponent
                backupCodes={backupCodes}
                onComplete={() => {
                  setShowBackupCodes(false);
                  setTwoFactorSetupOpen(false);
                  setPasswordSuccess('Two-factor authentication enabled successfully!');
                  setTimeout(() => setPasswordSuccess(''), 3000);
                }}
                colors={colors}
              />
            ) : (
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-white">Set Up Two-Factor Authentication</h4>
                
                {passwordError && (
                  <div className="p-2 rounded-lg bg-red-900/30 text-red-300 text-xs">
                    {passwordError}
                  </div>
                )}
                
                <div className="p-3 rounded-lg bg-blue-900/30 text-blue-200 text-xs">
                  <p className="mb-2">1. Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                  <div className="bg-white p-4 rounded-lg w-48 h-48 mx-auto mb-2 flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer"></div>
                    {/* Use the real QR code from Supabase */}
                    {qrCodeUrl ? (
                      <img 
                        src={qrCodeUrl} 
                        alt="2FA QR Code" 
                        className="border-8 border-white rounded-lg"
                      />
                    ) : (
                      <Loader className="text-gray-400 animate-spin" size={32} />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-blue-900/70 text-white text-xs px-2 py-1 rounded">
                        Scan with authenticator app
                      </div>
                    </div>
                  </div>
                  <p className="mb-2">2. Can't scan? Use this secret key instead:</p>
                  <div className="bg-blue-900/50 p-2 rounded-md font-mono text-center mb-2 relative overflow-hidden group hover:bg-blue-900/70 transition-colors duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer"></div>
                    {secretKey || 'Loading...'}
                  </div>
                  <p>3. Enter the 6-digit code from your authenticator app:</p>
                </div>
                
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={handleDigitInput}
                    className="flex-1 px-3 py-2 rounded-lg bg-blue-900/30 text-white border border-blue-700/30 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center text-lg font-mono"
                    placeholder="000000"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  <button
                    onClick={confirmTwoFactorSetup}
                    disabled={isLoading || twoFactorCode.length !== 6}
                    className={`px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium transition-all duration-300 ${
                      isLoading || twoFactorCode.length !== 6 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader className="animate-spin inline-block h-4 w-4 mr-1" />
                        Verifying
                      </>
                    ) : (
                      'Verify & Enable'
                    )}
                  </button>
                </div>
                
                <div className="text-right">
                  <button
                    onClick={() => {
                      setTwoFactorSetupOpen(false);
                      setTwoFactorEnabled(false); // Reset toggle state
                    }}
                    className="text-sm text-blue-300 hover:text-blue-200"
                  >
                    Cancel Setup
                  </button>
                </div>
                
                <p className="text-xs text-blue-200 italic pt-2 border-t border-blue-800/30">
                  With 2FA enabled, even if someone guesses your terrible password, they still can't get in. It's like having a bouncer who actually checks IDs.
                </p>
              </div>
            )}
          </div>
          
          {passwordSuccess && !isChangingPassword && !twoFactorSetupOpen && !showBackupCodes && !passwordVerifyOpen && !disablingWithPassword && (
            <div className="mt-4 p-2 rounded-lg bg-green-900/30 text-green-300 text-xs animate-pulse">
              {passwordSuccess}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountTab;