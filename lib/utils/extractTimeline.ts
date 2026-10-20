/**
 * Extract timeline in days from aspiration text
 * Looks for common time references like "by end of next month", "in 3 weeks", etc.
 */
export function extractTimelineFromText(text: string): number {
  const lowerText = text.toLowerCase();
  const now = new Date();

  // Time patterns and their corresponding days
  const patterns: { regex: RegExp; days: number | ((match: RegExpMatchArray) => number) }[] = [
    // Year references - calculate actual days
    { 
      regex: /by (?:the )?end of (?:this )?year/i, 
      days: () => {
        const endOfYear = new Date(now.getFullYear(), 11, 31); // Dec 31 of current year
        return Math.ceil((endOfYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
    },
    { 
      regex: /by (?:the )?end of next year/i, 
      days: () => {
        const endOfNextYear = new Date(now.getFullYear() + 1, 11, 31); // Dec 31 of next year
        return Math.ceil((endOfNextYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
    },

    // Specific months
    { regex: /by (?:the )?end of (?:next\s+)?january/i, days: 31 },
    { regex: /by (?:the )?end of (?:next\s+)?february/i, days: 28 },
    { regex: /by (?:the )?end of (?:next\s+)?march/i, days: 31 },
    { regex: /by (?:the )?end of (?:next\s+)?april/i, days: 30 },
    { regex: /by (?:the )?end of (?:next\s+)?may/i, days: 31 },
    { regex: /by (?:the )?end of (?:next\s+)?june/i, days: 30 },
    { regex: /by (?:the )?end of (?:next\s+)?july/i, days: 31 },
    { regex: /by (?:the )?end of (?:next\s+)?august/i, days: 31 },
    { regex: /by (?:the )?end of (?:next\s+)?september/i, days: 30 },
    { regex: /by (?:the )?end of (?:next\s+)?october/i, days: 31 },
    { regex: /by (?:the )?end of (?:next\s+)?november/i, days: 30 },
    { regex: /by (?:the )?end of (?:next\s+)?december/i, days: 31 },

    // General time references
    { 
      regex: /by (?:the )?end of (?:this\s+)?month/i, 
      days: () => {
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
    },
    { 
      regex: /by (?:the )?end of next month/i, 
      days: () => {
        const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        return Math.ceil((endOfNextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
    },
    { regex: /by (?:the )?end of (?:this\s+)?week/i, days: 7 },
    { regex: /by (?:the )?end of next week/i, days: 14 },

    // Relative time
    { regex: /in\s+(\d+)\s+years?/i, days: (match) => parseInt(match[1]) * 365 },
    { regex: /in\s+(\d+)\s+months?/i, days: (match) => parseInt(match[1]) * 30 },
    { regex: /in\s+(\d+)\s+weeks?/i, days: (match) => parseInt(match[1]) * 7 },
    { regex: /in\s+(\d+)\s+days?/i, days: (match) => parseInt(match[1]) },

    // Quick references
    { regex: /within\s+(\d+)\s+months?/i, days: (match) => parseInt(match[1]) * 30 },
    { regex: /within\s+(\d+)\s+weeks?/i, days: (match) => parseInt(match[1]) * 7 },
    { regex: /within\s+(\d+)\s+days?/i, days: (match) => parseInt(match[1]) },

    // Urgency indicators
    { regex: /asap|immediately|right now/i, days: 7 },
    { regex: /soon/i, days: 30 },
    { regex: /eventually/i, days: 365 },
  ];

  // Try to match patterns
  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const days = typeof pattern.days === 'function' ? pattern.days(match) : pattern.days;
      console.log(`📅 Matched pattern: "${match[0]}" → ${days} days`);
      return Math.max(1, days); // Ensure at least 1 day
    }
  }

  // Default to 90 days if no pattern found
  console.log('📅 No pattern matched, using default: 90 days');
  return 90;
}
