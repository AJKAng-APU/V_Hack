import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTheme } from '../../ThemeContext';

const MessageCard = ({ doctor, message, time, unread, colors }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isDarkMode } = useTheme();
  
  return (
    <div 
      className="p-4 rounded-2xl bg-white shadow-lg border border-blue-50 transition-all duration-500 relative overflow-hidden dark-mode-transition"
      style={{ 
        backgroundColor: isDarkMode ? colors.cardBg : 'white',
        borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
        boxShadow: isHovered 
          ? `0 15px 25px -5px ${colors.primary}30` 
          : `0 10px 15px -3px ${colors.primary}20`,
        transform: isHovered ? 'translateX(5px)' : 'translateX(0)',
        borderLeft: unread ? `4px solid ${colors.primary}` : '4px solid transparent'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {unread && (
        <div className="absolute top-0 right-0">
          <div className="w-3 h-3 m-2 rounded-full animate-pulse" 
              style={{ backgroundColor: colors.primary }}></div>
        </div>
      )}
      <div className="flex items-center mb-2">
        <div className="w-10 h-10 rounded-full shadow-md mr-3 relative overflow-hidden flex items-center justify-center"
             style={{ 
               background: `linear-gradient(135deg, ${colors.primary}40, ${colors.accent}30)`,
               boxShadow: `0 0 15px ${colors.primary}30` 
             }}>
          <span className="text-sm font-bold" style={{ color: colors.primary }}>{doctor.split(' ')[1][0]}</span>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>{doctor}</h4>
          <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>{time}</p>
        </div>
        <ChevronRight size={18} className="transition-opacity duration-300" style={{ color: colors.textSecondary, opacity: isHovered ? 1 : 0.5 }} />
      </div>
      <p className="text-sm ml-13 pl-13 dark-mode-transition" style={{ 
        color: unread ? colors.textPrimary : colors.textSecondary,
        fontWeight: unread ? '500' : '400',
        marginLeft: '3.25rem' 
      }}>{message}</p>
    </div>
  );
};

export default MessageCard;