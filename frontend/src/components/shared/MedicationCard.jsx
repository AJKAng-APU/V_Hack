import React from 'react';
import { CheckCircle, X, Clock, Calendar } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const MedicationCard = ({ name, dosage, time, status, colors }) => {
    const { isDarkMode } = useTheme();
    
    let statusColor, statusIcon, statusBg, statusGradient;
    
    if (status === 'taken') {
      statusColor = colors.success;
      statusIcon = <CheckCircle size={18} />;
      statusBg = `${colors.success}20`;
      statusGradient = `linear-gradient(135deg, ${colors.success}, ${colors.success}90)`;
    } else if (status === 'missed') {
      statusColor = colors.danger;
      statusIcon = <X size={18} />;
      statusBg = `${colors.danger}20`;
      statusGradient = `linear-gradient(135deg, ${colors.danger}, ${colors.danger}90)`;
    } else {
      statusColor = colors.textSecondary;
      statusIcon = <Clock size={18} />;
      statusBg = isDarkMode ? `${colors.primary}30` : `${colors.textSecondary}20`;
      statusGradient = `linear-gradient(135deg, ${colors.primary}40, ${colors.primary}20)`;
    }
    
    return (
      <div className="p-4 rounded-2xl shadow-lg border flex items-center transform hover:scale-105 transition-all duration-500 hover:shadow-xl dark-mode-transition"
           style={{ 
             backgroundColor: isDarkMode ? colors.cardBg : 'white',
             borderColor: isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)',
             boxShadow: `0 10px 15px -3px ${colors.primary}20`
           }}>
        <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center shimmer" 
             style={{ 
               background: `linear-gradient(135deg, ${colors.primary}90, ${colors.primary})`
             }}>
          <Calendar size={22} color="white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <h4 className="font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>{name}</h4>
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-300 hover:shadow-sm dark-mode-transition" 
                  style={{ 
                    background: isDarkMode ? `${colors.primary}30` : `linear-gradient(to right, ${colors.primary}20, ${colors.accent}10)`,
                    color: colors.primary
                  }}>
              {dosage}
            </span>
          </div>
          <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>{time}</p>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 duration-300" 
             style={{ 
               background: status === 'upcoming' ? 'transparent' : statusGradient, 
               color: status === 'upcoming' ? statusColor : 'white', 
               border: status === 'upcoming' ? `1px solid ${isDarkMode ? colors.textSecondary + '50' : colors.textSecondary + '30'}` : 'none',
               boxShadow: status !== 'upcoming' ? `0 0 15px ${statusColor}30` : 'none'
             }}>
          {statusIcon}
        </div>
      </div>
    );
  };

export default MedicationCard;