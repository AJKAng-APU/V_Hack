import React, { useState } from 'react';
import { 
  ArrowLeft, Edit, MoreVertical, CheckCircle, X, 
  Clock, Bell, BarChart2, Calendar, ChevronRight, 
  AlertTriangle, Pill, Zap, ActivitySquare, Trash2, Loader
} from "lucide-react";
import { useTheme } from '../ThemeContext';

// Component for displaying detailed information about a selected medication with biorhythm integration
const MedicationDetail = ({ medication, setView, onDelete, onUpdate, onTakeMedication, colors }) => {
  const { isDarkMode } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  if (!medication) return null;
  
  // Check if the medication has biorhythm data
  const hasBiorhythmData = medication.biorhythmData !== undefined;
  const biorhythmData = medication.biorhythmData || {};
  
  // Determine alignment color based on score
  let alignmentColor, alignmentText;
  if (hasBiorhythmData) {
    if (biorhythmData.alignmentScore >= 80) {
      alignmentColor = colors.success;
      alignmentText = "Excellent alignment with your biorhythm";
    } else if (biorhythmData.alignmentScore >= 60) {
      alignmentColor = colors.warning;
      alignmentText = "Moderate alignment with your biorhythm";
    } else {
      alignmentColor = colors.danger;
      alignmentText = "Poor alignment with your biorhythm";
    }
  }

  // Handle medication action (take or miss)
  const handleMedicationAction = async (scheduleItem, status) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    const success = await onTakeMedication(medication.id, scheduleItem.time, status);
    setIsProcessing(false);
    
    if (!success) {
      alert('Failed to update medication status');
    }
  };
  
  // Handle medication deletion
  const handleDelete = async () => {
    if (isProcessing) return;
    
    if (window.confirm(`Are you sure you want to delete ${medication.name}?`)) {
      setIsProcessing(true);
      const success = await onDelete(medication.id);
      setIsProcessing(false);
      
      if (success) {
        setView('main');
      }
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // If it's already in a display format (e.g., "March 10, 2025"), return as is
    if (dateString.includes(',')) return dateString;
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  // Dynamic styles based on dark mode
  const cardBg = isDarkMode ? colors.cardBg : 'white';
  const borderColor = isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)';
  const hoverBgColor = isDarkMode ? `${colors.primary}20` : 'rgba(239, 246, 255, 1)';
  const secondaryCardBg = isDarkMode ? colors.darkBg : 'white';
  const pillButtonBg = isDarkMode ? `${colors.primary}20` : 'rgba(239, 246, 255, 1)';
  const menuBg = isDarkMode ? colors.darkBg : 'white';
  
  return (
    <>
      <header className="flex items-center mb-8">
        <button 
          className="w-10 h-10 rounded-full flex items-center justify-center mr-4 hover:bg-blue-50 transition-colors duration-300 dark-mode-transition"
          onClick={() => setView('main')}
          style={{ backgroundColor: 'transparent', '&:hover': { backgroundColor: hoverBgColor } }}
        >
          <ArrowLeft size={24} style={{ color: colors.textPrimary }} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>{medication.name}</h1>
          <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>{medication.dosage} • {medication.purpose}</p>
        </div>
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors duration-300 dark-mode-transition"
                style={{ backgroundColor: 'transparent', '&:hover': { backgroundColor: hoverBgColor } }}>
          <Edit size={20} style={{ color: colors.textPrimary }} />
        </button>
        <div className="relative">
          <button 
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors duration-300 dark-mode-transition"
            style={{ backgroundColor: 'transparent', '&:hover': { backgroundColor: hoverBgColor } }}
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreVertical size={20} style={{ color: colors.textPrimary }} />
          </button>
          
          {/* Dropdown menu */}
          {showMenu && (
            <div 
              className="absolute right-0 top-10 w-40 p-2 rounded-xl shadow-xl z-20 border dark-mode-transition"
              style={{ 
                backgroundColor: menuBg,
                borderColor: borderColor,
                boxShadow: `0 10px 25px -5px ${colors.primary}30` 
              }}
              onClick={e => e.stopPropagation()}
            >
              <button 
                className="w-full p-2 rounded-lg hover:bg-blue-50 text-left text-sm transition-colors duration-200 dark-mode-transition flex items-center" 
                style={{ '&:hover': { backgroundColor: hoverBgColor }, color: colors.textPrimary }}
                onClick={() => {
                  setShowMenu(false);
                  // Edit functionality would go here
                }}
              >
                <Edit size={16} className="mr-2" />
                Edit
              </button>
              <button 
                className="w-full p-2 rounded-lg hover:bg-red-50 text-left text-sm transition-colors duration-200 flex items-center" 
                style={{ '&:hover': { backgroundColor: `${colors.danger}10` }, color: colors.danger }}
                onClick={() => {
                  setShowMenu(false);
                  handleDelete();
                }}
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </header>
      
      {/* Biorhythm Data if available */}
      {hasBiorhythmData && (
        <div className="mb-6 p-5 rounded-2xl shadow-lg border relative animate-breathe dark-mode-transition"
             style={{ 
               backgroundColor: cardBg,
               boxShadow: `0 15px 20px -3px ${colors.primary}30`,
               borderColor: borderColor,
               borderLeft: `4px solid ${alignmentColor}`
             }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full animate-float" 
               style={{ 
                 background: `radial-gradient(circle, ${colors.primary}10, transparent 70%)`,
                 transform: 'translate(30%, -30%)'
               }}></div>
          
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 shimmer" 
                style={{ 
                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`,
                }}>
              <ActivitySquare size={24} color="white" />
            </div>
            <div>
              <h3 className="font-bold text-lg dark-mode-transition" style={{ color: colors.textPrimary }}>Biorhythm Alignment</h3>
              <div className="flex items-center">
                <span 
                  className="text-2xl font-bold mr-2"
                  style={{ color: alignmentColor }}
                >
                  {biorhythmData.alignmentScore}%
                </span>
                <span className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                  {alignmentText}
                </span>
              </div>
            </div>
          </div>
          
          {biorhythmData.suggestedChanges && biorhythmData.suggestedChanges.length > 0 && (
            <div className="p-3 rounded-xl mt-2 dark-mode-transition"
                style={{ backgroundColor: isDarkMode ? `${colors.primary}15` : 'rgba(239, 246, 255, 1)' }}>
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shadow-sm" 
                     style={{ 
                       background: `linear-gradient(135deg, ${colors.accent}40, ${colors.accent}20)`,
                       color: colors.accent
                     }}>
                  <Zap size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>
                    Optimization Suggestion
                  </p>
                  <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                    Consider taking this medication at {biorhythmData.suggestedChanges[0].to} instead of {biorhythmData.suggestedChanges[0].from} for better alignment with your metabolic biorhythm.
                  </p>
                  <div className="mt-2 flex items-center">
                    <button 
                      className="px-3 py-1 rounded-lg text-xs font-medium mr-3 shadow-sm transition-all duration-300 hover:shadow-md" 
                      style={{ 
                        background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                        color: 'white',
                        boxShadow: `0 4px 6px -1px ${colors.primary}30`
                      }}
                    >
                      Update schedule
                    </button>
                    <button 
                      className="px-3 py-1 rounded-lg text-xs font-medium dark-mode-transition" 
                      style={{ color: colors.textSecondary }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Today's schedule */}
      <div className="mb-6 p-5 rounded-2xl shadow-lg border dark-mode-transition"
           style={{ 
             backgroundColor: cardBg, 
             borderColor: borderColor,
             boxShadow: `0 10px 15px -3px ${colors.primary}20` 
           }}>
        <h3 className="font-bold text-lg mb-4 dark-mode-transition" style={{ color: colors.textPrimary }}>Today's Schedule</h3>
        <div className="space-y-3">
          {medication.schedule.map((time, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl dark-mode-transition"
                 style={{ backgroundColor: isDarkMode ? `${colors.primary}15` : 'rgba(239, 246, 255, 1)' }}>
              <div className="flex items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center mr-3`}
                  style={{ 
                    background: time.status === 'taken' 
                      ? `linear-gradient(135deg, ${colors.success}, ${colors.success}80)`
                      : time.status === 'missed'
                        ? `linear-gradient(135deg, ${colors.danger}, ${colors.danger}80)`
                        : isDarkMode ? colors.darkBg : 'white',
                    color: time.status === 'upcoming' ? colors.textSecondary : 'white',
                    boxShadow: `0 5px 10px -3px ${colors.primary}20`
                  }}
                >
                  {time.status === 'taken' ? (
                    <CheckCircle size={20} />
                  ) : time.status === 'missed' ? (
                    <X size={20} />
                  ) : (
                    <Clock size={20} />
                  )}
                </div>
                <div>
                  <p className="font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>{time.time}</p>
                  <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                    {time.status === 'taken' ? 'Taken' : time.status === 'missed' ? 'Missed' : 'Upcoming'}
                  </p>
                </div>
              </div>
              {time.status === 'upcoming' ? (
                <div className="flex items-center">
                  <button 
                    className="px-3 py-1.5 rounded-lg text-sm font-medium shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 mr-2" 
                    style={{ 
                      background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                      color: 'white',
                      boxShadow: `0 4px 6px -1px ${colors.primary}30`
                    }}
                    onClick={() => handleMedicationAction(time, 'taken')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      'Take now'
                    )}
                  </button>
                  <button 
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border" 
                    style={{ 
                      borderColor: `${colors.danger}40`,
                      color: colors.danger
                    }}
                    onClick={() => handleMedicationAction(time, 'missed')}
                    disabled={isProcessing}
                  >
                    Skip
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        
        {/* Reminders setting */}
        <div className="mt-4 flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 transition-colors duration-300 dark-mode-transition"
             style={{ '&:hover': { backgroundColor: hoverBgColor } }}>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 shadow-sm" 
                 style={{ 
                   background: `linear-gradient(135deg, ${colors.primary}40, ${colors.primary}20)`,
                   color: colors.primary
                 }}>
              <Bell size={20} />
            </div>
            <div>
              <p className="font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>Reminders</p>
              <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>10 minutes before - so you can't claim you forgot</p>
            </div>
          </div>
          <button 
            className="w-10 h-5 rounded-full relative transition-all duration-300"
            style={{ 
              backgroundColor: colors.primary,
              boxShadow: `0 0 10px ${colors.primary}40`
            }}
          >
            <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white transform transition-transform duration-300"></span>
          </button>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl shadow-md dark-mode-transition"
             style={{ 
               backgroundColor: cardBg,
               boxShadow: `0 5px 10px -3px ${colors.primary}20` 
             }}>
          <h4 className="text-xs font-medium mb-2 dark-mode-transition" style={{ color: colors.textSecondary }}>Adherence Rate</h4>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold mr-1" style={{ color: colors.success }}>{medication.adherenceRate}%</span>
            <span className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>last 30 days</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl shadow-md dark-mode-transition"
             style={{ 
               backgroundColor: cardBg,
               boxShadow: `0 5px 10px -3px ${colors.primary}20` 
             }}>
          <h4 className="text-xs font-medium mb-2 dark-mode-transition" style={{ color: colors.textSecondary }}>Refill in</h4>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold mr-1" style={{ color: colors.primary }}>{medication.refillRemaining}</span>
            <span className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
              {medication.refillRemaining <= 5 ? "days - better call soon!" : "days left"}
            </span>
          </div>
        </div>
      </div>
      
      {/* Information */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-4 dark-mode-transition" style={{ color: colors.textPrimary }}>Information</h3>
        <div className="p-5 rounded-2xl shadow-lg border space-y-4 dark-mode-transition"
             style={{ 
               backgroundColor: cardBg, 
               borderColor: borderColor,
               boxShadow: `0 10px 15px -3px ${colors.primary}20` 
             }}>
          <div>
            <h4 className="text-sm font-medium mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>Instructions</h4>
            <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>{medication.instructions}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>Prescribed by</h4>
            <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
              {medication.prescribedBy || 'Not specified'} • Since {formatDate(medication.startDate)}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>Refill date</h4>
            <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
              {formatDate(medication.refillDate)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Interactions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg dark-mode-transition" style={{ color: colors.textPrimary }}>Interactions</h3>
          <button 
            className="text-sm font-medium px-3 py-1 rounded-full transition-all duration-300 hover:shadow-md dark-mode-transition" 
            style={{ color: colors.primary, backgroundColor: `${colors.primary}10` }}
            onClick={() => setView('interactions')}
          >
            View all
          </button>
        </div>
        
        {medication.interactions && medication.interactions.length > 0 ? (
          <div className="p-5 rounded-2xl shadow-lg border dark-mode-transition"
               style={{ 
                 backgroundColor: cardBg, 
                 borderColor: borderColor,
                 boxShadow: `0 10px 15px -3px ${colors.primary}20` 
               }}>
            {medication.interactions.slice(0, 1).map((interaction, idx) => (
              <div key={idx} className="mb-4">
                <div className="flex items-center mb-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center mr-2 dark-mode-transition"
                    style={{ 
                      backgroundColor: interaction.severity === 'high' ? `${colors.danger}20` : `${colors.warning}20`,
                      color: interaction.severity === 'high' ? colors.danger : colors.warning
                    }}
                  >
                    <AlertTriangle size={16} />
                  </div>
                  <h4 className="font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>
                    Interaction with {interaction.medication}
                  </h4>
                </div>
                <p className="text-sm ml-10 dark-mode-transition" style={{ color: colors.textSecondary }}>
                  {interaction.description}
                </p>
              </div>
            ))}
            
            {medication.interactions.length > 1 && (
              <button 
                className="text-sm font-medium flex items-center mt-2 ml-10 dark-mode-transition"
                style={{ color: colors.primary }}
                onClick={() => setView('interactions')}
              >
                View {medication.interactions.length - 1} more interactions
                <ChevronRight size={16} className="ml-1" />
              </button>
            )}
          </div>
        ) : (
          <div className="p-5 rounded-2xl shadow-lg border flex items-center dark-mode-transition"
               style={{ 
                 backgroundColor: cardBg, 
                 borderColor: borderColor,
                 boxShadow: `0 10px 15px -3px ${colors.primary}20` 
               }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 dark-mode-transition" 
                 style={{ 
                   backgroundColor: `${colors.success}20`,
                   color: colors.success
                 }}>
              <CheckCircle size={20} />
            </div>
            <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
              No known interactions with your other medications. Lucky you!
            </p>
          </div>
        )}
      </div>
      
      {/* Side Effects */}
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-4 dark-mode-transition" style={{ color: colors.textPrimary }}>Side Effects</h3>
        <div className="p-5 rounded-2xl shadow-lg border dark-mode-transition"
             style={{ 
               backgroundColor: cardBg, 
               borderColor: borderColor,
               boxShadow: `0 10px 15px -3px ${colors.primary}20` 
             }}>
          {medication.sideEffects && medication.sideEffects.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {medication.sideEffects.map((effect, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-medium dark-mode-transition"
                  style={{ backgroundColor: `${colors.textSecondary}15`, color: colors.textSecondary }}
                >
                  {effect}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm dark-mode-transition mb-3" style={{ color: colors.textSecondary }}>
              No known side effects recorded.
            </p>
          )}
          <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
            Contact your doctor if you experience severe side effects... or just google it at 3 AM like everyone else
          </p>
        </div>
      </div>
      
      {/* Quick actions */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <button 
          className="p-4 rounded-2xl shadow-md flex items-center justify-center transition-all duration-300 hover:shadow-lg dark-mode-transition"
          style={{ 
            backgroundColor: cardBg,
            boxShadow: `0 5px 10px -3px ${colors.primary}20` 
          }}
          onClick={() => setView('history')}
        >
          <BarChart2 size={20} className="mr-2" style={{ color: colors.primary }} />
          <span className="font-medium text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>View History</span>
        </button>
        <button 
          className="p-4 rounded-2xl shadow-md flex items-center justify-center transition-all duration-300 hover:shadow-lg dark-mode-transition"
          style={{ 
            backgroundColor: cardBg,
            boxShadow: `0 5px 10px -3px ${colors.primary}20` 
          }}
          onClick={() => setView('schedule')}
        >
          <Calendar size={20} className="mr-2" style={{ color: colors.primary }} />
          <span className="font-medium text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>View Schedule</span>
        </button>
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
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.2; }
          100% { transform: scale(1.1); opacity: 0.3; }
        }
        @keyframes float {
          0% { transform: translateY(0px) translateX(30%, -30%); }
          50% { transform: translateY(-10px) translateX(30%, -30%); }
          100% { transform: translateY(0px) translateX(30%, -30%); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-breathe {
          animation: breathe 4s ease-in-out infinite;
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .shimmer {
          background: linear-gradient(90deg, 
            rgba(255,255,255,0) 0%, 
            rgba(255,255,255,0.2) 50%, 
            rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        
        .dark .shimmer {
          background: linear-gradient(90deg, 
            rgba(30,41,59,0) 0%, 
            rgba(30,41,59,0.3) 50%, 
            rgba(30,41,59,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  );
};

export default MedicationDetail;