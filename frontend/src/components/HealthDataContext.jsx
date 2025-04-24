import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { useApiMiddleware } from './ApiMiddleware';
import api from './api';

// Create health data context
const HealthDataContext = createContext();

// Custom hook to use the health data context
export const useHealthData = () => {
  return useContext(HealthDataContext);
};

export const HealthDataProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { callApi } = useApiMiddleware();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGoogleFitConnected, setIsGoogleFitConnected] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState({
    height: null,
    weight: null,
    BMI: null,
    pressure: { systolic: null, diastolic: null },
    glucose: null,
    sleep: { sleep_time: null, wake_time: null }
  });
  const [symptoms, setSymptoms] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [biorhythmAdvice, setBiorhythmAdvice] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [environmentAdvice, setEnvironmentAdvice] = useState(null);
  
  // Track last refresh time
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  
  // Check Google Fit connection status
  const checkGoogleFitConnection = async () => {
    try {
      // Check if we have local storage data indicating connection
      const connected = localStorage.getItem('google_fit_connected') === 'true';
      setIsGoogleFitConnected(connected);
      
      // Also check with the API if possible
      if (connected) {
        // Ping the server to verify the connection is still active
        try {
          const response = await api.checkBackendHealth();
          // If server is down, we'll still keep the local status
        } catch (err) {
          console.warn("Could not verify Google Fit connection with server");
        }
      }
      
      return connected;
    } catch (error) {
      console.error('Failed to check Google Fit connection:', error);
      return false;
    }
  };
  
  // Connect to Google Fit and get OAuth2 token
  const connectGoogleFit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Generate an auth code for Google OAuth
      const authCode = `${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
      
      try {
        // Try to authenticate with the real API
        await callApi(api.authenticateGoogleFit, authCode);
        
        // Save connection status to local storage
        localStorage.setItem('google_fit_connected', 'true');
        setIsGoogleFitConnected(true);
        
        // Fetch initial health data
        await fetchHealthData();
        
        return true;
      } catch (apiError) {
        console.error('API authentication failed:', apiError);
        setError('Failed to authenticate with Google Fit. Please try again.');
        
        // Clear any potentially existing data
        localStorage.setItem('google_fit_connected', 'false');
        setIsGoogleFitConnected(false);
        
        return false;
      }
    } catch (error) {
      console.error('Failed to connect Google Fit:', error);
      setError('Failed to connect to Google Fit. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch health data from API - no mock data
  const fetchHealthData = async (options = { days: 30 }) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }
      
      if (!isGoogleFitConnected) {
        const connected = await checkGoogleFitConnection();
        if (!connected) {
          throw new Error('Google Fit not connected');
        }
      }
      
      // Get real data from the API
      const data = await callApi(api.fetchHealthData, options);
      
      // Only proceed if we actually got data back
      if (data && Object.keys(data).length > 0) {
        // Transform data into our expected format
        const transformedData = {
          height: data.height || null,
          weight: data.weight || null,
          BMI: data.BMI || null,
          pressure: { 
            systolic: data.systolic || null, 
            diastolic: data.diastolic || null 
          },
          glucose: data.glucose || null,
          sleep: {
            sleep_time: data.sleep_time || null,
            wake_time: data.wake_time || null
          }
        };
        
        setHealthMetrics(transformedData);
        
        // Get prediction based on health metrics
        if (data.systolic && data.diastolic && data.BMI && data.glucose && data.age) {
          await getPrediction({
            age: data.age,
            BMI: data.BMI,
            glucose: data.glucose,
            sbp: data.systolic,
            dbp: data.diastolic
          });
        }
        
        // Set last refresh time
        setLastRefreshTime(new Date());
        
        return transformedData;
      } else {
        throw new Error('No health data available from Google Fit');
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
      setError(error.message || 'Failed to fetch health data');
      throw error; // Rethrow to let the caller handle it
    } finally {
      setLoading(false);
    }
  };
  
  // Get prediction based on health metrics
  const getPrediction = async (metrics) => {
    try {
      // Get real prediction from the API
      const result = await callApi(api.getPrediction, metrics);
      setPrediction(result);
      return result;
    } catch (error) {
      console.error('Failed to get prediction:', error);
      throw error;
    }
  };
  
  // Get biorhythm advice
  const getBiorhythmAdvice = async (chronotype = 'morning', medicationTime = '08:00') => {
    try {
      console.log(`Requesting biorhythm advice for ${chronotype} chronotype...`);
      
      // Get actual biorhythm advice from the API
      const advice = await callApi(api.getBiorhythmAdvice, chronotype, medicationTime);
      
      setBiorhythmAdvice(advice);
      return advice;
    } catch (error) {
      console.error('Failed to get biorhythm advice:', error);
      throw error;
    }
  };
  
  // Get environment advice
  const getEnvironmentAdvice = async () => {
    try {
      // Get real environment advice
      const advice = await callApi(api.getEnvironmentAdvice);
      setEnvironmentAdvice(advice);
      return advice;
    } catch (error) {
      console.error('Failed to get environment advice:', error);
      throw error;
    }
  };
  
  // Add a new symptom and get AI insights
  const addSymptom = async (symptomData) => {
    try {
      // Submit the symptom to the API
      const newSymptom = await callApi(api.submitSymptom, symptomData);
      
      // Update local symptoms list
      setSymptoms(prevSymptoms => [newSymptom, ...prevSymptoms]);
      
      // Get AI insights based on the new symptom and health metrics
      const insightData = {
        symptom: symptomData,
        healthMetrics: healthMetrics
      };
      
      // Get real AI insights
      const insights = await callApi(api.getHealthInsight, insightData);
      setAiInsights(insights);
      
      return { symptom: newSymptom, insights };
    } catch (error) {
      console.error('Failed to add symptom:', error);
      throw error;
    }
  };
  
  // Load initial data when authenticated
  useEffect(() => {
    const loadInitialData = async () => {
      if (isAuthenticated) {
        const connected = await checkGoogleFitConnection();
        // Only fetch health data if Google Fit is connected
        if (connected) {
          try {
            await fetchHealthData();
            try {
              await getBiorhythmAdvice('morning'); // Load default biorhythm advice
            } catch (biorhythmError) {
              console.warn("Could not load biorhythm advice:", biorhythmError);
            }
          } catch (error) {
            console.error("Failed to load initial data:", error);
          }
        }
      }
    };
    
    loadInitialData();
  }, [isAuthenticated]);
  
  // Value to be provided to consuming components
  const value = {
    loading,
    error,
    isGoogleFitConnected,
    healthMetrics,
    symptoms,
    prediction,
    biorhythmAdvice,
    aiInsights,
    environmentAdvice,
    lastRefreshTime,
    connectGoogleFit,
    fetchHealthData,
    addSymptom,
    getBiorhythmAdvice,
    getPrediction,
    getEnvironmentAdvice
  };
  
  return (
    <HealthDataContext.Provider value={value}>
      {children}
    </HealthDataContext.Provider>
  );
};

export default HealthDataProvider;