import React from 'react';

const ToggleSwitch = ({ id, label, description, value, onChange, colors }) => {
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
    <div className="flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:bg-white hover:bg-opacity-5 dark-mode-transition">
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
          onChange={onChange}
        />
        <label 
          htmlFor={id}
          className="block w-14 h-8 rounded-full transition-all duration-500 cursor-pointer dark-mode-transition"
          style={{ 
            background: value 
              ? `linear-gradient(to right, ${colors.primary}, ${colors.accent})` 
              : 'rgba(51, 65, 85, 0.7)', // Dark gray for off state
            boxShadow: value ? `0 0 20px ${colors.primary}70` : 'none'
          }}
        >
          <span 
            className="block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-all duration-500 relative dark-mode-transition"
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

export default ToggleSwitch;