import React, { useState } from 'react';

const ProfileInputField = ({ 
  type = 'text',
  name,
  value,
  label,
  placeholder = '',
  disabled = true,
  editMode = false,
  onChange,
  colors
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
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
            if (!disabled && onChange) {
              onChange(e);
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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

export default ProfileInputField;