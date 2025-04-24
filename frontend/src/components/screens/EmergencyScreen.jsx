import React from 'react';
import ContactCard from '../shared/ContactCard';
import InfoItem from '../shared/InfoItem';
import { useTheme } from '../ThemeContext';

const EmergencyScreen = ({ colors }) => {
    const { isDarkMode } = useTheme();
    
    // Dark mode specific styles
    const cardBg = isDarkMode ? colors.cardBg : 'white';
    const borderColor = isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)';
    const emergencyBgPulse = isDarkMode ? `${colors.danger}20` : `${colors.danger}10`;
    
    return (
      <div className="p-6 pb-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-500 bg-clip-text text-transparent">Emergency</h1>
            <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>Quick access to emergency services</p>
          </div>
        </header>
        
        {/* Emergency call with enhanced pulsing animation */}
        <div className="mb-8 p-5 rounded-2xl relative overflow-hidden transform hover:scale-105 transition-all duration-500" 
             style={{ 
               background: `linear-gradient(135deg, ${colors.danger}, ${colors.gradientAlt2})`,
               boxShadow: `0 20px 25px -5px ${colors.danger}40`
             }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full animate-pulse" 
                 style={{ 
                   background: `radial-gradient(circle, ${emergencyBgPulse}, transparent 70%)`,
                 }}></div>
            <div className="w-48 h-48 rounded-full animate-pulse" 
                 style={{ 
                   background: `radial-gradient(circle, ${colors.danger}20, transparent 70%)`,
                   animationDelay: '0.5s'
                 }}></div>
            <div className="w-64 h-64 rounded-full animate-pulse" 
                 style={{ 
                   background: `radial-gradient(circle, ${colors.danger}10, transparent 70%)`,
                   animationDelay: '1s'
                 }}></div>
          </div>
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-xl mb-1">Emergency Call</h3>
              <p className="text-white text-opacity-90 text-sm">Contact emergency services immediately</p>
            </div>
            <button className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300 animate-pulse"
                  style={{ boxShadow: `0 0 20px rgba(255, 255, 255, 0.5)` }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={colors.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Emergency contacts with enhanced card design and hover effects */}
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-4 dark-mode-transition" style={{ color: colors.textPrimary }}>Emergency Contacts</h3>
          <div className="space-y-4">
            <ContactCard
              name="Maria Johnson"
              relation="Spouse"
              phone="(555) 123-4567"
              colors={colors}
            />
            <ContactCard
              name="David Smith"
              relation="Son"
              phone="(555) 987-6543"
              colors={colors}
            />
            <ContactCard
              name="Dr. Williams"
              relation="Primary Care"
              phone="(555) 456-7890"
              colors={colors}
            />
          </div>
        </div>
        
        {/* Medical Info for Emergency with enhanced card design and animations */}
        <div>
          <h3 className="font-bold text-lg mb-4 dark-mode-transition" style={{ color: colors.textPrimary }}>Medical Information</h3>
          <div className="p-5 rounded-2xl bg-white shadow-lg transform hover:scale-102 transition-all duration-500 dark-mode-transition"
               style={{ 
                 backgroundColor: cardBg,
                 boxShadow: `0 15px 25px -5px ${colors.primary}20` 
               }}>
            <p className="text-sm font-medium mb-4 dark-mode-transition" style={{ color: colors.textPrimary }}>
              Critical information to share with emergency responders:
            </p>
            
            <div className="space-y-3 mb-5">
              <InfoItem label="Blood Type" value="A+" colors={colors} />
              <InfoItem label="Allergies" value="Penicillin, Shellfish" colors={colors} />
              <InfoItem label="Conditions" value="Type 2 Diabetes, Hypertension" colors={colors} />
              <InfoItem label="Medications" value="Metformin, Lisinopril, Atorvastatin" colors={colors} />
            </div>
            
            <button className="w-full p-4 rounded-xl text-white font-medium shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1" 
                    style={{ 
                      background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                      boxShadow: `0 10px 15px -3px ${colors.primary}40`
                    }}>
              Generate Emergency Report
            </button>
          </div>
        </div>
        
        {/* Custom CSS for animations */}
        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-pulse {
            animation: pulse 2s ease-in-out infinite;
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  };

export default EmergencyScreen;