import React from 'react';
import { MessageCircle, Video } from 'lucide-react';
import { useTheme } from '../../ThemeContext';

const QuickConnectActions = ({ 
  headerVisible, 
  colors, 
  connectingDoctor, 
  setShowMessageDialog, 
  initiateCall,
  displayToast,
  isDarkMode
}) => {
  return (
    <div className={`mb-8 transition-all duration-500 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '400ms' }}>
      <h3 className="font-bold text-lg mb-4 dark-mode-transition" style={{ color: colors.textPrimary }}>Quick Connect</h3>
      <div className="grid grid-cols-2 gap-6">
        <button 
          className="p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all duration-500 relative overflow-hidden h-36 dark-mode-transition"
          style={{ 
            backgroundColor: isDarkMode ? colors.cardBg : 'white',
            boxShadow: `0 15px 25px -5px ${colors.primary}30, 0 10px 10px -5px ${colors.accent}20`,
            opacity: connectingDoctor ? 1 : 0.7
          }}
          onClick={() => {
            // Check if a doctor is connecting before allowing messaging
            if (!connectingDoctor) {
              displayToast("Please connect to a doctor first");
              return;
            }
            
            setShowMessageDialog(true);
          }}
        >
          {/* Background gradient effect */}
          <div className="absolute inset-0 opacity-10" 
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
              }}></div>
          
          {/* Icon container */}
          <div className="w-20 h-20 rounded-full mb-4 flex items-center justify-center shadow-lg transition-all duration-500 relative z-10" 
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                boxShadow: `0 0 20px ${colors.primary}40`
              }}>
            <MessageCircle size={32} color="white" />
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="shimmer-effect absolute inset-0"></div>
            </div>
          </div>
          
          {/* Label */}
          <span className="text-base font-semibold z-10 dark-mode-transition" style={{ color: colors.primary }}>Message</span>
          
          {/* Subtle indicator dots */}
          <div className="absolute bottom-4 right-4 flex space-x-1">
            <div className="w-2 h-2 rounded-full dark-mode-transition" style={{ backgroundColor: isDarkMode ? `${colors.primary}60` : `${colors.primary}40` }}></div>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: isDarkMode ? `${colors.primary}90` : `${colors.primary}80` }}></div>
            <div className="w-2 h-2 rounded-full dark-mode-transition" style={{ backgroundColor: isDarkMode ? `${colors.primary}60` : `${colors.primary}40` }}></div>
          </div>
        </button>
        
        <button 
          className="p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center transition-all duration-500 relative overflow-hidden h-36 dark-mode-transition"
          style={{ 
            backgroundColor: isDarkMode ? colors.cardBg : 'white',
            boxShadow: `0 15px 25px -5px ${colors.accentAlt}30, 0 10px 10px -5px ${colors.accent}20`,
            opacity: connectingDoctor && connectingDoctor.availability.includes('Available') && 
                    !connectingDoctor.availability.includes('in') ? 1 : 0.7
          }}
          onClick={async () => {
            if (!connectingDoctor) {
              displayToast("Please connect to a doctor first");
              return;
            }
            
            const isAvailableNow = connectingDoctor.availability.includes('Available') && 
                                  !connectingDoctor.availability.includes('in');
            
            if (!isAvailableNow) {
              displayToast(`${connectingDoctor.name} is not available for video call right now`);
              return;
            }
            
            await initiateCall(connectingDoctor);
          }}
        >
          {/* Background gradient effect */}
          <div className="absolute inset-0 opacity-10" 
              style={{ 
                background: `linear-gradient(135deg, ${colors.accentAlt}, ${colors.accent})`,
              }}></div>
          
          {/* Icon container */}
          <div className="w-20 h-20 rounded-full mb-4 flex items-center justify-center shadow-lg transition-all duration-500 relative z-10" 
              style={{ 
                background: `linear-gradient(135deg, ${colors.accentAlt}, ${colors.accent})`,
                boxShadow: `0 0 20px ${colors.accentAlt}40`
              }}>
            <Video size={32} color="white" />
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="shimmer-effect absolute inset-0"></div>
            </div>
          </div>
          
          {/* Label */}
          <span className="text-base font-semibold z-10 dark-mode-transition" style={{ color: colors.accentAlt }}>Video Call</span>
          
          {/* Subtle indicator dots */}
          <div className="absolute bottom-4 right-4 flex space-x-1">
            <div className="w-2 h-2 rounded-full dark-mode-transition" style={{ backgroundColor: isDarkMode ? `${colors.accentAlt}60` : `${colors.accentAlt}40` }}></div>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: isDarkMode ? `${colors.accentAlt}90` : `${colors.accentAlt}80` }}></div>
            <div className="w-2 h-2 rounded-full dark-mode-transition" style={{ backgroundColor: isDarkMode ? `${colors.accentAlt}60` : `${colors.accentAlt}40` }}></div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default QuickConnectActions;