// The issue is in the main component HealthAssistantUI (index.jsx)
// The problem is that the isAuthenticated state isn't persisting properly,
// and the authentication flow has a logical issue

// Update in components/HealthAssistantUI/index.jsx:

import React, { useState, useEffect } from 'react';
import { colors } from './colors';
import SplashScreen from './SplashScreen';
import NavButton from './NavButton';

// Import screens
import DashboardScreen from './screens/DashboardScreen';
import MedicationsScreen from './screens/MedicationsScreen';
import SymptomsScreen from './screens/SymptomsScreen';
import ConnectScreen from './screens/ConnectScreen';
import EducationScreen from './screens/EducationScreen';
import EmergencyScreen from './screens/EmergencyScreen';
import ProfileScreen from './screens/ProfileScreen';
import SignInScreen from './screens/SignInScreen';
import RegisterScreen from './screens/RegisterScreen';

// Main component to display the UI design
const HealthAssistantUI = () => {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState(null);

  // Authentication state - get from localStorage if available
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if we have an auth token in localStorage
    const savedAuth = localStorage.getItem('healthsync_auth');
    return savedAuth === 'true';
  });

  // Save authentication state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('healthsync_auth', isAuthenticated);
  }, [isAuthenticated]);

  // Splash screen effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      
      // If not authenticated, set active screen to signin
      if (!isAuthenticated) {
        setActiveScreen('signin');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

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
  
  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveScreen('signin');
  };

  // Renders different screens based on selection
  const renderScreen = () => {
    // If not authenticated, show login or register screens
    if (!isAuthenticated) {
      if (activeScreen === 'register') {
        return <RegisterScreen colors={colors} setActiveScreen={setActiveScreen} setIsAuthenticated={setIsAuthenticated} />;
      }
      
      return <SignInScreen colors={colors} setActiveScreen={setActiveScreen} setIsAuthenticated={setIsAuthenticated} />;
    }
    
    // If authenticated, show the selected screen
    switch(activeScreen) {
      case 'dashboard':
        return <DashboardScreen colors={colors} setActiveScreen={setActiveScreen} />;
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
        return <ProfileScreen colors={colors} setActiveScreen={setActiveScreen} setIsAuthenticated={handleLogout} />;
      default:
        return <DashboardScreen colors={colors} setActiveScreen={setActiveScreen} />;
    }
  };

  return (
    <div className="font-sans antialiased" style={{ backgroundColor: colors.background }}>
      {/* Mobile frame */}
      <div className="mx-auto my-8 bg-black rounded-3xl overflow-hidden shadow-2xl relative"
           style={{ width: '375px', height: '812px', boxShadow: `0 25px 50px -12px ${colors.primary}30` }}>
        {/* Status bar */}
        <div className="bg-black text-white h-6 flex items-center justify-between px-6">
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
        
        {/* App content with enhanced transitions */}
        <div className="bg-white h-full relative overflow-hidden">
          {showSplash ? <SplashScreen colors={colors} /> : (
            <>
              <div className="pb-20 overflow-y-auto h-full">
                <div className={`transition-all duration-300 ${activeTab ? 'opacity-0 transform translate-x-8' : 'opacity-100'}`}>
                  {renderScreen()}
                </div>
              </div>
              
              {/* Only show navigation when authenticated */}
              {isAuthenticated && (
                <div className="fixed bottom-0 w-full backdrop-blur-xl bg-white bg-opacity-70 border-t border-blue-100 flex justify-around items-center h-20 px-2 shadow-lg" 
                     style={{ 
                       maxWidth: '375px',
                       boxShadow: `0 -10px 30px -5px ${colors.primary}20`
                     }}>
                  <NavButton 
                    icon="activity" 
                    label="Dashboard" 
                    active={activeScreen === 'dashboard'} 
                    onClick={() => activeScreen !== 'dashboard' && setActiveTab('dashboard')}
                    colors={colors}
                  />
                  <NavButton 
                    icon="calendar" 
                    label="Meds" 
                    active={activeScreen === 'medications'} 
                    onClick={() => activeScreen !== 'medications' && setActiveTab('medications')}
                    colors={colors}
                  />
                  <NavButton 
                    icon="heart" 
                    label="Symptoms" 
                    active={activeScreen === 'symptoms'} 
                    onClick={() => activeScreen !== 'symptoms' && setActiveTab('symptoms')}
                    colors={colors}
                  />
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
      `}</style>
    </div>
  );
};

export default HealthAssistantUI;