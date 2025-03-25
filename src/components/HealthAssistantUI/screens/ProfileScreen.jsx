import React, { useState, useEffect } from 'react';
import { ChevronRight, AlertTriangle, X } from 'lucide-react';

const ProfileScreen = ({ colors, setActiveScreen, setIsAuthenticated }) => {
  const [activeTab, setActiveTab] = useState('account');
  const [hoveredTab, setHoveredTab] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // User data
  const [userData, setUserData] = useState({
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    avatar: "/User_4.png",
    dob: "1985-04-12",
    gender: "Female",
    height: "168",
    weight: "65",
    bloodType: "A+",
    allergies: ["Penicillin", "Peanuts"],
    conditions: ["Type 2 Diabetes", "Hypertension"],
    goalSteps: 10000,
    goalSleep: 8,
    goalWater: 2000
  });
  
  // Toggle switches
  const [preferences, setPreferences] = useState({
    notifications: true,
    reminders: true,
    dataSharing: false,
    darkMode: false,
    biometrics: true
  });
  
  // Mouse position for 3D effects
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Focus states
  const [focusedField, setFocusedField] = useState(null);
  
  // Generate sassy profile tips
  const [sassyTip, setSassyTip] = useState('');
  const sassyTips = [
    "Drinking more water might help with those headaches... or it might just make you visit the bathroom more often.",
    "Your sleep pattern looks like my WiFi signal - occasionally strong but mostly unreliable.",
    "Congrats on taking 10,000 steps yesterday! Your couch must be feeling neglected.",
    "Your heart rate during your last workout suggests you're either getting fitter or saw someone attractive walk by.",
    "According to your data, you've spent more time scrolling through this app than actually exercising.",
    "Your medication adherence is impressive! If only you remembered to call your mother that consistently.",
    "Your blood pressure readings are as stable as my dating life - wildly unpredictable.",
    "Based on your activity, I'm prescribing less Netflix and more movement. Just a suggestion, I'm not your mom.",
    "Your stress levels seem high. Have you tried yoga? Or just screaming into a pillow? Both work."
  ];
  
  useEffect(() => {
    // Set a random sassy tip only once when the component mounts
    const randomTip = sassyTips[Math.floor(Math.random() * sassyTips.length)];
    setSassyTip(randomTip);
  
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth) - 0.5;
      const y = (clientY / window.innerHeight) - 0.5;
      setMousePosition({ x, y });
    };
  
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []); // Empty dependency array ensures it runs only once
  
  
  const handleToggle = (key) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
    
    // Show playful messages for toggle actions
    if (key === 'notifications' && preferences.notifications) {
      setSassyTip("Silent mode activated. I'll stop bugging you, but don't blame me when you miss something important!");
    } else if (key === 'notifications' && !preferences.notifications) {
      setSassyTip("Look who's back! I've got so many notifications to send you now.");
    } else if (key === 'darkMode' && !preferences.darkMode) {
      setSassyTip("Welcome to the dark side. We have cookies... and better battery life.");
    }
  };
  
  const handleLogout = () => {
    // Clear any stored authentication
    localStorage.removeItem('healthsync_auth');
    
    // Update parent component state
    setIsAuthenticated(false);
    setActiveScreen('signin');
  };
  
  const handleSave = () => {
    // Simulate saving
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setEditMode(false);
    }, 1500);
  };
  
  // Generate a random number between min and max
  const random = (min, max) => Math.random() * (max - min) + min;
  
  // Generate a set of floating orbs for background
  const generateOrbs = (count) => {
    return [...Array(count)].map((_, i) => ({
      id: i,
      size: random(50, 120),
      x: random(0, 100),
      y: random(0, 100),
      delay: random(0, 5),
      duration: random(15, 25)
    }));
  };
  
  const orbs = generateOrbs(6);
  
  // Render a 3D input field with focus effects
  const renderInputField = (type, name, value, label, placeholder = "", disabled = !editMode) => {
    const isFocused = focusedField === name;
    
    // Get sassy placeholder based on field
    const getSassyPlaceholder = () => {
      if (name === 'name') return "Your name (or whatever you go by)";
      if (name === 'email') return "yourname@example.com"; 
      if (name === 'height') return "Height in cm (no fibbing)";
      if (name === 'weight') return "Weight in kg (our secret)";
      if (name === 'goalSteps') return "How many steps before you collapse";
      if (name === 'goalSleep') return "Hours of beauty sleep needed";
      if (name === 'goalWater') return "Milliliters to prevent desert-like skin";
      return placeholder;
    };
    
    return (
      <div className="space-y-1">
        <label className={`block text-sm font-medium transition-all duration-300 ${isFocused ? 'text-blue-400' : ''}`}
               style={{ color: isFocused ? colors.accent : 'white' }}>
          {label}
        </label>
        <div className={`relative rounded-xl overflow-hidden transition-all duration-300 transform
                       ${isFocused ? 'ring-2 ring-blue-500 shadow-lg scale-105' : 'shadow-sm scale-100'}
                       ${disabled ? 'opacity-80' : 'opacity-100'}`}
             style={{ 
               boxShadow: isFocused ? `0 0 15px ${colors.primary}80` : `0 4px 6px -1px ${colors.primary}20`,
               background: 'rgba(255, 255, 255, 0.07)'
             }}>
          <input
            type={type}
            name={name}
            value={value}
            onChange={(e) => {
              if (editMode) {
                setUserData({...userData, [name]: e.target.value});
              }
            }}
            onFocus={() => setFocusedField(name)}
            onBlur={() => setFocusedField(null)}
            className="w-full px-4 py-3 bg-transparent backdrop-blur-md border-none focus:outline-none text-white"
            placeholder={getSassyPlaceholder()}
            disabled={disabled}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600/10 to-cyan-400/10"></div>
          
          {disabled && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render the settings toggle switch with sassy labels
  const renderToggleSwitch = (id, label, description, value) => {
    // Get sassy description based on toggle state
    const getSassyDescription = () => {
      if (id === 'toggleNotifications') {
        return value 
          ? "We'll ping you for everything. Hope you like vibrations!" 
          : "You'll miss all the fun updates. Your choice.";
      }
      if (id === 'toggleReminders') {
        return value 
          ? "We'll nag you about your meds. For your own good!" 
          : "No reminders. Hope your memory is better than mine!";
      }
      if (id === 'toggleBiometrics') {
        return value 
          ? "Your fingerprint is the key. Very 007 of you." 
          : "Passcode it is. Old school, respectable.";
      }
      if (id === 'toggleDarkMode') {
        return value 
          ? "Easy on the eyes, tough on the battery." 
          : "Bright mode. Bold choice for 3am bathroom trips.";
      }
      if (id === 'toggleDataSharing') {
        return value 
          ? "Sharing is caring! Your data helps us help you." 
          : "Keeping your data to yourself. We're not offended... much.";
      }
      return description;
    };
    
    return (
      <div className="flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:bg-white hover:bg-opacity-5">
        <div>
          <h4 className="font-medium text-sm text-white">{label}</h4>
          <p className="text-xs text-blue-200">{getSassyDescription()}</p>
        </div>
        <div className="relative">
          <input 
            type="checkbox" 
            id={id}
            className="sr-only"
            checked={value}
            onChange={() => handleToggle(id.replace('toggle', '').toLowerCase())}
          />
          <label 
            htmlFor={id}
            className={`block w-14 h-8 rounded-full transition-all duration-500 cursor-pointer
                      ${value ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-slate-700'}`}
            style={{ 
              boxShadow: value ? `0 0 20px ${colors.primary}70` : 'none'
            }}
          >
            <span 
              className="block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-all duration-500 relative"
              style={{ 
                transform: value ? 'translateX(6px)' : 'translateX(0)',
                boxShadow: value ? '0 0 10px rgba(0, 255, 255, 0.5)' : '0 1px 3px rgba(0, 0, 0, 0.2)'
              }}
            >
              {value && (
                <span className="absolute inset-0 rounded-full animate-pulse bg-blue-200 opacity-50"></span>
              )}
            </span>
          </label>
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-6 pb-8 h-full overflow-auto relative"
         style={{
           background: `radial-gradient(circle at 70% 20%, ${colors.primary}20, transparent 50%),
                       radial-gradient(circle at 30% 80%, ${colors.accent}20, transparent 50%)`,
         }}>
      {/* Animated floating background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {orbs.map((orb) => (
          <div 
            key={orb.id}
            className="absolute rounded-full opacity-10"
            style={{
              width: orb.size + 'px',
              height: orb.size + 'px',
              left: orb.x + '%',
              top: orb.y + '%',
              background: `linear-gradient(135deg, ${colors.primary}80, ${colors.accent}60)`,
              filter: 'blur(20px)',
              animation: `floatOrb ${orb.duration}s ease-in-out infinite`,
              animationDelay: `${orb.delay}s`,
              transform: `translate3d(${mousePosition.x * -15}px, ${mousePosition.y * -15}px, 0)`
            }}
          />
        ))}
      </div>
      
      <header className="flex justify-between items-center mb-8 z-10 relative">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-white via-blue-300 to-blue-500 bg-clip-text text-transparent">Profile</h1>
          <p className="text-sm text-blue-200">Manage your account or whatever</p>
        </div>
        <button 
  onClick={handleLogout}
  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 relative overflow-hidden group tooltip-container" 
  style={{ 
    background: `linear-gradient(135deg, ${colors.danger}, ${colors.gradientAlt2})`,
    boxShadow: `0 0 15px ${colors.danger}40`
  }}>
  <span className="tooltip">Log Out</span>
  <div className="absolute inset-0 bg-black bg-opacity-20 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full"></div>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="z-10">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
</button>
      </header>
      
      {/* Sassy tip notification */}
      {sassyTip && !saveSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-md border border-blue-500/20 animate-bounce-subtle relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer"></div>
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-blue-100">{sassyTip}</p>
            </div>
            <button 
              onClick={() => setSassyTip('')}
              className="ml-2 text-blue-300 hover:text-blue-100 transition-colors duration-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Success message */}
      {saveSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-900/30 to-emerald-900/30 backdrop-blur-md border border-emerald-500/20 animate-bounce-subtle">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-emerald-100">Profile updated! Looking good there, superstar.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* User Profile Summary Card with parallax effects */}
      <div className="mb-8 p-6 rounded-2xl relative overflow-hidden transform hover:scale-102 transition-all duration-500" 
           style={{ 
             background: `linear-gradient(135deg, rgba(30, 64, 175, 0.8), rgba(8, 145, 178, 0.8))`,
             backdropFilter: 'blur(10px)',
             boxShadow: `0 20px 25px -5px ${colors.primary}50, 0 0 15px ${colors.accent}30`
           }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full animate-float" 
             style={{ 
               background: `radial-gradient(circle, ${colors.primaryLight}30, transparent 70%)`,
               transform: `translate(30%, -30%) translate3d(${mousePosition.x * 20}px, ${mousePosition.y * 20}px, 0)`,
               filter: 'blur(30px)'
             }}></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full animate-float" 
             style={{ 
               background: `radial-gradient(circle, ${colors.accent}20, transparent 70%)`,
               transform: `translate(-30%, 30%) translate3d(${mousePosition.x * -15}px, ${mousePosition.y * -15}px, 0)`,
               filter: 'blur(20px)',
               animationDelay: '1.5s'
             }}></div>
             
        <div className="relative flex items-center transition-all duration-300"
             style={{ transform: `translate3d(${mousePosition.x * -10}px, ${mousePosition.y * -10}px, 0)` }}>
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-70 blur-sm group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="w-16 h-16 rounded-full bg-blue-900 shadow-lg overflow-hidden relative border-2 border-white mr-5">
              <img src={userData.avatar} alt={userData.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent"></div>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center transform translate-x-1 translate-y-1 tooltip-container">
              <span className="tooltip">Change avatar</span>
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </div>
          </div>
          
          <div>
            <div className="flex items-end mb-1">
              <h2 className="text-2xl font-bold text-white mr-2 bg-clip-text">{userData.name}</h2>
              <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600/30 to-cyan-600/30 backdrop-blur-sm text-xs text-cyan-200 tooltip-container">
                <span className="tooltip">You're special!</span>
                Premium
              </div>
            </div>
            <p className="text-blue-100 text-sm">{userData.email}</p>
            
            <div className="mt-3 flex space-x-2">
              <button 
                onClick={() => setEditMode(!editMode)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center tooltip-container"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                <span className="tooltip">{editMode ? "Cancel editing" : "Edit profile"}</span>
                <svg className="w-3.5 h-3.5 mr-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                <span className="text-white">{editMode ? "Cancel" : "Edit Profile"}</span>
              </button>
              
              {editMode && (
                <button 
                  onClick={handleSave}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center bg-emerald-600 bg-opacity-70"
                >
                  <svg className="w-3.5 h-3.5 mr-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-white">Save Changes</span>
                </button>
              )}
              
              {!editMode && (
                <button 
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center tooltip-container"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.15)', 
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <span className="tooltip">Verification not needed, we trust you</span>
                  <svg className="w-3.5 h-3.5 mr-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-white">Verified!</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Membership status bar */}
        <div className="mt-6 pt-4 border-t border-white border-opacity-10">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-blue-200">Health Score</span>
            <span className="text-xs text-white font-medium">87/100 <span className="text-cyan-300">(better than 72% of users)</span></span>
          </div>
          <div className="w-full h-2 rounded-full bg-blue-900 bg-opacity-40 overflow-hidden">
            <div 
              className="h-full rounded-full shimmer" 
              style={{ 
                width: '87%', 
                background: 'linear-gradient(90deg, #3B82F6, #06B6D4)'
              }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Profile Navigation Tabs with glowing effect */}
      <div className="mb-8 flex p-1 rounded-xl bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-md">
        {[
          {id: 'account', label: 'Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'},
          {id: 'health', label: 'Health', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'},
          {id: 'preferences', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'},
          {id: 'privacy', label: 'Privacy', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'}
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            className={`flex-1 py-3 text-sm font-medium transition-all duration-500 relative rounded-lg ${
              activeTab === tab.id 
                ? 'text-white bg-gradient-to-br from-blue-600/80 to-blue-800/80 shadow-lg' 
                : 'text-blue-300 hover:text-white'
            }`}
            style={{
              transform: activeTab === tab.id ? 'translateY(-2px)' : 'none',
              boxShadow: activeTab === tab.id ? `0 10px 15px -3px ${colors.primary}40` : 'none'
            }}
          >
            <div className="flex flex-col items-center">
              <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}></path>
              </svg>
              <span>{tab.label}</span>
            </div>
            {activeTab === tab.id && (
              <div className="absolute inset-0 rounded-lg opacity-60 blur-sm -z-10"
                   style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})` }}></div>
            )}
          </button>
        ))}
      </div>
      
      {/* Content area with glass effect */}
      <div className="relative">
        <div className="absolute -inset-4 rounded-3xl opacity-10 bg-blue-500 blur-2xl"></div>
        <div className="relative p-6 rounded-2xl backdrop-blur-md border border-white border-opacity-10 min-h-[400px]"
             style={{ 
               background: 'rgba(13, 22, 47, 0.7)', 
               boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 0 15px ${colors.primary}30`
             }}>
          
          {/* Account Tab */}
          <div className={`transition-all duration-700 ${activeTab === 'account' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
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
                    {renderInputField('text', 'name', userData.name, 'Full Name', "Your name (or superhero alias)")}
                    {renderInputField('email', 'email', userData.email, 'Email', "secret.identity@example.com")}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {renderInputField('date', 'dob', userData.dob, 'Birthday', "")}
                    {renderInputField('text', 'gender', userData.gender, 'Gender', "How you identify")}
                    {renderInputField('text', 'bloodType', userData.bloodType, 'Blood Type', "For vampires")}
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
                  {[
                    { name: 'Google Fit', logo: '#4285F4', connected: true, description: 'Syncing your steps (and those accidental 3am fridge visits)' },
                    { name: 'Apple Health', logo: '#000000', connected: false, description: 'Connect to compare Apple vs Google accuracy wars' },
                    { name: 'Fitbit', logo: '#00B0B9', connected: false, description: 'That device on your wrist you forget to charge' }
                  ].map((account, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-white hover:bg-opacity-5 transition-colors duration-300"
                         style={{ 
                           background: account.connected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                           border: account.connected ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                         }}>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 shimmer"
                             style={{ 
                               background: `linear-gradient(135deg, ${account.logo}80, ${account.logo})`,
                               boxShadow: account.connected ? `0 0 15px ${account.logo}40` : 'none'
                             }}>
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm text-white flex items-center">
                            {account.name}
                            {account.connected && (
                              <span className="ml-2 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-blue-200">{account.description}</p>
                        </div>
                      </div>
                      <button 
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                          account.connected 
                            ? 'text-red-300 bg-red-900 bg-opacity-30 hover:bg-opacity-50'
                            : 'text-blue-300 bg-blue-900 bg-opacity-30 hover:bg-opacity-50'
                        }`}
                      >
                        {account.connected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Password section */}
              <div>
                <h3 className="font-bold text-lg mb-5 text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                  </svg>
                  Password & Security
                </h3>
                
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/20 to-blue-800/20 backdrop-blur-sm border border-blue-700/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-sm text-white">Change Password</h4>
                      <p className="text-xs text-blue-200">Last changed: Never (let me guess, it's "password123"?)</p>
                    </div>
                    <button 
                      className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 text-blue-300 bg-blue-900 bg-opacity-30 hover:bg-opacity-50"
                    >
                      Update
                    </button>
                  </div>
                  
                  <div className="mt-4 border-t border-blue-800/30 pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-sm text-white">Two-Factor Authentication</h4>
                        <p className="text-xs text-blue-200">Extra security, extra annoyance, worth it though!</p>
                      </div>
                      {renderToggleSwitch('toggle2FA', 'Enable 2FA', 'Add an extra layer of security', true)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Health Tab */}
          <div className={`transition-all duration-700 ${activeTab === 'health' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
            <div className="space-y-8 animate-fadein">
              <div>
                <h3 className="font-bold text-lg mb-5 text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  Body Metrics
                </h3>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {renderInputField('number', 'height', userData.height, 'Height (cm)', "How far your head is from the ground")}
                  {renderInputField('number', 'weight', userData.weight, 'Weight (kg)', "Earth's gravitational pull on you")}
                </div>
                
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-md mb-8">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mr-3 shimmer">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Health Stats</h4>
                      <p className="text-xs text-blue-200">BMI and other numbers to obsess over</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="p-3 rounded-lg bg-white bg-opacity-5 backdrop-blur-md">
                      <div className="text-2xl font-bold text-white mb-1">22.7</div>
                      <div className="text-xs text-blue-200">BMI Index</div>
                      <div className="text-xs mt-1 py-0.5 px-2 rounded-full bg-green-500 bg-opacity-20 text-green-400 inline-block">Healthy</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white bg-opacity-5 backdrop-blur-md">
                      <div className="text-2xl font-bold text-white mb-1">1853</div>
                      <div className="text-xs text-blue-200">Daily Calories</div>
                      <div className="text-xs mt-1 py-0.5 px-2 rounded-full bg-blue-500 bg-opacity-20 text-blue-400 inline-block">Maintenance</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white bg-opacity-5 backdrop-blur-md">
                      <div className="text-2xl font-bold text-white mb-1">8.5</div>
                      <div className="text-xs text-blue-200">Sleep Average</div>
                      <div className="text-xs mt-1 py-0.5 px-2 rounded-full bg-purple-500 bg-opacity-20 text-purple-400 inline-block">Excellent</div>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-white bg-opacity-5 backdrop-blur-sm border border-white border-opacity-5">
                    <p className="text-xs text-blue-200 italic">
                      "According to these calculations, you should live to approximately 110 years old, assuming you don't read the comments section on news articles."
                    </p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-sm text-white">Medical Conditions</h4>
                    <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors duration-300 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Add New
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {userData.conditions.map((condition, index) => (
                      <div 
                        key={index}
                        className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center shimmer transition-all duration-300 hover:shadow-lg hover:scale-105 tooltip-container"
                        style={{ 
                          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.3), rgba(8, 145, 178, 0.3))',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}
                      >
                        <span className="tooltip">Tap to edit</span>
                        {condition}
                        <button className="ml-2 w-4 h-4 rounded-full bg-white bg-opacity-10 flex items-center justify-center hover:bg-opacity-20 transition-colors duration-300">
                          <X size={10} className="text-white" />
                        </button>
                      </div>
                    ))}
                    <button 
                      className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center transition-all duration-300 hover:bg-blue-900/30"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white'
                      }}
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Add condition
                    </button>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-sm text-white">Allergies</h4>
                    <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors duration-300 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Add New
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {userData.allergies.map((allergy, index) => (
                      <div 
                        key={index}
                        className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center shimmer transition-all duration-300 hover:shadow-lg hover:scale-105"
                        style={{ 
                          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.3), rgba(248, 113, 113, 0.3))',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}
                      >
                        {allergy}
                        <button className="ml-2 w-4 h-4 rounded-full bg-white bg-opacity-10 flex items-center justify-center hover:bg-opacity-20 transition-colors duration-300">
                          <X size={10} className="text-white" />
                        </button>
                      </div>
                    ))}
                    <button 
                      className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center transition-all duration-300 hover:bg-red-900/30"
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white'
                      }}
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Add allergy
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-5 text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  Health Goals <span className="ml-2 text-sm font-normal text-blue-300">(a.k.a. wishful thinking)</span>
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <label className="text-sm font-medium text-white">Daily Steps</label>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                          </svg>
                          <span className="text-xs text-blue-300">12% above average couch potato</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-white">{userData.goalSteps.toLocaleString()} steps</span>
                    </div>
                    <div className="relative h-2 bg-blue-900 bg-opacity-40 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shimmer"
                        style={{ width: `${(userData.goalSteps / 20000) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-blue-400">
                      <span>2,000 <span className="text-blue-300">(Netflix to fridge)</span></span>
                      <span>10,000 <span className="text-blue-300">(Doctor's happy)</span></span>
                      <span>20,000 <span className="text-blue-300">(Show-off)</span></span>
                    </div>
                    
                    {editMode && (
                      <input
                        type="range"
                        min="2000"
                        max="20000"
                        step="1000"
                        value={userData.goalSteps}
                        onChange={(e) => setUserData({...userData, goalSteps: parseInt(e.target.value)})}
                        className="w-full mt-2 accent-blue-500"
                      />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <label className="text-sm font-medium text-white">Sleep Goal</label>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                          </svg>
                          <span className="text-xs text-blue-300">Dreaming beats reality anyway</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-white">{userData.goalSleep} hours</span>
                    </div>
                    <div className="relative h-2 bg-blue-900 bg-opacity-40 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-purple-500 to-fuchsia-400 rounded-full shimmer"
                        style={{ width: `${(userData.goalSleep / 12) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-blue-400">
                      <span>5h <span className="text-blue-300">(Zombie)</span></span>
                      <span>8h <span className="text-blue-300">(Perfect)</span></span>
                      <span>12h <span className="text-blue-300">(Teenager)</span></span>
                    </div>
                    
                    {editMode && (
                      <input
                        type="range"
                        min="5"
                        max="12"
                        step="0.5"
                        value={userData.goalSleep}
                        onChange={(e) => setUserData({...userData, goalSleep: parseFloat(e.target.value)})}
                        className="w-full mt-2 accent-purple-500"
                      />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <label className="text-sm font-medium text-white">Water Intake</label>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                          </svg>
                          <span className="text-xs text-blue-300">For hydration (or frequent bathroom trips)</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-white">{userData.goalWater} ml</span>
                    </div>
                    <div className="relative h-2 bg-blue-900 bg-opacity-40 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full shimmer"
                        style={{ width: `${(userData.goalWater / 4000) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-blue-400">
                      <span>1,000 ml <span className="text-blue-300">(Barely alive)</span></span>
                      <span>2,500 ml <span className="text-blue-300">(Adequate)</span></span>
                      <span>4,000 ml <span className="text-blue-300">(Fish)</span></span>
                    </div>
                    
                    {editMode && (
                      <input
                        type="range"
                        min="1000"
                        max="4000"
                        step="100"
                        value={userData.goalWater}
                        onChange={(e) => setUserData({...userData, goalWater: parseInt(e.target.value)})}
                        className="w-full mt-2 accent-cyan-500"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Preferences Tab */}
          <div className={`transition-all duration-700 ${activeTab === 'preferences' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
            <div className="space-y-8 animate-fadein">
              <div>
                <h3 className="font-bold text-lg mb-5 text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  App Preferences
                </h3>
                
                <div className="space-y-3">
                  {renderToggleSwitch('toggleNotifications', 'Push Notifications', 'Receive important alerts and updates', preferences.notifications)}
                  {renderToggleSwitch('toggleReminders', 'Medication Reminders', 'Get reminders for your medication schedule', preferences.reminders)}
                  {renderToggleSwitch('toggleBiometrics', 'Biometric Login', 'Use fingerprint or face recognition to login', preferences.biometrics)}
                  {renderToggleSwitch('toggleDarkMode', 'Dark Mode', 'Use dark theme throughout the app', preferences.darkMode)}
                  
                  <div className="p-3 rounded-xl bg-blue-900/20 backdrop-blur-sm mt-4">
                    <p className="text-xs text-blue-200 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Pro Tip: Toggle these as much as you want, it's oddly satisfying. I know I'm not the only one who flips switches for fun.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-5 text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
                  </svg>
                  App Settings
                </h3>
                
                <div className="space-y-3">
                  {[
                    { label: 'Language', value: 'English', tooltip: 'We also speak emoji 👍' },
                    { label: 'Units', value: 'Metric', tooltip: 'Because imperial makes no sense to the rest of the world' },
                    { label: 'Timezone', value: 'UTC+01:00 - London', tooltip: 'Time is an illusion, but meetings are real' },
                    { label: 'App Version', value: '2.5.1', tooltip: 'Yes, we know there are bugs' }
                  ].map((setting, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-white hover:bg-opacity-5 transition-colors duration-300 tooltip-container">
                      <span className="tooltip">{setting.tooltip}</span>
                      <h4 className="font-medium text-sm text-white">{setting.label}</h4>
                      <div className="flex items-center">
                        <span className="text-sm mr-2 text-blue-300">{setting.value}</span>
                        {index < 3 && (
                          <ChevronRight size={18} className="text-blue-300" />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 p-3 rounded-xl bg-gradient-to-r from-yellow-900/20 to-amber-800/20 backdrop-blur-md">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-400">Clear App Data</h4>
                        <p className="text-xs text-yellow-300/70 mt-1">
                          This will reset all app data, a bit like factory resetting your phone when it's acting weird. Boom, fresh start.
                        </p>
                        <button className="mt-2 px-3 py-1 rounded-lg text-xs font-medium bg-yellow-900/30 text-yellow-300 hover:bg-yellow-900/50 transition-colors duration-300">
                          Clear Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Privacy Tab */}
          <div className={`transition-all duration-700 ${activeTab === 'privacy' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
            <div className="space-y-8 animate-fadein">
              <div>
                <h3 className="font-bold text-lg mb-5 text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                  Privacy Settings
                </h3>
                
                <div className="space-y-6">
                  {renderToggleSwitch('toggleDataSharing', 'Data Sharing', 'Share anonymous data to improve app experience', preferences.dataSharing)}
                  
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/20 to-blue-800/20 backdrop-blur-sm">
                    <div className="flex">
                      <div className="flex-shrink-0 pt-0.5">
                        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <p className="ml-3 text-sm text-blue-200">
                        Your data is encrypted and secured. We promise not to sell it to the highest bidder. (Unless they offer a REALLY good price. Kidding!)
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    {[
                      { label: 'Privacy Policy', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', tooltip: 'Legal mumbo jumbo that nobody reads' },
                      { label: 'Terms of Service', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', tooltip: 'The thing you agree to without reading' },
                      { label: 'Data Request', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', tooltip: 'Find out what we know about you (spoiler: a lot)' }
                    ].map((item, index) => (
                      <button 
                        key={index}
                        className="w-full p-3 rounded-xl text-sm font-medium flex items-center justify-between hover:bg-white hover:bg-opacity-5 transition-all duration-300 group tooltip-container"
                        style={{ color: 'white' }}
                      >
                        <span className="tooltip">{item.tooltip}</span>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all duration-300 group-hover:scale-110 shimmer"
                               style={{ 
                                 background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(8, 145, 178, 0.2))',
                                 backdropFilter: 'blur(5px)'
                                }}>
                            <svg className="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
                            </svg>
                          </div>
                          <span className="text-blue-100">{item.label}</span>
                        </div>
                        <ChevronRight size={16} className="text-blue-300 transition-all duration-300 group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-5 text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  Danger Zone <span className="ml-2 text-sm font-normal text-red-300">(cue dramatic music)</span>
                </h3>
                
                <div className="space-y-3">
                  {[
                    { label: 'Delete All Health Data', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', tooltip: 'Because starting from scratch is sometimes easier' },
                    { label: 'Delete Account', icon: 'M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6', tooltip: 'Going off the grid? We\'ll miss you (sort of)' }
                  ].map((item, index) => (
                    <button 
                      key={index}
                      className="w-full p-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all duration-300 group bg-red-900 bg-opacity-20 hover:bg-opacity-30 tooltip-container"
                    >
                      <span className="tooltip">{item.tooltip}</span>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all duration-300 group-hover:scale-110 shimmer"
                             style={{ 
                               background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(248, 113, 113, 0.2))',
                               backdropFilter: 'blur(5px)'
                              }}>
                          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
                          </svg>
                        </div>
                        <span className="text-red-100">{item.label}</span>
                      </div>
                      <AlertTriangle size={16} className="text-red-300 animate-pulse" />
                    </button>
                  ))}
                </div>
                
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-red-900/20 to-red-800/20 backdrop-blur-md">
                  <div className="flex">
                    <div className="flex-shrink-0 pt-0.5">
                      <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <p className="ml-3 text-sm text-red-200">
                      Warning: These actions cannot be undone. Like that regrettable haircut in high school, but permanent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        @keyframes shimmerButtonEffect {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shimmerEffect {
          100% { transform: translateX(100%); }
        }
        @keyframes floatOrb {
          0% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(20px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-fadein {
          animation: fadeIn 0.5s ease-in-out;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 4s ease-in-out infinite;
        }
        input::placeholder, select::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        input[type="range"] {
          -webkit-appearance: none;
          height: 8px;
          border-radius: 5px;
          background: rgba(30, 64, 175, 0.3);
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3B82F6, #06B6D4);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale(1.2);
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
          z-index: 50;
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

export default ProfileScreen;