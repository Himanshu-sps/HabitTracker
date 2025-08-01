import { MoodType } from '@/type';

//export const OPENAI_API_KEY =
//  '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';
export const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
export const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

export const moodList: MoodType[] = [
  {
    moodLabel: 'Very Happy',
    moodIcon: `😁`,
    moodLevel: 1,
  },
  {
    moodLabel: 'Happy',
    moodIcon: `😊`,
    moodLevel: 2,
  },
  {
    moodLabel: 'Neutral',
    moodIcon: `😐`,
    moodLevel: 3,
  },
  {
    moodLabel: 'Sad',
    moodIcon: `🙁`,
    moodLevel: 4,
  },
  {
    moodLabel: 'Angry',
    moodIcon: `😡`,
    moodLevel: 5,
  },
];

export const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const STREAK_CHALLENGES = [
  {
    days: 1,
    badge: '🥉',
    description: 'Complete a habit for 1 day.',
  },
  {
    days: 7,
    badge: '🥈',
    description: 'Complete a habit for 7 days in a row.',
  },
  {
    days: 15,
    badge: '🥇',
    description: 'Complete a habit for 15 days in a row.',
  },
  {
    days: 30,
    badge: '🏆',
    description: 'Complete a habit for 30 days in a row.',
  },
  {
    days: 60,
    badge: '💎',
    description: 'Complete a habit for 60 days in a row.',
  },
];
