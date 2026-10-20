import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

interface TodayVerdictCardProps {
  userId: string;
}

export default function TodayVerdictCard({ userId }: TodayVerdictCardProps) {
  const [loading, setLoading] = useState(true);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    calculateTodayCompletion();
  }, [userId]);

  const calculateTodayCompletion = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Get all active goals
      const { data: goals, error: goalsError } = await (supabase.from('generated_goals') as any)
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (goalsError || !goals || goals.length === 0) {
        setCompletionPercentage(0);
        setLoading(false);
        return;
      }

      // Get today's logs
      const goalIds = goals.map((g: any) => g.id);
      const { data: logs, error: logsError } = await (supabase.from('daily_goal_logs') as any)
        .select('goal_id, status, completion_percentage')
        .in('goal_id', goalIds)
        .eq('log_date', today);

      if (logsError || !logs) {
        setCompletionPercentage(0);
        setLoading(false);
        return;
      }

      // Calculate completion percentage
      const completed = logs.filter((log: any) => 
        log.status === 'completed' || log.completion_percentage === 100
      ).length;

      const percentage = goals.length > 0 ? Math.round((completed / goals.length) * 100) : 0;
      setCompletionPercentage(percentage);
    } catch (error) {
      console.error('Error calculating today completion:', error);
      setCompletionPercentage(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.verdictCard, { backgroundColor: '#FFB84D' }]}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  const backgroundColor = completionPercentage < 40 ? '#FF6B6B' : completionPercentage < 70 ? '#FFB84D' : '#58CC02';
  const verdictText = completionPercentage < 40
    ? 'You need to push harder'
    : completionPercentage < 70
    ? 'Good progress, keep going'
    : 'Excellent work today!';

  return (
    <View 
      style={[
        styles.verdictCard, 
        { 
          backgroundColor,
          borderColor: backgroundColor,
        },
        Platform.OS === 'ios' && {
          shadowColor: backgroundColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        },
        Platform.OS === 'android' && {
          elevation: 8,
        },
      ]}
    >
      <Text style={[styles.verdictTitle, { color: '#FFFFFF' }]}>TODAY'S VERDICT</Text>
      <Text style={[styles.verdictText, { color: '#FFFFFF' }]}>
        {verdictText}
      </Text>
      <Text style={[styles.verdictSubtext, { color: 'rgba(255,255,255,0.8)' }]}>
        {completionPercentage}% completed
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  verdictCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  verdictTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  verdictText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  verdictSubtext: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
