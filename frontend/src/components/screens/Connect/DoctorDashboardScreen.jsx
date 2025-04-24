import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Bell, ToggleLeft, ToggleRight } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { useAuth } from '../../AuthProvider';
import supabase from '../../supabaseClient';
import webRTCService from '../../services/WebRTCService';

const DoctorDashboardScreen = ({ colors, setActiveScreen }) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    completedCalls: 0,
    averageRating: 4.8,
    onlineStatus: 'Connected'
  });
  
  // Get doctor availability from Supabase
  useEffect(() => {
    if (user?.doctorId) {
      const fetchDoctorAvailability = async () => {
        try {
          const { data, error } = await supabase
            .from('doctors')
            .select('availability')
            .eq('doctor_id', user.doctorId)
            .single();
            
          if (error) throw error;
          
          setIsAvailable(data.availability);
        } catch (error) {
          console.error('Error fetching doctor availability:', error);
        }
      };
      
      fetchDoctorAvailability();
    }
  }, [user]);
  
  // Mock data for appointments
  useEffect(() => {
    // Simulate fetching appointments
    const mockAppointments = [
      { 
        id: 1, 
        patientName: 'Sarah Johnson', 
        time: '10:30 AM', 
        date: new Date().toLocaleDateString(), 
        reason: 'Annual checkup',
        completed: false
      },
      { 
        id: 2, 
        patientName: 'Mike Rodriguez', 
        time: '2:15 PM', 
        date: new Date().toLocaleDateString(), 
        reason: 'Follow-up on medication',
        completed: false 
      },
      { 
        id: 3, 
        patientName: 'Emma Wilson', 
        time: '4:45 PM', 
        date: new Date().toLocaleDateString(), 
        reason: 'Discuss lab results',
        completed: false 
      }
    ];
    
    setAppointments(mockAppointments);
    setStats(prev => ({ ...prev, todayAppointments: mockAppointments.length }));
    
    // Mock patients data
    const mockPatients = [
      { id: 1, name: 'Sarah Johnson', lastVisit: '3 days ago', condition: 'Hypertension' },
      { id: 2, name: 'Mike Rodriguez', lastVisit: '1 week ago', condition: 'Diabetes Type 2' },
      { id: 3, name: 'Emma Wilson', lastVisit: 'Today', condition: 'Pregnancy' },
      { id: 4, name: 'John Smith', lastVisit: '2 weeks ago', condition: 'Anxiety' }
    ];
    
    setPatients(mockPatients);
  }, []);
  
  // Update doctor availability in Supabase
  const toggleAvailability = async () => {
    if (!user?.doctorId) return;
    
    try {
      const newAvailability = !isAvailable;
      
      // Update in Supabase
      const { error } = await supabase
        .from('doctors')
        .update({ availability: newAvailability })
        .eq('doctor_id', user.doctorId);
        
      if (error) throw error;
      
      setIsAvailable(newAvailability);
      
      // Update socket registration if needed
      if (webRTCService && webRTCService.signalingService) {
        const doctorId = `doctor-${user.doctorId}`;
        
        if (newAvailability) {
          // Register with socket server
          webRTCService.signalingService.send('register', doctorId);
          console.log(`Doctor ${doctorId} set as available and registered with socket`);
        }
      }
    } catch (error) {
      console.error('Error updating doctor availability:', error);
    }
  };

  return (
    <div className="p-6 dark-mode-transition" style={{ backgroundColor: isDarkMode ? colors.background : 'transparent' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold"
              style={{ 
                background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textFillColor: 'transparent'
              }}>Doctor Dashboard</h1>
          <p className="text-sm dark-mode-transition" style={{ color: colors.textSecondary }}>
            Welcome back, {user?.name || 'Doctor'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            className="relative px-4 py-2 rounded-lg text-white font-medium shadow-lg transition-all duration-300 flex items-center"
            style={{ 
              backgroundColor: isAvailable ? colors.success : colors.danger,
              boxShadow: `0 4px 12px -2px ${isAvailable ? colors.success : colors.danger}40`
            }}
            onClick={toggleAvailability}
          >
            {isAvailable ? (
              <>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                <span>Available</span>
                <ToggleRight className="ml-2" size={18} />
              </>
            ) : (
              <>
                <span>Unavailable</span>
                <ToggleLeft className="ml-2" size={18} />
              </>
            )}
          </button>
          
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center relative dark-mode-transition"
               style={{ backgroundColor: isDarkMode ? colors.darkBg : colors.primary + '20' }}>
            <Bell size={18} style={{ color: colors.primary }} />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              3
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { 
            label: "Today's Appointments", 
            value: stats.todayAppointments, 
            icon: Calendar, 
            color: colors.primary 
          },
          { 
            label: "Completed Calls", 
            value: stats.completedCalls, 
            icon: Clock,
            color: colors.success 
          },
          { 
            label: "Patient Rating", 
            value: stats.averageRating, 
            icon: Users,
            color: colors.accent 
          },
          { 
            label: "Status", 
            value: stats.onlineStatus, 
            icon: Bell,
            color: colors.primary 
          }
        ].map((stat, index) => (
          <div 
            key={index} 
            className="p-4 rounded-xl shadow-md flex flex-col items-center justify-center dark-mode-transition"
            style={{ 
              backgroundColor: isDarkMode ? colors.cardBg : 'white',
              boxShadow: `0 10px 15px -3px ${colors.primary}20`
            }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: stat.color + '20' }}
            >
              <stat.icon size={20} style={{ color: stat.color }} />
            </div>
            <span className="text-sm font-medium dark-mode-transition" style={{ color: colors.textSecondary }}>
              {stat.label}
            </span>
            <span className="text-xl font-bold dark-mode-transition" style={{ color: colors.textPrimary }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
      
      {/* Today's Schedule */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 dark-mode-transition" style={{ color: colors.textPrimary }}>
          Today's Schedule
        </h2>
        <div className="bg-white rounded-xl shadow-md p-4 dark-mode-transition"
             style={{ 
               backgroundColor: isDarkMode ? colors.cardBg : 'white',
               boxShadow: `0 10px 15px -3px ${colors.primary}20`
             }}>
          {appointments.length === 0 ? (
            <div className="text-center py-8 dark-mode-transition" style={{ color: colors.textSecondary }}>
              No appointments scheduled for today
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark-mode-transition" style={{ borderColor: isDarkMode ? colors.darkBg : 'rgba(239, 246, 255, 0.6)' }}>
              {appointments.map((appointment) => (
                <div key={appointment.id} className="py-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 dark-mode-transition"
                      style={{ backgroundColor: isDarkMode ? colors.darkBg : colors.primary + '20' }}
                    >
                      <Clock size={16} style={{ color: colors.primary }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>
                        {appointment.patientName}
                      </h3>
                      <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                        {appointment.time} - {appointment.reason}
                      </p>
                    </div>
                  </div>
                  <button 
                    className="px-3 py-1 rounded-lg text-white text-sm transition-all duration-300 hover:shadow-md"
                    style={{ 
                      backgroundColor: colors.primary,
                      boxShadow: `0 4px 12px -2px ${colors.primary}40`
                    }}
                  >
                    Video Call
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Patients */}
      <div>
        <h2 className="text-xl font-bold mb-4 dark-mode-transition" style={{ color: colors.textPrimary }}>
          Recent Patients
        </h2>
        <div className="bg-white rounded-xl shadow-md p-4 dark-mode-transition"
             style={{ 
               backgroundColor: isDarkMode ? colors.cardBg : 'white',
               boxShadow: `0 10px 15px -3px ${colors.primary}20`
             }}>
          {patients.length === 0 ? (
            <div className="text-center py-8 dark-mode-transition" style={{ color: colors.textSecondary }}>
              No recent patients
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark-mode-transition" style={{ borderColor: isDarkMode ? colors.darkBg : 'rgba(239, 246, 255, 0.6)' }}>
              {patients.map((patient) => (
                <div key={patient.id} className="py-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 dark-mode-transition"
                      style={{ backgroundColor: isDarkMode ? colors.darkBg : colors.accent + '20' }}
                    >
                      <Users size={16} style={{ color: colors.accent }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>
                        {patient.name}
                      </h3>
                      <p className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>
                        Last visit: {patient.lastVisit} - {patient.condition}
                      </p>
                    </div>
                  </div>
                  <button 
                    className="px-3 py-1 rounded-lg text-sm transition-all duration-300 hover:shadow-md dark-mode-transition"
                    style={{ 
                      color: colors.primary,
                      border: `1px solid ${colors.primary}40`,
                      backgroundColor: isDarkMode ? colors.darkBg : 'white'
                    }}
                  >
                    View Records
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboardScreen;