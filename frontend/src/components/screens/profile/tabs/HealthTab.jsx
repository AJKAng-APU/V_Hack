import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import ProfileInputField from '../components/ProfileInputField';

const HealthTab = ({ 
  userData, 
  setUserData, 
  editMode, 
  colors,
  addCondition,
  removeCondition,
  addAllergy,
  removeAllergy,
  isLoading 
}) => {
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  const handleInputChange = (e) => {
    if (editMode) {
      setUserData({ ...userData, [e.target.name]: e.target.value });
    }
  };

  const handleAddCondition = () => {
    if (newCondition.trim()) {
      addCondition(newCondition.trim());
      setNewCondition('');
    }
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      addAllergy(newAllergy.trim());
      setNewAllergy('');
    }
  };

  return (
    <div className="space-y-8 animate-fadein">
      <div>
        <h3 className="font-bold text-lg mb-5 text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          Body Metrics
        </h3>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <ProfileInputField 
            type="number"
            name="height"
            value={userData.height}
            label="Height (cm)"
            placeholder="How far your head is from the ground"
            disabled={!editMode}
            editMode={editMode}
            onChange={handleInputChange}
            colors={colors}
          />
          <ProfileInputField 
            type="number"
            name="weight"
            value={userData.weight}
            label="Weight (kg)"
            placeholder="Earth's gravitational pull on you"
            disabled={!editMode}
            editMode={editMode}
            onChange={handleInputChange}
            colors={colors}
          />
        </div>
        
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-md mb-8">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mr-3 shimmer">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-white">Health Stats</h4>
              <p className="text-xs text-blue-200">BMI and other numbers to obsess over</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="p-3 rounded-lg bg-white bg-opacity-5 backdrop-blur-md">
              <div className="text-2xl font-bold text-white mb-1">
                {userData.height && userData.weight 
                  ? (parseInt(userData.weight) / Math.pow(parseInt(userData.height)/100, 2)).toFixed(1) 
                  : "-"}
              </div>
              <div className="text-xs text-blue-200">BMI Index</div>
              <div className="text-xs mt-1 py-0.5 px-2 rounded-full bg-green-500 bg-opacity-20 text-green-400 inline-block">
                {userData.height && userData.weight 
                  ? getBmiCategory(parseInt(userData.weight) / Math.pow(parseInt(userData.height)/100, 2))
                  : "Not calculated"}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white bg-opacity-5 backdrop-blur-md">
              <div className="text-2xl font-bold text-white mb-1">
                {userData.height && userData.weight 
                  ? calculateDailyCalories(userData) 
                  : "-"}
              </div>
              <div className="text-xs text-blue-200">Daily Calories</div>
              <div className="text-xs mt-1 py-0.5 px-2 rounded-full bg-blue-500 bg-opacity-20 text-blue-400 inline-block">
                Estimate
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white bg-opacity-5 backdrop-blur-md">
              <div className="text-2xl font-bold text-white mb-1">{userData.goalSleep}</div>
              <div className="text-xs text-blue-200">Sleep Goal</div>
              <div className="text-xs mt-1 py-0.5 px-2 rounded-full bg-purple-500 bg-opacity-20 text-purple-400 inline-block">
                {userData.goalSleep >= 8 ? "Excellent" : userData.goalSleep >= 7 ? "Good" : "Needs work"}
              </div>
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-white bg-opacity-5 backdrop-blur-sm border border-white border-opacity-5">
            <p className="text-xs text-blue-200 italic">
              "According to these calculations, you should live to approximately 110 years old, assuming you don't read the comments section on news articles."
            </p>
          </div>
        </div>
        
        {/* Medical Conditions with add functionality */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-sm text-white">Medical Conditions</h4>
            
            {editMode && (
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  placeholder="New condition"
                  className="text-xs px-2 py-1 rounded-lg bg-blue-900/30 text-white border border-blue-700/30 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button 
                  onClick={handleAddCondition}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors duration-300 flex items-center"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
            
            {!editMode && (
              <div className="text-xs text-blue-200 flex items-center">
                <svg className="w-4 h-4 mr-1 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {userData.conditions.length} conditions recorded
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {userData.conditions.map((condition, index) => (
              <div 
                key={index}
                className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center shimmer transition-all duration-300 hover:shadow-lg hover:scale-105 tooltip-container"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.3), rgba(8, 145, 178, 0.3))',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }}
              >
                <span className="tooltip">Tap to edit</span>
                {condition}
                {editMode && (
                  <button 
                    className="ml-2 w-4 h-4 rounded-full bg-white bg-opacity-10 flex items-center justify-center hover:bg-opacity-20 transition-colors duration-300"
                    onClick={() => removeCondition(condition)}
                  >
                    <X size={10} className="text-white" />
                  </button>
                )}
              </div>
            ))}
            {userData.conditions.length === 0 && (
              <div className="text-sm text-blue-200 italic">
                No conditions recorded. {editMode ? "Add some above." : ""}
              </div>
            )}
            {editMode && (
              <button 
                className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center transition-all duration-300 hover:bg-blue-900/30"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }}
                onClick={() => setNewCondition("Type here...")}
              >
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add condition
              </button>
            )}
          </div>
        </div>
        
        {/* Allergies with add functionality */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-sm text-white">Allergies</h4>
            
            {editMode && (
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="New allergy"
                  className="text-xs px-2 py-1 rounded-lg bg-red-900/30 text-white border border-red-700/30 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <button 
                  onClick={handleAddAllergy}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors duration-300 flex items-center"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
            
            {!editMode && (
              <div className="text-xs text-blue-200 flex items-center">
                <svg className="w-4 h-4 mr-1 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                {userData.allergies.length} allergies recorded
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {userData.allergies.map((allergy, index) => (
              <div 
                key={index}
                className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center shimmer transition-all duration-300 hover:shadow-lg hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.3), rgba(248, 113, 113, 0.3))',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }}
              >
                {allergy}
                {editMode && (
                  <button 
                    className="ml-2 w-4 h-4 rounded-full bg-white bg-opacity-10 flex items-center justify-center hover:bg-opacity-20 transition-colors duration-300"
                    onClick={() => removeAllergy(allergy)}
                  >
                    <X size={10} className="text-white" />
                  </button>
                )}
              </div>
            ))}
            {userData.allergies.length === 0 && (
              <div className="text-sm text-blue-200 italic">
                No allergies recorded. {editMode ? "Add some above." : ""}
              </div>
            )}
            {editMode && (
              <button 
                className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center transition-all duration-300 hover:bg-red-900/30"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white'
                }}
                onClick={() => setNewAllergy("Type here...")}
              >
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add allergy
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="font-bold text-lg mb-5 text-white flex items-center">
          <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          Health Goals <span className="ml-2 text-sm font-normal text-blue-300">(a.k.a. wishful thinking)</span>
        </h3>
        
        <div className="space-y-6">
          {/* Daily Steps Goal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-sm font-medium text-white">Daily Steps</label>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                  <span className="text-xs text-blue-300">12% above average couch potato</span>
                </div>
              </div>
              <span className="text-sm font-bold text-white">{userData.goalSteps.toLocaleString()} steps</span>
            </div>
            <div className="relative h-2 bg-blue-900 bg-opacity-40 rounded-full overflow-hidden">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shimmer"
                style={{ width: `${(userData.goalSteps / 20000) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-blue-400">
              <span>2,000 <span className="text-blue-300">(Netflix to fridge)</span></span>
              <span>10,000 <span className="text-blue-300">(Doctor's happy)</span></span>
              <span>20,000 <span className="text-blue-300">(Show-off)</span></span>
            </div>
            
            {editMode && (
              <input
                type="range"
                min="2000"
                max="20000"
                step="1000"
                value={userData.goalSteps}
                onChange={(e) => setUserData({...userData, goalSteps: parseInt(e.target.value)})}
                className="w-full mt-2 accent-blue-500"
              />
            )}
          </div>
          
          {/* Sleep Goal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-sm font-medium text-white">Sleep Goal</label>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                  <span className="text-xs text-blue-300">Dreaming beats reality anyway</span>
                </div>
              </div>
              <span className="text-sm font-bold text-white">{userData.goalSleep} hours</span>
            </div>
            <div className="relative h-2 bg-blue-900 bg-opacity-40 rounded-full overflow-hidden">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-purple-500 to-fuchsia-400 rounded-full shimmer"
                style={{ width: `${(userData.goalSleep / 12) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-blue-400">
              <span>5h <span className="text-blue-300">(Zombie)</span></span>
              <span>8h <span className="text-blue-300">(Perfect)</span></span>
              <span>12h <span className="text-blue-300">(Teenager)</span></span>
            </div>
            
            {editMode && (
              <input
                type="range"
                min="5"
                max="12"
                step="0.5"
                value={userData.goalSleep}
                onChange={(e) => setUserData({...userData, goalSleep: parseFloat(e.target.value)})}
                className="w-full mt-2 accent-purple-500"
              />
            )}
          </div>
          
          {/* Water Intake Goal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-sm font-medium text-white">Water Intake</label>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <span className="text-xs text-blue-300">For hydration (or frequent bathroom trips)</span>
                </div>
              </div>
              <span className="text-sm font-bold text-white">{userData.goalWater} ml</span>
            </div>
            <div className="relative h-2 bg-blue-900 bg-opacity-40 rounded-full overflow-hidden">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full shimmer"
                style={{ width: `${(userData.goalWater / 4000) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-blue-400">
              <span>1,000 ml <span className="text-blue-300">(Barely alive)</span></span>
              <span>2,500 ml <span className="text-blue-300">(Adequate)</span></span>
              <span>4,000 ml <span className="text-blue-300">(Fish)</span></span>
            </div>
            
            {editMode && (
              <input
                type="range"
                min="1000"
                max="4000"
                step="100"
                value={userData.goalWater}
                onChange={(e) => setUserData({...userData, goalWater: parseInt(e.target.value)})}
                className="w-full mt-2 accent-cyan-500"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to determine BMI category
function getBmiCategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

// Helper function to estimate daily calories
function calculateDailyCalories(userData) {
  // Basic BMR calculation using weight in kg
  if (!userData.weight) return "-";
  
  // Very simple estimation - in a real app, would use Harris-Benedict or Mifflin-St Jeor equations
  const weight = parseInt(userData.weight);
  // Assuming moderate activity and adult
  return Math.round(weight * 28);
}

export default HealthTab;