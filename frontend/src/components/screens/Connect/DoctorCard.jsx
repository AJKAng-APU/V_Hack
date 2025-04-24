import React, { useState } from 'react';
import { useTheme } from '../../ThemeContext';

const DoctorCard = ({ 
  name, 
  specialty, 
  image, 
  availability, 
  colors, 
  rating, 
  onConnectClick, 
  isConnecting 
}) => {
  const isAvailableNow = availability.includes('Available') && !availability.includes('in');
  const [isHovered, setIsHovered] = useState(false);
  const { isDarkMode } = useTheme();
  
  return (
    <div 
      className="p-4 rounded-2xl bg-white shadow-lg border border-blue-50 min-w-[180px] transform transition-all duration-500 hover:shadow-xl dark-mode-transition"
      style={{ 
        backgroundColor: isDarkMode ? colors.cardBg : 'white',
        borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
        boxShadow: isHovered 
          ? `0 20px 25px -5px ${colors.primary}30, 0 10px 10px -5px ${colors.accent}20` 
          : `0 10px 15px -3px ${colors.primary}20`,
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center mb-3">
        <div className="w-14 h-14 rounded-full shadow-md mr-3 relative overflow-hidden transition-all duration-300"
            style={{ 
              boxShadow: `0 0 15px ${colors.primary}30`,
              transform: isHovered ? 'scale(1.05)' : 'scale(1)'
            }}>
          <img src={image} alt={name} className="w-full h-full rounded-full object-cover" />
          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white animate-pulse" 
              style={{ 
                backgroundColor: isConnecting ? colors.accent : isAvailableNow ? colors.success : colors.warning,
                borderColor: isDarkMode ? colors.cardBg : 'white'
              }}></div>
        </div>
        <div>
          <h4 className="font-semibold text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>{name}</h4>
          <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>{specialty}</p>
          {rating && (
            <div className="flex items-center mt-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full mr-1 dark-mode-transition" 
                    style={{ backgroundColor: i < rating ? colors.primary : isDarkMode ? colors.darkBg : colors.background }}></div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center mb-3">
        <div className="w-3 h-3 mr-2 rounded-full animate-pulse" 
            style={{ backgroundColor: isConnecting ? colors.accent : isAvailableNow ? colors.success : colors.warning }}></div>
        <span className="text-xs font-medium" 
            style={{ color: isConnecting ? colors.accent : isAvailableNow ? colors.success : colors.warning }}>
          {isConnecting ? "Connecting..." : availability}
        </span>
      </div>
      <button 
        className="w-full p-2 rounded-lg text-xs font-medium shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1" 
        style={{ 
          background: isConnecting 
            ? `linear-gradient(135deg, ${colors.accent}, ${colors.accentAlt})`
            : isAvailableNow 
              ? `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
              : isDarkMode
                ? `linear-gradient(135deg, ${colors.darkBg}, ${colors.cardBg})`
                : `linear-gradient(135deg, ${colors.background}, white)`,
          color: (isConnecting || isAvailableNow) ? 'white' : colors.primary,
          border: (isConnecting || isAvailableNow) ? 'none' : `1px solid ${colors.primary}30`,
          boxShadow: (isConnecting || isAvailableNow)
            ? `0 8px 15px -3px ${colors.primary}40` 
            : `0 4px 6px -1px ${colors.primary}20`
        }}
        onClick={onConnectClick}
      >
        {isConnecting ? 'Disconnect' : isAvailableNow ? 'Connect Now' : 'Schedule'}
      </button>
    </div>
  );
};

export default DoctorCard;