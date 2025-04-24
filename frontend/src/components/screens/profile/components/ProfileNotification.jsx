import React from 'react';
import { X } from 'lucide-react';

const ProfileNotification = ({ message, type = 'info', onClose, colors }) => {
  const getNotificationStyles = () => {
    switch (type) {
      case 'success':
        return {
          background: 'bg-gradient-to-r from-green-900/30 to-emerald-900/30',
          borderColor: 'border-emerald-500/20',
          iconColor: 'text-emerald-400',
          textColor: 'text-emerald-100',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          )
        };
      case 'warning':
        return {
          background: 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30',
          borderColor: 'border-amber-500/20',
          iconColor: 'text-amber-400',
          textColor: 'text-amber-100',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          )
        };
      case 'error':
        return {
          background: 'bg-gradient-to-r from-red-900/30 to-rose-900/30',
          borderColor: 'border-red-500/20',
          iconColor: 'text-red-400',
          textColor: 'text-red-100',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          )
        };
      case 'info':
      default:
        return {
          background: 'bg-gradient-to-r from-blue-900/30 to-purple-900/30',
          borderColor: 'border-blue-500/20',
          iconColor: 'text-cyan-400',
          textColor: 'text-blue-100',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          )
        };
    }
  };

  const styles = getNotificationStyles();

  return (
    <div className={`mb-6 p-4 rounded-xl ${styles.background} backdrop-blur-md border ${styles.borderColor} animate-bounce-subtle relative overflow-hidden group dark-mode-transition`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer"></div>
      <div className="flex items-start">
        <div className={`flex-shrink-0 pt-0.5 ${styles.iconColor}`}>
          {styles.icon}
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm ${styles.textColor}`}>{message}</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-2 text-blue-300 hover:text-blue-100 transition-colors duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileNotification;