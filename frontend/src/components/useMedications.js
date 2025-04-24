import { useState, useEffect } from 'react';
import supabase from './supabaseClient';
import { useAuth } from './AuthProvider';

/**
 * Custom hook for managing medications with Supabase
 * Handles fetching, creating, updating, and deleting medications
 */
export const useMedications = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch medications and related data
  const fetchMedications = async () => {
    if (!user) {
      setMedications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch user medications
      const { data: medicationsData, error: medicationsError } = await supabase
        .from('user_medications')
        .select('*')
        .eq('user_id', user.id);
        
      if (medicationsError) throw medicationsError;
      
      // Fetch medication schedules for each medication
      const medicationsWithSchedules = await Promise.all(medicationsData.map(async (med) => {
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('medication_schedule')
          .select('*')
          .eq('medication_id', med.medication_id);
          
        if (scheduleError) throw scheduleError;
        
        // Format schedule data to match the application's format
        const formattedSchedules = scheduleData.map(schedule => ({
          time: schedule.time,
          status: schedule.status,
          day: schedule.day_reference
        }));
        
        // Fetch side effects
        const { data: sideEffectsData, error: sideEffectsError } = await supabase
          .from('medication_side_effects')
          .select('*')
          .eq('medication_id', med.medication_id);
          
        if (sideEffectsError) throw sideEffectsError;
        
        const sideEffects = sideEffectsData.map(effect => effect.effect_text);
        
        // Fetch interactions
        const { data: interactionsData, error: interactionsError } = await supabase
          .from('medication_interactions')
          .select('*')
          .eq('medication_id', med.medication_id);
          
        if (interactionsError) throw interactionsError;
        
        // Fetch medication history logs
        const { data: historyData, error: historyError } = await supabase
          .from('medication_history_logs')
          .select('*')
          .eq('medication_id', med.medication_id)
          .order('log_date', { ascending: false });
          
        if (historyError) throw historyError;
        
        // Format history data
        const formattedHistory = historyData.map(history => ({
          date: history.log_date,
          time: history.log_time,
          status: history.status,
          delay: history.delay_note
        }));
        
        // Calculate adherence rate based on history
        const totalDoses = formattedHistory.length;
        const takenDoses = formattedHistory.filter(h => h.status === 'taken').length;
        const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;
        const missedDoses = totalDoses - takenDoses;
        
        // Return complete medication object with related data
        return {
          id: med.medication_id,
          name: med.name,
          dosage: med.dosage,
          form: med.form,
          purpose: med.purpose,
          instructions: med.instructions,
          category: med.category,
          prescribedBy: med.prescribed_by,
          startDate: med.start_date,
          refillDate: med.refill_date,
          refillRemaining: med.refill_remaining,
          adherenceRate: adherenceRate,
          missedDoses: missedDoses,
          schedule: formattedSchedules,
          sideEffects: sideEffects,
          interactions: interactionsData.map(interaction => ({
            medication: interaction.conflict_with,
            severity: interaction.severity,
            description: interaction.description
          })),
          history: formattedHistory
        };
      }));
      
      setMedications(medicationsWithSchedules);
      setError(null);
    } catch (error) {
      console.error('Error fetching medications:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add a new medication
  const addMedication = async (medicationData) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      // First, insert the medication
      const { data: newMedication, error: medicationError } = await supabase
        .from('user_medications')
        .insert({
          user_id: user.id,
          name: medicationData.name,
          dosage: medicationData.dosage,
          form: medicationData.form,
          purpose: medicationData.purpose,
          instructions: medicationData.instructions,
          category: medicationData.category || 'general',
          prescribed_by: medicationData.prescribedBy,
          start_date: medicationData.startDate,
          refill_date: medicationData.refillDate,
          refill_remaining: medicationData.refillRemaining,
          missed_doses: 0,
          created_at: new Date().toISOString()
        })
        .select();
        
      if (medicationError) throw medicationError;
      
      // Then, insert the schedule entries
      if (medicationData.schedule && medicationData.schedule.length > 0) {
        const scheduleEntries = medicationData.schedule.map(schedule => ({
          medication_id: newMedication[0].medication_id,
          time: schedule.time,
          status: schedule.status || 'upcoming',
          day_reference: schedule.day || 'today'
        }));
        
        const { error: scheduleError } = await supabase
          .from('medication_schedule')
          .insert(scheduleEntries);
          
        if (scheduleError) throw scheduleError;
      }
      
      // Insert side effects
      if (medicationData.sideEffects && medicationData.sideEffects.length > 0) {
        const sideEffectsEntries = medicationData.sideEffects.map(effect => ({
          medication_id: newMedication[0].medication_id,
          effect_text: effect
        }));
        
        const { error: sideEffectsError } = await supabase
          .from('medication_side_effects')
          .insert(sideEffectsEntries);
          
        if (sideEffectsError) throw sideEffectsError;
      }
      
      // Insert interactions
      if (medicationData.interactions && medicationData.interactions.length > 0) {
        const interactionsEntries = medicationData.interactions.map(interaction => ({
          medication_id: newMedication[0].medication_id,
          conflict_with: interaction.medication,
          severity: interaction.severity,
          description: interaction.description
        }));
        
        const { error: interactionsError } = await supabase
          .from('medication_interactions')
          .insert(interactionsEntries);
          
        if (interactionsError) throw interactionsError;
      }
      
      // Refresh medications list
      await fetchMedications();
      
      return { success: true, medicationId: newMedication[0].medication_id };
    } catch (error) {
      console.error('Error adding medication:', error.message);
      return { success: false, error: error.message };
    }
  };

  // Update medication
  const updateMedication = async (medicationId, medicationData) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      // Update medication record
      const { error: medicationError } = await supabase
        .from('user_medications')
        .update({
          name: medicationData.name,
          dosage: medicationData.dosage,
          form: medicationData.form,
          purpose: medicationData.purpose,
          instructions: medicationData.instructions,
          category: medicationData.category,
          prescribed_by: medicationData.prescribedBy,
          start_date: medicationData.startDate,
          refill_date: medicationData.refillDate,
          refill_remaining: medicationData.refillRemaining
        })
        .eq('medication_id', medicationId)
        .eq('user_id', user.id);
        
      if (medicationError) throw medicationError;
      
      // Update schedule - delete old entries and insert new ones
      if (medicationData.schedule && medicationData.schedule.length > 0) {
        // Delete existing schedules
        const { error: deleteScheduleError } = await supabase
          .from('medication_schedule')
          .delete()
          .eq('medication_id', medicationId);
          
        if (deleteScheduleError) throw deleteScheduleError;
        
        // Insert new schedules
        const scheduleEntries = medicationData.schedule.map(schedule => ({
          medication_id: medicationId,
          time: schedule.time,
          status: schedule.status || 'upcoming',
          day_reference: schedule.day || 'today'
        }));
        
        const { error: scheduleError } = await supabase
          .from('medication_schedule')
          .insert(scheduleEntries);
          
        if (scheduleError) throw scheduleError;
      }
      
      // Update side effects - delete old entries and insert new ones
      if (medicationData.sideEffects && medicationData.sideEffects.length > 0) {
        // Delete existing side effects
        const { error: deleteSideEffectsError } = await supabase
          .from('medication_side_effects')
          .delete()
          .eq('medication_id', medicationId);
          
        if (deleteSideEffectsError) throw deleteSideEffectsError;
        
        // Insert new side effects
        const sideEffectsEntries = medicationData.sideEffects.map(effect => ({
          medication_id: medicationId,
          effect_text: effect
        }));
        
        const { error: sideEffectsError } = await supabase
          .from('medication_side_effects')
          .insert(sideEffectsEntries);
          
        if (sideEffectsError) throw sideEffectsError;
      }
      
      // Update interactions - delete old entries and insert new ones
      if (medicationData.interactions && medicationData.interactions.length > 0) {
        // Delete existing interactions
        const { error: deleteInteractionsError } = await supabase
          .from('medication_interactions')
          .delete()
          .eq('medication_id', medicationId);
          
        if (deleteInteractionsError) throw deleteInteractionsError;
        
        // Insert new interactions
        const interactionsEntries = medicationData.interactions.map(interaction => ({
          medication_id: medicationId,
          conflict_with: interaction.medication,
          severity: interaction.severity,
          description: interaction.description
        }));
        
        const { error: interactionsError } = await supabase
          .from('medication_interactions')
          .insert(interactionsEntries);
          
        if (interactionsError) throw interactionsError;
      }
      
      // Refresh medications list
      await fetchMedications();
      
      return { success: true };
    } catch (error) {
      console.error('Error updating medication:', error.message);
      return { success: false, error: error.message };
    }
  };

  // Delete medication
  const deleteMedication = async (medicationId) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      // Delete related records first to maintain referential integrity
      
      // Delete schedule entries
      const { error: scheduleError } = await supabase
        .from('medication_schedule')
        .delete()
        .eq('medication_id', medicationId);
        
      if (scheduleError) throw scheduleError;
      
      // Delete side effects
      const { error: sideEffectsError } = await supabase
        .from('medication_side_effects')
        .delete()
        .eq('medication_id', medicationId);
        
      if (sideEffectsError) throw sideEffectsError;
      
      // Delete interactions
      const { error: interactionsError } = await supabase
        .from('medication_interactions')
        .delete()
        .eq('medication_id', medicationId);
        
      if (interactionsError) throw interactionsError;
      
      // Delete history logs
      const { error: historyError } = await supabase
        .from('medication_history_logs')
        .delete()
        .eq('medication_id', medicationId);
        
      if (historyError) throw historyError;
      
      // Delete the medication
      const { error: medicationError } = await supabase
        .from('user_medications')
        .delete()
        .eq('medication_id', medicationId)
        .eq('user_id', user.id);
        
      if (medicationError) throw medicationError;
      
      // Refresh medications list
      await fetchMedications();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting medication:', error.message);
      return { success: false, error: error.message };
    }
  };
  
  // Log medication status (taken, missed, etc.)
  const logMedicationStatus = async (medicationId, scheduleTime, status) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      // Update the schedule status
      const { error: scheduleError } = await supabase
        .from('medication_schedule')
        .update({ status })
        .eq('medication_id', medicationId)
        .eq('time', scheduleTime);
        
      if (scheduleError) throw scheduleError;
      
      // Get current time
      const now = new Date();
      const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Calculate delay
      const scheduleParts = scheduleTime.split(/[:\s]/);
      let scheduleHour = parseInt(scheduleParts[0]);
      const scheduleMinute = parseInt(scheduleParts[1] || 0);
      
      // Adjust for AM/PM if present
      if (scheduleTime.includes('PM') && scheduleHour < 12) {
        scheduleHour += 12;
      } else if (scheduleTime.includes('AM') && scheduleHour === 12) {
        scheduleHour = 0;
      }
      
      const scheduleDate = new Date();
      scheduleDate.setHours(scheduleHour, scheduleMinute, 0, 0);
      
      const diffMinutes = Math.round((now - scheduleDate) / (1000 * 60));
      
      let delayNote;
      if (status === 'missed') {
        delayNote = 'missed';
      } else if (Math.abs(diffMinutes) <= 5) {
        delayNote = 'on time';
      } else if (diffMinutes > 0) {
        delayNote = `${diffMinutes} min late`;
      } else {
        delayNote = `${Math.abs(diffMinutes)} min early`;
      }
      
      // Add to history log
      const { error: historyError } = await supabase
        .from('medication_history_logs')
        .insert({
          medication_id: medicationId,
          log_date: now.toISOString().split('T')[0],
          log_time: formattedTime,
          status,
          delay_note: delayNote
        });
        
      if (historyError) throw historyError;
      
      // Update adherence metrics in the medication record
      const { data: historyData, error: fetchHistoryError } = await supabase
        .from('medication_history_logs')
        .select('*')
        .eq('medication_id', medicationId);
        
      if (fetchHistoryError) throw fetchHistoryError;
      
      // Calculate new adherence rate
      const totalDoses = historyData.length;
      const takenDoses = historyData.filter(h => h.status === 'taken').length;
      const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;
      const missedDoses = totalDoses - takenDoses;
      
      // Update medication record
      const { error: updateMedicationError } = await supabase
        .from('user_medications')
        .update({
          adherence_rate: adherenceRate,
          missed_doses: missedDoses
        })
        .eq('medication_id', medicationId);
        
      if (updateMedicationError) throw updateMedicationError;
      
      // Refresh medications list
      await fetchMedications();
      
      return { success: true };
    } catch (error) {
      console.error('Error logging medication status:', error.message);
      return { success: false, error: error.message };
    }
  };

  // Add biorhythm optimization data
  const updateMedicationWithBiorhythm = async (medicationId, biorhythmData) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      // Find the medication in local state
      const medicationIndex = medications.findIndex(med => med.id === medicationId);
      if (medicationIndex === -1) {
        return { success: false, error: 'Medication not found' };
      }
      
      // Update the medication in local state with biorhythm data
      const updatedMedications = [...medications];
      updatedMedications[medicationIndex] = {
        ...updatedMedications[medicationIndex],
        biorhythmData
      };
      
      setMedications(updatedMedications);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating medication with biorhythm data:', error.message);
      return { success: false, error: error.message };
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchMedications();
  }, [user]);

  return {
    medications,
    loading,
    error,
    fetchMedications,
    addMedication,
    updateMedication,
    deleteMedication,
    logMedicationStatus,
    updateMedicationWithBiorhythm
  };
};

export default useMedications;