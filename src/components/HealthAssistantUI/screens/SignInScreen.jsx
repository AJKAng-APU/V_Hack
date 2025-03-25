import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

// Sign In Screen with ultra-enhanced futuristic blue theme and impressive animations
const SignInScreen = ({ colors, setActiveScreen, setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  
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
  
  const handleSignIn = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Check if it's a "secret" demo login
    if (email.toLowerCase() === 'demo@healthsync.com' && password === 'demo') {
      setTimeout(() => {
        // Set local storage for persistence
        localStorage.setItem('healthsync_auth', 'true');
        
        // Update state and redirect
        setIsAuthenticated(true);
        setActiveScreen('dashboard');
        setIsLoading(false);
      }, 500);
      return;
    }
    
    // Simulate authentication delay
    setTimeout(() => {
      // For demo purposes, let's pretend any email with a password length > 3 works
      if (password.length > 3) {
        // Set local storage for persistence
        localStorage.setItem('healthsync_auth', 'true');
        
        // Update state and redirect
        setIsAuthenticated(true);
        setActiveScreen('dashboard');
      } else {
        // Show "failed" state
        setLoginAttempts(loginAttempts + 1);
        // Reset loading state
        setIsLoading(false);
      }
    }, 1000);
  };
  
  // Get sassy message based on login attempts
  const getSassyMessage = () => {
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
  
  return (
    <div className="p-6 pb-8 h-full flex flex-col overflow-hidden relative"
         style={{
           background: `radial-gradient(circle at 30% 50%, ${colors.primary}05, transparent 35%),
                       radial-gradient(circle at 70% 80%, ${colors.accent}05, transparent 35%)`,
         }}>
      {/* Animated floating orbs in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full opacity-20"
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
            
             <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center shadow-lg" 
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
            Young
          </h1>
          <p className="text-base" style={{ color: colors.textSecondary }}>
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">kinda bossy</span> Health Assistant
          </p>
        </div>
        
        {/* Sign in form with enhanced glass effects and animations */}
        <div className="w-full max-w-sm relative" 
             style={{ 
               transform: `translate3d(${mousePosition.x * -5}px, ${mousePosition.y * -5}px, 0)`,
               transition: 'transform 0.2s ease-out' 
             }}>
          <div className="absolute -inset-6 rounded-3xl opacity-20 bg-blue-500 blur-xl"></div>
          <div className="relative p-6 rounded-2xl backdrop-blur-md border border-white border-opacity-20"
               style={{ 
                 background: 'rgba(255, 255, 255, 0.1)', 
                 boxShadow: `
                   0 10px 25px -5px rgba(0, 0, 0, 0.1),
                   0 0 10px ${colors.primary}20
                 `
               }}>
            
            {/* Sassy message that appears on failed logins */}
            {getSassyMessage() && (
              <div className="p-3 rounded-xl bg-white bg-opacity-10 backdrop-blur-md mb-4 animate-bounce-once text-center">
                <p className="text-sm text-black">{getSassyMessage()}</p>
              </div>
            )}
            
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className={`block text-sm font-medium transition-all duration-300 ${emailFocused ? 'text-blue-500' : ''}`}
                         style={{ color: emailFocused ? colors.accent : colors.textPrimary }}>
                    Email
                  </label>
                  
                  <span className="text-xs text-black cursor-pointer">
                    Try demo@healthsync.com
                  </span>
                </div>
                <div className={`relative rounded-xl overflow-hidden transition-all duration-300 ${emailFocused ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-200' : 'shadow-sm'}`}
                     style={{ 
                       boxShadow: emailFocused ? `0 0 15px ${colors.primary}40` : `0 4px 6px -1px ${colors.primary}10` 
                     }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    className="w-full px-4 py-4 bg-white bg-opacity-10 backdrop-blur-md border-none focus:outline-none text-white"
                    placeholder="name@example.com"
                    required
                  />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600/10 to-cyan-400/10"></div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className={`block text-sm font-medium transition-all duration-300 ${passwordFocused ? 'text-blue-500' : ''}`}
                         style={{ color: passwordFocused ? colors.accent : colors.textPrimary }}>
                    Password
                  </label>
                  <button type="button" className="text-xs font-medium transition-all duration-300 hover:text-blue-400"
                          style={{ color: colors.primary }}>
                    Forgot password?
                  </button>
                </div>
                <div className={`relative rounded-xl overflow-hidden transition-all duration-300 ${passwordFocused ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-200' : 'shadow-sm'}`}
                     style={{ 
                       boxShadow: passwordFocused ? `0 0 15px ${colors.primary}40` : `0 4px 6px -1px ${colors.primary}10` 
                     }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className="w-full px-4 py-4 bg-white bg-opacity-10 backdrop-blur-md border-none focus:outline-none text-black pr-12"
                    placeholder={loginAttempts > 2 ? "Hint: try 'demo'" : "••••••••"}
                    required
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white opacity-70 hover:opacity-100 transition-opacity"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    )}
                  </button>
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600/10 to-cyan-400/10"></div>
                </div>
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
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>{loginAttempts > 1 ? "Let's hope it works this time..." : "Signing in..."}</span>
                  </div>
                ) : (
                  loginAttempts > 2 ? "Oh alright, let me in" : "Sign in"
                )}
              </button>
            </form>
            
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white border-opacity-10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 text-black text-opacity-60 backdrop-blur-sm bg-white bg-opacity-5 rounded-full">Or continue with</span>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { color: '#4285F4', name: 'Google', icon: 'M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z' },
                  { color: '#000000', name: 'Apple', icon: 'M17.05,11.97 C17.0516669,10.46 16.5049995,8.99666667 15.5,7.87 C14.5008904,6.77666667 13.0716671,6.177 11.5,6.17 C9.9283329,6.177 8.49910963,6.77666667 7.5,7.87 C6.49500055,8.99666667 5.94833306,10.46 5.95,11.97 C5.94833306,13.48 6.49500055,14.9433333 7.5,16.07 C8.49910963,17.1633333 9.9283329,17.763 11.5,17.77 C13.0716671,17.763 14.5008904,17.1633333 15.5,16.07 C16.5049995,14.9433333 17.0516669,13.48 17.05,11.97 Z M19.05,11.97 C19.0516669,13.9716667 18.1916755,15.8683333 16.71,17.21 C15.2410779,18.56 13.405392,19.297 11.5,19.29 C9.59460796,19.297 7.75892207,18.56 6.29,17.21 C4.80832447,15.8683333 3.94833306,13.9716667 3.95,11.97 C3.94833306,9.96833333 4.80832447,8.07166667 6.29,6.73 C7.75892207,5.38 9.59460796,4.643 11.5,4.65 C13.405392,4.643 15.2410779,5.38 16.71,6.73 C18.1916755,8.07166667 19.0516669,9.96833333 19.05,11.97 Z' },
                  { color: '#1DA1F2', name: 'Twitter', icon: 'M22.05,5.7c-0.8,0.3-1.6,0.6-2.4,0.7c0.9-0.5,1.5-1.3,1.8-2.2c-0.8,0.5-1.7,0.8-2.6,1 c-0.8-0.8-1.8-1.3-3-1.3c-2.3,0-4.1,1.9-4.1,4.2c0,0.3,0,0.6,0.1,0.9C8.2,8.8,5.5,7,3.8,4.5C3.5,5.1,3.3,5.8,3.3,6.5 c0,1.5,0.7,2.7,1.8,3.5c-0.7,0-1.3-0.2-1.9-0.5c0,0,0,0,0,0.1c0,2,1.4,3.7,3.3,4.1c-0.3,0.1-0.7,0.1-1.1,0.1c-0.3,0-0.5,0-0.8-0.1 c0.5,1.7,2.1,2.9,3.9,2.9c-1.4,1.1-3.2,1.8-5.2,1.8c-0.3,0-0.7,0-1-0.1c1.9,1.2,4.1,1.9,6.4,1.9c7.7,0,11.9-6.4,11.9-11.9 c0-0.2,0-0.4,0-0.5C20.8,7.3,21.5,6.5,22.05,5.7z' }
                ].map((provider, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="group relative flex justify-center py-2 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden tooltip-container"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <span className="tooltip">{provider.name}</span>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <svg className="w-5 h-5 z-10 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill={provider.color}>
                      <path d={provider.icon} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center z-10">
        <p className="text-sm text-black text-opacity-80">
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
        input {
          color: white;
        }
        .animate-bounce-once {
          animation: bounce-once 0.8s ease;
        }
        .tooltip-container {
          position: relative;
        }
        .tooltip {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
          white-space: nowrap;
        }
        .tooltip-container:hover .tooltip {
          opacity: 1;
        }
        .tooltip:after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: rgba(0, 0, 0, 0.7) transparent transparent transparent;
        }
      `}</style>
    </div>
  );
};

export default SignInScreen;