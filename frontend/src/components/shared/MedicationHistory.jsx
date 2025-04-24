import React from 'react';
import { ArrowLeft, BarChart2, CheckCircle, X } from "lucide-react";
import { useTheme } from '../ThemeContext';

// Component for displaying medication history and adherence stats
const MedicationHistory = ({ medication, medications, setView, colors }) => {
  const { isDarkMode } = useTheme();
  
  // If a specific medication was selected, show only its history
  // Otherwise, show combined history for all medications
  const allHistory = medication 
    ? medication.history 
    : medications.flatMap(med => med.history.map(h => ({ ...h, medication: med.name, dosage: med.dosage, medicationId: med.id })));
  
  // Group by date
  const historyByDate = {};
  allHistory.forEach(item => {
    // Skip items without a date (should not happen with proper data)
    if (!item.date) return;
    
    // Format date if needed - sometimes the date is already in a display format
    let formattedDate = item.date;
    if (!formattedDate.includes('-') && !formattedDate.includes('/') && !formattedDate.includes(',')) {
      // Not a standard date format, skip this item
      return;
    }
    
    // Try to standardize date format if it's a date string like "2025-03-22"
    if (formattedDate.includes('-') && formattedDate.split('-').length === 3) {
      try {
        const date = new Date(formattedDate);
        formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch (e) {
        // Keep original format if parsing fails
        console.error('Error parsing date:', e);
      }
    }
    
    if (!historyByDate[formattedDate]) {
      historyByDate[formattedDate] = [];
    }
    historyByDate[formattedDate].push(item);
  });
  
  // Get adherence rate for display
  const adherenceRate = medication 
    ? medication.adherenceRate 
    : Math.round(
        medications.reduce((sum, med) => sum + med.adherenceRate, 0) / medications.length
      );
  
  // Get missed doses for display
  const missedDoses = medication
    ? medication.missedDoses
    : medications.reduce((sum, med) => sum + med.missedDoses, 0);
  
  // Dark mode specific styles
  const cardBg = isDarkMode ? colors.cardBg : 'white';
  const timelineBgColor = isDarkMode ? colors.primary + '30' : '#E5E7EB';
  const hoverBgColor = isDarkMode ? colors.primary + '20' : 'rgba(239, 246, 255, 1)';
  const emptyStateBg = isDarkMode ? colors.primary + '15' : 'rgba(239, 246, 255, 1)';
  
  return (
    <>
      <header className="flex items-center mb-8">
        <button 
          className="w-10 h-10 rounded-full flex items-center justify-center mr-4 hover:bg-blue-50 transition-colors duration-300 dark-mode-transition"
          onClick={() => medication ? setView('detail') : setView('main')}
          style={{ '&:hover': { backgroundColor: hoverBgColor } }}
        >
          <ArrowLeft size={24} style={{ color: colors.textPrimary }} />
        </button>
        <div>
          <h1 className="text-2xl font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
            {medication ? `${medication.name} History` : 'Medication History'}
          </h1>
          <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
            {medication ? medication.dosage : 'All medications'}
          </p>
        </div>
      </header>
      
      {/* Adherence statistics */}
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
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full animate-float" 
             style={{ 
               background: `radial-gradient(circle, ${colors.primaryLight}30, transparent 70%)`,
               transform: 'translate(-30%, 30%)',
               animationDelay: '1s'
             }}></div>
        
        <div className="relative flex justify-between items-center">
          <div>
            <h3 className="text-white text-opacity-90 text-sm font-medium mb-1">30-Day Adherence</h3>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-white mr-1">{adherenceRate}%</span>
              <span className="text-white text-opacity-80 text-sm">taken as prescribed</span>
            </div>
            <p className="text-white text-opacity-70 text-xs mt-1">
              {missedDoses > 0 
                ? `${missedDoses} missed dose${missedDoses > 1 ? 's' : ''} this month. We've all been there.`
                : 'Perfect record! Are you even human?'
              }
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center" 
                 style={{ boxShadow: '0 0 15px rgba(255, 255, 255, 0.5)' }}>
              <BarChart2 size={24} style={{ color: colors.primary }} className="animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Mini chart showing last 7 days */}
        <div className="mt-6 pt-4 border-t border-white border-opacity-20">
          <div className="h-16 relative">
            {(() => {
              // Get dates for the last 7 days
              const dates = [];
              const today = new Date();
              
              for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(today.getDate() - i);
                dates.push(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
              }
              
              // Calculate adherence per day based on history
              return dates.map((dateStr, idx) => {
                // Find logs for this date
                const dateHistory = allHistory.filter(h => {
                  // Normalize date format for comparison
                  try {
                    const historyDate = new Date(h.date).toISOString().split('T')[0];
                    return historyDate === dateStr;
                  } catch (e) {
                    return false;
                  }
                });
                
                // Calculate adherence for this day
                let height = '0%';
                if (dateHistory.length > 0) {
                  const takenCount = dateHistory.filter(h => h.status === 'taken').length;
                  const adherencePercent = (takenCount / dateHistory.length) * 100;
                  height = `${adherencePercent}%`;
                }
                
                return (
                  <div 
                    key={idx}
                    className="absolute bottom-0 bg-white bg-opacity-70 rounded-t-lg"
                    style={{ 
                      left: `${idx * (100 / 7) + (100 / 14)}%`,
                      height,
                      width: '8px',
                      transform: 'translateX(-50%)'
                    }}></div>
                );
              });
            })()}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-white text-opacity-70">
              {(() => {
                const date = new Date();
                date.setDate(date.getDate() - 6);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              })()}
            </span>
            <span className="text-xs text-white text-opacity-70">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
      
      {/* History timeline */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-4 dark-mode-transition" style={{ color: colors.textPrimary }}>Timeline</h3>
        
        {Object.keys(historyByDate).length > 0 ? (
          <div className="space-y-6">
            {Object.keys(historyByDate).sort((a, b) => {
              // Sort dates in descending order (newest first)
              try {
                return new Date(b) - new Date(a);
              } catch (e) {
                // If date parsing fails, use string comparison
                return b.localeCompare(a);
              }
            }).map(date => (
              <div key={date}>
                <h4 className="text-sm font-medium mb-3 px-2 dark-mode-transition" style={{ color: colors.textPrimary }}>{date}</h4>
                <div className="space-y-3">
                  {historyByDate[date].map((item, idx) => (
                    <div key={idx} className="flex p-3 rounded-xl bg-white shadow-md relative dark-mode-transition"
                         style={{ 
                           backgroundColor: cardBg,
                           boxShadow: `0 5px 10px -3px ${colors.primary}10` 
                         }}>
                      {/* Timeline bar */}
                      {idx < historyByDate[date].length - 1 && (
                        <div 
                          className="absolute left-8 top-full w-0.5 h-4 z-0 dark-mode-transition"
                          style={{ 
                            backgroundColor: timelineBgColor
                          }}
                        ></div>
                      )}
                      
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 z-10`}
                        style={{ 
                          background: item.status === 'taken' 
                            ? `linear-gradient(135deg, ${colors.success}, ${colors.success}80)`
                            : `linear-gradient(135deg, ${colors.danger}, ${colors.danger}80)`,
                          color: 'white'
                        }}
                      >
                        {item.status === 'taken' ? (
                          <CheckCircle size={20} />
                        ) : (
                          <X size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>
                          {!medication && item.medication ? `${item.medication} ${item.dosage || ''}` : medication?.name}
                        </p>
                        <div className="flex items-center mt-1">
                          <p className="text-xs mr-2 dark-mode-transition" style={{ color: colors.textSecondary }}>{item.time}</p>
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ 
                              backgroundColor: item.delay === 'on time' 
                                ? `${colors.success}15` 
                                : item.delay === 'missed'
                                  ? `${colors.danger}15`
                                  : `${colors.warning}15`,
                              color: item.delay === 'on time' 
                                ? colors.success 
                                : item.delay === 'missed'
                                  ? colors.danger
                                  : colors.warning
                            }}
                          >
                            {item.delay}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 dark-mode-transition" 
                 style={{ 
                   background: `${colors.primary}20`,
                   color: colors.primary
                 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 dark-mode-transition" style={{ color: colors.textPrimary }}>No history yet</h3>
            <p className="text-center text-sm max-w-xs mb-6 dark-mode-transition" style={{ color: colors.textSecondary }}>
              Start taking your medications to build up a history. We're watching... in a non-creepy way.
            </p>
            <div className="p-4 rounded-xl dark-mode-transition"
                 style={{ backgroundColor: emptyStateBg }}>
              <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                Taking your medication on time helps build good habits. As you take or miss doses, they'll appear here in your history.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
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

export default MedicationHistory;