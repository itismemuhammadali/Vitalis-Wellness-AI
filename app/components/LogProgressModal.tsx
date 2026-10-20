import { useGamification } from '@/app/context/GamificationContext';
import { GoalWithProgress, logGoalProgress } from '@/app/lib/goalsHelper';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface LogProgressModalProps {
  visible: boolean;
  goal?: GoalWithProgress | null;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
  isQuickAction?: boolean;
  onGoalCompleted?: () => void;
}

type StatusType = 'completed' | 'incomplete' | 'partial';

export default function LogProgressModal({
  visible,
  goal,
  userId,
  onClose,
  onSuccess,
  isQuickAction = false,
  onGoalCompleted,
}: LogProgressModalProps) {
  const { isDarkMode } = useTheme();
  const { addXP } = useGamification();
  const [status, setStatus] = useState<StatusType>('partial');
  const [completion, setCompletion] = useState(50);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [allGoals, setAllGoals] = useState<GoalWithProgress[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (visible && isQuickAction) {
      loadAllGoals();
    }
  }, [visible, isQuickAction]);

  const bgColor = isDarkMode ? '#1A1F2E' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const subtitleColor = isDarkMode ? '#B0B0B0' : '#757575';
  const inputBg = isDarkMode ? '#0F1419' : '#F5F1E8';
  const borderColor = isDarkMode ? '#2A3142' : '#E0E0E0';
  const overlayBg = isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)';

  const colorPalette = {
    red: '#FF6B6B',
    blue: '#1F9FFF',
    orange: '#FFB84D',
    purple: '#A78BFA',
    teal: '#00D9A3',
    green: '#58CC02',
  };

  const handleClose = () => {
    setStatus('partial');
    setCompletion(50);
    setNotes('');
    onClose();
  };

  const analyzeAccomplishments = async () => {
    if (!notes.trim() || allGoals.length === 0) {
      alert('Please enter what you accomplished');
      return;
    }

    try {
      setAnalyzing(true);
      const today = new Date().toISOString().split('T')[0];

      // Save original text to accomplishment_logs
      const { error: logError } = await (supabase.from('accomplishment_logs') as any)
        .insert({
          user_id: userId,
          log_date: today,
          original_text: notes,
        })
        .select()
        .single();

      if (logError) {
        console.error('Error saving accomplishment log:', logError);
        alert('Failed to save accomplishment');
        return;
      }

      // Call AI analysis function
      const functionUrl = 'https://aikobdjkiioxqiqtffyc.supabase.co/functions/v1/analyze-accomplishments';

      const fetchResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userId,
          accomplishmentText: notes,
          goals: allGoals.map((g) => ({
            id: g.id,
            title: g.title,
            description: g.description,
          })),
        }),
      });

      const responseData = await fetchResponse.json();

      const response = {
        data: fetchResponse.ok ? responseData : null,
        error: fetchResponse.ok ? null : new Error(`HTTP ${fetchResponse.status}`),
      };

      if (response.error) {
        console.error('Analysis error:', response.error);
        alert(`Error: ${response.error?.message || 'Failed to analyze accomplishments'}`);
        return;
      }

      if (!response.data) {
        console.error('Invalid response structure:', response);
        alert('Invalid response from analysis service');
        return;
      }

      const { matches } = response.data;

      if (!Array.isArray(matches)) {
        console.error('Matches is not an array:', matches);
        alert('Invalid matches format from analysis service');
        return;
      }

      // Process matches and update database
      for (const match of matches) {
        if (!match.goalId) {
          console.warn('Skipping match without goalId:', match);
          continue;
        }

        const { data: customGoal } = await (supabase.from('custom_goals') as any)
          .select('id')
          .eq('id', match.goalId)
          .eq('user_id', userId)
          .single();

        if (customGoal) {
          const { error: customError } = await (supabase.from('custom_goals') as any)
            .update({
              analyzed_text: match.reason,
              completion_percentage: match.completion,
              last_logged_date: today,
              updated_at: new Date().toISOString(),
            })
            .eq('id', match.goalId);

          if (customError) {
            console.error('❌ Error updating custom goal:', customError);
          }
        }

        const isCustomGoal = customGoal;

        if (!isCustomGoal) {
          const { data: existingLog } = await (supabase.from('daily_goal_logs') as any)
            .select('id')
            .eq('user_id', userId)
            .eq('goal_id', match.goalId)
            .eq('log_date', today)
            .single();

          if (existingLog) {
            const { error: updateError } = await (supabase.from('daily_goal_logs') as any)
              .update({
                status: match.status,
                completion_percentage: match.completion,
                analyzed_text: match.reason,
                last_logged_date: today,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingLog.id);

            if (updateError) {
              console.error('❌ Error updating log:', updateError);
            }
          } else {
            const { error: insertError } = await (supabase.from('daily_goal_logs') as any)
              .insert({
                user_id: userId,
                goal_id: match.goalId,
                log_date: today,
                status: match.status,
                completion_percentage: match.completion,
                analyzed_text: match.reason,
                last_logged_date: today,
              })
              .select();

            if (insertError) {
              console.error('❌ Error inserting log for goal', match.goalId, ':', insertError);
            }
          }

          if (match.status === 'completed' || match.completion === 100) {
            const { updateAspirationProgressOnCompletion } = await import('../lib/updateAspirationProgress');
            await updateAspirationProgressOnCompletion(userId);

            // Add XP for completed goal
            console.log('🎯 Goal completed via AI analysis! Adding XP...');
            try {
              const { data: xpResult, error: xpError } = await supabase.functions.invoke('add-goal-xp', {
                body: {
                  userId: userId,
                  goalId: match.goalId,
                },
              });

              if (xpError) {
                console.error('❌ Error adding XP:', xpError);
              } else if (xpResult && xpResult.xpAdded) {
                console.log('✅ XP added successfully:', xpResult.xpAdded);
                // Update the gamification context
                addXP(xpResult.xpAdded, 'Goal completed');
              }
            } catch (xpErr) {
              console.error('❌ Error calling add-goal-xp function:', xpErr);
            }

            // Trigger refresh of completed goals
            if (onGoalCompleted) {
              onGoalCompleted();
            }
          }
        }
      }

      // After processing all goals, check if ALL goals are completed and update streak
      console.log('🔥 Checking streak after all goals processed...');
      try {
        const { data: streakResult, error: streakError } = await supabase.functions.invoke('update-streak', {
          body: {
            userId: userId,
          },
        });

        if (streakError) {
          console.error('❌ Error updating streak:', streakError);
        } else if (streakResult) {
          console.log('✅ Streak result:', streakResult);
          
          // Show streak message if all goals completed
          if (streakResult.allGoalsCompleted && streakResult.message) {
            setTimeout(() => {
              alert(streakResult.message);
            }, 500);
          }
        }
      } catch (streakErr) {
        console.error('❌ Error calling update-streak function:', streakErr);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error analyzing accomplishments:', error);
      alert('Failed to analyze accomplishments');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!goal) return;

    try {
      setLoading(true);
      const finalStatus = Math.round(completion) === 100 ? 'completed' : status;

      const success = await logGoalProgress(
        userId,
        goal.id,
        finalStatus,
        Math.round(completion),
        notes
      );

      if (success) {
        // Add XP if goal is completed
        if (finalStatus === 'completed') {
          console.log('🎯 Goal completed! Adding XP...');
          try {
            const { data: xpResult, error: xpError } = await supabase.functions.invoke('add-goal-xp', {
              body: {
                userId: userId,
                goalId: goal.id,
              },
            });

            if (xpError) {
              console.error('❌ Error adding XP:', xpError);
            } else if (xpResult && xpResult.xpAdded) {
              console.log('✅ XP added successfully:', xpResult.xpAdded);
              // Update the gamification context
              addXP(xpResult.xpAdded, 'Goal completed');
            }
          } catch (xpErr) {
            console.error('❌ Error calling add-goal-xp function:', xpErr);
          }

          // Update streak
          console.log('🔥 Updating streak...');
          try {
            const { data: streakResult, error: streakError } = await supabase.functions.invoke('update-streak', {
              body: {
                userId: userId,
              },
            });

            if (streakError) {
              console.error('❌ Error updating streak:', streakError);
            } else if (streakResult) {
              console.log('✅ Streak result:', streakResult);
              
              // Show streak message if all goals completed
              if (streakResult.allGoalsCompleted && streakResult.message) {
                setTimeout(() => {
                  alert(streakResult.message);
                }, 500);
              }
            }
          } catch (streakErr) {
            console.error('❌ Error calling update-streak function:', streakErr);
          }

          // Trigger refresh of completed goals
          if (onGoalCompleted) {
            onGoalCompleted();
          }
        }

        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllGoals = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: generatedGoals, error: generatedError } = await (supabase.from('generated_goals') as any)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      const { data: customGoals, error: customError } = await (supabase.from('custom_goals') as any)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (generatedError) {
        console.error('Error fetching generated goals:', generatedError);
      }

      if (customError) {
        console.error('Error fetching custom goals:', customError);
      }

      const allGoalsData = [...(generatedGoals || []), ...(customGoals || [])];

      if (allGoalsData.length === 0) {
        setAllGoals([]);
        return;
      }

      const { data: logs, error: logsError } = await (supabase.from('daily_goal_logs') as any)
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', today);

      if (logsError) {
        console.error('Error fetching logs:', logsError);
      }

      const goalsWithProgress: GoalWithProgress[] = allGoalsData.map((goal: any) => {
        const todayLog = logs?.find((log: any) => log.goal_id === goal.id);
        return {
          id: goal.id,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          difficulty: goal.difficulty,
          estimatedTime: goal.estimated_time,
          deadline: goal.deadline,
          aspiration: goal.aspiration,
          coaching: goal.coaching,
          todayStatus: todayLog?.status || 'not_logged',
          todayCompletion: todayLog?.completion_percentage || 0,
          todayNotes: todayLog?.notes || '',
        };
      });

      setAllGoals(goalsWithProgress);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  // Quick Action Mode
  if (isQuickAction) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={[styles.overlay, { backgroundColor: overlayBg }]}>
          <View style={[styles.modalContainer, { backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colorPalette.blue }]}>
              <Text style={[styles.title, { color: '#FFFFFF' }]}>Log Progress</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButtonContainer}>
                <Text style={[styles.closeButton, { color: '#FFFFFF' }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Accomplishment Input */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: textColor }]}>What did you accomplish?</Text>
                <View style={[styles.inputWrapper, { borderLeftColor: colorPalette.blue }]}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: inputBg,
                        color: textColor,
                        borderColor: borderColor,
                      },
                    ]}
                    placeholder="E.g., I did 30 minutes of exercise, prepared a healthy meal..."
                    placeholderTextColor={subtitleColor}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={5}
                    editable={!analyzing}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: 'transparent',
                    borderColor: colorPalette.red,
                    borderWidth: 2,
                  },
                ]}
                onPress={handleClose}
                disabled={analyzing}
              >
                <Text style={[styles.buttonText, { color: colorPalette.red }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: notes.trim() ? colorPalette.green : 'rgba(88, 204, 2, 0.5)',
                    opacity: notes.trim() ? 1 : 0.6,
                  },
                ]}
                onPress={analyzeAccomplishments}
                disabled={!notes.trim() || analyzing}
              >
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Log Progress</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Individual Goal Mode
  if (!goal) return null;

  const completionOptions = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: overlayBg }]}>
        <View style={[styles.modalContainer, { backgroundColor: bgColor }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colorPalette.purple }]}>
            <Text style={[styles.title, { color: '#FFFFFF' }]}>Log Progress</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButtonContainer}>
              <Text style={[styles.closeButton, { color: '#FFFFFF' }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Goal Title */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: textColor }]}>Goal</Text>
              <View style={[styles.inputWrapper, { borderLeftColor: colorPalette.blue }]}>
                <View
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBg,
                      borderColor: borderColor,
                    },
                  ]}
                >
                  <Text style={[styles.goalText, { color: textColor }]}>{goal.title}</Text>
                </View>
              </View>
            </View>

            {/* Status */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: textColor }]}>Status</Text>
              <View style={styles.statusGrid}>
                {(['completed', 'partial', 'incomplete'] as StatusType[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusButton,
                      {
                        backgroundColor: status === s ? colorPalette.green : inputBg,
                        borderColor: status === s ? colorPalette.green : borderColor,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setStatus(s)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        {
                          color: status === s ? '#FFFFFF' : textColor,
                        },
                      ]}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Completion Percentage */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: textColor }]}>Completion %</Text>
              <View style={styles.completionGrid}>
                {completionOptions.map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.completionButton,
                      {
                        backgroundColor: completion === value ? colorPalette.orange : inputBg,
                        borderColor: completion === value ? colorPalette.orange : borderColor,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setCompletion(value)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.completionButtonText,
                        {
                          color: completion === value ? '#FFFFFF' : textColor,
                        },
                      ]}
                    >
                      {value}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: textColor }]}>Notes (Optional)</Text>
              <View style={[styles.inputWrapper, { borderLeftColor: colorPalette.purple }]}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBg,
                      color: textColor,
                      borderColor: borderColor,
                    },
                  ]}
                  placeholder="Add any notes about your progress..."
                  placeholderTextColor={subtitleColor}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                  editable={!loading}
                />
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: 'transparent',
                  borderColor: colorPalette.red,
                  borderWidth: 2,
                },
              ]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: colorPalette.red }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: colorPalette.green,
                },
              ]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Save Progress</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    borderRadius: 20,
    width: '100%',
    maxHeight: '95%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButtonContainer: {
    padding: 8,
  },
  closeButton: {
    fontSize: 28,
    fontWeight: '300',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: '80%',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    borderLeftWidth: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 120,
  },
  goalText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  completionButton: {
    width: '18%',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
