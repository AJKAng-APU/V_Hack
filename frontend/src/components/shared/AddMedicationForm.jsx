import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, PlusCircle, X, Bell, 
  Eye, Clock, Pill, Loader, Check, Zap,
  Calendar, AlertTriangle, Shield, AlarmClock
} from "lucide-react";
import { useTheme } from '../ThemeContext';

// Stunning blue-themed medication form with sassy design
const AddMedicationForm = ({ setView, addMedication, isProcessing, colors }) => {
  const { isDarkMode } = useTheme();
  const [activeField, setActiveField] = useState(null);
  const [animateSubmit, setAnimateSubmit] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    form: '',
    purpose: '',
    instructions: '',
    schedule: [
      { time: "08:00", status: "upcoming", day: "today" }
    ],
    reminders: true,
    sideEffects: [],
    category: 'general',
    refillRemaining: 30,
    adherenceRate: 100,
    missedDoses: 0,
    refillDate: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    prescribedBy: "",
    startDate: formatDate(new Date()),
    interactions: [],
    history: []
  });
  
  // Format date to YYYY-MM-DD for database
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Format date for display
  function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  // Update form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle field focus
  const handleFocus = (field) => {
    setActiveField(field);
  };

  // Handle field blur
  const handleBlur = () => {
    setActiveField(null);
  };

  // Add a new time to the schedule
  const addScheduleTime = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [...prev.schedule, { time: "12:00", status: "upcoming", day: "today" }]
    }));
  };

  // Remove a time from the schedule
  const removeScheduleTime = (index) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, idx) => idx !== index)
    }));
  };

  // Update a specific schedule time
  const updateScheduleTime = (index, time) => {
    setFormData(prev => {
      const newSchedule = [...prev.schedule];
      newSchedule[index] = { ...newSchedule[index], time };
      return { ...prev, schedule: newSchedule };
    });
  };
  
  // Add a side effect
  const addSideEffect = () => {
    const effect = prompt("Enter a potential side effect:");
    if (effect && effect.trim()) {
      setFormData(prev => ({
        ...prev,
        sideEffects: [...prev.sideEffects, effect.trim()]
      }));
    }
  };
  
  // Remove a side effect
  const removeSideEffect = (index) => {
    setFormData(prev => ({
      ...prev,
      sideEffects: prev.sideEffects.filter((_, idx) => idx !== index)
    }));
  };
  
  // Add an interaction
  const addInteraction = () => {
    const medication = prompt("Enter medication that interacts:");
    if (medication && medication.trim()) {
      const severity = prompt("Enter severity (high, moderate, low):", "moderate");
      const description = prompt("Enter description of the interaction:");
      
      if (description && description.trim()) {
        setFormData(prev => ({
          ...prev,
          interactions: [...prev.interactions, {
            medication: medication.trim(),
            severity: severity ? severity.trim().toLowerCase() : 'moderate',
            description: description.trim()
          }]
        }));
      }
    }
  };
  
  // Remove an interaction
  const removeInteraction = (index) => {
    setFormData(prev => ({
      ...prev,
      interactions: prev.interactions.filter((_, idx) => idx !== index)
    }));
  };

  // Toggle reminders on/off
  const toggleReminders = () => {
    setFormData(prev => ({ ...prev, reminders: !prev.reminders }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.dosage || !formData.form) {
      alert('Please fill out all required fields');
      return;
    }
    
    if (formData.schedule.length === 0) {
      alert('Please add at least one schedule time');
      return;
    }
    
    setAnimateSubmit(true);
    
    // Format the times in AM/PM format for consistency
    const formattedSchedule = formData.schedule.map(item => {
      const [hours, minutes] = item.time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return {
        ...item,
        time: `${formattedHour}:${minutes} ${ampm}`
      };
    });
    
    // Add the new medication with formatted schedule
    const success = await addMedication({
      ...formData,
      schedule: formattedSchedule
    });
    
    if (success) {
      setView('main');
    } else {
      setAnimateSubmit(false);
    }
  };

  // Sassy blue theme colors
  const sassyBlue = {
    primary: '#2563EB', // Vibrant blue
    gradient1: '#2563EB', // Start color for gradients
    gradient2: '#3B82F6', // Mid color
    gradient3: '#60A5FA', // End color for gradients
    accent: '#06B6D4', // Cyan for accents
    highlight: '#8B5CF6', // Purple highlight
    success: '#10B981', // Emerald green
    warning: '#FBBF24', // Amber
    danger: '#EF4444', // Red
    cardBg: isDarkMode ? '#1E293B' : 'white',
    darkBg: isDarkMode ? '#0F172A' : '#F1F5F9',
    glow: isDarkMode ? 'rgba(56, 189, 248, 0.3)' : 'rgba(56, 189, 248, 0.2)'
  };

  // Input style generator function
  const getInputStyle = (fieldName) => {
    const isActive = activeField === fieldName;
    return {
      backgroundColor: isDarkMode ? sassyBlue.darkBg : 'white',
      borderColor: isActive ? sassyBlue.accent : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(219, 234, 254, 0.5)',
      color: isDarkMode ? 'white' : 'inherit',
      boxShadow: isActive ? `0 0 0 3px ${sassyBlue.glow}` : 'none',
      transform: isActive ? 'translateY(-2px)' : 'none'
    };
  };

  // Button style generator
  const getButtonStyle = (type = 'primary') => {
    const styles = {
      primary: {
        background: `linear-gradient(135deg, ${sassyBlue.gradient1}, ${sassyBlue.gradient3})`,
        color: 'white',
        boxShadow: `0 10px 20px -5px ${sassyBlue.glow}`
      },
      secondary: {
        background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(219, 234, 254, 0.5)',
        color: isDarkMode ? 'white' : sassyBlue.primary,
        boxShadow: 'none'
      },
      danger: {
        background: `linear-gradient(135deg, ${sassyBlue.danger}, #F87171)`,
        color: 'white',
        boxShadow: `0 10px 20px -5px rgba(239, 68, 68, 0.3)`
      }
    };
    return styles[type];
  };

  return (
    <>
      <header className="flex items-center mb-8">
        <button 
          className="w-10 h-10 rounded-full flex items-center justify-center mr-4 hover:scale-105 transition-all duration-300"
          onClick={() => setView('main')}
          disabled={isProcessing}
          style={{
            background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(219, 234, 254, 0.5)',
            color: sassyBlue.primary,
          }}
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-2xl font-bold" 
              style={{ 
                background: `-webkit-linear-gradient(135deg, ${sassyBlue.gradient1}, ${sassyBlue.gradient3})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Add Medication</h1>
          <p className="text-sm opacity-80" style={{ color: isDarkMode ? 'white' : '#6B7280' }}>
            Because your memory is terrible, let's be honest.
          </p>
        </div>
      </header>
      
      <div className="mb-8 rounded-3xl shadow-xl border-0 relative overflow-hidden transition-all duration-500"
           style={{ 
             backgroundColor: sassyBlue.cardBg,
             boxShadow: `0 20px 25px -5px ${sassyBlue.glow}`
           }}>
        {/* Decorative top bar */}
        <div className="h-2 w-full" style={{ background: `linear-gradient(to right, ${sassyBlue.gradient1}, ${sassyBlue.gradient3}, ${sassyBlue.accent})` }}></div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
             style={{ 
               background: `radial-gradient(circle, ${sassyBlue.accent}, transparent 70%)`,
               transform: 'translate(30%, -30%)'
             }}></div>
             
        <div className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Medication name */}
            <div className="relative">
              <label className="block text-sm font-medium mb-2 flex items-center" 
                     style={{ color: isDarkMode ? 'white' : '#4B5563' }}>
                <Pill size={16} className="mr-2 opacity-80" />
                Medication Name<span className="text-red-500 ml-1">*</span>
              </label>
              <input 
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => handleFocus('name')}
                onBlur={handleBlur}
                className="w-full p-4 rounded-xl border focus:outline-none transition-all duration-300"
                style={getInputStyle('name')}
                placeholder="What's this magical pill called?"
                required
                disabled={isProcessing}
              />
              {activeField === 'name' && (
                <div className="absolute right-3 top-1/2 mt-2 text-xs rounded-full px-2 py-1 bg-blue-100 text-blue-800">
                  Required
                </div>
              )}
            </div>
            
            {/* Dosage and Form */}
            <div className="grid grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-sm font-medium mb-2 flex items-center" 
                       style={{ color: isDarkMode ? 'white' : '#4B5563' }}>
                  <Shield size={16} className="mr-2 opacity-80" />
                  Dosage<span className="text-red-500 ml-1">*</span>
                </label>
                <input 
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  onFocus={() => handleFocus('dosage')}
                  onBlur={handleBlur}
                  className="w-full p-4 rounded-xl border focus:outline-none transition-all duration-300"
                  style={getInputStyle('dosage')}
                  placeholder="e.g., 10mg"
                  required
                  disabled={isProcessing}
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-2 flex items-center" 
                       style={{ color: isDarkMode ? 'white' : '#4B5563' }}>
                  <Calendar size={16} className="mr-2 opacity-80" />
                  Form<span className="text-red-500 ml-1">*</span>
                </label>
                <select 
                  name="form"
                  value={formData.form}
                  onChange={handleChange}
                  onFocus={() => handleFocus('form')}
                  onBlur={handleBlur}
                  className="w-full p-4 rounded-xl border focus:outline-none transition-all duration-300 appearance-none"
                  style={getInputStyle('form')}
                  required
                  disabled={isProcessing}
                >
                  <option value="">Select form</option>
                  <option value="tablet">Tablet</option>
                  <option value="capsule">Capsule</option>
                  <option value="liquid">Liquid</option>
                  <option value="injection">Injection</option>
                  <option value="patch">Patch</option>
                  <option value="inhaler">Inhaler</option>
                </select>
                <div className="absolute right-4 top-11 pointer-events-none" style={{ color: sassyBlue.primary }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Category and Purpose */}
            <div className="grid grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-sm font-medium mb-2 flex items-center" 
                       style={{ color: isDarkMode ? 'white' : '#4B5563' }}>
                  <svg width="16" height="16" className="mr-2 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: sassyBlue.primary }}>
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  onFocus={() => handleFocus('category')}
                  onBlur={handleBlur}
                  className="w-full p-4 rounded-xl border focus:outline-none transition-all duration-300 appearance-none"
                  style={getInputStyle('category')}
                  required
                  disabled={isProcessing}
                >
                  <option value="general">General</option>
                  <option value="cardiovascular">Cardiovascular</option>
                  <option value="metabolic">Metabolic</option>
                  <option value="pain">Pain</option>
                  <option value="antibiotic">Antibiotic</option>
                  <option value="neurological">Neurological</option>
                  <option value="respiratory">Respiratory</option>
                  <option value="gastrointestinal">Gastrointestinal</option>
                  <option value="vitamin">Vitamin/Supplement</option>
                  <option value="other">Other</option>
                </select>
                <div className="absolute right-4 top-11 pointer-events-none" style={{ color: sassyBlue.primary }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-2 flex items-center" 
                       style={{ color: isDarkMode ? 'white' : '#4B5563' }}>
                  <Zap size={16} className="mr-2 opacity-80" />
                  Purpose<span className="text-red-500 ml-1">*</span>
                </label>
                <input 
                  type="text"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  onFocus={() => handleFocus('purpose')}
                  onBlur={handleBlur}
                  className="w-full p-4 rounded-xl border focus:outline-none transition-all duration-300"
                  style={getInputStyle('purpose')}
                  placeholder="What's it for? Besides emptying your wallet."
                  required
                  disabled={isProcessing}
                />
              </div>
            </div>
            
            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center" 
                     style={{ color: isDarkMode ? 'white' : '#4B5563' }}>
                <AlarmClock size={16} className="mr-2 opacity-80" />
                Schedule<span className="text-red-500 ml-1">*</span>
              </label>
              <div className="space-y-3">
                {formData.schedule.map((scheduleItem, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 rounded-xl border transition-all duration-300 hover:scale-101"
                    style={{ 
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(241, 245, 249, 0.8)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(219, 234, 254, 0.5)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" 
                           style={{ backgroundColor: `${sassyBlue.primary}15`, color: sassyBlue.primary }}>
                        <Clock size={18} />
                      </div>
                      <input 
                        type="time"
                        className="p-2 border rounded-lg focus:outline-none transition-all duration-300 appearance-none"
                        style={{ 
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'white', 
                          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(219, 234, 254, 0.5)',
                          color: isDarkMode ? 'white' : 'inherit'
                        }}
                        value={scheduleItem.time}
                        onChange={(e) => updateScheduleTime(index, e.target.value)}
                        required
                        disabled={isProcessing}
                      />
                    </div>
                    <button 
                      type="button" 
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                      style={{ 
                        backgroundColor: sassyBlue.danger + '20', 
                        color: sassyBlue.danger 
                      }}
                      onClick={() => formData.schedule.length > 1 && removeScheduleTime(index)}
                      disabled={isProcessing}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  className="flex items-center justify-center w-full p-4 rounded-xl border-2 border-dashed transition-all duration-300 text-sm hover:scale-102 hover:shadow-md"
                  style={{ 
                    color: sassyBlue.primary,
                    borderColor: isDarkMode ? `${sassyBlue.primary}40` : 'rgba(191, 219, 254, 0.8)',
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(241, 245, 249, 0.5)',
                  }}
                  onClick={addScheduleTime}
                  disabled={isProcessing}
                >
                  <PlusCircle size={18} className="mr-2" />
                  Add another time (for overachievers)
                </button>
              </div>
            </div>
            
            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center" 
                     style={{ color: isDarkMode ? 'white' : '#4B5563' }}>
                <AlertTriangle size={16} className="mr-2 opacity-80" />
                Instructions<span className="text-red-500 ml-1">*</span>
              </label>
              <textarea 
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                onFocus={() => handleFocus('instructions')}
                onBlur={handleBlur}
                className="w-full p-4 rounded-xl border focus:outline-none transition-all duration-300"
                style={getInputStyle('instructions')}
                placeholder="Special instructions (e.g., take with food, avoid with alcohol, don't lick)"
                rows="3"
                required
                disabled={isProcessing}
              ></textarea>
            </div>
            
            {/* Dates and Refill */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center" 
                       style={{ color: isDarkMode ? 'white' : '#4B5563' }}>
                  <Calendar size={16} className="mr-2 opacity-80" />
                  Start Date
                </label>
                <input 
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  onFocus={() => handleFocus('startDate')}
                  onBlur={handleBlur}
                  className="w-full p-4 rounded-xl border focus:outline-none transition-all duration-300"
                  style={getInputStyle('startDate')}
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center" 
                       style={{ color: isDarkMode ? 'white' : '#4B5563' }}>
                  <Calendar size={16} className="mr-2 opacity-80" />
                  Refill Date
                </label>
                <input 
                  type="date"
                  name="refillDate"
                  value={formData.refillDate}
                  onChange={handleChange}
                  onFocus={() => handleFocus('refillDate')}
                  onBlur={handleBlur}
                  className="w-full p-4 rounded-xl border focus:outline-none transition-all duration-300"
                  style={getInputStyle('refillDate')}
                  disabled={isProcessing}
                />
              </div>
            </div>
            
            {/* Prescriber */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center" 
                     style={{ color: isDarkMode ? 'white' : '#4B5563' }}>
                <svg width="16" height="16" className="mr-2 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: sassyBlue.primary }}>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Prescribed By
              </label>
              <input 
                type="text"
                name="prescribedBy"
                value={formData.prescribedBy}
                onChange={handleChange}
                onFocus={() => handleFocus('prescribedBy')}
                onBlur={handleBlur}
                className="w-full p-4 rounded-xl border focus:outline-none transition-all duration-300"
                style={getInputStyle('prescribedBy')}
                placeholder="That doctor you can never remember the name of"
                disabled={isProcessing}
              />
            </div>
            
            {/* Reminders */}
            <div className="flex items-center justify-between p-4 rounded-xl transition-colors duration-300"
                 style={{ 
                   backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(241, 245, 249, 0.8)',
                 }}>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" 
                     style={{ backgroundColor: `${sassyBlue.primary}20`, color: sassyBlue.primary }}>
                  <Bell size={18} />
                </div>
                <div>
                  <span className="font-medium" style={{ color: isDarkMode ? 'white' : '#4B5563' }}>Reminders</span>
                  <p className="text-xs opacity-70" style={{ color: isDarkMode ? 'white' : '#6B7280' }}>
                    Because we both know you'll forget otherwise
                  </p>
                </div>
              </div>
              <button 
                type="button"
                className="w-14 h-7 rounded-full relative transition-all duration-300"
                style={{ 
                  backgroundColor: formData.reminders ? sassyBlue.primary : isDarkMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
                  boxShadow: formData.reminders ? `0 0 10px ${sassyBlue.glow}` : 'none'
                }}
                onClick={toggleReminders}
                disabled={isProcessing}
              >
                <span 
                  className="absolute w-5 h-5 rounded-full bg-white transform transition-transform duration-300 flex items-center justify-center"
                  style={{ 
                    top: '0.25rem',
                    left: formData.reminders ? 'auto' : '0.25rem',
                    right: formData.reminders ? '0.25rem' : 'auto',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  {formData.reminders && <Check size={12} style={{ color: sassyBlue.primary }} />}
                </span>
              </button>
            </div>
            
            {/* Side Effects */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center" 
                       style={{ color: isDarkMode ? 'white' : '#4B5563' }}>
                  <AlertTriangle size={16} className="mr-2 opacity-80" />
                  Side Effects
                </label>
                <button 
                  type="button"
                  className="text-xs px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105"
                  style={{ 
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : `${sassyBlue.primary}15`,
                    color: sassyBlue.primary
                  }}
                  onClick={addSideEffect}
                  disabled={isProcessing}
                >
                  + Add Effect
                </button>
              </div>
              
              {formData.sideEffects.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-4 rounded-xl transition-all duration-300"
                     style={{ 
                       backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(241, 245, 249, 0.8)'
                     }}>
                  {formData.sideEffects.map((effect, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center px-3 py-1.5 rounded-full text-xs"
                      style={{ 
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'white',
                        color: isDarkMode ? 'white' : '#4B5563',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                      }}
                    >
                      {effect}
                      <button 
                        type="button"
                        className="ml-2 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${sassyBlue.danger}20`, color: sassyBlue.danger }}
                        onClick={() => removeSideEffect(idx)}
                        disabled={isProcessing}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl flex items-center justify-center"
                     style={{ 
                       backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(241, 245, 249, 0.8)'
                     }}>
                  <p className="text-xs italic opacity-70"
                     style={{ color: isDarkMode ? 'white' : '#6B7280' }}>
                    Add side effects that might make you question your life choices
                  </p>
                </div>
              )}
            </div>
            
            {/* Submit button */}
            <button 
              type="submit"
              className="w-full py-5 rounded-xl text-white font-medium transition-all duration-500 hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center relative overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${sassyBlue.gradient1}, ${sassyBlue.gradient3})`,
                boxShadow: `0 10px 25px -5px ${sassyBlue.glow}`
              }}
              disabled={isProcessing || animateSubmit}
            >
              {isProcessing || animateSubmit ? (
                <>
                  <div className={`absolute inset-0 ${animateSubmit ? 'animate-progress' : ''}`}
                       style={{ 
                         background: `linear-gradient(to right, ${sassyBlue.gradient3}, ${sassyBlue.gradient1})`,
                         width: '100%',
                         transform: animateSubmit ? 'translateX(0)' : 'translateX(-100%)'
                       }}></div>
                  <Loader size={20} className="animate-spin mr-2 relative z-10" />
                  <span className="relative z-10">Saving...</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">Save This Pill</span>
                  <div className="absolute right-5 w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                    <Check size={14} />
                  </div>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(-10%); }
          100% { transform: translateX(0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .animate-progress {
          animation: progress 0.8s ease-out forwards;
        }
        /* Scale hover effect */
        .hover\\:scale-101:hover {
          transform: scale(1.01);
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
        /* Floating label effect */
        .focus-within\\:text-blue-500:focus-within {
          color: ${sassyBlue.primary};
        }
        /* Input highlight */
        .focus\\:border-blue-500:focus {
          border-color: ${sassyBlue.primary};
        }
      `}</style>
    </>
  );
};

export default AddMedicationForm;