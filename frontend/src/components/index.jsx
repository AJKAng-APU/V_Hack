import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { useAuth } from './AuthProvider';
import SplashScreen from './SplashScreen';
import NavButton from './NavButton';

// Import screens
import DashboardScreen from './screens/DashboardScreen';
import DoctorDashboardScreen from './screens/Connect/DoctorDashboardScreen'; // New doctor dashboard
import MedicationsScreen from './screens/MedicationsScreen';
import SymptomsScreen from './screens/SymptomsScreen';
import ConnectScreen from './screens/Connect/ConnectScreen';
import EducationScreen from './screens/EducationScreen';
import EmergencyScreen from './screens/EmergencyScreen';
import ProfileScreen from './screens/ProfileScreen';
import SignInScreen from './screens/SignInScreen';
import RegisterScreen from './screens/RegisterScreen';
import BiorhythmScreen from './screens/BiorhythmScreen';

// Wrap the main component with ThemeProvider
const HealthAssistantApp = () => {
  return (
    <ThemeProvider>
      <HealthAssistantUI />
    </ThemeProvider>
  );
};

// Main component to display the UI design
const HealthAssistantUI = () => {
  // Get theme from context
  const { colors, isDarkMode, toggleDarkMode } = useTheme();
  
  // Get auth context
  const { user, isAuthenticated } = useAuth();
  
  // Add state to manage authentication in UI
  const [isAppAuthenticated, setIsAuthenticated] = useState(isAuthenticated);
  
  // Update local state when auth context changes
  useEffect(() => {
    setIsAuthenticated(isAuthenticated);
  }, [isAuthenticated]);
  
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState(null);

  // Check if the user is a doctor
  const isDoctor = user?.isDoctor || false;
  
  // Create a preferences state to share across components
  const [preferences, setPreferences] = useState({
    notifications: true,
    reminders: true,
    dataSharing: false,
    darkMode: isDarkMode, // Connect to the theme context
    biometrics: true
  });
  
  // Handle toggle of preferences
  const handleToggle = (key) => {
    if (key === 'darkMode') {
      // Toggle the theme context when dark mode is toggled
      toggleDarkMode();
    }
    
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  // Update preferences when theme changes from outside
  useEffect(() => {
    setPreferences(prev => ({
      ...prev,
      darkMode: isDarkMode
    }));
  }, [isDarkMode]);

  // Splash screen effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      
      // If not authenticated, set active screen to signin
      if (!isAppAuthenticated) {
        setActiveScreen('signin');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isAppAuthenticated]);

  // Add tab switching animation
  useEffect(() => {
    if (activeTab !== null) {
      const timeout = setTimeout(() => {
        setActiveScreen(activeTab);
        setActiveTab(null);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [activeTab]);

  // Renders different screens based on selection
  const renderScreen = () => {
    // If not authenticated, show login or register screens
    if (!isAppAuthenticated) {
      if (activeScreen === 'register') {
        return <RegisterScreen 
                 colors={colors} 
                 setActiveScreen={setActiveScreen} 
                 setIsAuthenticated={setIsAuthenticated}
               />;
      }
      
      return <SignInScreen 
               colors={colors} 
               setActiveScreen={setActiveScreen} 
               setIsAuthenticated={setIsAuthenticated}
             />;
    }
    
    // If authenticated, show the selected screen
    switch(activeScreen) {
      case 'dashboard':
        // Use different dashboard based on user type
        return isDoctor ? 
          <DoctorDashboardScreen colors={colors} setActiveScreen={setActiveScreen} /> :
          <DashboardScreen colors={colors} setActiveScreen={setActiveScreen} />;
      case 'medications':
        return <MedicationsScreen colors={colors} setActiveScreen={setActiveScreen} />;
      case 'symptoms':
        return <SymptomsScreen colors={colors} setActiveScreen={setActiveScreen} />;
      case 'connect':
        return <ConnectScreen colors={colors} setActiveScreen={setActiveScreen} />;
      case 'education':
        return <EducationScreen colors={colors} setActiveScreen={setActiveScreen} />;
      case 'emergency':
        return <EmergencyScreen colors={colors} setActiveScreen={setActiveScreen} />;
      case 'profile':
        return <ProfileScreen 
                 colors={colors} 
                 setActiveScreen={setActiveScreen} 
                 setIsAuthenticated={setIsAuthenticated}
                 preferences={preferences}
                 handleToggle={handleToggle} 
               />;
      case 'biorhythm':
        return <BiorhythmScreen colors={colors} setActiveScreen={setActiveScreen} />;
      default:
        return <DashboardScreen colors={colors} setActiveScreen={setActiveScreen} />;
    }
  };

  return (
    <div className={`font-sans antialiased transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`} 
         style={{ backgroundColor: colors.background }}>
      {/* Mobile frame - enhanced with dark mode colors */}
      <div className="mx-auto my-8 rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-500"
           style={{ 
             width: '375px', 
             height: '812px', 
             boxShadow: `0 25px 50px -12px ${colors.primary}40`,
             backgroundColor: isDarkMode ? colors.darkBg : 'black' // Frame color changes with theme
           }}>
        {/* Status bar */}
        <div className="h-6 flex items-center justify-between px-6 transition-colors duration-300"
             style={{ 
               backgroundColor: isDarkMode ? colors.darkBg : 'black',
               color: 'white'
             }}>
          <span className="text-xs">9:41</span>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <div className="w-4 h-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              </svg>
            </div>
          </div>
        </div>
        
        {/* App content with enhanced transitions for dark mode */}
        <div className="h-full relative overflow-hidden transition-colors duration-500" 
             style={{ backgroundColor: isDarkMode ? colors.background : 'white' }}>
          {showSplash ? <SplashScreen colors={colors} /> : (
            <>
              <div className="pb-20 overflow-y-auto h-full">
                <div className={`transition-all duration-300 ${activeTab ? 'opacity-0 transform translate-x-8' : 'opacity-100'}`}>
                  {renderScreen()}
                </div>
              </div>
              
              {/* Only show navigation when authenticated */}
              {isAppAuthenticated && (
                <div className="fixed bottom-0 w-full backdrop-blur-xl border-t flex justify-around items-center h-20 px-2 shadow-lg transition-all duration-500" 
                     style={{ 
                       maxWidth: '375px',
                       backgroundColor: isDarkMode ? `${colors.darkBg}90` : 'rgba(255, 255, 255, 0.7)',
                       borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
                       boxShadow: `0 -10px 30px -5px ${colors.primary}20`
                     }}>
                  <NavButton 
                    icon="activity" 
                    label="Dashboard" 
                    active={activeScreen === 'dashboard'} 
                    onClick={() => activeScreen !== 'dashboard' && setActiveTab('dashboard')}
                    colors={colors}
                  />
                  
                  {isDoctor ? (
                    // Doctor-specific nav button
                    <NavButton 
                      icon="calendar" 
                      label="Schedule" 
                      active={activeScreen === 'schedule'} 
                      onClick={() => activeScreen !== 'schedule' && setActiveTab('schedule')}
                      colors={colors}
                    />
                  ) : (
                    // Patient-specific nav button
                    <NavButton 
                      icon="calendar" 
                      label="Meds" 
                      active={activeScreen === 'medications'} 
                      onClick={() => activeScreen !== 'medications' && setActiveTab('medications')}
                      colors={colors}
                    />
                  )}
                  
                  {isDoctor ? (
                    // Doctor-specific nav button
                    <NavButton 
                      icon="users" 
                      label="Patients" 
                      active={activeScreen === 'patients'} 
                      onClick={() => activeScreen !== 'patients' && setActiveTab('patients')}
                      colors={colors}
                    />
                  ) : (
                    // Patient-specific nav button
                    <NavButton 
                      icon="heart" 
                      label="Symptoms" 
                      active={activeScreen === 'symptoms'} 
                      onClick={() => activeScreen !== 'symptoms' && setActiveTab('symptoms')}
                      colors={colors}
                    />
                  )}
                  
                  <NavButton 
                    icon="message-circle" 
                    label="Connect" 
                    active={activeScreen === 'connect'} 
                    onClick={() => activeScreen !== 'connect' && setActiveTab('connect')}
                    colors={colors}
                  />
                  
                  <NavButton 
                    icon="user" 
                    label="Profile" 
                    active={activeScreen === 'profile'} 
                    onClick={() => activeScreen !== 'profile' && setActiveTab('profile')}
                    colors={colors}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      @keyframes breathe {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes shimmer {
        0% { background-position: -100% 0; }
        100% { background-position: 200% 0; }
      }
      .animate-float {
        animation: float 3s ease-in-out infinite;
      }
      .animate-breathe {
        animation: breathe 4s ease-in-out infinite;
      }
      .shimmer {
        background: linear-gradient(90deg, 
          rgba(255,255,255,0) 0%, 
          rgba(255,255,255,0.2) 50%, 
          rgba(255,255,255,0) 100%);
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
      }
      
      /* Dark mode specific animations */
      .dark .shimmer {
        background: linear-gradient(90deg, 
          rgba(30,41,59,0) 0%, 
          rgba(30,41,59,0.3) 50%, 
          rgba(30,41,59,0) 100%);
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
      }
      
      /* Global transitions for dark mode */
      .dark-mode-transition,
      .dark-mode-transition * {
        transition: background-color 0.5s ease, 
                    color 0.5s ease, 
                    border-color 0.5s ease,
                    box-shadow 0.5s ease,
                    transform 0.3s ease;
      }
    `}</style>
    </div>
  );
};

export default HealthAssistantApp;