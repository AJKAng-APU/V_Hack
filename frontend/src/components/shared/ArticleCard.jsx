import React from 'react';
import { Clock } from "lucide-react"; 
import { useTheme } from '../ThemeContext';

const ArticleCard = ({ title, description, time, colors }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="p-4 rounded-2xl shadow-lg border transform hover:scale-105 transition-all duration-500 hover:shadow-xl dark-mode-transition"
         style={{ 
           backgroundColor: isDarkMode ? colors.cardBg : 'white',
           borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
           boxShadow: `0 10px 15px -3px ${colors.primary}20`
         }}>
      <div className="flex items-center mb-3">
        <div className="flex-1">
          <h4 className="font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>{title}</h4>
          <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>{description}</p>
        </div>
        <Clock size={16} className="dark-mode-transition" style={{ color: colors.textSecondary }} />
      </div>
      <p className="text-xs text-right dark-mode-transition" style={{ color: colors.textSecondary }}>{time}</p>
    </div>
  );
};

export default ArticleCard;