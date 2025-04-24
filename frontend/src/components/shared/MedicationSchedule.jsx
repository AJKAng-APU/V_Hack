import React, { useState } from 'react';
import { 
  ArrowLeft, Sun, Clock, Zap, 
  Moon, Pill, CheckCircle, X, Loader
} from "lucide-react";
import { useTheme } from '../ThemeContext';

// Helper component for left chevron icon
const ChevronLeft = ({ size, style }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  );
};

// Helper component for right chevron icon
const ChevronRight = ({ size, style }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );
};

// Component for displaying medication schedule with dark mode support
const MedicationSchedule = ({ medication, medications, onTakeMedication, setView, colors }) => {
  const { isDarkMode } = useTheme();
  const [processingMed, setProcessingMed] = useState(null);
  
  // Days of the week for display in the calendar
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Get current day index (0 = Monday, 6 = Sunday in our array)
  const today = new Date();
  const currentDayIndex = (today.getDay() + 6) % 7; // Convert from JS day (0 = Sunday) to our day (0 = Monday)
  
  // Time slots for organization
  const timeSlots = ['Morning', 'Afternoon', 'Evening', 'Night'];
  
  // Generate schedule data from medications - filter for selected medication if provided
  const medsToDisplay = medication ? [medication] : medications;
  
  // Helper function to determine which time slot a schedule falls into
  const getTimeSlot = (timeString) => {
    // Handle "8:00 AM" format
    if (timeString.includes('AM') || timeString.includes('PM')) {
      const timeParts = timeString.split(':');
      let hour = parseInt(timeParts[0]);
      
      if (timeString.includes('PM') && hour < 12) {
        hour += 12;
      } else if (timeString.includes('AM') && hour === 12) {
        hour = 0;
      }
      
      if (hour >= 5 && hour < 12) return 'Morning';
      if (hour >= 12 && hour < 17) return 'Afternoon';
      if (hour >= 17 && hour < 21) return 'Evening';
      return 'Night';
    }
    
    // Handle 24-hour format
    const hour = parseInt(timeString.split(':')[0]);
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
  };
  
  // Initialize schedule data
  const scheduleData = {};
  timeSlots.forEach(slot => {
    scheduleData[slot] = [];
    
    medsToDisplay.forEach(med => {
      med.schedule.forEach(scheduleItem => {
        const time = scheduleItem.time;
        const timeSlot = getTimeSlot(time);
        
        if (timeSlot === slot) {
          scheduleData[slot].push({
            ...med,
            scheduleItem
          });
        }
      });
    });
  });
  
  // Handle medication action (take or miss)
  const handleMedicationAction = async (medId, scheduleTime, status) => {
    setProcessingMed(`${medId}-${scheduleTime}`);
    try {
      const success = await onTakeMedication(medId, scheduleTime, status);
      if (!success) {
        alert('Failed to update medication status');
      }
    } catch (error) {
      console.error('Error updating medication status:', error);
      alert('An error occurred while updating medication status');
    } finally {
      setProcessingMed(null);
    }
  };
  
  // Dark mode specific styles
  const cardBg = isDarkMode ? colors.cardBg : 'white';
  const borderColor = isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)';
  const hoverBgColor = isDarkMode ? colors.primary + '20' : 'rgba(239, 246, 255, 1)';
  const timelineBgColor = isDarkMode ? colors.primary + '30' : '#E5E7EB';
  const emptyStateBg = isDarkMode ? colors.primary + '15' : 'rgba(239, 246, 255, 1)';
  const calendarBgActive = isDarkMode ? colors.primary : 'white';
  const calendarTextActive = isDarkMode ? 'white' : colors.primary;
  
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
          <h1 className="text-2xl font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>Medication Schedule</h1>
          <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
            {medication ? medication.name : 'All medications'}
          </p>
        </div>
      </header>
      
      {/* Week selector */}
      <div className="mb-6 p-4 rounded-2xl shadow-lg flex flex-col dark-mode-transition"
           style={{ 
             backgroundColor: cardBg,
             boxShadow: `0 10px 15px -3px ${colors.primary}20` 
           }}>
        <div className="flex justify-between items-center mb-4">
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors duration-300 dark-mode-transition"
                  style={{ '&:hover': { backgroundColor: hoverBgColor } }}>
            <ChevronLeft size={20} style={{ color: colors.textPrimary }} />
          </button>
          <h3 className="font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors duration-300 dark-mode-transition"
                  style={{ '&:hover': { backgroundColor: hoverBgColor } }}>
            <ChevronRight size={20} style={{ color: colors.textPrimary }} />
          </button>
        </div>
        
        <div className="flex justify-between">
          {daysOfWeek.map((day, idx) => {
            const isToday = idx === currentDayIndex;
            // Calculate the date for this day of the week
            const date = new Date();
            const diff = idx - currentDayIndex;
            date.setDate(date.getDate() + diff);
            const dayOfMonth = date.getDate();
            
            return (
              <div key={day} className="flex flex-col items-center">
                <span className="text-xs mb-1 dark-mode-transition" style={{ color: colors.textSecondary }}>{day.slice(0, 3)}</span>
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 dark-mode-transition`}
                  style={{ 
                    background: isToday ? `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` : 'transparent',
                    boxShadow: isToday ? `0 0 10px ${colors.primary}40` : 'none',
                    color: isToday ? 'white' : colors.textPrimary
                  }}
                >
                  <span className="text-sm">{dayOfMonth}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Daily schedule */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-4 dark-mode-transition" style={{ color: colors.textPrimary }}>Today's Schedule</h3>
        
        <div className="space-y-5">
          {timeSlots.map((slot, idx) => (
            <div key={slot} className="relative">
              {/* Timeline bar */}
              {idx < timeSlots.length - 1 && (
                <div className="absolute left-5 top-10 w-0.5 h-6 z-0 dark-mode-transition"
                     style={{ backgroundColor: timelineBgColor }}></div>
              )}
              
              <div className="flex items-start mb-2">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center mr-3 z-10"
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.primary}80, ${colors.accent}60)`,
                    color: 'white',
                    boxShadow: `0 5px 10px -3px ${colors.primary}40`
                  }}
                >
                  {slot === 'Morning' ? (
                    <Sun size={20} />
                  ) : slot === 'Afternoon' ? (
                    <Clock size={20} />
                  ) : slot === 'Evening' ? (
                    <Zap size={20} />
                  ) : (
                    <Moon size={20} />
                  )}
                </div>
                <div>
                  <h4 className="font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>{slot}</h4>
                  <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                    {slot === 'Morning' ? '5:00 AM - 11:59 AM' : 
                     slot === 'Afternoon' ? '12:00 PM - 4:59 PM' : 
                     slot === 'Evening' ? '5:00 PM - 8:59 PM' : 
                     '9:00 PM - 4:59 AM'}
                  </p>
                </div>
              </div>
              
              <div className="ml-13 space-y-2">
                {scheduleData[slot].length > 0 ? (
                  scheduleData[slot].map((medData, medIdx) => {
                    const isProcessing = processingMed === `${medData.id}-${medData.scheduleItem.time}`;
                    
                    return (
                      <div 
                        key={`${medData.id}-${slot}-${medIdx}`} 
                        className="p-3 rounded-xl shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-300 dark-mode-transition"
                        style={{ 
                          backgroundColor: cardBg,
                          boxShadow: `0 5px 10px -3px ${colors.primary}10` 
                        }}
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center mr-2 dark-mode-transition"
                            style={{ 
                              backgroundColor: `${colors.primary}15`,
                              color: colors.primary
                            }}
                          >
                            <Pill size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>
                              {medData.name} {medData.dosage}
                            </p>
                            <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                              {medData.scheduleItem.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {medData.scheduleItem.status === 'taken' ? (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center dark-mode-transition" 
                                style={{ backgroundColor: `${colors.success}20`, color: colors.success }}>
                              <CheckCircle size={14} />
                            </div>
                          ) : medData.scheduleItem.status === 'missed' ? (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center dark-mode-transition" 
                                style={{ backgroundColor: `${colors.danger}20`, color: colors.danger }}>
                              <X size={14} />
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <button 
                                className="px-3 py-1 rounded-lg text-xs font-medium shadow-sm transition-all duration-300 hover:shadow-md transform hover:scale-105 flex items-center" 
                                style={{ 
                                  background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                                  color: 'white',
                                  boxShadow: `0 2px 4px -1px ${colors.primary}30`
                                }}
                                onClick={() => handleMedicationAction(medData.id, medData.scheduleItem.time, 'taken')}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <Loader size={12} className="animate-spin" />
                                ) : (
                                  'Take'
                                )}
                              </button>
                              <button 
                                className="px-2 py-1 rounded-lg text-xs font-medium border transition-all duration-300" 
                                style={{ 
                                  borderColor: `${colors.danger}40`,
                                  color: colors.danger
                                }}
                                onClick={() => handleMedicationAction(medData.id, medData.scheduleItem.time, 'missed')}
                                disabled={isProcessing}
                              >
                                Skip
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 rounded-xl flex items-center dark-mode-transition"
                       style={{ backgroundColor: emptyStateBg }}>
                    <p className="text-xs italic dark-mode-transition" style={{ color: colors.textSecondary }}>
                      No medications scheduled. Time for a break!
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tips section */}
      <div className="p-5 rounded-2xl shadow-lg border mb-6 dark-mode-transition"
           style={{ 
             backgroundColor: cardBg,
             borderColor: borderColor,
             boxShadow: `0 10px 15px -3px ${colors.primary}20` 
           }}>
        <h3 className="font-bold text-lg mb-3 dark-mode-transition" style={{ color: colors.textPrimary }}>Schedule Tips</h3>
        <ul className="space-y-2">
          <li className="flex items-center text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center mr-2 dark-mode-transition" 
                 style={{ backgroundColor: `${colors.success}15`, color: colors.success }}>
              <CheckCircle size={12} />
            </div>
            Take medications at the same time each day to build a routine
          </li>
          <li className="flex items-center text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center mr-2 dark-mode-transition" 
                 style={{ backgroundColor: `${colors.success}15`, color: colors.success }}>
              <CheckCircle size={12} />
            </div>
            Use meal times as reminders for medications that need to be taken with food
          </li>
          <li className="flex items-center text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center mr-2 dark-mode-transition" 
                 style={{ backgroundColor: `${colors.success}15`, color: colors.success }}>
              <CheckCircle size={12} />
            </div>
            Set reminders on your phone (or use our app, obviously) to help you remember
          </li>
        </ul>
      </div>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  );
};

export default MedicationSchedule;