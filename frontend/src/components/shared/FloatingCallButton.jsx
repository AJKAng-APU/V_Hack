import React, { useState, useEffect } from 'react';
import { Phone, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import useGlobalCallStore from '../services/GlobalCallService';
import supabase from '../supabaseClient';

/**
 * A floating call button that allows users to call doctors from anywhere in the app
 */
const FloatingCallButton = () => {
  const { colors, isDarkMode } = useTheme();
  const { loadAvailableDoctors, availableDoctors, callDoctor, showCallUI } = useGlobalCallStore();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Load available doctors when the component mounts
  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true);
      await loadAvailableDoctors();
      setIsLoading(false);
    };
    
    fetchDoctors();
    
    // Set up interval to refresh doctors' availability every 30 seconds
    const interval = setInterval(fetchDoctors, 30000);
    
    return () => clearInterval(interval);
  }, [loadAvailableDoctors]);
  
  // Hide the expanded panel when call UI is shown
  useEffect(() => {
    if (showCallUI) {
      setIsExpanded(false);
    }
  }, [showCallUI]);
  
  // Handle call initiation
  const handleCallDoctor = async (doctor) => {
    setSelectedDoctor(doctor);
    setIsLoading(true);
    
    try {
      // Double-check doctor availability with the server
      const { data, error } = await supabase
        .from('doctors')
        .select('availability')
        .eq('doctor_id', doctor.id)
        .single();
        
      if (error) throw error;
      
      if (!data.availability) {
        alert(`${doctor.name} is no longer available. Please try another doctor.`);
        await loadAvailableDoctors(); // Refresh the list
        setIsLoading(false);
        return;
      }
      
      // Initiate the call
      await callDoctor(doctor);
      setIsExpanded(false);
    } catch (error) {
      console.error('Error initiating call:', error);
      alert('Failed to connect with the doctor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // If no doctors are available, don't show the button
  if (availableDoctors.length === 0 && !isLoading) {
    return null;
  }
  
  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end">
      {/* Expanded panel showing available doctors */}
      {isExpanded && (
        <div 
          className="mb-4 p-3 rounded-xl shadow-lg animate-bounce-in transition-all duration-300 max-h-60 overflow-y-auto"
          style={{ 
            backgroundColor: isDarkMode ? colors.cardBg : 'white',
            boxShadow: `0 10px 25px -5px ${colors.primary}40`,
            width: 220,
            maxWidth: '90vw'
          }}
        >
          <div className="mb-2 flex justify-between items-center">
            <h3 className="text-sm font-bold" style={{ color: colors.textPrimary }}>
              Available Doctors
            </h3>
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-full"
              style={{ backgroundColor: `${colors.primary}20` }}
            >
              <X size={14} style={{ color: colors.textSecondary }} />
            </button>
          </div>
          
          {isLoading ? (
            <div className="py-4 flex justify-center">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" 
                   style={{ borderColor: `${colors.primary}40`, borderTopColor: 'transparent' }}></div>
            </div>
          ) : availableDoctors.length > 0 ? (
            <div className="space-y-2">
              {availableDoctors.map(doctor => (
                <button
                  key={doctor.id}
                  className="w-full p-2 rounded-lg flex items-center transition-all duration-300 hover:shadow-md"
                  style={{ 
                    backgroundColor: isDarkMode ? `${colors.primary}15` : `${colors.primary}10`,
                    boxShadow: selectedDoctor?.id === doctor.id ? `0 0 0 2px ${colors.primary}` : 'none'
                  }}
                  onClick={() => handleCallDoctor(doctor)}
                  disabled={isLoading}
                >
                  <div className="w-8 h-8 rounded-full mr-2 relative overflow-hidden flex-shrink-0">
                    <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2" 
                        style={{ 
                          backgroundColor: colors.success,
                          borderColor: isDarkMode ? colors.cardBg : 'white'
                        }}></div>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>
                      {doctor.name}
                    </div>
                    <div className="text-xs truncate" style={{ color: colors.textSecondary }}>
                      {doctor.specialty}
                    </div>
                  </div>
                  <div className="ml-1 p-1 rounded-full" style={{ backgroundColor: colors.success + '20' }}>
                    <Phone size={14} style={{ color: colors.success }} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-3 text-center">
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                No doctors available right now
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Main floating call button */}
      <button
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg relative transition-all duration-500 transform hover:scale-105"
        style={{ 
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
          boxShadow: `0 10px 25px -5px ${colors.primary}80`
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown size={24} color="white" />
        ) : (
          <div className="flex flex-col items-center">
            <Phone size={20} color="white" />
            <div className="text-xs text-white mt-1 font-medium">Call</div>
          </div>
        )}
        
        {availableDoctors.length > 0 && !isExpanded && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
            <span className="text-xs text-white font-bold">{availableDoctors.length}</span>
          </div>
        )}
      </button>
      
      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.8); opacity: 0; }
          70% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default FloatingCallButton;