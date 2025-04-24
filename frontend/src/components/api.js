// api.js - Client for communicating with Python backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

/**
 * API client for communicating with the Python backend
 */
class ApiClient {
  /**
   * Authenticate with Google Fit
   * @param {string} authCode - Google OAuth2 authorization code
   * @returns {Promise} - Resolves to the authentication status
   */
  async authenticateGoogleFit(authCode) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google-fit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authCode }),
        // For CORS issues, we should NOT use include mode if the server doesn't support it
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to authenticate with Google Fit');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Google Fit authentication error:', error);
      throw error;
    }
  }

  /**
   * Fetch health data from Google Fit via the Python backend
   * @param {Object} options - Options to customize the data retrieval
   * @param {number} options.days - Number of days to fetch data for
   * @param {Array} options.fields - Specific fields to fetch
   * @returns {Promise} - Resolves to the health data
   */
  async fetchHealthData(options = { days: 30, fields: null }) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('days', options.days);
      
      if (options.fields && Array.isArray(options.fields)) {
        options.fields.forEach(field => queryParams.append('fields', field));
      }
      
      const response = await fetch(`${API_BASE_URL}/health-data?${queryParams}`, {
        method: 'GET',
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch health data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      throw error;
    }
  }

  /**
   * Get an AI-generated health insight based on symptoms and metrics
   * @param {Object} data - Combined symptom and health metric data
   * @returns {Promise} - Resolves to the AI-generated insight
   */
  async getHealthInsight(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to get AI insights');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get AI insights:', error);
      throw error;
    }
  }

  /**
   * Get biorhythm advice based on chronotype and health data
   * @param {string} chronotype - User's chronotype (e.g., "morning", "evening")
   * @param {string} medicationTime - Preferred medication time
   * @returns {Promise} - Resolves to biorhythm advice
   */
  async getBiorhythmAdvice(chronotype, medicationTime) {
    try {
      // For simplicity, using GET with query params to avoid CORS preflight issues
      const params = new URLSearchParams({
        chronotype,
        medicationTime
      });
      
      // Add timeout with AbortController to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(`${API_BASE_URL}/biorhythm/advice?${params}`, {
          method: 'GET',
          credentials: 'same-origin',
          signal: controller.signal
        });
        
        // Clear the timeout since request completed
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Biorhythm advice service not available');
          }
          
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to get biorhythm advice');
        }
        
        return await response.json();
      } catch (fetchError) {
        // Clear timeout if there was an error
        clearTimeout(timeoutId);
        
        // Handle abort error specifically
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out while getting biorhythm advice');
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('Failed to get biorhythm advice:', error);
      throw error;
    }
  }

  /**
   * Submit a new symptom with health context
   * @param {Object} symptomData - The symptom data to submit
   * @returns {Promise} - Resolves when the symptom is saved
   */
  async submitSymptom(symptomData) {
    try {
      const response = await fetch(`${API_BASE_URL}/symptoms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(symptomData),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to submit symptom');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to submit symptom:', error);
      throw error;
    }
  }

  /**
   * Get prediction results based on health metrics
   * @param {Object} healthMetrics - The health metrics to analyze
   * @returns {Promise} - Resolves to the prediction results
   */
  async getPrediction(healthMetrics) {
    try {
      const response = await fetch(`${API_BASE_URL}/prediction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(healthMetrics),
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to get prediction');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get prediction:', error);
      throw error;
    }
  }
  
  /**
   * Get environment health advice based on user's location
   * @returns {Promise} - Resolves to environment health advice
   */
  async getEnvironmentAdvice() {
    try {
      // Add timeout with AbortController to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      try {
        const response = await fetch(`${API_BASE_URL}/environment/advice`, {
          method: 'GET',
          credentials: 'same-origin',
          signal: controller.signal
        });
        
        // Clear the timeout since request completed
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to get environment advice');
        }
        
        return await response.json();
      } catch (fetchError) {
        // Clear timeout if there was an error
        clearTimeout(timeoutId);
        
        // Handle abort error specifically
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out while getting environment advice');
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('Failed to get environment advice:', error);
      throw error;
    }
  }
  
  /**
   * Check if backend services are available
   * @returns {Promise<boolean>} - Resolves to true if backend is available
   */
  async checkBackendHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response.ok;
      } catch (error) {
        clearTimeout(timeoutId);
        return false;
      }
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Mock method to generate demo data when backend is unavailable
   * @returns {Object} - Demo health data
   */
  generateMockHealthData() {
    return {
      height: 1.75,
      weight: 70.5,
      BMI: 23.0,
      systolic: 120,
      diastolic: 80,
      glucose: 95,
      sleep_time: "23:30",
      wake_time: "07:15",
      age: 35
    };
  }
  
  /**
   * Mock method to generate demo symptoms when backend is unavailable
   * @returns {Array} - Demo symptoms
   */
  generateMockSymptoms() {
    return [
      {
        id: 1,
        symptom: "Headache",
        severity: "Moderate",
        time: "15:30",
        date: "April 20, 2025",
        notes: "Throbbing pain on left side of head, started after working on computer for 3 hours",
        triggers: ["Screen time", "Stress"],
        associatedSymptoms: ["Fatigue"],
        healthContext: {
          bmi: 23.0,
          bloodPressure: {
            systolic: 130,
            diastolic: 85
          },
          glucose: 100
        }
      },
      {
        id: 2,
        symptom: "Nausea",
        severity: "Mild",
        time: "08:45",
        date: "April 21, 2025",
        notes: "Felt queasy after breakfast, subsided after 30 minutes",
        triggers: ["Coffee"],
        associatedSymptoms: ["Dizziness"],
        healthContext: {
          bmi: 23.0,
          bloodPressure: {
            systolic: 118,
            diastolic: 75
          },
          glucose: 90
        }
      }
    ];
  }
  
  /**
   * Mock method to generate demo AI insights when backend is unavailable
   * @returns {Object} - Demo AI insights
   */
  generateMockAIInsights() {
    return {
      pattern: "Your headaches tend to occur after extended screen time and coincide with slightly elevated blood pressure. The most common time is afternoon (between 2-4pm).",
      recommendation: "Consider implementing the 20-20-20 rule while working (every 20 minutes, look at something 20 feet away for 20 seconds). Stay hydrated and take short walking breaks every hour.",
      relatedMetrics: ["blood pressure", "screen time", "stress"]
    };
  }
  
  /**
   * Mock method to generate biorhythm advice
   * @param {string} chronotype - The user's chronotype (morning/evening)
   * @returns {Object} - Mock biorhythm advice
   */
  generateMockBiorhythmAdvice(chronotype) {
    return {
      chronotype: chronotype,
      medicationTime: chronotype === 'morning' ? '08:00 - 09:00' : 
                     chronotype === 'evening' ? '18:00 - 19:00' : 
                     '12:00 - 14:00',
      sleepAdvice: `Based on your ${chronotype} chronotype, you should aim to sleep between ${
        chronotype === 'morning' ? '22:30 and 06:30' : 
        chronotype === 'evening' ? '00:00 and 08:00' : 
        '23:00 and 07:00'
      } for optimal rest and energy levels.`,
      generalAdvice: "Align your most demanding cognitive tasks with your peak alertness hours. Stay hydrated throughout the day and maintain consistent meal times to support your body's natural rhythms."
    };
  }
}

export default new ApiClient();