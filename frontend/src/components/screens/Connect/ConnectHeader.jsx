import React from 'react';
import { Menu, Bell } from 'lucide-react';

const ConnectHeader = ({ 
  headerVisible, 
  notifications, 
  setNotifications,
  colors,
  isDoctorMode,
  setIsDoctorMode
}) => {
  return (
    <header className={`flex justify-between items-center mb-8 transition-all duration-700 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
      <div>
        <h1 className="text-3xl font-bold" 
            style={{ 
              background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textFillColor: 'transparent'
            }}>Connect</h1>
        <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>Your health team at your fingertips</p>
      </div>
      <div className="flex items-center space-x-3">
        {/* Doctor Mode Toggle */}
        <button 
          onClick={() => setIsDoctorMode(!isDoctorMode)}
          className="px-3 py-1 rounded-lg text-xs font-medium"
          style={{ 
            backgroundColor: isDoctorMode ? colors.success : colors.cardBg,
            color: isDoctorMode ? 'white' : colors.textPrimary
          }}
        >
          {isDoctorMode ? 'Doctor Mode: ON' : 'Doctor Mode: OFF'}
        </button>

        <button 
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 duration-300 relative"
          style={{ 
            background: notifications > 0
              ? `linear-gradient(135deg, ${colors.accent}, ${colors.accentAlt})`
              : `linear-gradient(135deg, ${colors.darkBg}, ${colors.cardBg})`,
            boxShadow: notifications > 0
              ? `0 0 15px ${colors.accent}40`
              : `0 0 10px ${colors.primary}20`
          }}
          onClick={() => setNotifications(0)}
        >
          <Bell size={20} color={notifications > 0 ? "white" : colors.textSecondary} />
          {notifications > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-xs text-white font-bold">{notifications}</span>
            </div>
          )}
        </button>
        <button className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 duration-300" 
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
            boxShadow: `0 0 15px ${colors.primary}40`
          }}>
          <Menu size={20} color="white" />
        </button>
      </div>
    </header>
  );
};

export default ConnectHeader;