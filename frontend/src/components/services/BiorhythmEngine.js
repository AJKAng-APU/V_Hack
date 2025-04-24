// BiorhythmEngine.js - A production-ready biorhythm calculation system
// This can be exported as a separate utility for use across your app

/**
 * Comprehensive biorhythm calculation engine with optimized performance 
 * and caching for production applications
 */
export class BiorhythmEngine {
    constructor(options = {}) {
      // Default configurations - can be overridden
      this.config = {
        // Peak hours for different rhythms (based on chronobiology research)
        peakHours: {
          physical: options.physicalPeak || 11, // Peaks mid-morning
          emotional: options.emotionalPeak || 16, // Peaks afternoon
          intellectual: options.intellectualPeak || 10, // Peaks early morning
          metabolic: options.metabolicPeak || 12, // Peaks at noon
        },
        // Amplitude determines the strength of the rhythm variation
        amplitudes: {
          physical: options.physicalAmplitude || 0.8,
          emotional: options.emotionalAmplitude || 0.7,
          intellectual: options.intellectualAmplitude || 0.9,
          metabolic: options.metabolicAmplitude || 0.75,
        },
        // Threshold settings for different activities
        thresholds: {
          medication: { min: options.medicationMinThreshold || 0.6, max: options.medicationMaxThreshold || 0.8 },
          exercise: { min: options.exerciseMinThreshold || 0.7, max: options.exerciseMaxThreshold || 1.0 },
          meals: { min: options.mealsMinThreshold || 0.7, max: options.mealsMaxThreshold || 1.0 },
          focus: { min: options.focusMinThreshold || 0.8, max: options.focusMaxThreshold || 1.0 },
          sleep: { physical: options.sleepPhysicalThreshold || 0.4, emotional: options.sleepEmotionalThreshold || 0.5 }
        },
        // Weight factors for calculating the overall score
        weights: {
          physical: options.physicalWeight || 0.3,
          emotional: options.emotionalWeight || 0.2, 
          intellectual: options.intellectualWeight || 0.2,
          metabolic: options.metabolicWeight || 0.3
        },
        // Personal chronotype adjustment (-12 to 12, negative = early bird, positive = night owl)
        chronotypeAdjustment: options.chronotypeAdjustment || 0,
        cacheResults: options.cacheResults !== undefined ? options.cacheResults : true
      };
      
      // Results cache to avoid redundant calculations
      this.cache = {
        hourlyData: null,
        lastCalculationDate: null
      };
    }
    
    /**
     * Calculate biorhythm value for a specific rhythm at a given hour
     * @param {number} hour - Hour of day (0-23)
     * @param {string} rhythmType - Type of rhythm (physical, emotional, intellectual, metabolic)
     * @returns {number} Normalized biorhythm value (0-1)
     */
    calculateRhythmValue(hour, rhythmType) {
      if (!this.config.peakHours[rhythmType]) {
        console.warn(`Unknown rhythm type: ${rhythmType}. Using physical rhythm as fallback.`);
        rhythmType = 'physical';
      }
      
      // Adjust hour based on chronotype
      const adjustedHour = (hour + this.config.chronotypeAdjustment + 24) % 24;
      
      // Get peak hour and amplitude for this rhythm
      const peakHour = this.config.peakHours[rhythmType];
      const amplitude = this.config.amplitudes[rhythmType];
      
      // Convert to radians (full cycle over 24 hours)
      const radians = ((adjustedHour - peakHour) / 24) * 2 * Math.PI;
      
      // Cosine function gives oscillation, amplitude controls height, add offset to make positive
      return ((Math.cos(radians) * amplitude) + 1) / 2;
    }
    
    /**
     * Calculate full day's biorhythm data
     * @param {Date} [date=new Date()] - Date to calculate biorhythms for
     * @returns {Array<Object>} Hourly biorhythm data
     */
    calculateHourlyData(date = new Date()) {
      // Check cache to avoid redundant calculations (only if date matches)
      const dateString = date.toDateString();
      if (this.config.cacheResults && 
          this.cache.hourlyData && 
          this.cache.lastCalculationDate === dateString) {
        return this.cache.hourlyData;
      }
      
      // Generate hourly data
      const hourlyData = [];
      for (let i = 0; i < 24; i++) {
        const physical = this.calculateRhythmValue(i, 'physical');
        const emotional = this.calculateRhythmValue(i, 'emotional');
        const intellectual = this.calculateRhythmValue(i, 'intellectual');
        const metabolic = this.calculateRhythmValue(i, 'metabolic');
        
        // Calculate overall score using weighted average
        const overall = (
          physical * this.config.weights.physical +
          emotional * this.config.weights.emotional +
          intellectual * this.config.weights.intellectual +
          metabolic * this.config.weights.metabolic
        );
        
        hourlyData.push({
          hour: i,
          physical,
          emotional, 
          intellectual,
          metabolic,
          overall
        });
      }
      
      // Update cache
      if (this.config.cacheResults) {
        this.cache.hourlyData = hourlyData;
        this.cache.lastCalculationDate = dateString;
      }
      
      return hourlyData;
    }
    
    /**
     * Get current biorhythm scores
     * @param {Date} [date=new Date()] - Date to calculate for
     * @returns {Object} Current biorhythm scores (0-100)
     */
    getCurrentScores(date = new Date()) {
      const hour = date.getHours();
      const hourlyData = this.calculateHourlyData(date);
      const currentHourData = hourlyData.find(data => data.hour === hour) || hourlyData[0];
      
      return {
        overall: parseFloat((currentHourData.overall * 100).toFixed(1)),
        physical: parseFloat((currentHourData.physical * 100).toFixed(1)),
        emotional: parseFloat((currentHourData.emotional * 100).toFixed(1)),
        intellectual: parseFloat((currentHourData.intellectual * 100).toFixed(1)),
        metabolic: parseFloat((currentHourData.metabolic * 100).toFixed(1))
      };
    }
    
    /**
     * Find optimal time windows for specific activities
     * @param {string} activityType - Type of activity (medication, exercise, meals, focus, sleep)
     * @param {Date} [date=new Date()] - Date to calculate for
     * @returns {Array<number>} Hours that are optimal for the activity
     */
    getOptimalTimes(activityType, date = new Date()) {
      const hourlyData = this.calculateHourlyData(date);
      
      switch(activityType) {
        case 'medication':
          return this._getTimesBasedOnThreshold(
            hourlyData, 
            'metabolic', 
            this.config.thresholds.medication.min, 
            this.config.thresholds.medication.max
          );
          
        case 'exercise':
          return this._getTimesBasedOnThreshold(
            hourlyData, 
            'physical', 
            this.config.thresholds.exercise.min, 
            this.config.thresholds.exercise.max
          );
          
        case 'meals':
          return this._getTimesBasedOnThreshold(
            hourlyData, 
            'metabolic', 
            this.config.thresholds.meals.min, 
            this.config.thresholds.meals.max
          );
          
        case 'focus':
          return this._getTimesBasedOnThreshold(
            hourlyData, 
            'intellectual', 
            this.config.thresholds.focus.min, 
            this.config.thresholds.focus.max
          );
          
        case 'sleep':
          return hourlyData
            .filter(item => 
              item.physical < this.config.thresholds.sleep.physical && 
              item.emotional < this.config.thresholds.sleep.emotional
            )
            .map(item => item.hour);
            
        default:
          console.warn(`Unknown activity type: ${activityType}`);
          return [];
      }
    }
    
    /**
     * Get biorhythm-based recommendations
     * @param {Date} [date=new Date()] - Date to calculate for 
     * @returns {Object} Complete set of biorhythm recommendations
     */
    getRecommendations(date = new Date()) {
      return {
        currentScore: this.getCurrentScores(date),
        hourlyData: this.calculateHourlyData(date),
        recommendations: {
          medicationTiming: this.getOptimalTimes('medication', date),
          exerciseTiming: this.getOptimalTimes('exercise', date),
          mealTiming: this.getOptimalTimes('meals', date),
          focusTiming: this.getOptimalTimes('focus', date),
          sleepTiming: this.getOptimalTimes('sleep', date)
        },
        dominantRhythm: this._getDominantRhythm(date),
        nextTransition: this._getNextTransition(date)
      };
    }
    
    /**
     * Find the dominant rhythm at current time
     * @param {Date} [date=new Date()] - Date to calculate for
     * @returns {Object} Dominant rhythm information
     */
    _getDominantRhythm(date = new Date()) {
      const scores = this.getCurrentScores(date);
      const rhythms = [
        { type: 'physical', value: scores.physical },
        { type: 'emotional', value: scores.emotional },
        { type: 'intellectual', value: scores.intellectual },
        { type: 'metabolic', value: scores.metabolic }
      ];
      
      rhythms.sort((a, b) => b.value - a.value);
      return rhythms[0];
    }
    
    /**
     * Calculate when the next significant biorhythm transition will occur
     * @param {Date} [date=new Date()] - Starting date
     * @returns {Object} Next transition information
     */
    _getNextTransition(date = new Date()) {
      const currentHour = date.getHours();
      const currentDominant = this._getDominantRhythm(date).type;
      
      // Check future hours for a change in dominant rhythm
      for (let i = 1; i <= 24; i++) {
        const futureDate = new Date(date);
        futureDate.setHours(currentHour + i);
        
        const futureDominant = this._getDominantRhythm(futureDate).type;
        if (futureDominant !== currentDominant) {
          return {
            from: currentDominant,
            to: futureDominant,
            hoursFromNow: i,
            time: `${(currentHour + i) % 24}:00`
          };
        }
      }
      
      // If no transition found within 24 hours
      return null;
    }
    
    /**
     * Helper to find times based on threshold values
     * @private
     */
    _getTimesBasedOnThreshold(hourlyData, rhythmType, minThreshold, maxThreshold) {
      return hourlyData
        .filter(item => item[rhythmType] >= minThreshold && item[rhythmType] <= maxThreshold)
        .map(item => item.hour);
    }
    
    /**
     * Update engine configuration
     * @param {Object} newConfig - New configuration parameters
     */
    updateConfig(newConfig) {
      // Deep merge the new config with existing config
      this.config = this._deepMerge(this.config, newConfig);
      
      // Clear cache when config changes
      this.clearCache();
    }
    
    /**
     * Clear cached calculations
     */
    clearCache() {
      this.cache = {
        hourlyData: null,
        lastCalculationDate: null
      };
    }
    
    /**
     * Utility method for deep merging objects
     * @private
     */
    _deepMerge(target, source) {
      const output = Object.assign({}, target);
      
      if (this._isObject(target) && this._isObject(source)) {
        Object.keys(source).forEach(key => {
          if (this._isObject(source[key])) {
            if (!(key in target)) {
              Object.assign(output, { [key]: source[key] });
            } else {
              output[key] = this._deepMerge(target[key], source[key]);
            }
          } else {
            Object.assign(output, { [key]: source[key] });
          }
        });
      }
      
      return output;
    }
    
    /**
     * Check if value is an object
     * @private
     */
    _isObject(item) {
      return (item && typeof item === 'object' && !Array.isArray(item));
    }
  }
  
  /**
   * Format time window for display
   * @param {Array<number>} hours - Array of hours
   * @returns {string} Formatted time windows
   */
  export function formatTimeWindows(hours) {
    if (!hours || hours.length === 0) return "No optimal times found";
    
    // Sort hours
    hours.sort((a, b) => a - b);
    
    // Group consecutive hours
    const windows = [];
    let start = hours[0];
    let end = hours[0];
    
    for (let i = 1; i < hours.length; i++) {
      if (hours[i] === end + 1) {
        end = hours[i];
      } else {
        windows.push({ start, end });
        start = hours[i];
        end = hours[i];
      }
    }
    windows.push({ start, end });
    
    // Format windows as strings
    return windows.map(window => {
      if (window.start === window.end) {
        return formatHour(window.start);
      } else {
        return `${formatHour(window.start)} - ${formatHour(window.end)}`;
      }
    }).join(", ");
  }
  
  /**
   * Format hour for display
   * @param {number} hour - Hour (0-23)
   * @returns {string} Formatted hour (e.g. "2 PM")
   */
  export function formatHour(hour) {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
  }
  
  /**
   * Generates sassy biorhythm comments based on time of day
   * @param {Date} date - Current date
   * @returns {string} Sassy comment
   */
  export function getSassyRecommendation(date = new Date()) {
    const hour = date.getHours();
    
    if (hour >= 5 && hour < 8) {
      return "Morning person or still awake? Either way, your metabolism is barely online. Coffee first, decisions later.";
    } else if (hour >= 8 && hour < 11) {
      return "Your brain's finally booting up! Perfect time to solve problems before your coworkers ruin your flow.";
    } else if (hour >= 11 && hour < 14) {
      return "Physical energy peaking! Perfect for a workout, unless lunch food coma claims you first.";
    } else if (hour >= 14 && hour < 17) {
      return "Afternoon slump who? Your emotional intelligence is peaking. Time for that difficult conversation you've been avoiding.";
    } else if (hour >= 17 && hour < 20) {
      return "Metabolism slowing down. Maybe don't inhale that entire pizza? Just a biorhythmic suggestion.";
    } else if (hour >= 20 && hour < 23) {
      return "Your brain's winding down. Netflix algorithms make more sense than your decision-making right now.";
    } else {
      return "It's literally the middle of the night. Even your biorhythms are judging your life choices right now.";
    }
  }
  
  // Export a singleton instance with default settings for easy use
  export const biorhythmEngine = new BiorhythmEngine();
  
  // Example usage:
  // import { biorhythmEngine, formatTimeWindows, getSassyRecommendation } from './BiorhythmEngine';
  //
  // // Get all biorhythm data
  // const bioData = biorhythmEngine.getRecommendations();
  //
  // // Customize for an early bird
  // biorhythmEngine.updateConfig({ chronotypeAdjustment: -2 });
  //
  // // Get specific recommendations
  // const medicationTimes = biorhythmEngine.getOptimalTimes('medication');
  // console.log(`Best times to take medication: ${formatTimeWindows(medicationTimes)}`);