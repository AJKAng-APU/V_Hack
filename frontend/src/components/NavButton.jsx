// Updated NavButton.jsx with enhanced dark mode support
import React from 'react';
import { Activity, Calendar, Heart, MessageCircle, User, Clock } from 'lucide-react';

// Navigation Button with enhanced hover and active states + dark mode support
const NavButton = ({ icon, label, active, onClick, colors }) => {
  // Render the appropriate icon based on name
  const renderIcon = () => {
    switch(icon) {
      case 'activity':
        return <Activity size={24} />;
      case 'calendar':
        return <Calendar size={24} />;
      case 'heart':
        return <Heart size={24} />;
      case 'message-circle':
        return <MessageCircle size={24} />;
      case 'user':
        return <User size={24} />;
      case 'clock':
        return <Clock size={24} />;
      default:
        return <Activity size={24} />;
    }
  };

  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center w-16 dark-mode-transition"
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${active ? 'shadow-md' : ''} dark-mode-transition`} 
        style={{ 
          background: active 
            ? `linear-gradient(135deg, ${colors.primary}40, ${colors.accent}30)` 
            : 'transparent',
          transform: active ? 'translateY(-8px)' : 'none',
          boxShadow: active ? `0 10px 15px -3px ${colors.primary}30` : 'none'
        }}>
        <div style={{ 
          color: active ? colors.primary : colors.textSecondary,
          transition: 'transform 0.3s ease-in-out',
          transform: active ? 'scale(1.2)' : 'scale(1)'
        }}>
          {renderIcon()}
        </div>
      </div>
      <span className="text-xs mt-1 transition-all duration-300 dark-mode-transition" style={{ 
        color: active ? colors.primary : colors.textSecondary,
        fontWeight: active ? '600' : 'normal',
        opacity: active ? 1 : 0.8
      }}>
        {label}
      </span>
    </button>
  );
};

export default NavButton;