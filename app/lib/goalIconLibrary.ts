/**
 * Goal Icon Library
 * Comprehensive icon mapping for different goal types and keywords
 * Used to dynamically select appropriate icons based on goal content
 */

interface IconMapping {
  keywords: string[];
  icon: string;
  category: string;
}

const ICON_LIBRARY: IconMapping[] = [
  // Exercise & Fitness
  {
    category: 'Exercise & Fitness',
    keywords: ['exercise', 'workout', 'run', 'running', 'cardio', 'gym', 'fitness', 'muscle', 'strength', 'train', 'training', 'yoga', 'walk', 'walking', 'cycle', 'cycling', 'swim', 'swimming', 'sport', 'sports', 'lift', 'lifting', 'stretch', 'stretching', 'jog', 'jogging', 'dance', 'dancing', 'pilates', 'crossfit', 'hiit', 'aerobic'],
    icon: '💪',
  },
  // Cooking & Meal Preparation
  {
    category: 'Cooking & Meal Prep',
    keywords: ['prepare', 'meal', 'cook', 'cooking', 'recipe', 'recipes', 'kitchen', 'bake', 'baking', 'grill', 'grilling', 'healthy meal', 'dinner', 'lunch', 'breakfast', 'snack', 'smoothie', 'juice', 'blend'],
    icon: '👨‍🍳',
  },
  // Nutrition & Diet
  {
    category: 'Nutrition & Diet',
    keywords: ['eat', 'diet', 'food', 'nutrition', 'nutritious', 'healthy', 'protein', 'vegetable', 'vegetables', 'fruit', 'fruits', 'drink', 'water', 'hydrate', 'calorie', 'calories', 'macro', 'macros', 'supplement', 'vitamin', 'minerals'],
    icon: '🥗',
  },
  // Sleep & Rest
  {
    category: 'Sleep & Rest',
    keywords: ['sleep', 'rest', 'bed', 'nap', 'relax', 'relaxation', 'meditation', 'mindfulness', 'calm', 'calmness', 'breathe', 'breathing', 'unwind', 'recharge', 'recovery'],
    icon: '😴',
  },
  // Work & Career
  {
    category: 'Work & Career',
    keywords: ['work', 'job', 'career', 'project', 'task', 'deadline', 'meeting', 'presentation', 'report', 'code', 'coding', 'develop', 'development', 'build', 'create', 'design', 'office', 'professional', 'business', 'client', 'proposal'],
    icon: '💼',
  },
  // Reading & Articles
  {
    category: 'Reading & Articles',
    keywords: ['read', 'reading', 'article', 'articles', 'blog', 'post', 'news', 'journal', 'publication', 'paper', 'research', 'study', 'document', 'content', 'material', 'text'],
    icon: '📰',
  },
  // Learning & Education
  {
    category: 'Learning & Education',
    keywords: ['learn', 'learning', 'study', 'studying', 'book', 'books', 'course', 'courses', 'skill', 'skills', 'education', 'training', 'practice', 'improve', 'improvement', 'tutorial', 'lesson', 'class', 'school', 'university', 'certificate', 'certification'],
    icon: '📚',
  },
  // Networking & Calls
  {
    category: 'Networking & Communication',
    keywords: ['network', 'networking', 'call', 'calling', 'phone', 'contact', 'reach out', 'connect', 'connection', 'meet', 'meeting', 'talk', 'talking', 'conversation', 'discuss', 'discussion', 'sales', 'marketing', 'pitch', 'relationship', 'friend', 'colleague', 'person', 'people', 'team', 'group', 'chat', 'message', 'email', 'communicate'],
    icon: '☎️',
  },
  // Research & Internet
  {
    category: 'Research & Internet',
    keywords: ['research', 'researching', 'search', 'searching', 'internet', 'online', 'web', 'website', 'browser', 'google', 'explore', 'exploring', 'discover', 'discovery', 'investigate', 'investigation', 'find', 'finding', 'look up', 'information', 'data', 'resource', 'resources'],
    icon: '🔍',
  },
  // Finance & Money
  {
    category: 'Finance & Money',
    keywords: ['save', 'saving', 'money', 'budget', 'budgeting', 'invest', 'investment', 'financial', 'finance', 'income', 'earn', 'earning', 'spend', 'spending', 'expense', 'expenses', 'bill', 'bills', 'payment', 'payments', 'income', 'revenue', 'profit', 'wealth', 'asset', 'assets'],
    icon: '💰',
  },
  // Health & Medical
  {
    category: 'Health & Medical',
    keywords: ['health', 'doctor', 'medical', 'appointment', 'checkup', 'check-up', 'medicine', 'medication', 'therapy', 'therapist', 'mental', 'stress', 'anxiety', 'depression', 'wellness', 'wellbeing', 'hospital', 'clinic', 'treatment', 'heal', 'healing'],
    icon: '🏥',
  },
  // Creative & Hobbies
  {
    category: 'Creative & Hobbies',
    keywords: ['create', 'creating', 'creation', 'art', 'artistic', 'music', 'musical', 'write', 'writing', 'draw', 'drawing', 'design', 'designing', 'hobby', 'hobbies', 'creative', 'creativity', 'paint', 'painting', 'craft', 'crafting', 'photography', 'photo', 'video', 'film', 'movie', 'game', 'gaming', 'play', 'playing'],
    icon: '🎨',
  },
  // Personal Growth & Goals
  {
    category: 'Personal Growth',
    keywords: ['goal', 'goals', 'growth', 'grow', 'improve', 'improvement', 'develop', 'development', 'progress', 'achieve', 'achievement', 'success', 'successful', 'motivation', 'motivate', 'inspire', 'inspiration', 'potential', 'self', 'self-improvement', 'better', 'best', 'excellence', 'transform', 'transformation'],
    icon: '🚀',
  },
  // Home & Organization
  {
    category: 'Home & Organization',
    keywords: ['clean', 'cleaning', 'organize', 'organizing', 'organization', 'home', 'house', 'room', 'rooms', 'tidy', 'tidying', 'arrange', 'arranging', 'declutter', 'decluttering', 'organize', 'organizing', 'storage', 'storage', 'furniture', 'decorate', 'decoration', 'interior', 'design'],
    icon: '🏠',
  },
  // Travel & Adventure
  {
    category: 'Travel & Adventure',
    keywords: ['travel', 'traveling', 'trip', 'trips', 'adventure', 'adventurous', 'explore', 'exploring', 'exploration', 'visit', 'visiting', 'journey', 'vacation', 'holiday', 'tour', 'touring', 'destination', 'destinations', 'map', 'navigate', 'navigation', 'passport', 'flight', 'hotel', 'accommodation'],
    icon: '✈️',
  },
  // Skills & Income
  {
    category: 'Skills & Income',
    keywords: ['skill', 'skills', 'income', 'high income', 'side hustle', 'hustle', 'freelance', 'freelancing', 'gig', 'opportunity', 'opportunities', 'monetize', 'monetization', 'revenue', 'stream', 'passive', 'active', 'business', 'entrepreneurship', 'startup', 'venture'],
    icon: '💡',
  },
  // Social & Relationships
  {
    category: 'Social & Relationships',
    keywords: ['social', 'relationship', 'relationships', 'friend', 'friends', 'family', 'love', 'dating', 'date', 'partner', 'spouse', 'community', 'group', 'team', 'collaboration', 'collaborate', 'together', 'bond', 'bonding', 'connection', 'connect', 'communicate', 'communication'],
    icon: '👥',
  },
  // Mindfulness & Mental Health
  {
    category: 'Mindfulness & Mental Health',
    keywords: ['mindfulness', 'mindful', 'meditation', 'meditate', 'mental', 'mental health', 'wellness', 'wellbeing', 'therapy', 'therapist', 'counseling', 'counselor', 'journal', 'journaling', 'reflect', 'reflection', 'gratitude', 'grateful', 'mindset', 'positive', 'affirmation', 'affirmations'],
    icon: '🧘',
  },
  // Productivity & Time Management
  {
    category: 'Productivity & Time',
    keywords: ['productivity', 'productive', 'time', 'management', 'manage', 'organize', 'schedule', 'scheduling', 'plan', 'planning', 'prioritize', 'prioritization', 'focus', 'focused', 'concentration', 'concentrate', 'efficiency', 'efficient', 'deadline', 'deadlines', 'task', 'tasks', 'todo', 'to-do'],
    icon: '⏰',
  },
];

/**
 * Get the most appropriate icon for a goal based on its title and description
 * @param title - Goal title
 * @param description - Goal description
 * @returns Emoji icon that best matches the goal
 */
export function getGoalIcon(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();

  // Find the best matching icon based on keyword matches
  let bestMatch: IconMapping | null = null;
  let bestMatchCount = 0;

  for (const mapping of ICON_LIBRARY) {
    let matchCount = 0;
    for (const keyword of mapping.keywords) {
      if (text.includes(keyword)) {
        matchCount++;
      }
    }

    // If this mapping has more keyword matches, use it
    if (matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
      bestMatch = mapping;
    }
  }

  // Return the best match, or default to target icon
  return bestMatch ? bestMatch.icon : '🎯';
}

/**
 * Get all available icon categories
 * @returns Array of category names
 */
export function getIconCategories(): string[] {
  return [...new Set(ICON_LIBRARY.map((m) => m.category))];
}

/**
 * Get all icons for a specific category
 * @param category - Category name
 * @returns Array of icons in that category
 */
export function getIconsByCategory(category: string): string[] {
  return ICON_LIBRARY.filter((m) => m.category === category).map((m) => m.icon);
}

/**
 * Get all keywords for a specific icon
 * @param icon - Emoji icon
 * @returns Array of keywords associated with the icon
 */
export function getKeywordsByIcon(icon: string): string[] {
  const mapping = ICON_LIBRARY.find((m) => m.icon === icon);
  return mapping ? mapping.keywords : [];
}
