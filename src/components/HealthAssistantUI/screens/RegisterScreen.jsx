import React, { useState, useEffect } from "react";

const RegisterScreen = ({ colors, setActiveScreen, setIsAuthenticated }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      birthdate: '',
      gender: '',
      height: '',
      weight: '',
      conditions: []
    });
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [passwordMatch, setPasswordMatch] = useState(true);
    
    // Floating effect with mouse position
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    
    useEffect(() => {
      const handleMouseMove = (e) => {
        const { clientX, clientY } = e;
        const x = (clientX / window.innerWidth) - 0.5;
        const y = (clientY / window.innerHeight) - 0.5;
        setMousePosition({ x, y });
      };
      
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);
    
    // Password validation
    useEffect(() => {
      if (formData.confirmPassword) {
        setPasswordMatch(formData.password === formData.confirmPassword);
      } else {
        setPasswordMatch(true);
      }
    }, [formData.password, formData.confirmPassword]);
    
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (step < 3) {
          setStep(step + 1);
          return;
        }
        
        setIsLoading(true);
        
        // Simulate registration delay
        setTimeout(() => {
          // Set local storage for persistence
          localStorage.setItem('healthsync_auth', 'true');
          
          // Update state and redirect
          setIsAuthenticated(true);
          setActiveScreen('dashboard');
          setIsLoading(false);
        }, 1500);
      };
    
    const renderStepIndicator = () => {
      return (
        <div className="flex items-center justify-center space-x-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="relative">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 transform z-10
                  ${step === s ? 'scale-110' : (step > s ? 'scale-100' : 'scale-90')}
                `}
                style={{ 
                  background: step >= s ? `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: step >= s ? `0 0 20px ${colors.primary}60` : 'none',
                  opacity: step === s ? 1 : (step > s ? 0.8 : 0.4)
                }}
              >
                {step > s ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <span className="text-sm font-bold" style={{ color: step === s ? 'white' : 'rgba(255, 255, 255, 0.7)' }}>{s}</span>
                )}
                {step === s && (
                  <div className="absolute -inset-2 rounded-full animate-pulse opacity-40 -z-10"
                       style={{ background: `radial-gradient(circle, ${colors.accent}, transparent 70%)` }}></div>
                )}
              </div>
              {s < 3 && (
                <div className="absolute top-1/2 left-full w-8 h-0.5 -translate-y-1/2"
                     style={{ 
                       background: step > s ? `linear-gradient(to right, ${colors.accent}, ${colors.primary}30)` : 'rgba(255, 255, 255, 0.1)',
                       transformOrigin: 'left'
                    }}></div>
              )}
            </div>
          ))}
        </div>
      );
    };
    
    const renderStep = () => {
      const renderInput = (name, label, type = 'text', placeholder = '', options = null) => {
        const isFocused = focusedField === name;
        
        return (
          <div className="space-y-1">
            <label 
              className={`block text-sm font-medium transition-all duration-300 ${isFocused ? 'text-blue-400' : ''}`}
              style={{ color: isFocused ? colors.accent : 'rgba(255, 255, 255, 0.8)' }}
            >
              {label}
            </label>
            <div 
              className={`relative rounded-xl overflow-hidden transition-all duration-300 ${isFocused ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-sm'}`}
              style={{ 
                boxShadow: isFocused ? `0 0 15px ${colors.primary}40` : `0 4px 6px -1px rgba(0, 0, 0, 0.1)` 
              }}
            >
              {type === 'select' ? (
                <select
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  onFocus={() => setFocusedField(name)}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-4 bg-white bg-opacity-10 backdrop-blur-md border-none focus:outline-none text-white appearance-none"
                  required
                >
                  {options.map(option => (
                    <option key={option.value} value={option.value} className="bg-blue-900 text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  onFocus={() => setFocusedField(name)}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-4 bg-white bg-opacity-10 backdrop-blur-md border-none focus:outline-none text-white"
                  placeholder={placeholder}
                  required
                />
              )}
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600/10 to-cyan-400/10"></div>
              
              {/* Select dropdown icon */}
              {type === 'select' && (
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              )}
              
              {/* Password match indicator */}
              {name === 'confirmPassword' && formData.confirmPassword && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {passwordMatch ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      };
      
      switch(step) {
        case 1:
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-100 to-cyan-100 bg-clip-text text-transparent mb-6">Create your account</h2>
              
              <div className="space-y-4">
                {renderInput('name', 'Full Name', 'text', 'Jane Smith')}
                {renderInput('email', 'Email', 'email', 'jane@example.com')}
                {renderInput('password', 'Password', 'password', '••••••••')}
                {renderInput('confirmPassword', 'Confirm Password', 'password', '••••••••')}
                
                {!passwordMatch && (
                  <p className="text-xs text-red-400 animate-pulse">Passwords do not match</p>
                )}
              </div>
              
              <div className="p-3 rounded-xl bg-blue-900 bg-opacity-20 backdrop-blur-md">
                <p className="text-xs text-blue-200">
                  Password should be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.
                </p>
              </div>
            </div>
          );
        
        case 2:
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-100 to-cyan-100 bg-clip-text text-transparent mb-6">Your Physical Profile</h2>
              
              <div className="space-y-4">
                {renderInput('birthdate', 'Date of Birth', 'date')}
                {renderInput('gender', 'Gender', 'select', '', [
                  { value: '', label: 'Select Gender' },
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'non-binary', label: 'Non-binary' },
                  { value: 'prefer-not-to-say', label: 'Prefer not to say' }
                ])}
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {renderInput('height', 'Height (cm)', 'number', '175')}
                  {renderInput('weight', 'Weight (kg)', 'number', '70')}
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-blue-600 bg-opacity-10 backdrop-blur-md border border-blue-500 border-opacity-20">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </div>
                  <p className="ml-3 text-xs text-blue-200">
                    This information helps us personalize your health recommendations and track your progress accurately.
                  </p>
                </div>
              </div>
            </div>
          );
        
        case 3:
          const conditions = ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'None'];
          
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-100 to-cyan-100 bg-clip-text text-transparent mb-6">Health Information</h2>
              
              <div className="space-y-4">
                <label className="block text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Do you have any pre-existing medical conditions?
                </label>
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {conditions.map((condition) => (
                    <label 
                      key={condition} 
                      className={`
                        flex items-center p-3 rounded-xl transition-all duration-300 cursor-pointer
                        ${formData.conditions.includes(condition) 
                          ? 'bg-blue-600 bg-opacity-20 ring-2 ring-blue-500 ring-opacity-60' 
                          : 'bg-white bg-opacity-5 hover:bg-opacity-10'}
                      `}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={formData.conditions.includes(condition)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (condition === 'None') {
                              setFormData({ ...formData, conditions: ['None'] });
                            } else {
                              const newConditions = formData.conditions.filter(c => c !== 'None');
                              setFormData({ ...formData, conditions: [...newConditions, condition] });
                            }
                          } else {
                            setFormData({ ...formData, conditions: formData.conditions.filter(c => c !== condition) });
                          }
                        }}
                      />
                      <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 transition-all duration-300 ${
                        formData.conditions.includes(condition) ? 'bg-blue-500' : 'bg-white bg-opacity-20'
                      }`}>
                        {formData.conditions.includes(condition) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-white">{condition}</span>
                    </label>
                  ))}
                </div>
                
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-md">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="terms"
                      className="sr-only"
                      required
                    />
                    <label htmlFor="terms" className="flex items-start cursor-pointer group">
                      <div className="w-5 h-5 rounded flex items-center justify-center mr-3 transition-all duration-300 bg-white bg-opacity-20 group-hover:bg-opacity-30">
                        <svg className="w-0 h-0 group-hover:w-3 group-hover:h-3 transition-all duration-300" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span className="text-sm text-blue-100">
                        I agree to the{' '}
                        <button type="button" className="font-medium text-cyan-300 hover:text-cyan-200 transition-colors duration-300 underline underline-offset-2">
                          Terms of Service
                        </button>{' '}
                        and{' '}
                        <button type="button" className="font-medium text-cyan-300 hover:text-cyan-200 transition-colors duration-300 underline underline-offset-2">
                          Privacy Policy
                        </button>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          );
        
        default:
          return null;
      }
    };
    
    // Animation classes for step transitions
    const getStepClasses = (stepNumber) => {
      if (stepNumber === step) {
        return 'opacity-100 transform translate-x-0 transition-all duration-700 ease-out';
      } else if (stepNumber < step) {
        return 'opacity-0 absolute transform -translate-x-full transition-all duration-700 ease-in';
      } else {
        return 'opacity-0 absolute transform translate-x-full transition-all duration-700 ease-in';
      }
    };
    
    return (
      <div className="p-6 pb-8 h-full flex flex-col overflow-hidden relative"
           style={{
             background: `radial-gradient(circle at 70% 30%, ${colors.primary}10, transparent 50%),
                         radial-gradient(circle at 30% 70%, ${colors.accent}10, transparent 50%)`,
           }}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full opacity-10"
              style={{
                width: Math.random() * 100 + 50 + 'px',
                height: Math.random() * 100 + 50 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                background: `linear-gradient(135deg, ${colors.primary}80, ${colors.accent}60)`,
                filter: 'blur(30px)',
                animation: `float ${Math.random() * 8 + 15}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
                transform: `translate3d(${mousePosition.x * -20}px, ${mousePosition.y * -20}px, 0)`
              }}
            />
          ))}
        </div>
        
        <div className="z-10">
          <div className="flex items-center mb-8">
            <button 
              onClick={() => step > 1 ? setStep(step - 1) : setActiveScreen('signin')}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white hover:bg-opacity-10 text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 flex justify-center">
              <h1 className="text-xl font-bold text-white">Create Account</h1>
            </div>
            <div className="w-10 h-10"></div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col relative z-10">
          {renderStepIndicator()}
          
          <div className="relative flex-1 max-w-md mx-auto w-full">
            <div className="absolute -inset-6 rounded-3xl opacity-20 bg-blue-500 blur-xl"></div>
            <div className="relative p-6 rounded-2xl backdrop-blur-md border border-white border-opacity-20 h-full"
                 style={{ 
                   background: 'rgba(13, 22, 47, 0.7)', 
                   boxShadow: `
                     0 10px 25px -5px rgba(0, 0, 0, 0.2),
                     0 0 10px ${colors.primary}30
                   `
                 }}>
              <form onSubmit={handleSubmit} className="h-full flex flex-col">
                <div className="flex-1">
                  <div className={getStepClasses(1)}>
                    {step === 1 && renderStep()}
                  </div>
                  <div className={getStepClasses(2)}>
                    {step === 2 && renderStep()}
                  </div>
                  <div className={getStepClasses(3)}>
                    {step === 3 && renderStep()}
                  </div>
                </div>
                
                <div className="mt-8">
                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl text-white font-medium transition-all duration-500 hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center overflow-hidden relative"
                    style={{ 
                      background: `linear-gradient(45deg, ${colors.primary}, ${colors.accent}, ${colors.accentAlt}, ${colors.primary})`,
                      backgroundSize: '300% 300%',
                      animation: 'gradientShift 5s ease infinite',
                      boxShadow: `0 10px 25px -5px ${colors.primary}60, 0 0 15px ${colors.neonAccent}30`
                    }}
                    disabled={isLoading || (step === 1 && !passwordMatch)}
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                         style={{ 
                           transform: 'translateX(-100%)',
                           animation: 'shimmerEffect 2.5s infinite'
                         }}></div>
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>Creating account...</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span>{step < 3 ? "Continue" : "Create Account"}</span>
                        {step < 3 && (
                          <svg className="ml-2 w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                          </svg>
                        )}
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {step === 1 && (
          <div className="mt-8 text-center z-10">
            <p className="text-sm text-white text-opacity-80">
              Already have an account?{' '}
              <button 
                onClick={() => setActiveScreen('signin')}
                className="font-medium transition-all duration-300 hover:text-blue-300 relative"
                style={{ color: colors.accent }}
              >
                Sign in
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 transform scale-x-0 origin-left transition-transform duration-300 hover:scale-x-100"></span>
              </button>
            </p>
          </div>
        )}
        
        <style jsx>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50% }
            50% { background-position: 100% 50% }
            100% { background-position: 0% 50% }
          }
          @keyframes shimmerEffect {
            100% { transform: translateX(100%); }
          }
          @keyframes float {
            0% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-20px) translateX(10px); }
            100% { transform: translateY(0px) translateX(0px); }
          }
          input::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }
          input, select {
            color: white;
          }
        `}</style>
      </div>
    );
  };

  export default RegisterScreen;