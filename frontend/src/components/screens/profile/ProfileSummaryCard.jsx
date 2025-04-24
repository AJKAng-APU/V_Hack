import React, { useState, useRef } from 'react';
import { Camera, Loader } from 'lucide-react';
import supabase from '../../supabaseClient';
import { useAuth } from '../../AuthProvider';

const ProfileSummaryCard = ({ userData, editMode, setEditMode, handleSave, mousePosition, colors }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const { user, updateUserProfile } = useAuth();

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const fileExt = file.name.split('.').pop();
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif'];
    const isValidFileType = allowedExts.includes(fileExt.toLowerCase());

    if (!isValidFileType) {
      setUploadError('Please upload an image file (jpg, jpeg, png, gif)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 2MB');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Create a unique file name to prevent collisions
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
      
      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update the user's avatar_url in the database
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update the user context
      if (updateUserProfile) {
        await updateUserProfile({ avatar: publicUrl });
      }

      // Update the local state for immediate UI update
      userData.avatar = publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-8 p-6 rounded-2xl relative overflow-hidden transform hover:scale-102 transition-all duration-500 dark-mode-transition" 
         style={{ 
           background: `linear-gradient(135deg, rgba(30, 64, 175, 0.8), rgba(8, 145, 178, 0.8))`,
           backdropFilter: 'blur(10px)',
           boxShadow: `0 20px 25px -5px ${colors.primary}50, 0 0 15px ${colors.accent}30`
         }}>
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full animate-float" 
           style={{ 
             background: `radial-gradient(circle, ${colors.primaryLight}30, transparent 70%)`,
             transform: `translate(30%, -30%) translate3d(${mousePosition.x * 20}px, ${mousePosition.y * 20}px, 0)`,
             filter: 'blur(30px)'
           }}></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full animate-float" 
           style={{ 
             background: `radial-gradient(circle, ${colors.accent}20, transparent 70%)`,
             transform: `translate(-30%, 30%) translate3d(${mousePosition.x * -15}px, ${mousePosition.y * -15}px, 0)`,
             filter: 'blur(20px)',
             animationDelay: '1.5s'
           }}></div>
           
      <div className="relative flex items-center transition-all duration-300"
           style={{ transform: `translate3d(${mousePosition.x * -10}px, ${mousePosition.y * -10}px, 0)` }}>
        <div className="relative group">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-70 blur-sm group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="w-16 h-16 rounded-full bg-blue-900 shadow-lg overflow-hidden relative border-2 border-white mr-5 group-hover:shadow-xl transition-all duration-300">
            {userData.avatar ? (
              <img 
                src={userData.avatar} 
                alt={userData.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/default-avatar.jpg"; // Fallback to default if image fails to load
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-800 text-white text-2xl font-bold">
                {userData.name ? userData.name.charAt(0).toUpperCase() : "?"}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent"></div>
          </div>
          
          {/* Upload button */}
          <button 
            onClick={handleAvatarClick}
            disabled={uploading || !editMode}
            className={`absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center transform translate-x-1 translate-y-1 
                      ${editMode ? 'bg-emerald-500 cursor-pointer' : 'bg-blue-400 cursor-not-allowed opacity-50'} 
                      border-2 border-white transition-all duration-300 tooltip-container`}
          >
            <span className="tooltip">Change avatar</span>
            {uploading ? (
              <Loader size={12} className="text-white animate-spin" />
            ) : (
              <Camera size={12} className="text-white" />
            )}
          </button>
          
          {/* Hidden file input */}
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading || !editMode}
          />
        </div>
        
        <div>
          <div className="flex items-end mb-1">
            <h2 className="text-2xl font-bold text-white mr-2 bg-clip-text">{userData.name}</h2>
            {userData.isPremium && (
              <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600/30 to-cyan-600/30 backdrop-blur-sm text-xs text-cyan-200 tooltip-container">
                <span className="tooltip">You're special!</span>
                Premium
              </div>
            )}
          </div>
          <p className="text-blue-100 text-sm">{userData.email}</p>
          
          {/* Error message for upload failures */}
          {uploadError && (
            <div className="mt-1 text-xs text-red-300 bg-red-900/30 px-2 py-1 rounded-md">
              {uploadError}
            </div>
          )}
          
          <div className="mt-3 flex space-x-2">
            <button 
              onClick={() => setEditMode(!editMode)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center tooltip-container"
              style={{ 
                background: 'rgba(255, 255, 255, 0.15)', 
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              <span className="tooltip">{editMode ? "Cancel editing" : "Edit profile"}</span>
              <svg className="w-3.5 h-3.5 mr-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              <span className="text-white">{editMode ? "Cancel" : "Edit Profile"}</span>
            </button>
            
            {editMode && (
              <button 
                onClick={handleSave}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center bg-emerald-600 bg-opacity-70"
              >
                <svg className="w-3.5 h-3.5 mr-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-white">Save Changes</span>
              </button>
            )}
            
            {!editMode && (
              <button 
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center tooltip-container"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.15)', 
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                <span className="tooltip">Verification not needed, we trust you</span>
                <svg className="w-3.5 h-3.5 mr-1.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-white">Verified!</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Membership status bar */}
      <div className="mt-6 pt-4 border-t border-white border-opacity-10">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-blue-200">Health Score</span>
          <span className="text-xs text-white font-medium">87/100 <span className="text-cyan-300">(better than 72% of users)</span></span>
        </div>
        <div className="w-full h-2 rounded-full bg-blue-900 bg-opacity-40 overflow-hidden">
          <div 
            className="h-full rounded-full shimmer" 
            style={{ 
              width: '87%', 
              background: 'linear-gradient(90deg, #3B82F6, #06B6D4)'
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSummaryCard;