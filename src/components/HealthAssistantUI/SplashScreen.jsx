import React from 'react';

// Updated splash screen with custom logo
const SplashScreen = ({ colors }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center z-50" 
       style={{ background: `linear-gradient(135deg, ${colors.primaryDark}, ${colors.accentAlt})` }}>
    {/* Animated particles in background */}
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div 
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: Math.random() * 20 + 5 + 'px',
            height: Math.random() * 20 + 5 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            background: colors.primaryGlow,
            boxShadow: `0 0 20px ${colors.primaryGlow}`,
            animation: `float ${Math.random() * 10 + 10}s linear infinite`,
            transform: `translateY(${Math.random() * 100}px)`,
            animationDelay: `${Math.random() * 5}s`
          }}
        />
      ))}
    </div>
    
    <div className="relative">
      <div className="absolute -inset-10 rounded-full opacity-70 animate-pulse"
           style={{ background: `radial-gradient(circle, ${colors.neonAccent}, transparent 70%)` }}></div>
      <div className="absolute -inset-16 rounded-full opacity-20"
           style={{ 
             background: `radial-gradient(circle, ${colors.primaryGlow}, transparent 70%)`,
             animation: 'pulse 2s ease-in-out infinite alternate'
           }}></div>
      
      {/* Logo image replaces the Sparkles icon */}
      <div className="relative flex items-center justify-center w-28 h-28 rounded-full overflow-hidden" 
           style={{ 
             background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`,
             boxShadow: `0 0 30px ${colors.primary}80`
           }}>
        {/* Import the logo correctly in your component or use from public folder */}
        <img 
          src="/logo.jpg" 
          alt="Logo" 
          className="w-24 h-24 object-cover rounded-full animate-pulse"
        />
      </div>
    </div>
    <h1 className="mt-8 text-4xl font-bold text-white tracking-wide">HealthSync</h1>
    <p className="mt-3 text-lg text-white text-opacity-80">Your AI Health Assistant</p>
    
    {/* Loading indicator */}
    <div className="mt-10 w-32 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden">
      <div className="h-full bg-white rounded-full" 
           style={{ 
             width: '30%', 
             animation: 'loading 1.5s ease-in-out infinite',
             boxShadow: `0 0 10px ${colors.primaryGlow}`
           }}></div>
    </div>
    
    <style jsx>{`
      @keyframes pulse {
        0% { transform: scale(1); opacity: 0.2; }
        100% { transform: scale(1.1); opacity: 0.3; }
      }
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-100px); }
        100% { transform: translateY(-200px) }
      }
      @keyframes loading {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(50%); }
        100% { transform: translateX(200%); }
      }
    `}</style>
  </div>
);

export default SplashScreen;