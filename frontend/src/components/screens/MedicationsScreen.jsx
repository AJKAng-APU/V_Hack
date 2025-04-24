// This fix corrects two key issues:
// 1. The app shows empty state even with search results
// 2. There's a duplicate Biorhythm Optimization component

import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Filter, Calendar, Zap, CheckCircle, Clock, X, AlertTriangle, Pill } from "lucide-react";
import { useTheme } from '../ThemeContext';

// Import sub-components
import MedicationList from '../shared/MedicationList';
import MedicationDetail from '../shared/MedicationDetail';
import MedicationHistory from '../shared/MedicationHistory';
import MedicationSchedule from '../shared/MedicationSchedule';
import MedicationInteractions from '../shared/MedicationInteractions';
import AddMedicationForm from '../shared/AddMedicationForm';

// Import biorhythm engine
import { biorhythmEngine, formatTimeWindows } from '../services/BiorhythmEngine';

// Import our custom hook for medication data
import useMedications from '../useMedications';

// Main component for medication management with biorhythm integration
const MedicationsScreen = ({ colors, setActiveScreen }) => {
  // Get theme context for dark mode
  const { isDarkMode } = useTheme();
  
  // Use our custom hook to fetch and manage medications
  const { 
    medications, 
    loading, 
    error, 
    addMedication: addMedicationToSupabase, 
    updateMedication: updateMedicationInSupabase,
    deleteMedication: deleteMedicationFromSupabase,
    logMedicationStatus,
    updateMedicationWithBiorhythm
  } = useMedications();
  
  // Dark mode specific styles
  const cardBg = isDarkMode ? colors.cardBg : 'white';
  const borderColor = isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)';
  const hoverBgColor = isDarkMode ? colors.primary + '20' : 'rgba(239, 246, 255, 1)';
  const inputBg = isDarkMode ? colors.darkBg : 'white';
  const emptyStateBg = isDarkMode ? colors.primary + '15' : 'rgba(239, 246, 255, 1)';
  const calendarBgActive = isDarkMode ? colors.primary : 'white';
  const calendarTextActive = isDarkMode ? 'white' : colors.primary;
  const timelineBgColor = isDarkMode ? colors.primary + '30' : '#E5E7EB';
  const pageBgColor = isDarkMode ? colors.darkBg : 'transparent';
  
  // View state (main, detail, add, history, schedule, interactions)
  const [view, setView] = useState('main');
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [biorhythmOptimized, setBiorhythmOptimized] = useState(false);
  const [biorhythmData, setBiorhythmData] = useState(null);
  const [optimizedMeds, setOptimizedMeds] = useState([]);
  
  // Loading state for UI
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Load biorhythm data
  useEffect(() => {
    try {
      const data = biorhythmEngine.getRecommendations();
      setBiorhythmData(data);
      
      // Create optimized medication schedule based on biorhythm
      if (data && medications.length > 0) {
        optimizeMedicationTiming(data);
      }
    } catch (error) {
      console.error("Failed to load biorhythm data:", error);
    }
  }, [medications]);
  
  // Optimize medication timing based on biorhythm data
  const optimizeMedicationTiming = (bioData) => {
    if (!bioData) return;
    
    // Get optimal times for medication from biorhythm engine
    const optimalMedicationTimes = bioData.recommendations.medicationTiming;
    
    // Create new array of medications with optimized timing
    const optimized = medications.map(med => {
      // Deep clone the medication object
      const optimizedMed = JSON.parse(JSON.stringify(med));
      
      // Calculate biorhythm alignment score for each medication based on its category
      let alignmentScore = 0;
      let optimizedTimes = [];
      let suggestedChanges = [];
      
      optimizedMed.schedule.forEach(scheduleItem => {
        // Convert time string to hour (24-hour format)
        let hour = 0;
        if (scheduleItem.time.includes('AM') || scheduleItem.time.includes('PM')) {
          const timeParts = scheduleItem.time.split(':');
          let timeHour = parseInt(timeParts[0]);
          const isPM = scheduleItem.time.includes('PM');
          
          hour = isPM && timeHour !== 12 ? timeHour + 12 : 
                !isPM && timeHour === 12 ? 0 : timeHour;
        }
        
        // Check if current time is optimal according to biorhythm
        const isOptimalTime = optimalMedicationTimes.includes(hour);
        
        // If not optimal, find the nearest optimal time
        if (!isOptimalTime && scheduleItem.status === 'upcoming') {
          let nearestOptimalHour = optimalMedicationTimes.reduce((nearest, current) => {
            return Math.abs(current - hour) < Math.abs(nearest - hour) ? current : nearest;
          }, optimalMedicationTimes[0]);
          
          // Format the optimal time in AM/PM format
          const optimalTimeFormatted = `${nearestOptimalHour > 12 ? nearestOptimalHour - 12 : nearestOptimalHour === 0 ? 12 : nearestOptimalHour}:00 ${nearestOptimalHour >= 12 ? 'PM' : 'AM'}`;
          
          optimizedTimes.push({
            currentTime: scheduleItem.time,
            optimalTime: optimalTimeFormatted
          });
          
          suggestedChanges.push({
            from: scheduleItem.time,
            to: optimalTimeFormatted,
            difference: Math.abs(nearestOptimalHour - hour)
          });
        }
        
        // Calculate alignment score
        if (isOptimalTime) {
          alignmentScore += 100;
        } else {
          // Find how far the current time is from optimal
          const closestOptimalHour = optimalMedicationTimes.reduce((nearest, current) => {
            return Math.abs(current - hour) < Math.abs(nearest - hour) ? current : nearest;
          }, optimalMedicationTimes[0]);
          
          const hourDifference = Math.abs(closestOptimalHour - hour);
          
          // Calculate score based on proximity to optimal time (100 - distance * 10)
          alignmentScore += Math.max(0, 100 - (hourDifference * 10));
        }
      });
      
      // Calculate average alignment score
      alignmentScore = Math.round(alignmentScore / optimizedMed.schedule.length);
      
      // Add biorhythm data to medication
      return {
        ...optimizedMed,
        biorhythmData: {
          alignmentScore,
          optimizedTimes,
          suggestedChanges
        }
      };
    });
    
    setOptimizedMeds(optimized);
  };

  // Filter medications based on search query
  const filteredMedications = (biorhythmOptimized ? optimizedMeds : medications).filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add a new medication
  const addMedication = async (newMedication) => {
    setIsProcessing(true);
    
    // Format schedule times to match database format
    const formattedSchedule = newMedication.schedule.map(item => {
      // Extract just the time part and standardize format
      let timeStr = item.time;
      return {
        ...item,
        time: timeStr
      };
    });
    
    // Prepare the medication data
    const medicationData = {
      ...newMedication,
      schedule: formattedSchedule
    };
    
    // Send to Supabase
    const result = await addMedicationToSupabase(medicationData);
    
    setIsProcessing(false);
    
    if (result.success) {
      // If biorhythm optimization is enabled, update the new medication with biorhythm data
      if (biorhythmData && biorhythmOptimized) {
        // Wait for the next render cycle to ensure the medication is in the list
        setTimeout(() => {
          optimizeMedicationTiming(biorhythmData);
        }, 0);
      }
      
      setView('main');
      return true;
    } else {
      // Show error to user
      alert(`Failed to add medication: ${result.error}`);
      return false;
    }
  };

  // Delete a medication
  const deleteMedication = async (medicationId) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      setIsProcessing(true);
      const result = await deleteMedicationFromSupabase(medicationId);
      setIsProcessing(false);
      
      if (result.success) {
        setView('main');
        return true;
      } else {
        alert(`Failed to delete medication: ${result.error}`);
        return false;
      }
    }
    return false;
  };

  // Update a medication
  const updateMedication = async (medicationId, updatedData) => {
    setIsProcessing(true);
    const result = await updateMedicationInSupabase(medicationId, updatedData);
    setIsProcessing(false);
    
    if (result.success) {
      // If biorhythm optimization is enabled, update the medication with biorhythm data
      if (biorhythmData && biorhythmOptimized) {
        setTimeout(() => {
          optimizeMedicationTiming(biorhythmData);
        }, 0);
      }
      
      return true;
    } else {
      alert(`Failed to update medication: ${result.error}`);
      return false;
    }
  };

  // Take, skip, or miss a medication
  const handleMedicationAction = async (medicationId, scheduleTime, status) => {
    setIsProcessing(true);
    const result = await logMedicationStatus(medicationId, scheduleTime, status);
    setIsProcessing(false);
    
    if (result.success) {
      return true;
    } else {
      alert(`Failed to update medication status: ${result.error}`);
      return false;
    }
  };

  // Toggle biorhythm optimization
  const toggleBiorhythmOptimization = () => {
    setBiorhythmOptimized(!biorhythmOptimized);
    
    // If enabling optimization and we have biorhythm data but no optimized meds yet
    if (!biorhythmOptimized && biorhythmData && (!optimizedMeds.length || optimizedMeds.length !== medications.length)) {
      optimizeMedicationTiming(biorhythmData);
    }
  };

  // Cleanup any popups when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowAddOptions(false);
      setShowFilterOptions(false);
    };
    
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Show loading state while fetching data
  if (loading && view === 'main') {
    return (
      <div className="p-6 pb-8 h-full flex flex-col items-center justify-center dark-mode-transition" style={{ backgroundColor: pageBgColor }}>
        <div className="w-16 h-16 rounded-full animate-spin mb-6" 
             style={{ 
               borderWidth: '4px',
               borderStyle: 'solid',
               borderColor: `${colors.primary}20`,
               borderTopColor: colors.primary
             }}></div>
        <h3 className="text-xl font-bold mb-2 dark-mode-transition" style={{ color: colors.textPrimary }}>Loading Medications</h3>
        <p className="text-center text-sm max-w-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
          Fetching your medication information...
        </p>
      </div>
    );
  }

  // Show error state if there's an issue
  if (error && view === 'main') {
    return (
      <div className="p-6 pb-8 h-full flex flex-col items-center justify-center dark-mode-transition" style={{ backgroundColor: pageBgColor }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 text-white"
             style={{ backgroundColor: colors.danger }}>
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold mb-2 dark-mode-transition" style={{ color: colors.textPrimary }}>Something Went Wrong</h3>
        <p className="text-center text-sm max-w-xs mb-6 dark-mode-transition" style={{ color: colors.textSecondary }}>
          We couldn't load your medications: {error}
        </p>
        <button 
          className="px-6 py-2 rounded-xl text-white font-medium transition-all duration-300 hover:shadow-lg"
          style={{ 
            background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
            boxShadow: `0 4px 6px -1px ${colors.primary}30`
          }}
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Render the appropriate view based on state
  const renderView = () => {
    switch(view) {
      case 'detail':
        return (
          <MedicationDetail 
            medication={selectedMedication} 
            setView={setView}
            onDelete={deleteMedication}
            onUpdate={updateMedication}
            onTakeMedication={handleMedicationAction}
            colors={colors} 
            isDarkMode={isDarkMode}
          />
        );
      case 'history':
        return (
          <MedicationHistory 
            medication={selectedMedication} 
            medications={biorhythmOptimized ? optimizedMeds : medications} 
            setView={setView} 
            colors={colors} 
            isDarkMode={isDarkMode}
          />
        );
      case 'schedule':
        return (
          <MedicationSchedule 
            medication={selectedMedication} 
            medications={biorhythmOptimized ? optimizedMeds : medications} 
            onTakeMedication={handleMedicationAction}
            setView={setView} 
            colors={colors} 
            isDarkMode={isDarkMode}
          />
        );
      case 'interactions':
        return (
          <MedicationInteractions 
            medication={selectedMedication} 
            setView={setView} 
            colors={colors} 
            isDarkMode={isDarkMode}
          />
        );
      case 'add':
        return (
          <AddMedicationForm 
            setView={setView} 
            addMedication={addMedication}
            isProcessing={isProcessing}
            colors={colors} 
            isDarkMode={isDarkMode}
          />
        );
      default:
        // Check if we actually have medications that match the search query
        const hasSearchResults = searchQuery === '' || filteredMedications.length > 0;
        
        // If there are no medications at all (not just no search results)
        if (medications.length === 0) {
          return (
            <div>
              <header className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">Medications</h1>
                  <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                    Track your pills, because even I can't remember all this stuff
                  </p>
                </div>
                <div className="relative">
                  <button 
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 duration-300 z-10" 
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                      boxShadow: `0 0 15px ${colors.primary}40`
                    }}
                    onClick={() => setView('add')}
                  >
                    <PlusCircle size={24} color="white" />
                  </button>
                </div>
              </header>
                
              <div className="p-6 rounded-2xl border flex flex-col items-center justify-center dark-mode-transition"
                   style={{ 
                     backgroundColor: emptyStateBg,
                     borderColor: borderColor
                   }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 dark-mode-transition" 
                     style={{ 
                       background: `${colors.primary}20`,
                       color: colors.primary
                     }}>
                  <Pill size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2 dark-mode-transition" style={{ color: colors.textPrimary }}>No Medications Yet</h3>
                <p className="text-center text-sm max-w-xs mb-6 dark-mode-transition" style={{ color: colors.textSecondary }}>
                  You haven't added any medications yet. Start by adding your first medication.
                </p>
                <button 
                  className="px-6 py-2 rounded-xl text-white font-medium transition-all duration-300 hover:shadow-lg"
                  style={{ 
                    background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                    boxShadow: `0 4px 6px -1px ${colors.primary}30`
                  }}
                  onClick={() => setView('add')}
                >
                  Add Medication
                </button>
              </div>
              
              {/* Only show one Biorhythm Optimization card */}
              <div className="mt-6 mb-6 p-4 rounded-2xl shadow-lg border flex items-center justify-between dark-mode-transition"
                   style={{ 
                     backgroundColor: cardBg,
                     borderColor: borderColor,
                     boxShadow: `0 10px 15px -3px ${colors.primary}20` 
                   }}>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 shimmer" 
                       style={{ 
                         background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`,
                       }}>
                    <Zap size={24} color="white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg dark-mode-transition" style={{ color: colors.textPrimary }}>Biorhythm Optimization</h3>
                    <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                      {biorhythmOptimized 
                        ? "Your meds are now aligned with your body's rhythm. Science or magic? You decide." 
                        : "Optimize your medication schedule based on your biorhythm"}
                    </p>
                  </div>
                </div>
                <div>
                  <button 
                    className="w-14 h-7 rounded-full relative transition-all duration-300 focus:outline-none"
                    style={{ 
                      backgroundColor: biorhythmOptimized ? colors.primary : isDarkMode ? '#374151' : '#E5E7EB',
                      boxShadow: biorhythmOptimized ? `0 0 10px ${colors.primary}40` : 'none'
                    }}
                    onClick={toggleBiorhythmOptimization}
                  >
                    <span 
                      className="absolute top-1 w-5 h-5 rounded-full bg-white transform transition-transform duration-300"
                      style={{ 
                        left: biorhythmOptimized ? 'auto' : '0.25rem',
                        right: biorhythmOptimized ? '0.25rem' : 'auto'
                      }}
                    ></span>
                  </button>
                </div>
              </div>
            </div>
          );
        }
        
        // Show medication list if medications exist
        return (
          <>
            <MedicationList 
              medications={filteredMedications} 
              setSelectedMedication={setSelectedMedication} 
              setView={setView} 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              showAddOptions={showAddOptions} 
              setShowAddOptions={setShowAddOptions} 
              showFilterOptions={showFilterOptions} 
              setShowFilterOptions={setShowFilterOptions} 
              onTakeMedication={handleMedicationAction}
              colors={colors}
              biorhythmOptimized={biorhythmOptimized}
            />
            
            {/* Only show one Biorhythm Optimization card */}
            <div className="mb-6 p-4 rounded-2xl shadow-lg border flex items-center justify-between dark-mode-transition"
                 style={{ 
                   backgroundColor: cardBg,
                   borderColor: borderColor,
                   boxShadow: `0 10px 15px -3px ${colors.primary}20` 
                 }}>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 shimmer" 
                     style={{ 
                       background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`,
                     }}>
                  <Zap size={24} color="white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg dark-mode-transition" style={{ color: colors.textPrimary }}>Biorhythm Optimization</h3>
                  <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                    {biorhythmOptimized 
                      ? "Your meds are now aligned with your body's rhythm. Science or magic? You decide." 
                      : "Optimize your medication schedule based on your biorhythm"}
                  </p>
                </div>
              </div>
              <div>
                <button 
                  className="w-14 h-7 rounded-full relative transition-all duration-300 focus:outline-none"
                  style={{ 
                    backgroundColor: biorhythmOptimized ? colors.primary : isDarkMode ? '#374151' : '#E5E7EB',
                    boxShadow: biorhythmOptimized ? `0 0 10px ${colors.primary}40` : 'none'
                  }}
                  onClick={toggleBiorhythmOptimization}
                >
                  <span 
                    className="absolute top-1 w-5 h-5 rounded-full bg-white transform transition-transform duration-300"
                    style={{ 
                      left: biorhythmOptimized ? 'auto' : '0.25rem',
                      right: biorhythmOptimized ? '0.25rem' : 'auto'
                    }}
                  ></span>
                </button>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="p-6 pb-8 overflow-y-auto dark-mode-transition" style={{ backgroundColor: pageBgColor }}>
      {renderView()}
      
      {/* Processing overlay */}
      {isProcessing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center">
            <div className="w-12 h-12 rounded-full animate-spin mb-4" 
                 style={{ 
                   borderWidth: '4px',
                   borderStyle: 'solid',
                   borderColor: `${colors.primary}20`,
                   borderTopColor: colors.primary
                 }}></div>
            <p className="text-center font-medium">Processing...</p>
          </div>
        </div>
      )}
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-breathe {
          animation: breathe 4s ease-in-out infinite;
        }
        
        .shimmer {
          background: linear-gradient(90deg, 
            rgba(255,255,255,0) 0%, 
            rgba(255,255,255,0.2) 50%, 
            rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
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
    </div>
  );
};

export default MedicationsScreen;