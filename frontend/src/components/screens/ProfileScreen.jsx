import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import supabase from '../supabaseClient';
import { useAuth } from '../AuthProvider';
import ProfileSummaryCard from './profile/ProfileSummaryCard';
import ProfileTabs from './profile/ProfileTabs';
import AccountTab from './profile/tabs/AccountTab';
import HealthTab from './profile/tabs/HealthTab';
import PreferencesTab from './profile/tabs/PreferencesTab';
import PrivacyTab from './profile/tabs/PrivacyTab';
import ProfileNotification from './profile/components/ProfileNotification';

// Demo account data cache - used to avoid database queries for demo accounts
const DEMO_PROFILE_CACHE = {
  'demo@healthsync.com': {
    name: "Demo User",
    email: "demo@healthsync.com",
    avatar: "/User_4.png",
    dob: "1990-01-01",
    gender: "Female",
    height: "170",
    weight: "65",
    bloodType: "A+",
    allergies: ["Peanuts", "Penicillin"],
    conditions: ["Asthma", "Seasonal allergies"],
    goalSteps: 10000,
    goalSleep: 8,
    goalWater: 2000
  },
  'doctor@healthsync.com': {
    name: "Dr. Johnson",
    email: "doctor@healthsync.com",
    avatar: "/User_3.png",
    dob: "1985-05-15",
    gender: "Male",
    height: "182",
    weight: "78",
    bloodType: "O+",
    allergies: ["Latex"],
    conditions: ["None"],
    goalSteps: 8000,
    goalSleep: 7,
    goalWater: 2500
  }
};

const ProfileScreen = ({ colors, setActiveScreen, setIsAuthenticated, preferences, handleToggle }) => {
  const [activeTab, setActiveTab] = useState('account');
  const [hoveredTab, setHoveredTab] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Get authenticated user from context - now also check if demo account
  const { user, signOut, isDemoAccount } = useAuth();
  
  // User data state
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    avatar: "/User_4.png",
    dob: "",
    gender: "",
    height: "",
    weight: "",
    bloodType: "",
    allergies: [],
    conditions: [],
    goalSteps: 10000,
    goalSleep: 8,
    goalWater: 2000
  });
  
  // Add a state to track queries in progress
  const [queriesInProgress, setQueriesInProgress] = useState(0);
  
  // Mouse position for 3D effects
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Sassy tips
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

  // Fetch user data from Supabase when component mounts
  useEffect(() => {
    if (user?.id) {
      // Log the starting timestamp for performance measurement
      console.log(`Starting profile data fetch at ${new Date().toISOString()}`);
      const startTime = performance.now();
      
      // Check if this is a demo account - use cached data if so
      if (isDemoAccount || user.email === 'demo@healthsync.com' || user.email === 'doctor@healthsync.com') {
        console.log('Using cached profile data for demo account');
        const demoData = DEMO_PROFILE_CACHE[user.email] || DEMO_PROFILE_CACHE['demo@healthsync.com'];
        
        setUserData({
          ...userData,
          ...demoData
        });
        
        setIsLoading(false);
        return;
      }
      
      fetchUserData().then(() => {
        const endTime = performance.now();
        console.log(`Profile data fetch completed in ${Math.round(endTime - startTime)}ms`);
      });
    }
  }, [user]);
  
  // Fetch user profile data from Supabase
  const fetchUserData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setQueriesInProgress(4); // We're going to make 4 different queries
    
    try {
      // Use Promise.all to perform all queries concurrently instead of sequentially
      // This should significantly reduce the total fetch time
      const [userData, profileData, conditionsData, allergiesData] = await Promise.all([
        // User data
        fetchWithTimeout(
          supabase
            .from('users')
            .select('*')
            .eq('user_id', user.id)
            .single(),
          3000
        ).then(result => {
          setQueriesInProgress(prev => prev - 1);
          return result;
        }).catch(error => {
          console.error('Error fetching user data:', error);
          setQueriesInProgress(prev => prev - 1);
          return { data: null, error };
        }),
        
        // Profile metrics
        fetchWithTimeout(
          supabase
            .from('user_profile_metrics')
            .select('*')
            .eq('user_id', user.id)
            .single(),
          3000
        ).then(result => {
          setQueriesInProgress(prev => prev - 1);
          return result;
        }).catch(error => {
          console.error('Error fetching profile metrics:', error);
          setQueriesInProgress(prev => prev - 1);
          return { data: null, error: null }; // Continue even if this fails
        }),
        
        // User conditions
        fetchWithTimeout(
          supabase
            .from('user_conditions')
            .select('condition_name')
            .eq('user_id', user.id),
          3000
        ).then(result => {
          setQueriesInProgress(prev => prev - 1);
          return result;
        }).catch(error => {
          console.error('Error fetching conditions:', error);
          setQueriesInProgress(prev => prev - 1);
          return { data: [], error: null }; // Default to empty array
        }),
        
        // User allergies
        fetchWithTimeout(
          supabase
            .from('user_allergies')
            .select('allergy_name')
            .eq('user_id', user.id),
          3000
        ).then(result => {
          setQueriesInProgress(prev => prev - 1);
          return result;
        }).catch(error => {
          console.error('Error fetching allergies:', error);
          setQueriesInProgress(prev => prev - 1);
          return { data: [], error: null }; // Default to empty array
        })
      ]);
      
      // Check if basic user data was retrieved successfully
      if (userData.error) throw userData.error;
      
      // If there's profile data, update the state with it
      const newUserData = {
        name: userData.data?.name || "",
        email: userData.data?.email || "",
        avatar: userData.data?.avatar_url || "/User_4.png",
        dob: profileData.data?.date_of_birth || "",
        gender: profileData.data?.gender || "",
        height: profileData.data?.height_cm?.toString() || "",
        weight: profileData.data?.weight_kg?.toString() || "",
        bloodType: profileData.data?.blood_type || "",
        allergies: allergiesData.data?.map(a => a.allergy_name) || [],
        conditions: conditionsData.data?.map(c => c.condition_name) || [],
        goalSteps: profileData.data?.goal_steps || 10000,
        goalSleep: profileData.data?.goal_sleep_hours || 8,
        goalWater: profileData.data?.goal_water_ml || 2000
      };
      
      // Store the retrieved profile data in localStorage for faster access next time
      try {
        localStorage.setItem(`profile_cache_${user.id}`, JSON.stringify({
          data: newUserData,
          timestamp: Date.now()
        }));
      } catch (e) {
        // Ignore storage errors
        console.log('Error caching profile data:', e);
      }
      
      setUserData(newUserData);
    } catch (error) {
      console.error('Error fetching user data:', error.message);
      setErrorMessage('Failed to load profile data. Please try again later.');
      
      // Try to use cached data if available
      try {
        const cachedData = localStorage.getItem(`profile_cache_${user.id}`);
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (parsed.data) {
            console.log('Using cached profile data due to fetch error');
            setUserData(parsed.data);
          }
        }
      } catch (e) {
        // Ignore cache errors
        console.log('Error reading cached profile data:', e);
      }
    } finally {
      // Only set loading to false when all queries are complete
      if (queriesInProgress === 0) {
        setIsLoading(false);
      }
    }
  };

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
  
  // Effect to turn off loading when all queries complete
  useEffect(() => {
    if (queriesInProgress === 0 && isLoading) {
      setIsLoading(false);
    }
  }, [queriesInProgress]);
  
  // Save user data to Supabase
  const saveUserData = async () => {
    // If demo account, just show success UI without saving
    if (isDemoAccount || user.email === 'demo@healthsync.com' || user.email === 'doctor@healthsync.com') {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditMode(false);
      }, 1500);
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Update user table
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          name: userData.name,
          // Note: Email updates may require additional verification
        })
        .eq('user_id', user.id);
      
      if (userError) throw userError;
      
      // Check if user_profile_metrics record exists
      const { data: existingProfile } = await supabase
        .from('user_profile_metrics')
        .select('user_profile_id')
        .eq('user_id', user.id)
        .single();
      
      // Prepare profile metrics data
      const profileData = {
        user_id: user.id,
        date_of_birth: userData.dob || null,
        gender: userData.gender || null,
        blood_type: userData.bloodType || null,
        height_cm: userData.height ? parseInt(userData.height) : null,
        weight_kg: userData.weight ? parseInt(userData.weight) : null,
        goal_steps: userData.goalSteps,
        goal_sleep_hours: userData.goalSleep,
        goal_water_ml: userData.goalWater,
        updated_at: new Date().toISOString()
      };
      
      // Update or insert profile metrics
      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('user_profile_metrics')
          .update(profileData)
          .eq('user_id', user.id);
          
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_profile_metrics')
          .insert([profileData]);
          
        if (insertError) throw insertError;
      }
      
      // Handle conditions - first delete existing ones
      await supabase
        .from('user_conditions')
        .delete()
        .eq('user_id', user.id);
      
      // Then insert new conditions
      if (userData.conditions.length > 0) {
        const conditionsToInsert = userData.conditions.map(condition => ({
          user_id: user.id,
          condition_name: condition,
          created_at: new Date().toISOString()
        }));
        
        const { error: conditionsError } = await supabase
          .from('user_conditions')
          .insert(conditionsToInsert);
          
        if (conditionsError) throw conditionsError;
      }
      
      // Handle allergies - first delete existing ones
      await supabase
        .from('user_allergies')
        .delete()
        .eq('user_id', user.id);
      
      // Then insert new allergies
      if (userData.allergies.length > 0) {
        const allergiesToInsert = userData.allergies.map(allergy => ({
          user_id: user.id,
          allergy_name: allergy,
          created_at: new Date().toISOString()
        }));
        
        const { error: allergiesError } = await supabase
          .from('user_allergies')
          .insert(allergiesToInsert);
          
        if (allergiesError) throw allergiesError;
      }
      
      // Update local cache
      try {
        localStorage.setItem(`profile_cache_${user.id}`, JSON.stringify({
          data: userData,
          timestamp: Date.now()
        }));
      } catch (e) {
        // Ignore storage errors
      }
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditMode(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error saving user data:', error);
      setErrorMessage('Failed to save profile changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save preferences to Supabase
  const savePreferences = async (updatedPrefs) => {
    // For demo accounts, just update local state without database calls
    if (isDemoAccount || user.email === 'demo@healthsync.com' || user.email === 'doctor@healthsync.com') {
      return;
    }
    
    try {
      // Check if user_preferences record exists
      const { data: existingPrefs } = await supabase
        .from('user_preferences')
        .select('user_preferences_id')
        .eq('user_id', user.id)
        .single();
      
      // Prepare preferences data
      const prefsData = {
        user_id: user.id,
        enable_notifications: updatedPrefs.notifications,
        enable_reminders: updatedPrefs.reminders,
        enable_biometrics: updatedPrefs.biometrics,
        enable_dark_mode: updatedPrefs.darkMode,
        enable_data_sharing: updatedPrefs.dataSharing,
        updated_at: new Date().toISOString()
      };
      
      // Update or insert preferences
      if (existingPrefs) {
        await supabase
          .from('user_preferences')
          .update(prefsData)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_preferences')
          .insert([prefsData]);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };
  
  // Handle preference toggles and save to Supabase
  const handlePreferenceToggle = (key) => {
    const updatedPrefs = { ...preferences, [key]: !preferences[key] };
    
    // Toggle the local state
    handleToggle(key);
    
    // Save to Supabase
    if (user?.id) {
      savePreferences(updatedPrefs);
    }
  };
  
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
  }, []);
  
  const handleLogout = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setActiveScreen('signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const handleSave = () => {
    if (user?.id) {
      saveUserData();
    } else {
      // Demo mode or no user ID - just show success UI
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditMode(false);
      }, 1500);
    }
  };
  
  // Add a condition
  const addCondition = (condition) => {
    if (condition && !userData.conditions.includes(condition)) {
      setUserData({
        ...userData,
        conditions: [...userData.conditions, condition]
      });
    }
  };
  
  // Remove a condition
  const removeCondition = (condition) => {
    setUserData({
      ...userData,
      conditions: userData.conditions.filter(c => c !== condition)
    });
  };
  
  // Add an allergy
  const addAllergy = (allergy) => {
    if (allergy && !userData.allergies.includes(allergy)) {
      setUserData({
        ...userData,
        allergies: [...userData.allergies, allergy]
      });
    }
  };
  
  // Remove an allergy
  const removeAllergy = (allergy) => {
    setUserData({
      ...userData,
      allergies: userData.allergies.filter(a => a !== allergy)
    });
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
  
  // Show a simplified loading state UI
  if (isLoading && !userData.name) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 opacity-25"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
          <p className="text-blue-200">Loading your profile...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 pb-8 h-full overflow-auto relative dark-mode-transition"
         style={{
           background: `radial-gradient(circle at 70% 20%, ${colors.primary}20, transparent 50%),
                       radial-gradient(circle at 30% 80%, ${colors.accent}20, transparent 50%)`,
         }}>
      {/* Animated floating background orbs - adjusted for dark mode compatibility */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {orbs.map((orb) => (
          <div 
            key={orb.id}
            className="absolute rounded-full opacity-10 dark-mode-transition"
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
      
      {/* Error message */}
      {errorMessage && (
        <ProfileNotification 
          message={errorMessage} 
          type="error" 
          onClose={() => setErrorMessage('')} 
          colors={colors}
        />
      )}
      
      {/* Sassy tip notification */}
      {sassyTip && !saveSuccess && !errorMessage && (
        <ProfileNotification 
          message={sassyTip} 
          type="info" 
          onClose={() => setSassyTip('')} 
          colors={colors}
        />
      )}
      
      {/* Success message */}
      {saveSuccess && (
        <ProfileNotification 
          message="Profile updated! Looking good there, superstar." 
          type="success" 
          colors={colors}
        />
      )}
      
      {/* User Profile Summary Card */}
      <ProfileSummaryCard 
        userData={userData} 
        editMode={editMode} 
        setEditMode={setEditMode} 
        handleSave={handleSave} 
        mousePosition={mousePosition} 
        colors={colors} 
      />
      
      {/* Profile Navigation Tabs */}
      <ProfileTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        hoveredTab={hoveredTab} 
        setHoveredTab={setHoveredTab} 
        colors={colors} 
      />
      
      {/* Content area with glass effect - enhanced for dark mode */}
      <div className="relative">
        <div className="absolute -inset-4 rounded-3xl opacity-10 bg-blue-500 blur-2xl dark-mode-transition"></div>
        <div className="relative p-6 rounded-2xl backdrop-blur-md border border-white border-opacity-10 min-h-[400px] dark-mode-transition"
             style={{ 
               background: 'rgba(13, 22, 47, 0.7)', 
               boxShadow: `0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 0 15px ${colors.primary}30`
             }}>
          
          {/* Account Tab */}
          <div className={`transition-all duration-700 ${activeTab === 'account' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
            <AccountTab 
              userData={userData} 
              setUserData={setUserData} 
              editMode={editMode} 
              colors={colors} 
              isLoading={isLoading} 
            />
          </div>
          
          {/* Health Tab */}
          <div className={`transition-all duration-700 ${activeTab === 'health' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
            <HealthTab 
              userData={userData} 
              setUserData={setUserData} 
              editMode={editMode} 
              colors={colors}
              addCondition={addCondition}
              removeCondition={removeCondition}
              addAllergy={addAllergy}
              removeAllergy={removeAllergy}
              isLoading={isLoading}
            />
          </div>
          
          {/* Preferences Tab - Updated to use handlePreferenceToggle */}
          <div className={`transition-all duration-700 ${activeTab === 'preferences' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
            <PreferencesTab 
              preferences={preferences} 
              handleToggle={handlePreferenceToggle} 
              colors={colors} 
            />
          </div>
          
          {/* Privacy Tab - Updated to use handlePreferenceToggle */}
          <div className={`transition-all duration-700 ${activeTab === 'privacy' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
            <PrivacyTab 
              preferences={preferences} 
              handleToggle={handlePreferenceToggle} 
              colors={colors} 
            />
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
      `}</style>
    </div>
  );
};

export default ProfileScreen;