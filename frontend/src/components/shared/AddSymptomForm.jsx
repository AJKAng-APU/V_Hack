import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, PlusCircle, X, Heart, 
  Clock, AlertTriangle, Sun, Moon,
  Info, Activity, Lightbulb, Check,
  Thermometer, CloudRain, Droplet, Coffee
} from "lucide-react";
import { useTheme } from '../ThemeContext';
import { useHealthData } from '../HealthDataContext';
import { useApiMiddleware } from '../ApiMiddleware';

const AddSymptomForm = ({ setView, addSymptom, colors, prefillData }) => {
  const { isDarkMode } = useTheme();
  const { isGoogleFitConnected, healthMetrics } = useHealthData();
  const { isLoading } = useApiMiddleware();
  
  // Common symptoms suggestions
  const commonSymptoms = [
    'Headache', 'Fatigue', 'Nausea', 'Dizziness', 
    'Fever', 'Cough', 'Sore throat', 'Muscle pain'
  ];
  
  // Common triggers suggestions
  const commonTriggers = [
    'Stress', 'Lack of sleep', 'Dehydration', 'Exercise',
    'Alcohol', 'Caffeine', 'Screen time', 'Weather'
  ];
  
  // Form state
  const [formData, setFormData] = useState({
    symptom: '',
    severity: 'Mild',
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    duration: '',
    notes: '',
    triggers: [],
    associatedSymptoms: [],
    timeOfDay: 'Morning'
  });

  // Form validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Function to validate the form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.symptom.trim()) {
      newErrors.symptom = 'Symptom is required';
    }
    
    return newErrors;
  };

  // Update form when prefill data changes (from Google Fit)
  useEffect(() => {
    if (prefillData) {
      // Determine time of day based on current time
      const now = new Date();
      const hours = now.getHours();
      let timeOfDay = 'Morning';
      
      if (hours >= 12 && hours < 17) {
        timeOfDay = 'Afternoon';
      } else if (hours >= 17 && hours < 21) {
        timeOfDay = 'Evening';
      } else if (hours >= 21 || hours < 5) {
        timeOfDay = 'Night';
      }
      
      // Update form data with time of day
      setFormData(prev => ({
        ...prev,
        timeOfDay
      }));
    }
  }, [prefillData]);

  // Update form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate on change
    if (touched[name]) {
      const validationErrors = validateForm();
      setErrors(validationErrors);
    }
  };

  // Add a suggested symptom
  const addSuggestedSymptom = (symptom) => {
    setFormData(prev => ({ ...prev, symptom }));
    setTouched(prev => ({ ...prev, symptom: true }));
    setErrors(prev => ({ ...prev, symptom: undefined }));
  };

  // Add a suggested trigger
  const addSuggestedTrigger = (trigger) => {
    if (!formData.triggers.includes(trigger)) {
      setFormData(prev => ({
        ...prev,
        triggers: [...prev.triggers, trigger]
      }));
    }
  };

  // Add a new trigger
  const [newTrigger, setNewTrigger] = useState('');
  
  const addTrigger = () => {
    if (newTrigger.trim() && !formData.triggers.includes(newTrigger.trim())) {
      setFormData(prev => ({
        ...prev,
        triggers: [...prev.triggers, newTrigger.trim()]
      }));
      setNewTrigger('');
    }
  };

  // Handle trigger key press
  const handleTriggerKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTrigger();
    }
  };

  // Remove a trigger
  const removeTrigger = (index) => {
    setFormData(prev => ({
      ...prev,
      triggers: prev.triggers.filter((_, idx) => idx !== index)
    }));
  };

  // Add a new associated symptom
  const [newAssociatedSymptom, setNewAssociatedSymptom] = useState('');
  
  const addAssociatedSymptom = () => {
    if (newAssociatedSymptom.trim() && !formData.associatedSymptoms.includes(newAssociatedSymptom.trim())) {
      setFormData(prev => ({
        ...prev,
        associatedSymptoms: [...prev.associatedSymptoms, newAssociatedSymptom.trim()]
      }));
      setNewAssociatedSymptom('');
    }
  };

  // Handle associated symptom key press
  const handleAssociatedSymptomKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAssociatedSymptom();
    }
  };

  // Remove an associated symptom
  const removeAssociatedSymptom = (index) => {
    setFormData(prev => ({
      ...prev,
      associatedSymptoms: prev.associatedSymptoms.filter((_, idx) => idx !== index)
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    setErrors(validationErrors);
    
    // If there are errors, mark all fields as touched
    if (Object.keys(validationErrors).length > 0) {
      const allTouched = Object.keys(formData).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      setTouched(allTouched);
      return;
    }
    
    // Add the new symptom
    addSymptom(formData);
  };

  // Dark mode specific styles
  const cardBg = isDarkMode ? colors.cardBg : 'white';
  const inputBg = isDarkMode ? colors.darkBg : 'white';
  const inputBorder = isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)';
  const inputText = isDarkMode ? colors.textPrimary : 'inherit';
  const hoverBgColor = isDarkMode ? colors.primary + '20' : 'rgba(239, 246, 255, 1)';
  
  // Format health metrics for display
  const formatBloodPressure = () => {
    if (!healthMetrics || !healthMetrics.pressure.systolic || !healthMetrics.pressure.diastolic) {
      return 'Not available';
    }
    return `${Math.round(healthMetrics.pressure.systolic)}/${Math.round(healthMetrics.pressure.diastolic)} mmHg`;
  };
  
  const formatBMI = () => {
    if (!healthMetrics || !healthMetrics.BMI) {
      return 'Not available';
    }
    return `${healthMetrics.BMI.toFixed(1)}`;
  };
  
  const formatGlucose = () => {
    if (!healthMetrics || !healthMetrics.glucose) {
      return 'Not available';
    }
    return `${healthMetrics.glucose.toFixed(1)} mg/dL`;
  };

  // Get icon for a trigger
  const getTriggerIcon = (trigger) => {
    const triggerLower = trigger.toLowerCase();
    if (triggerLower.includes('stress')) return <Activity size={14} />;
    if (triggerLower.includes('sleep')) return <Moon size={14} />;
    if (triggerLower.includes('weather')) return <CloudRain size={14} />;
    if (triggerLower.includes('fever') || triggerLower.includes('temperature')) return <Thermometer size={14} />;
    if (triggerLower.includes('dehydration') || triggerLower.includes('water')) return <Droplet size={14} />;
    if (triggerLower.includes('caffeine') || triggerLower.includes('coffee')) return <Coffee size={14} />;
    return <Info size={14} />;
  };

  return (
    <div className="p-6 pb-20">
      <header className="flex items-center mb-6">
        <button 
          className="w-10 h-10 rounded-full flex items-center justify-center mr-4 hover:bg-opacity-10 transition-colors duration-300 dark-mode-transition"
          onClick={() => setView('main')}
          style={{ 
            backgroundColor: isDarkMode ? `${colors.primary}10` : 'transparent',
            color: colors.textPrimary 
          }}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Log Symptom</h1>
          <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>Track what your body's telling you</p>
        </div>
      </header>
      
      {/* Health Context Card - Shows current health metrics from Google Fit */}
      {isGoogleFitConnected && (
        <div className="mb-6 p-4 rounded-2xl shadow-lg border dark-mode-transition"
             style={{ 
               backgroundColor: isDarkMode ? `${colors.primary}10` : '#F0F9FF',
               borderColor: inputBorder,
               boxShadow: `0 10px 15px -3px ${colors.primary}20` 
             }}>
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 rounded-lg mr-3 flex items-center justify-center" 
                 style={{ 
                   backgroundColor: `${colors.primary}20`
                 }}>
              <Activity size={18} style={{ color: colors.primary }} />
            </div>
            <div>
              <h4 className="font-medium text-sm dark-mode-transition" style={{ color: colors.textPrimary }}>
                Current Health Context
              </h4>
              <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                From Google Fit
              </p>
            </div>
            <div className="ml-auto">
              <div className="text-xs px-2 py-0.5 rounded-full dark-mode-transition"
                   style={{ 
                     backgroundColor: `${colors.success}20`,
                     color: colors.success
                   }}>
                Connected
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg dark-mode-transition"
                 style={{ 
                   backgroundColor: isDarkMode ? `${colors.primary}20` : '#EFF6FF'
                 }}>
              <div className="text-xs mb-1 dark-mode-transition" style={{ color: colors.textSecondary }}>
                Blood Pressure
              </div>
              <div className="font-medium text-sm dark-mode-transition" style={{ color: colors.primary }}>
                {formatBloodPressure()}
              </div>
            </div>
            
            <div className="p-2 rounded-lg dark-mode-transition"
                 style={{ 
                   backgroundColor: isDarkMode ? `${colors.primary}20` : '#EFF6FF'
                 }}>
              <div className="text-xs mb-1 dark-mode-transition" style={{ color: colors.textSecondary }}>
                BMI
              </div>
              <div className="font-medium text-sm dark-mode-transition" style={{ color: colors.primary }}>
                {formatBMI()}
              </div>
            </div>
            
            <div className="p-2 rounded-lg dark-mode-transition"
                 style={{ 
                   backgroundColor: isDarkMode ? `${colors.primary}20` : '#EFF6FF'
                 }}>
              <div className="text-xs mb-1 dark-mode-transition" style={{ color: colors.textSecondary }}>
                Glucose
              </div>
              <div className="font-medium text-sm dark-mode-transition" style={{ color: colors.primary }}>
                {formatGlucose()}
              </div>
            </div>
          </div>
          
          <div className="mt-2 flex items-start">
            <Lightbulb size={14} className="mr-1 mt-0.5" style={{ color: colors.accent }} />
            <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
              These metrics will be used to provide more accurate AI insights about your symptoms.
            </p>
          </div>
        </div>
      )}
      
      <div className="mb-8 p-6 rounded-2xl shadow-lg border dark-mode-transition"
           style={{ 
             backgroundColor: cardBg, 
             borderColor: inputBorder,
             boxShadow: `0 10px 15px -3px ${colors.gradientAlt1}20` 
           }}>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Symptom name */}
          <div>
            <label className="block text-sm font-medium mb-2 dark-mode-transition" style={{ color: colors.textPrimary }}>
              Symptom
            </label>
            <input 
              type="text"
              name="symptom"
              value={formData.symptom}
              onChange={handleChange}
              className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 transition-all duration-300 dark-mode-transition ${errors.symptom && touched.symptom ? 'border-red-500 ring-red-200' : ''}`}
              style={{ 
                backgroundColor: inputBg, 
                borderColor: errors.symptom && touched.symptom ? colors.danger : inputBorder,
                color: inputText
              }}
              placeholder="What's bothering you? (e.g., Headache, Nausea)"
              required
            />
            {errors.symptom && touched.symptom && (
              <p className="mt-1 text-xs" style={{ color: colors.danger }}>{errors.symptom}</p>
            )}
            
            {/* Common symptoms suggestions */}
            <div className="mt-2 flex flex-wrap gap-2">
              {commonSymptoms.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  className="px-3 py-1 rounded-full text-xs transition-all duration-300 hover:shadow-sm dark-mode-transition"
                  style={{ 
                    backgroundColor: formData.symptom === symptom ? `${colors.primary}30` : (isDarkMode ? `${colors.primary}15` : `${colors.primary}10`),
                    color: colors.primary
                  }}
                  onClick={() => addSuggestedSymptom(symptom)}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>
          
          {/* Severity and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark-mode-transition" style={{ color: colors.textPrimary }}>
                Severity
              </label>
              <select 
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 dark-mode-transition"
                style={{ 
                  backgroundColor: inputBg, 
                  borderColor: inputBorder,
                  color: inputText
                }}
                required
              >
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark-mode-transition" style={{ color: colors.textPrimary }}>
                Time
              </label>
              <input 
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 dark-mode-transition"
                style={{ 
                  backgroundColor: inputBg, 
                  borderColor: inputBorder,
                  color: inputText
                }}
                required
              />
            </div>
          </div>
          
          {/* Duration & Time of Day */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark-mode-transition" style={{ color: colors.textPrimary }}>
                Duration
              </label>
              <input 
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 dark-mode-transition"
                style={{ 
                  backgroundColor: inputBg, 
                  borderColor: inputBorder,
                  color: inputText
                }}
                placeholder="e.g., 2 hours, 30 minutes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark-mode-transition" style={{ color: colors.textPrimary }}>
                Time of Day
              </label>
              <select 
                name="timeOfDay"
                value={formData.timeOfDay}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 dark-mode-transition"
                style={{ 
                  backgroundColor: inputBg, 
                  borderColor: inputBorder,
                  color: inputText
                }}
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2 dark-mode-transition" style={{ color: colors.textPrimary }}>
              Notes
            </label>
            <textarea 
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 dark-mode-transition"
              style={{ 
                backgroundColor: inputBg, 
                borderColor: inputBorder,
                color: inputText
              }}
              placeholder="Describe your symptom (e.g., throbbing pain, location, what makes it better/worse)"
              rows="3"
            ></textarea>
          </div>
          
          {/* Triggers */}
          <div>
            <label className="block text-sm font-medium mb-2 dark-mode-transition" style={{ color: colors.textPrimary }}>
              Possible Triggers
            </label>
            <div className="flex items-center mb-2">
              <input 
                type="text"
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                onKeyPress={handleTriggerKeyPress}
                className="flex-1 p-3 rounded-l-xl border focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 dark-mode-transition"
                style={{ 
                  backgroundColor: inputBg, 
                  borderColor: inputBorder,
                  color: inputText
                }}
                placeholder="Add potential triggers (e.g., stress, food)"
              />
              <button 
                type="button"
                className="p-3 rounded-r-xl border-t border-r border-b transition-colors duration-300 dark-mode-transition"
                style={{ 
                  backgroundColor: `${colors.primary}10`,
                  borderColor: inputBorder,
                  color: colors.primary
                }}
                onClick={addTrigger}
              >
                <PlusCircle size={20} />
              </button>
            </div>
            
            {/* Common triggers suggestions */}
            <div className="mb-3 flex flex-wrap gap-2">
              {commonTriggers.map((trigger) => (
                <button
                  key={trigger}
                  type="button"
                  className="px-3 py-1 rounded-full text-xs transition-all duration-300 hover:shadow-sm flex items-center dark-mode-transition"
                  style={{ 
                    backgroundColor: formData.triggers.includes(trigger) ? `${colors.accent}30` : (isDarkMode ? `${colors.primary}15` : `${colors.primary}10`),
                    color: formData.triggers.includes(trigger) ? colors.accent : colors.primary
                  }}
                  onClick={() => addSuggestedTrigger(trigger)}
                >
                  {getTriggerIcon(trigger)}
                  <span className="ml-1">{trigger}</span>
                  {formData.triggers.includes(trigger) && (
                    <Check size={12} className="ml-1" />
                  )}
                </button>
              ))}
            </div>
            
            {/* Selected triggers */}
            <div className="flex flex-wrap gap-2">
              {formData.triggers.map((trigger, idx) => (
                <div 
                  key={idx} 
                  className="px-3 py-1.5 rounded-full flex items-center text-sm dark-mode-transition"
                  style={{ 
                    backgroundColor: `${colors.primary}15`,
                    color: colors.primary
                  }}
                >
                  <span className="mr-1">{trigger}</span>
                  <button 
                    type="button" 
                    className="w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-300"
                    style={{
                      backgroundColor: `${colors.primary}20`,
                      '&:hover': { backgroundColor: colors.danger }
                    }}
                    onClick={() => removeTrigger(idx)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Associated Symptoms */}
          <div>
            <label className="block text-sm font-medium mb-2 dark-mode-transition" style={{ color: colors.textPrimary }}>
              Associated Symptoms
            </label>
            <div className="flex items-center mb-2">
              <input 
                type="text"
                value={newAssociatedSymptom}
                onChange={(e) => setNewAssociatedSymptom(e.target.value)}
                onKeyPress={handleAssociatedSymptomKeyPress}
                className="flex-1 p-3 rounded-l-xl border focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 dark-mode-transition"
                style={{ 
                  backgroundColor: inputBg, 
                  borderColor: inputBorder,
                  color: inputText
                }}
                placeholder="Add other symptoms (e.g., nausea with headache)"
              />
              <button 
                type="button"
                className="p-3 rounded-r-xl border-t border-r border-b transition-colors duration-300 dark-mode-transition"
                style={{ 
                  backgroundColor: `${colors.primary}10`,
                  borderColor: inputBorder,
                  color: colors.primary
                }}
                onClick={addAssociatedSymptom}
              >
                <PlusCircle size={20} />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.associatedSymptoms.map((symptom, idx) => (
                <div 
                  key={idx} 
                  className="px-3 py-1.5 rounded-full flex items-center text-sm dark-mode-transition"
                  style={{ 
                    backgroundColor: `${colors.accent}15`,
                    color: colors.accent
                  }}
                >
                  <span className="mr-1">{symptom}</span>
                  <button 
                    type="button" 
                    className="w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-300"
                    style={{
                      backgroundColor: `${colors.accent}20`,
                      '&:hover': { backgroundColor: colors.danger }
                    }}
                    onClick={() => removeAssociatedSymptom(idx)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Health metrics notice */}
          {isGoogleFitConnected && (
            <div className="p-3 rounded-xl flex items-start dark-mode-transition"
                 style={{ 
                   backgroundColor: `${colors.info}15`,
                   color: colors.info
                 }}>
              <Info size={18} className="mr-2 mt-0.5" />
              <p className="text-sm">
                Your Google Fit health metrics will be attached to this symptom for more accurate AI analysis.
              </p>
            </div>
          )}
          
          {/* Submit button */}
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-xl text-white font-medium transition-all duration-500 hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
            style={{ 
              background: `linear-gradient(to right, ${colors.gradientAlt1}, ${colors.gradientAlt2})`,
              boxShadow: `0 10px 15px -3px ${colors.gradientAlt1}40`,
              opacity: isLoading ? 0.8 : 1
            }}
          >
            {isLoading ? (
              <>
                <Activity size={20} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Symptom'
            )}
          </button>
        </form>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse {
          animation: pulse 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default AddSymptomForm;