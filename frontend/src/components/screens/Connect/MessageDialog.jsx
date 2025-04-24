import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Paperclip, Image, Smile, Clock, Check, CheckCheck } from 'lucide-react';
import { useTheme } from '../../ThemeContext';

const MessageDialog = ({ isOpen, onClose, colors, recipient = null, doctors = [] }) => {
  const [message, setMessage] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(recipient);
  const [showDoctorSelector, setShowDoctorSelector] = useState(!recipient);
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const { isDarkMode } = useTheme();
  
  // Keep selectedDoctor in sync with recipient prop
  useEffect(() => {
    if (recipient) {
      setSelectedDoctor(recipient);
    }
  }, [recipient]);
  
  // When dialog opens, focus the textarea
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current.focus(), 300);
    }
    
    // Reset state when dialog opens
    if (isOpen) {
      setIsSent(false);
      setMessage('');
      setAttachments([]);
      // Sync selectedDoctor with recipient when dialog opens
      if (recipient) {
        setSelectedDoctor(recipient);
        setShowDoctorSelector(!recipient);
      }
    }
  }, [isOpen, recipient]);
  
  // Handle outside click to close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isOpen && e.target.classList.contains('dialog-backdrop')) {
        onClose();
      }
    };
    
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen, onClose]);
  
  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newAttachments = files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      }));
      
      setAttachments([...attachments, ...newAttachments]);
    }
  };
  
  // Enhanced handleSend with better validation
  const handleSend = () => {
    // Check for content to send
    if (!message.trim() && attachments.length === 0) {
      // Optionally show a toast/error message
      return;
    }
    
    // Check for recipient
    if (!selectedDoctor) {
      // Optionally show a toast/error message about needing to select a recipient
      return;
    }
    
    setIsSending(true);
    
    // Simulate sending message
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
      
      // Close dialog after showing sent confirmation
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 1500);
  };
  
  // Dark mode specific styles
  const cardBg = isDarkMode ? colors.cardBg : 'white';
  const borderColor = isDarkMode ? `${colors.primary}30` : 'rgba(219, 234, 254, 1)';
  const inputBg = isDarkMode ? colors.darkBg : 'white';
  const hoverBgColor = isDarkMode ? `${colors.primary}20` : 'rgba(239, 246, 255, 1)';
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center dialog-backdrop"
         style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform dark-mode-transition"
           style={{ 
             maxHeight: '80vh',
             boxShadow: `0 25px 50px -12px ${colors.primary}50`,
             transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
             opacity: isOpen ? 1 : 0,
             backgroundColor: cardBg
           }}>
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center dark-mode-transition"
             style={{ 
               background: isDarkMode ? `linear-gradient(to right, ${colors.darkBg}, ${colors.cardBg})` : `linear-gradient(to right, ${colors.background}, white)`,
               borderColor: borderColor
             }}>
          <h3 className="font-bold text-lg dark-mode-transition" style={{ color: colors.textPrimary }}>
            {showDoctorSelector ? 'New Message' : `Message to ${selectedDoctor?.name || 'Doctor'}`}
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors dark-mode-transition"
            style={{ backgroundColor: `${colors.primary}10` }}
          >
            <X size={18} style={{ color: colors.textSecondary }} />
          </button>
        </div>
        
        {/* Doctor selector */}
        {showDoctorSelector && (
          <div className="p-4 border-b dark-mode-transition" 
               style={{ borderColor: borderColor }}>
            <label className="block text-sm font-medium mb-2 dark-mode-transition" style={{ color: colors.textSecondary }}>
              Select recipient
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {doctors.map(doctor => (
                <button 
                  key={doctor.id}
                  className="w-full p-3 rounded-xl flex items-center transition-all duration-300 dark-mode-transition"
                  style={{ 
                    backgroundColor: selectedDoctor?.id === doctor.id ? `${colors.primary}10` : cardBg,
                    border: `1px solid ${selectedDoctor?.id === doctor.id ? colors.primary : colors.primary + '20'}`
                  }}
                  onClick={() => setSelectedDoctor(doctor)}
                  disabled={recipient !== null} // Disable selection if recipient is provided
                >
                  <div className="w-10 h-10 rounded-full mr-3 relative overflow-hidden flex items-center justify-center"
                       style={{ 
                         background: `linear-gradient(135deg, ${colors.primary}40, ${colors.accent}30)`,
                         boxShadow: `0 0 15px ${colors.primary}30` 
                       }}>
                    <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium dark-mode-transition" style={{ color: colors.textPrimary }}>{doctor.name}</div>
                    <div className="text-xs dark-mode-transition" style={{ color: colors.textSecondary }}>{doctor.specialty}</div>
                  </div>
                  {selectedDoctor?.id === doctor.id && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center"
                         style={{ backgroundColor: colors.primary }}>
                      <Check size={14} color="white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Message content */}
        <div className="p-4 flex-1 max-h-60 overflow-y-auto">
          {isSent ? (
            <div className="h-full flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4 dark-mode-transition"
                   style={{ backgroundColor: isDarkMode ? `${colors.success}30` : `${colors.success}20` }}>
                <CheckCheck size={32} style={{ color: colors.success }} />
              </div>
              <h4 className="text-lg font-medium mb-1 dark-mode-transition" style={{ color: colors.textPrimary }}>Message Sent!</h4>
              <p className="text-sm text-center dark-mode-transition" style={{ color: colors.textSecondary }}>
                Your message has been sent to {selectedDoctor?.name}.
              </p>
            </div>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                className="w-full p-3 rounded-xl border resize-none mb-3 dark-mode-transition"
                style={{ 
                  borderColor: `${colors.primary}30`,
                  height: '120px',
                  color: colors.textPrimary,
                  backgroundColor: isDarkMode ? `${colors.primary}10` : `${colors.primary}05`,
                }}
                placeholder={`Write your message to ${selectedDoctor?.name || 'your doctor'}...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></textarea>
              
              {/* Attachments preview */}
              {attachments.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm font-medium mb-2 dark-mode-transition" style={{ color: colors.textSecondary }}>Attachments</div>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="relative group">
                        {file.preview ? (
                          <div className="w-16 h-16 rounded-lg overflow-hidden border dark-mode-transition"
                               style={{ borderColor: borderColor }}>
                            <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg flex items-center justify-center dark-mode-transition" 
                               style={{ backgroundColor: `${colors.primary}10` }}>
                            <span className="text-xs dark-mode-transition" style={{ color: colors.textPrimary }}>.{file.name.split('.').pop()}</span>
                          </div>
                        )}
                        <button 
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity dark-mode-transition"
                          style={{ backgroundColor: isDarkMode ? colors.cardBg : 'white' }}
                          onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                        >
                          <X size={12} style={{ color: colors.textPrimary }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer with actions */}
        {!isSent && (
          <div className="p-4 border-t flex justify-between items-center dark-mode-transition"
               style={{ borderColor: borderColor }}>
            <div className="flex space-x-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                onChange={handleFileSelect}
              />
              <button 
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors dark-mode-transition"
                style={{ backgroundColor: `${colors.primary}10` }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={18} style={{ color: colors.primary }} />
              </button>
              <button 
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors dark-mode-transition"
                style={{ backgroundColor: `${colors.primary}10` }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Image size={18} style={{ color: colors.primary }} />
              </button>
              <button 
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors dark-mode-transition"
                style={{ backgroundColor: `${colors.primary}10` }}
              >
                <Smile size={18} style={{ color: colors.primary }} />
              </button>
            </div>
            
            {/* Enhanced send button with proper visual feedback */}
            <button 
              className="px-5 py-2 rounded-full font-medium text-white flex items-center transition-all duration-300 disabled:opacity-50"
              style={{ 
                background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                boxShadow: `0 8px 15px -3px ${colors.primary}40`,
                opacity: (!message.trim() && attachments.length === 0) || !selectedDoctor || isSending ? 0.5 : 1,
                cursor: (!message.trim() && attachments.length === 0) || !selectedDoctor || isSending ? 'not-allowed' : 'pointer'
              }}
              disabled={(!message.trim() && attachments.length === 0) || !selectedDoctor || isSending}
              onClick={handleSend}
            >
              {isSending ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2">
                    <Clock size={16} color="white" />
                  </div>
                  Sending...
                </div>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  {!selectedDoctor ? "Select Recipient" : "Send"}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageDialog;