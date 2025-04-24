import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Search, Filter, Calendar, ChevronRight, 
  Pill, Zap, CheckCircle, Clock, X, AlertTriangle, Loader, Sparkles, Sun, Moon
} from "lucide-react";
import { useTheme } from '../ThemeContext';

// Enhanced medication list component with biorhythm integration and dark mode
const MedicationList = ({ 
  medications, 
  setSelectedMedication, 
  setView, 
  searchQuery, 
  setSearchQuery, 
  showAddOptions, 
  setShowAddOptions, 
  showFilterOptions, 
  setShowFilterOptions,
  onTakeMedication,
  colors,
  biorhythmOptimized
}) => {
  const { isDarkMode } = useTheme();
  const [processingMed, setProcessingMed] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredMeds, setFilteredMeds] = useState([]);
  const [showNoResults, setShowNoResults] = useState(false);
  
  // Apply filtering logic whenever medications, search query, or active filter changes
  useEffect(() => {
    // First filter by search query
    let filtered = [...medications].filter(med => 
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.purpose.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Then apply category filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'morning') {
        filtered = filtered.filter(med => 
          med.schedule.some(s => {
            const time = s.time;
            if (time.includes('AM')) return true;
            const hour = parseInt(time.split(':')[0]);
            return hour < 12;
          })
        );
      } else if (activeFilter === 'evening') {
        filtered = filtered.filter(med => 
          med.schedule.some(s => {
            const time = s.time;
            if (time.includes('PM')) return true;
            const hour = parseInt(time.split(':')[0]);
            return hour >= 12;
          })
        );
      } else if (activeFilter === 'refill') {
        filtered = filtered.filter(med => med.refillRemaining <= 7);
      } else if (activeFilter === 'biorhythm') {
        filtered = filtered.filter(med => 
          med.biorhythmData && med.biorhythmData.alignmentScore >= 80
        );
      }
    }
    
    // Sort medications if biorhythm optimization is enabled
    if (biorhythmOptimized) {
      filtered.sort((a, b) => {
        // First prioritize upcoming medications
        const aHasUpcoming = a.schedule.some(s => s.status === 'upcoming');
        const bHasUpcoming = b.schedule.some(s => s.status === 'upcoming');
        
        if (aHasUpcoming && !bHasUpcoming) return -1;
        if (!aHasUpcoming && bHasUpcoming) return 1;
        
        // Then sort by alignment score (higher first)
        return (b.biorhythmData?.alignmentScore || 0) - (a.biorhythmData?.alignmentScore || 0);
      });
    }
    
    setFilteredMeds(filtered);
    setShowNoResults(searchQuery !== '' && filtered.length === 0);
  }, [medications, searchQuery, activeFilter, biorhythmOptimized]);
  
  // Handler for add medication button click - prevents propagation to avoid immediate popup close
  const handleAddButtonClick = (e) => {
    e.stopPropagation();
    setShowAddOptions(!showAddOptions);
  };
  
  // Handler for filter button click - prevents propagation
  const handleFilterButtonClick = (e) => {
    e.stopPropagation();
    setShowFilterOptions(!showFilterOptions);
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // No need to do anything else as filtering happens in useEffect
  };

  // Set filter and close filter menu
  const applyFilter = (filter) => {
    setActiveFilter(filter);
    setShowFilterOptions(false);
  };

  // Handle medication action (take or skip)
  const handleMedicationAction = async (e, medId, scheduleTime, status) => {
    e.stopPropagation(); // Prevent navigation to detail view
    
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
  const inputBg = isDarkMode ? `${colors.primary}15` : 'white';
  const inputBorder = isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)';
  const pillBtnBg = isDarkMode ? colors.darkBg : 'white';
  const filterOptionsBg = isDarkMode ? colors.cardBg : 'white';
  const filterHoverBg = isDarkMode ? `${colors.primary}20` : 'rgba(239, 246, 255, 1)';
  const stickyHeaderBg = isDarkMode ? `${colors.darkBg}90` : 'rgba(239, 246, 255, 0.9)';
  const emptyStateBg = isDarkMode ? `${colors.primary}15` : 'rgba(239, 246, 255, 1)';

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">Medications</h1>
          <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
            {biorhythmOptimized 
              ? "Optimized with your biorhythm, because science is cooler than guessing" 
              : "Track your pills, because even I can't remember all this stuff"}
          </p>
        </div>
        <div className="relative">
          <button 
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 duration-300 z-10" 
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
              boxShadow: `0 0 15px ${colors.primary}40`
            }}
            onClick={handleAddButtonClick}
          >
            <PlusCircle size={24} color="white" />
          </button>
          
          {/* Add medication options popup */}
          {showAddOptions && (
            <div 
              className="absolute right-0 top-14 w-56 p-2 rounded-xl shadow-xl z-20 border dark-mode-transition"
              style={{ 
                backgroundColor: filterOptionsBg,
                borderColor: borderColor,
                boxShadow: `0 10px 25px -5px ${colors.primary}30` 
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-102 dark-mode-transition" 
                   style={{ backgroundColor: filterHoverBg }}
                   onClick={() => {setView('add'); setShowAddOptions(false);}}>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full mr-3 flex items-center justify-center dark-mode-transition shimmer" 
                       style={{ 
                         background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
                         color: 'white'
                       }}>
                    <Pill size={16} />
                  </div>
                  <span className="text-sm font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>
                    Add medication
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* Check if medications exist */}
      {medications.length === 0 ? (
        // EMPTY MEDICATIONS STATE - Only show when there are no medications at all
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
      ) : (
        <>
          {/* Weekly medication adherence overview */}
          <div className="mb-8 p-5 rounded-2xl shadow-lg border transform hover:scale-102 transition-all duration-500 dark-mode-transition"
               style={{ 
                 backgroundColor: cardBg,
                 borderColor: borderColor,
                 boxShadow: `0 15px 25px -5px ${colors.primary}20` 
               }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg dark-mode-transition" style={{ color: colors.textPrimary }}>Weekly Adherence</h3>
              <button 
                className="flex items-center text-sm font-medium px-3 py-1 rounded-full transition-all duration-300 hover:shadow-md dark-mode-transition" 
                style={{ color: colors.primary, backgroundColor: `${colors.primary}10` }}
                onClick={() => setView('history')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                History
              </button>
            </div>
            <div className="flex justify-between items-center">
              {/* Calculate the day of week for the current date */}
              {(() => {
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const today = new Date();
                const currentDayIndex = today.getDay(); // 0 = Sunday, 6 = Saturday
                
                // Reorder days to start with Sunday
                const orderedDays = [...days];
                
                return orderedDays.map((day, index) => {
                  // Calculate if this day is today, in the past, or in the future
                  const diff = index - currentDayIndex;
                  const isPast = diff < 0;
                  const isToday = diff === 0;
                  const isFuture = diff > 0;
                  
                  // Calculate day of month for this weekday
                  const date = new Date();
                  date.setDate(today.getDate() + diff);
                  const dayOfMonth = date.getDate();
                  
                  // Determine status and style based on day
                  let bgColor, icon;
                  if (isPast) {
                    // For past days, calculate a random adherence (in a real app, this would come from real data)
                    const randomAdherence = Math.random();
                    if (randomAdherence > 0.9) {
                      // Perfect adherence
                      bgColor = `linear-gradient(135deg, ${colors.success}, ${colors.success}90)`;
                      icon = <CheckCircle size={18} color="white" />;
                    } else if (randomAdherence > 0.7) {
                      // Partial adherence
                      bgColor = `linear-gradient(135deg, ${colors.warning}, ${colors.warning}90)`;
                      icon = <Clock size={18} color="white" />;
                    } else {
                      // Poor adherence
                      bgColor = `linear-gradient(135deg, ${colors.danger}, ${colors.danger}90)`;
                      icon = <X size={18} color="white" />;
                    }
                  } else if (isToday) {
                    // Today's adherence
                    const todayMeds = medications.filter(med => 
                      med.schedule.some(s => s.day === 'today')
                    );
                    const todayTaken = todayMeds.filter(med => 
                      med.schedule.some(s => s.status === 'taken')
                    );
                    
                    if (todayMeds.length === 0) {
                      bgColor = 'transparent';
                      icon = null;
                    } else if (todayTaken.length === todayMeds.length) {
                      bgColor = `linear-gradient(135deg, ${colors.success}, ${colors.success}90)`;
                      icon = <CheckCircle size={18} color="white" />;
                    } else if (todayTaken.length > 0) {
                      bgColor = `linear-gradient(135deg, ${colors.warning}, ${colors.warning}90)`;
                      icon = <Clock size={18} color="white" />;
                    } else {
                      bgColor = isDarkMode ? colors.darkBg : 'white';
                      icon = <Clock size={18} style={{ color: colors.primary }} />;
                    }
                  } else {
                    // Future days
                    bgColor = 'transparent';
                    icon = null;
                  }
                  
                  return (
                    <div key={day} className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md mb-2 transition-transform hover:scale-110 duration-300 dark-mode-transition" 
                           style={{ 
                             background: bgColor,
                             border: isFuture ? `2px dashed ${isDarkMode ? colors.textSecondary + '50' : '#E5E7EB'}` : 'none',
                             boxShadow: !isFuture ? `0 0 10px ${colors.primary}20` : 'none'
                           }}>
                        {icon || <span className="text-xs font-medium dark-mode-transition" style={{ color: isDarkMode ? colors.textSecondary : '#9CA3AF' }}>{day[0]}</span>}
                      </div>
                      <span className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>{day}</span>
                    </div>
                  );
                });
              })()}
            </div>
            <div className="mt-4 p-3 rounded-xl shadow-sm flex items-center animate-breathe dark-mode-transition" 
                 style={{ 
                   background: `linear-gradient(to right, ${colors.primary}20, ${colors.accent}10)`
                 }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 shadow-sm shimmer" 
                   style={{ 
                     background: `linear-gradient(135deg, ${colors.primary}40, ${colors.primary}20)`
                   }}>
                <Zap size={18} color={colors.primary} />
              </div>
              <p className="text-sm font-medium dark-mode-transition" style={{ color: colors.primary }}>
                {biorhythmOptimized 
                  ? "Biorhythm optimization can improve medication effectiveness by up to 23%*. *Disclaimer: I totally made that stat up."
                  : "You've taken 92% of your medications on time this week! That's more consistent than my sleep schedule."}
              </p>
            </div>
          </div>
          
          {/* Search and filter */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex-1 relative">
              <form onSubmit={handleSearchSubmit} className="w-full">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 dark-mode-transition" style={{ color: colors.textSecondary }}>
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-300 dark-mode-transition"
                  placeholder="Search for your pills... if you remember what they're called"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    color: colors.textPrimary,
                    boxShadow: searchQuery ? `0 0 15px ${colors.primary}30` : 'none'
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setSearchQuery('')}
                    style={{ color: colors.textSecondary }}
                  >
                    <X size={16} />
                  </button>
                )}
              </form>
            </div>
            <div className="relative">
              <button 
                className="p-3 rounded-xl border hover:bg-blue-50 transition-colors duration-300 flex items-center justify-center dark-mode-transition"
                onClick={handleFilterButtonClick}
                style={{ 
                  backgroundColor: activeFilter !== 'all' ? `${colors.primary}20` : pillBtnBg,
                  borderColor: inputBorder,
                  color: activeFilter !== 'all' ? colors.primary : colors.textPrimary
                }}
              >
                <Filter size={18} />
                {activeFilter !== 'all' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }}></span>
                )}
              </button>
              
              {/* Filter options popup - Enhanced */}
              {showFilterOptions && (
                <div 
                  className="absolute right-0 top-12 w-48 p-2 rounded-xl shadow-xl z-20 border dark-mode-transition"
                  style={{ 
                    backgroundColor: filterOptionsBg,
                    borderColor: borderColor,
                    boxShadow: `0 10px 25px -5px ${colors.primary}30` 
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="text-xs font-medium mb-2 px-2 dark-mode-transition" style={{ color: colors.textSecondary }}>
                    Filter by
                  </div>
                  
                  <div 
                    className="p-2 rounded-lg cursor-pointer transition-all duration-200 dark-mode-transition"
                    style={{ 
                      backgroundColor: activeFilter === 'all' ? filterHoverBg : 'transparent',
                      color: activeFilter === 'all' ? colors.primary : colors.textPrimary,
                      fontWeight: activeFilter === 'all' ? 'bold' : 'normal'
                    }}
                    onClick={() => applyFilter('all')}
                  >
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full mr-2 flex items-center justify-center"
                           style={{ 
                             backgroundColor: activeFilter === 'all' ? `${colors.primary}20` : 'transparent',
                             color: colors.primary 
                           }}>
                        {activeFilter === 'all' && <CheckCircle size={12} />}
                      </div>
                      <span className="text-sm">All medications</span>
                    </div>
                  </div>
                  
                  <div 
                    className="p-2 rounded-lg cursor-pointer transition-all duration-200 dark-mode-transition"
                    style={{ 
                      backgroundColor: activeFilter === 'morning' ? filterHoverBg : 'transparent',
                      color: activeFilter === 'morning' ? colors.primary : colors.textPrimary,
                      fontWeight: activeFilter === 'morning' ? 'bold' : 'normal'
                    }}
                    onClick={() => applyFilter('morning')}
                  >
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full mr-2 flex items-center justify-center"
                           style={{ 
                             backgroundColor: activeFilter === 'morning' ? `${colors.primary}20` : 'transparent',
                             color: colors.primary 
                           }}>
                        {activeFilter === 'morning' ? <CheckCircle size={12} /> : <Sun size={12} />}
                      </div>
                      <span className="text-sm">Morning pills</span>
                    </div>
                  </div>
                  
                  <div 
                    className="p-2 rounded-lg cursor-pointer transition-all duration-200 dark-mode-transition"
                    style={{ 
                      backgroundColor: activeFilter === 'evening' ? filterHoverBg : 'transparent',
                      color: activeFilter === 'evening' ? colors.primary : colors.textPrimary,
                      fontWeight: activeFilter === 'evening' ? 'bold' : 'normal'
                    }}
                    onClick={() => applyFilter('evening')}
                  >
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full mr-2 flex items-center justify-center"
                           style={{ 
                             backgroundColor: activeFilter === 'evening' ? `${colors.primary}20` : 'transparent',
                             color: colors.primary 
                           }}>
                        {activeFilter === 'evening' ? <CheckCircle size={12} /> : <Moon size={12} />}
                      </div>
                      <span className="text-sm">Evening pills</span>
                    </div>
                  </div>
                  
                  <div 
                    className="p-2 rounded-lg cursor-pointer transition-all duration-200 dark-mode-transition"
                    style={{ 
                      backgroundColor: activeFilter === 'refill' ? filterHoverBg : 'transparent',
                      color: activeFilter === 'refill' ? colors.primary : colors.textPrimary,
                      fontWeight: activeFilter === 'refill' ? 'bold' : 'normal'
                    }}
                    onClick={() => applyFilter('refill')}
                  >
                    <div className="flex items-center">
                      <div className="w-5 h-5 rounded-full mr-2 flex items-center justify-center"
                           style={{ 
                             backgroundColor: activeFilter === 'refill' ? `${colors.primary}20` : 'transparent', 
                             color: colors.primary
                           }}>
                        {activeFilter === 'refill' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                      </div>
                      <span className="text-sm">Needs refill soon</span>
                    </div>
                  </div>
                  
                  {biorhythmOptimized && (
                    <div 
                      className="p-2 rounded-lg cursor-pointer transition-all duration-200 dark-mode-transition"
                      style={{ 
                        backgroundColor: activeFilter === 'biorhythm' ? filterHoverBg : 'transparent',
                        color: activeFilter === 'biorhythm' ? colors.primary : colors.textPrimary,
                        fontWeight: activeFilter === 'biorhythm' ? 'bold' : 'normal'
                      }}
                      onClick={() => applyFilter('biorhythm')}
                    >
                      <div className="flex items-center">
                        <div className="w-5 h-5 rounded-full mr-2 flex items-center justify-center shimmer"
                             style={{ 
                               backgroundColor: activeFilter === 'biorhythm' ? `${colors.primary}20` : 'transparent',
                               color: colors.primary 
                             }}>
                          {activeFilter === 'biorhythm' ? <CheckCircle size={12} /> : <Sparkles size={12} />}
                        </div>
                        <span className="text-sm">Best biorhythm match</span>
                      </div>
                    </div>
                  )}
                  
                  {activeFilter !== 'all' && (
                    <div className="mt-2 pt-2 border-t dark-mode-transition" style={{ borderColor: `${colors.primary}20` }}>
                      <button 
                        className="w-full p-2 rounded-lg text-center text-xs font-medium dark-mode-transition"
                        style={{ color: colors.danger }}
                        onClick={() => applyFilter('all')}
                      >
                        Clear filter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button 
              className="p-3 rounded-xl border hover:bg-blue-50 transition-colors duration-300 flex items-center justify-center dark-mode-transition"
              onClick={() => setView('schedule')}
              style={{ 
                backgroundColor: pillBtnBg,
                borderColor: inputBorder,
                '&:hover': { backgroundColor: filterHoverBg }
              }}
            >
              <Calendar size={18} style={{ color: colors.textPrimary }} />
            </button>
          </div>
          
          {/* Search status message */}
          {searchQuery && (
            <div className="mb-4 px-3 py-2 rounded-lg dark-mode-transition animate-fade-in"
                 style={{ backgroundColor: `${colors.primary}10` }}>
              <p className="text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>
                {showNoResults ? (
                  <span>No results found for "<strong>{searchQuery}</strong>"</span>
                ) : (
                  <span>Showing results for "<strong>{searchQuery}</strong>" ({filteredMeds.length} found)</span>
                )}
              </p>
            </div>
          )}
          
          {/* Medications section with sticky header */}
          <div className="mb-6">
            <div className="mb-4 sticky top-0 z-10 flex justify-between items-center px-4 py-2 rounded-lg backdrop-blur-sm dark-mode-transition"
                 style={{ backgroundColor: stickyHeaderBg }}>
              <h3 className="font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>Today's Medications</h3>
              <button
                className="text-xs px-3 py-1 rounded-full transition-colors duration-300 dark-mode-transition"
                style={{ color: colors.primary, backgroundColor: `${colors.primary}20` }}
                onClick={() => setView('schedule')}
              >
                View schedule
              </button>
            </div>
            
            {/* Medication list for today */}
            <div className="space-y-4">
              {showNoResults ? (
                <div className="p-6 rounded-2xl border flex flex-col items-center justify-center dark-mode-transition animate-fade-in"
                     style={{ 
                       backgroundColor: emptyStateBg,
                       borderColor: borderColor
                     }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 dark-mode-transition" 
                       style={{ 
                         background: `${colors.primary}20`,
                         color: colors.primary
                       }}>
                    <Search size={24} />
                  </div>
                  <h3 className="text-lg font-bold mb-2 dark-mode-transition" style={{ color: colors.textPrimary }}>No Medications Found</h3>
                  <p className="text-center text-sm mb-4 dark-mode-transition" style={{ color: colors.textSecondary }}>
                    We couldn't find any medications matching "<strong>{searchQuery}</strong>".
                  </p>
                  <button 
                    className="px-4 py-1.5 rounded-xl font-medium text-sm transition-all duration-300 dark-mode-transition"
                    style={{ 
                      border: `1px solid ${colors.primary}`,
                      color: colors.primary
                    }}
                    onClick={() => setSearchQuery('')}
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <>
                  {filteredMeds.filter(med => 
                    med.schedule.some(s => s.day === 'today')
                  ).map(med => {
                    // Get biorhythm data if optimized
                    const biorhythmData = biorhythmOptimized ? med.biorhythmData : null;
                    const hasOptimizationSuggestions = biorhythmData?.suggestedChanges?.length > 0;
                    
                    // Determine alignment badge color based on score
                    let alignmentColor, alignmentBg;
                    if (biorhythmData) {
                      if (biorhythmData.alignmentScore >= 80) {
                        alignmentColor = colors.success;
                        alignmentBg = `${colors.success}20`;
                      } else if (biorhythmData.alignmentScore >= 60) {
                        alignmentColor = colors.warning;
                        alignmentBg = `${colors.warning}20`;
                      } else {
                        alignmentColor = colors.danger;
                        alignmentBg = `${colors.danger}20`;
                      }
                    }
                    
                    // Get upcoming schedule item if any
                    const upcomingSchedule = med.schedule.find(s => s.status === 'upcoming');
                    const isProcessing = upcomingSchedule && processingMed === `${med.id}-${upcomingSchedule.time}`;
                    
                    return (
                      <div
                        key={med.id}
                        className="p-4 rounded-2xl shadow-lg border relative transform hover:scale-105 transition-all duration-500 hover:shadow-xl cursor-pointer dark-mode-transition animate-fade-in"
                        style={{ 
                          backgroundColor: cardBg,
                          borderColor: borderColor,
                          boxShadow: `0 10px 15px -3px ${colors.primary}20`,
                          borderLeft: biorhythmOptimized ? `4px solid ${alignmentColor}` : undefined
                        }}
                        onClick={() => {
                          setSelectedMedication(med);
                          setView('detail');
                        }}
                      >
                        <div className="flex items-start">
                          <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center shimmer" 
                              style={{ 
                                background: `linear-gradient(135deg, ${colors.primary}90, ${colors.primary})`
                              }}>
                            <Pill size={22} color="white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center flex-wrap">
                              <h4 className="font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>{med.name}</h4>
                              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-300 hover:shadow-sm dark-mode-transition" 
                                    style={{ 
                                      background: isDarkMode ? `${colors.primary}20` : `linear-gradient(to right, ${colors.primary}20, ${colors.accent}10)`,
                                      color: colors.primary
                                    }}>
                                {med.dosage}
                              </span>
                              
                              {/* Biorhythm alignment badge */}
                              {biorhythmOptimized && (
                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium" 
                                      style={{ backgroundColor: alignmentBg, color: alignmentColor }}>
                                  {biorhythmData?.alignmentScore}% aligned
                                </span>
                              )}
                            </div>
                            <div className="flex mt-1 flex-wrap">
                              {med.schedule.map((time, idx) => (
                                <div key={idx} className="flex items-center mr-3 mb-1">
                                  <div 
                                    className="w-2 h-2 rounded-full mr-1"
                                    style={{ 
                                      backgroundColor: time.status === 'taken' 
                                        ? colors.success 
                                        : time.status === 'missed' 
                                          ? colors.danger 
                                          : colors.warning 
                                    }}
                                  ></div>
                                  <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>{time.time}</p>
                                </div>
                              ))}
                            </div>
                            
                            {/* Biorhythm optimization suggestion */}
                            {biorhythmOptimized && hasOptimizationSuggestions && (
                              <div className="mt-2 p-2 rounded-lg flex items-center dark-mode-transition"
                                   style={{ backgroundColor: isDarkMode ? `${colors.primary}15` : 'rgba(239, 246, 255, 1)' }}>
                                <div className="w-5 h-5 rounded-full flex items-center justify-center mr-2"
                                     style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}>
                                  <Zap size={12} />
                                </div>
                                <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                                  Suggestion: Take at {med.biorhythmData.suggestedChanges[0].to} instead for better absorption
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {/* Quick actions for upcoming medications */}
                          {upcomingSchedule ? (
                            <div className="flex space-x-2 items-center">
                              <button 
                                className="p-2 rounded-full transition-all duration-300 flex items-center justify-center hover:scale-110"
                                style={{ 
                                  backgroundColor: `${colors.success}20`,
                                  color: colors.success,
                                  boxShadow: `0 2px 5px ${colors.success}20`
                                }}
                                onClick={(e) => handleMedicationAction(e, med.id, upcomingSchedule.time, 'taken')}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <Loader size={16} className="animate-spin" />
                                ) : (
                                  <CheckCircle size={16} />
                                )}
                              </button>
                              <button 
                                className="p-2 rounded-full transition-all duration-300 flex items-center justify-center hover:scale-110"
                                style={{ 
                                  backgroundColor: `${colors.danger}20`,
                                  color: colors.danger,
                                  boxShadow: `0 2px 5px ${colors.danger}20`
                                }}
                                onClick={(e) => handleMedicationAction(e, med.id, upcomingSchedule.time, 'missed')}
                                disabled={isProcessing}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <ChevronRight size={20} style={{ color: colors.textSecondary }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Show empty state if no medications for today */}
                  {filteredMeds.filter(med => 
                    med.schedule.some(s => s.day === 'today')
                  ).length === 0 && !showNoResults && (
                    <div className="p-4 rounded-2xl flex items-center justify-center dark-mode-transition"
                         style={{ backgroundColor: emptyStateBg }}>
                      <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                        No medications scheduled for today. Enjoy your break!
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* All medications section */}
          <div>
            <div className="mb-4 sticky top-12 z-10 flex justify-between items-center px-4 py-2 rounded-lg backdrop-blur-sm dark-mode-transition"
                 style={{ backgroundColor: stickyHeaderBg }}>
              <h3 className="font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>All Medications</h3>
              <span className="text-xs px-2 py-1 rounded-full dark-mode-transition" 
                    style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                {showNoResults ? 0 : filteredMeds.length} total
              </span>
            </div>
            
            <div className="space-y-4">
              {showNoResults ? (
                <div className="p-4 rounded-lg flex items-center justify-center dark-mode-transition animate-fade-in"
                    style={{ backgroundColor: emptyStateBg }}>
                  <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
                    Try modifying your search to find medications
                  </p>
                </div>
              ) : (
                filteredMeds.map(med => {
                  // Get biorhythm data if optimized
                  const biorhythmData = biorhythmOptimized ? med.biorhythmData : null;
                  
                  // Determine alignment badge color based on score
                  let alignmentColor, alignmentBg;
                  if (biorhythmData) {
                    if (biorhythmData.alignmentScore >= 80) {
                      alignmentColor = colors.success;
                      alignmentBg = `${colors.success}20`;
                    } else if (biorhythmData.alignmentScore >= 60) {
                      alignmentColor = colors.warning;
                      alignmentBg = `${colors.warning}20`;
                    } else {
                      alignmentColor = colors.danger;
                      alignmentBg = `${colors.danger}20`;
                    }
                  }
                  
                  return (
                    <div
                      key={med.id}
                      className="p-4 rounded-2xl shadow-lg border flex items-center transform hover:scale-105 transition-all duration-300 hover:shadow-xl cursor-pointer dark-mode-transition animate-fade-in"
                      style={{ 
                        backgroundColor: cardBg,
                        borderColor: borderColor,
                        boxShadow: `0 10px 15px -3px ${colors.primary}20`,
                        borderLeft: biorhythmOptimized ? `4px solid ${alignmentColor}` : undefined
                      }}
                      onClick={() => {
                        setSelectedMedication(med);
                        setView('detail');
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl mr-3 flex items-center justify-center dark-mode-transition" 
                          style={{ 
                            background: `${colors.primary}20`
                          }}>
                        <Pill size={20} style={{ color: colors.primary }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap">
                          <h4 className="font-medium text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>{med.name}</h4>
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium dark-mode-transition" 
                                style={{ 
                                  background: `${colors.primary}10`,
                                  color: colors.primary
                                }}>
                            {med.dosage}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5 dark-mode-transition" style={{ color: colors.textSecondary }}>{med.purpose}</p>
                      </div>
                      
                      {biorhythmOptimized ? (
                        <div className="text-xs px-2 py-1 rounded-full flex items-center" 
                            style={{ backgroundColor: alignmentBg, color: alignmentColor }}>
                          <span>{biorhythmData?.alignmentScore}%</span>
                        </div>
                      ) : (
                        <div className="text-xs px-2 py-1 rounded-full flex items-center" 
                            style={{ 
                              backgroundColor: med.adherenceRate > 90 
                                ? `${colors.success}20` 
                                : med.adherenceRate > 80 
                                  ? `${colors.warning}20` 
                                  : `${colors.danger}20`,
                              color: med.adherenceRate > 90 
                                ? colors.success
                                : med.adherenceRate > 80 
                                  ? colors.warning
                                  : colors.danger
                            }}>
                          <span>{med.adherenceRate}%</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
      
      {/* Custom CSS for dark mode effects */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, 
            rgba(255,255,255,0) 0%, 
            rgba(255,255,255,0.2) 50%, 
            rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-breathe {
          animation: breathe 4s ease-in-out infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        .dark .shimmer {
          background: linear-gradient(90deg, 
            rgba(30,41,59,0) 0%, 
            rgba(30,41,59,0.3) 50%, 
            rgba(30,41,59,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        /* Scale hover effects */
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
        .hover\\:scale-105:hover {
          transform: scale(1.05);
        }
        .hover\\:scale-110:hover {
          transform: scale(1.1);
        }
      `}</style>
    </>
  );
};

export default MedicationList;