import React from 'react';
import DoctorCard from './DoctorCard';
import { useTheme } from '../../ThemeContext';

const DoctorsTeam = ({ 
  headerVisible, 
  doctors, 
  colors, 
  connectingDoctor, 
  handleConnectDoctor,
  setSelectedDoctor,
  setSchedulingDoctor,
  setShowMessageDialog,
  isDarkMode
}) => {
  return (
    <div className={`mb-8 transition-all duration-500 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '300ms' }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg dark-mode-transition" style={{ color: colors.textPrimary }}>Your Care Team</h3>
        <button className="text-sm font-medium px-3 py-1 rounded-full transition-all duration-300 hover:shadow-md dark-mode-transition" 
                style={{ 
                  color: colors.primary, 
                  backgroundColor: isDarkMode ? `${colors.primary}20` : `${colors.primary}10` 
                }}>
          View all
        </button>
      </div>
      
      {doctors.length > 0 ? (
        <div className="flex overflow-x-auto pb-4 -mx-2 px-2 space-x-4 hide-scrollbar">
          {doctors.map(doctor => (
            <div key={doctor.id}>
              <DoctorCard
                name={doctor.name}
                specialty={doctor.specialty}
                image={doctor.image}
                availability={doctor.availability}
                rating={doctor.rating}
                colors={colors}
                isConnecting={connectingDoctor?.id === doctor.id}
                onConnectClick={async () => {
                  const isAvailableNow = doctor.availability.includes('Available') && !doctor.availability.includes('in');
                  
                  if (!isAvailableNow) {
                    setSelectedDoctor(doctor);
                    setSchedulingDoctor(doctor);
                    setShowMessageDialog(true);
                    return;
                  }
                  
                  await handleConnectDoctor(doctor);
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white shadow-lg text-center dark-mode-transition"
             style={{ 
               backgroundColor: isDarkMode ? colors.cardBg : 'white',
               boxShadow: `0 10px 15px -3px ${colors.primary}20`
             }}>
          <p className="dark-mode-transition" style={{ color: colors.textSecondary }}>No doctors match your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default DoctorsTeam;