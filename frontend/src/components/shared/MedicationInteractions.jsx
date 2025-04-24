import React from 'react';
import { 
  ArrowLeft, AlertTriangle, ChevronRight,
  Info, CheckCircle
} from "lucide-react";
import { useTheme } from '../ThemeContext';

// Component for displaying medication interactions
const MedicationInteractions = ({ medication, setView, colors }) => {
  const { isDarkMode } = useTheme();
  
  if (!medication) return null;
  
  // Dark mode specific styles
  const cardBg = isDarkMode ? colors.cardBg : 'white';
  const borderColor = isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)';
  const hoverBgColor = isDarkMode ? colors.primary + '20' : 'rgba(239, 246, 255, 1)';
  const metaTagBg = isDarkMode ? colors.primary + '20' : 'rgba(239, 246, 255, 1)';
  
  return (
    <>
      <header className="flex items-center mb-8">
        <button 
          className="w-10 h-10 rounded-full flex items-center justify-center mr-4 hover:bg-blue-50 transition-colors duration-300 dark-mode-transition"
          onClick={() => setView('detail')}
          style={{ '&:hover': { backgroundColor: hoverBgColor } }}
        >
          <ArrowLeft size={24} style={{ color: colors.textPrimary }} />
        </button>
        <div>
          <h1 className="text-2xl font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>{medication.name} Interactions</h1>
          <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>{medication.dosage}</p>
        </div>
      </header>
      
      {/* Information banner */}
      <div className="mb-8 p-5 rounded-2xl relative overflow-hidden transform hover:scale-105 transition-all duration-500 animate-breathe" 
           style={{ 
             background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
             boxShadow: `0 20px 25px -5px ${colors.primary}50`
           }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full animate-float" 
             style={{ 
               background: `radial-gradient(circle, ${colors.primaryLight}50, transparent 70%)`,
               transform: 'translate(30%, -30%)'
             }}></div>
        
        <div className="relative flex items-start">
          <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center mr-4">
            <Info size={24} color="white" />
          </div>
          <div>
            <h3 className="text-white font-bold mb-2">About Drug Interactions</h3>
            <p className="text-white text-opacity-90 text-sm">
              Interactions can affect how medications work and may increase your risk of side effects. 
              Always consult your healthcare provider before taking new medications or supplements.
              And no, googling at 2 AM doesn't count as consulting a healthcare provider.
            </p>
          </div>
        </div>
      </div>
      
      {/* Interactions list */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg dark-mode-transition" style={{ color: colors.textPrimary }}>Known Interactions</h3>
          <div className="flex items-center">
            <button className="flex items-center text-xs px-3 py-1 rounded-full mr-2" 
                    style={{ backgroundColor: `${colors.danger}15`, color: colors.danger }}>
              <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: colors.danger }}></span>
              High Risk
            </button>
            <button className="flex items-center text-xs px-3 py-1 rounded-full" 
                    style={{ backgroundColor: `${colors.warning}15`, color: colors.warning }}>
              <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: colors.warning }}></span>
              Moderate
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {medication.interactions.map((interaction, idx) => (
            <div 
              key={idx}
              className="p-5 rounded-2xl bg-white shadow-lg border border-blue-50 transform hover:scale-102 transition-all duration-300 dark-mode-transition"
              style={{ 
                backgroundColor: cardBg,
                borderColor: borderColor,
                boxShadow: `0 10px 15px -3px ${colors.primary}20`,
                borderLeftColor: interaction.severity === 'high' ? colors.danger : colors.warning,
                borderLeftWidth: '4px'
              }}
            >
              <div className="flex items-center mb-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                  style={{ 
                    backgroundColor: interaction.severity === 'high' ? `${colors.danger}20` : `${colors.warning}20`,
                    color: interaction.severity === 'high' ? colors.danger : colors.warning
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>{interaction.medication}</h4>
                  <p className="text-xs font-medium" 
                     style={{ color: interaction.severity === 'high' ? colors.danger : colors.warning }}>
                    {interaction.severity === 'high' ? 'High Risk' : 'Moderate Risk'}
                  </p>
                </div>
              </div>
              <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                {interaction.description}
              </p>
              <div className="mt-4 flex justify-between items-center">
                <button className="text-sm font-medium" style={{ color: colors.primary }}>
                  Learn more
                </button>
                <span className="text-xs px-3 py-1 rounded-full dark-mode-transition" 
                     style={{ backgroundColor: metaTagBg, color: colors.textSecondary }}>
                  Updated Mar 2025
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* No other interactions disclaimer */}
      <div className="mb-6 p-5 rounded-2xl bg-white shadow-md flex items-start dark-mode-transition"
           style={{ 
             backgroundColor: cardBg,
             boxShadow: `0 5px 10px -3px ${colors.primary}10` 
           }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" 
             style={{ 
               backgroundColor: `${colors.success}20`,
               color: colors.success
             }}>
          <CheckCircle size={20} />
        </div>
        <div>
          <h4 className="font-medium text-sm mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>No other interactions detected</h4>
          <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
            Based on your current medication list. Always inform your doctor about all medications you take,
            including over-the-counter drugs, supplements, and those "natural remedies" your aunt keeps recommending.
          </p>
        </div>
      </div>
      
      {/* Safety tips */}
      <div className="p-5 rounded-2xl bg-white shadow-lg border border-blue-50 mb-6 dark-mode-transition"
           style={{ 
             backgroundColor: cardBg,
             borderColor: borderColor,
             boxShadow: `0 10px 15px -3px ${colors.primary}20` 
           }}>
        <h3 className="font-bold text-lg mb-3 dark-mode-transition" style={{ color: colors.textPrimary }}>Interaction Safety Tips</h3>
        <ul className="space-y-3">
          <li className="flex items-start">
            <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-0.5" 
                 style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
              Always tell your healthcare providers about <strong>all</strong> medications, supplements, and vitamins you take
            </p>
          </li>
          <li className="flex items-start">
            <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-0.5" 
                 style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
              Use a single pharmacy for all prescriptions when possible, as they track potential interactions
            </p>
          </li>
          <li className="flex items-start">
            <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-0.5" 
                 style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
              Ask about food interactions - some medications work differently when taken with certain foods
            </p>
          </li>
          <li className="flex items-start">
            <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-0.5" 
                 style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
              Be extra cautious with alcohol - it can interact with many medications in unexpected ways
            </p>
          </li>
        </ul>
      </div>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0) translate(30%, -30%); }
          50% { transform: translateY(-10px) translate(30%, -30%); }
          100% { transform: translateY(0) translate(30%, -30%); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-breathe {
          animation: breathe 4s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default MedicationInteractions;