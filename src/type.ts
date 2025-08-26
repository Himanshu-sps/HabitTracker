/**
 * Represents the user data stored in Firestore and used in the app.
 * Use this type throughout the app for user data.
 */
export interface UserDataType {
  id: string;
  name: string;
  email: string;
  // image?: string | null; // Uncomment if you add user images
}

/**
 * Standard response type for async operations.
 * Use this type throughout the app for API/service responses.
 */
export interface BaseResponseType<T = any> {
  success: boolean;
  data?: T;
  msg?: string;
}

/**
 * Represents a habit document in Firestore.
 */
export interface HabitType {
  id?: string; // Firestore doc id (optional, filled after save)
  userId: string;
  name: string;
  description: string;
  color: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  reminderEnabled: boolean;
  reminderTime?: string; // e.g. '10:00 AM' or ISO time string
  createdAt: string; // ISO string
  completed?: boolean; // Indicates if the habit is completed for today
}

export interface JournalType {
  id?: string;
  userId: string;
  journalEntry: string;
  journalDate: string;
  sentimentLabel: string;
  sentimentScore: number;
  aiTips: string;
  updatedAt: string;
}

export interface SentimentResult {
  mood: MoodType;
  tip: string;
}

export interface MoodType {
  moodLabel: string;
  moodIcon: string;
  moodLevel: number;
}

export interface ChatMsg {
  id: string;
  sender: 'bot' | 'user';
  message?: string;
  moodResult?: SentimentResult;
}
