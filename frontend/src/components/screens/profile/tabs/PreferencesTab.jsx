// PreferencesTab.jsx
import React from 'react';
import { ChevronRight, Moon, Sun } from 'lucide-react';
import ToggleSwitch from '../components/ToggleSwitch';

const PreferencesTab = ({ preferences, handleToggle, colors }) => {
  return (
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
          <ToggleSwitch 
            id="toggleNotifications" 
            label="Push Notifications" 
            description="Receive important alerts and updates" 
            value={preferences.notifications} 
            onChange={() => handleToggle('notifications')}
            colors={colors}
          />
          
          <ToggleSwitch 
            id="toggleReminders" 
            label="Medication Reminders" 
            description="Get reminders for your medication schedule" 
            value={preferences.reminders} 
            onChange={() => handleToggle('reminders')}
            colors={colors}
          />
          
          <ToggleSwitch 
            id="toggleBiometrics" 
            label="Biometric Login" 
            description="Use fingerprint or face recognition to login" 
            value={preferences.biometrics} 
            onChange={() => handleToggle('biometrics')}
            colors={colors}
          />
          
          {/* Enhanced Dark Mode Toggle with better visual indicators */}
          <div className="flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:bg-white hover:bg-opacity-5 relative overflow-hidden group">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-transform group-hover:scale-110 duration-300" 
                   style={{ 
                     background: `linear-gradient(135deg, ${preferences.darkMode ? '#0F172A' : '#60A5FA'}, ${preferences.darkMode ? '#334155' : '#93C5FD'})`,
                     boxShadow: `0 0 15px ${preferences.darkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(96, 165, 250, 0.6)'}`,
                   }}>
                {preferences.darkMode ? 
                  <Moon size={16} className="text-white" /> : 
                  <Sun size={16} className="text-white" />
                }
              </div>
              <div>
                <h4 className="font-medium text-sm text-white">Dark Mode</h4>
                <p className="text-xs text-blue-200">
                  {preferences.darkMode 
                    ? "Easy on the eyes, tough on the battery." 
                    : "Bright mode. Bold choice for 3am bathroom trips."}
                </p>
              </div>
            </div>
            
            {/* Custom animated toggle switch for dark mode */}
            <button 
              onClick={() => handleToggle('darkMode')}
              className="w-14 h-8 rounded-full relative transition-all duration-500 cursor-pointer dark-mode-transition"
              style={{ 
                backgroundColor: preferences.darkMode 
                  ? 'rgba(15, 23, 42, 0.7)' 
                  : 'rgba(96, 165, 250, 0.7)',
                boxShadow: preferences.darkMode 
                  ? '0 0 20px rgba(15, 23, 42, 0.6)' 
                  : '0 0 20px rgba(96, 165, 250, 0.6)'
              }}
            >
              <span 
                className="block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-all duration-500 absolute dark-mode-transition"
                style={{ 
                  transform: preferences.darkMode ? 'translateX(6px)' : 'translateX(0)',
                  boxShadow: preferences.darkMode 
                    ? '0 0 10px rgba(255, 255, 255, 0.3)' 
                    : '0 0 10px rgba(255, 255, 255, 0.5)'
                }}
              >
                {preferences.darkMode && (
                  <span className="absolute inset-0 rounded-full animate-pulse bg-blue-200 opacity-50"></span>
                )}
              </span>
              
              {/* Little sun icon for day mode */}
              <span 
                className={`absolute top-1 left-1 transition-opacity duration-500 ${preferences.darkMode ? 'opacity-0' : 'opacity-100'}`}
                style={{ color: '#FFD700' }} // Gold color for sun
              >
                <Sun size={16} />
              </span>
              
              {/* Little moon icon for night mode */}
              <span 
                className={`absolute top-1 right-1 transition-opacity duration-500 ${preferences.darkMode ? 'opacity-100' : 'opacity-0'}`}
                style={{ color: '#E2E8F0' }} // Silver color for moon
              >
                <Moon size={16} />
              </span>
            </button>
            
            {/* Background effect for dark mode toggle */}
            <div 
              className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${preferences.darkMode ? 'opacity-40' : 'opacity-0'}`}
              style={{ 
                background: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.8) 0%, transparent 70%)',
                zIndex: -1
              }}
            ></div>
          </div>
          
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
  );
};

export default PreferencesTab;