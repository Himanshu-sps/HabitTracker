import { UserDataType, BaseResponseType, HabitType, JournalType } from '@/type';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment';

const usersCollection = firestore().collection('users');
const habitsCollection = firestore().collection('habits');
const journalsCollection = firestore().collection('journals');

// ========================================================================
// AUTHENTICATION
// ========================================================================

/**
 * Creates a new user with email and password and stores user data in Firestore.
 */
export const firebaseSignUp = async (
  name: string,
  email: string,
  password: string,
): Promise<BaseResponseType> => {
  try {
    const response = await getAuth().createUserWithEmailAndPassword(
      email,
      password,
    );
    const userData: UserDataType = {
      id: response.user.uid,
      name,
      email,
    };
    await usersCollection.doc(response.user.uid).set(userData);
    return { success: true, data: userData, msg: 'User created successfully' };
  } catch (error: any) {
    const msg =
      error.code === 'auth/email-already-in-use'
        ? 'Email already registered'
        : error.message;
    return { success: false, msg };
  }
};

/**
 * Signs in a user with email and password.
 */
export const firebaseLogin = async (
  email: string,
  password: string,
): Promise<BaseResponseType> => {
  try {
    await getAuth().signInWithEmailAndPassword(email, password);
    return { success: true, msg: 'Logged in successfully' };
  } catch (error: any) {
    const msg =
      error.code === 'auth/invalid-credential'
        ? 'Invalid credentials'
        : error.message;
    return { success: false, msg };
  }
};

/**
 * Logs out the current user.
 */
export const firebaseLogout = async (): Promise<BaseResponseType> => {
  try {
    await getAuth().signOut();
    return { success: true, msg: 'Logged out successfully' };
  } catch (error: any) {
    return { success: false, msg: error.message || 'Logout failed' };
  }
};

// ========================================================================
// HABITS
// ========================================================================

/**
 * A reusable query for fetching habits for a user.
 */
const getHabitsQuery = (userId: string) =>
  habitsCollection.where('userId', '==', userId).orderBy('createdAt', 'desc');

/**
 * Adds a new habit to Firestore.
 */
export const addHabitToFirestore = async (
  habit: Omit<HabitType, 'id' | 'createdAt'>,
): Promise<BaseResponseType> => {
  try {
    const docRef = await habitsCollection.add({
      ...habit,
      createdAt: new Date().toISOString(),
    });
    return {
      success: true,
      data: { ...habit, id: docRef.id, createdAt: new Date().toISOString() },
      msg: 'Habit added successfully',
    };
  } catch (error: any) {
    return { success: false, msg: error.message || 'Failed to add habit' };
  }
};

/**
 * Updates an existing habit in Firestore.
 */
export const updateHabitInFirestore = async (
  habit: HabitType,
): Promise<BaseResponseType> => {
  try {
    if (!habit.id) throw new Error('Habit ID is missing');
    await habitsCollection.doc(habit.id).update(habit);
    return { success: true, msg: 'Habit updated successfully' };
  } catch (error: any) {
    return { success: false, msg: error.message || 'Failed to update habit' };
  }
};

/**
 * Subscribes to real-time updates for a user's habits.
 */
export const subscribeToHabitsForUser = (
  userId: string,
  onUpdate: (habits: HabitType[]) => void,
) => {
  const query = getHabitsQuery(userId);
  return query.onSnapshot(snapshot => {
    const habits = snapshot.docs.map(
      doc => ({ id: doc.id, ...doc.data() } as HabitType),
    );
    onUpdate(habits);
  });
};

// ========================================================================
// HABIT COMPLETION & STREAKS
// ========================================================================

/**
 * Gets the sub-collection of completed habits for a user.
 */
const getCompletedHabitsCollection = (userId: string) =>
  usersCollection.doc(userId).collection('completedHabits');

/**
 * Tracks the completion of a habit for a user on a specific date.
 */
export const trackHabitCompletion = async (
  userId: string,
  habitId: string,
  trackingDate: string,
): Promise<BaseResponseType> => {
  try {
    const docId = `${habitId}_${trackingDate}`;
    await getCompletedHabitsCollection(userId).doc(docId).set({
      habitId,
      date: trackingDate,
    });
    return { success: true, msg: 'Habit completion tracked' };
  } catch (error: any) {
    return { success: false, msg: error.message || 'Failed to track' };
  }
};

/**
 * Subscribes to real-time updates for completed habit IDs for a user on a specific date.
 */
export const subscribeToCompletedHabitsForDate = (
  userId: string,
  date: string,
  onUpdate: (completedHabitIds: string[]) => void,
) => {
  const query = getCompletedHabitsCollection(userId).where('date', '==', date);
  return query.onSnapshot(snapshot => {
    const completedHabitIds = snapshot.docs.map(doc => doc.data().habitId);
    onUpdate(completedHabitIds);
  });
};

/**
 * Fetches all completion dates for a specific habit.
 */
export async function fetchCompletedHabitsForHabit(
  userId: string,
  habitId: string,
): Promise<string[]> {
  try {
    const snapshot = await getCompletedHabitsCollection(userId)
      .where('habitId', '==', habitId)
      .orderBy('date', 'asc')
      .get();
    return snapshot.docs.map(doc => doc.data().date);
  } catch (error) {
    console.error('Error fetching completed habits for habit:', error);
    return [];
  }
}

/**
 * Calculates the current and best streaks from a sorted list of dates.
 */
export function calculateStreaks(dates: string[]): {
  currentStreak: number;
  bestStreak: number;
} {
  if (dates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const sortedMoments = dates
    .map(d => moment(d, 'YYYY-MM-DD'))
    .sort((a, b) => a.diff(b));

  let currentStreak = 1;
  let bestStreak = 1;

  for (let i = 1; i < sortedMoments.length; i++) {
    const diff = sortedMoments[i].diff(sortedMoments[i - 1], 'days');
    if (diff === 1) {
      currentStreak++;
    } else if (diff > 1) {
      currentStreak = 1; // Reset streak
    }
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }
  }

  // Check if the streak is active up to today
  const lastCompletion = sortedMoments[sortedMoments.length - 1];
  const today = moment();
  if (
    !lastCompletion.isSame(today, 'day') &&
    !lastCompletion.isSame(today.clone().subtract(1, 'day'), 'day')
  ) {
    currentStreak = 0;
  }

  return { currentStreak, bestStreak };
}

/**
 * Fetches the streak data for a specific habit.
 */
export async function getHabitStreaks(
  userId: string,
  habitId: string,
): Promise<{
  currentStreak: number;
  bestStreak: number;
  completedDays: number;
}> {
  const completedDates = await fetchCompletedHabitsForHabit(userId, habitId);
  const streaks = calculateStreaks(completedDates);
  return {
    ...streaks,
    completedDays: completedDates.length,
  };
}

/**
 * Deletes a habit and all its completion records.
 */
export const deleteHabitsForUser = async (
  habit: HabitType,
  userId: string,
): Promise<BaseResponseType> => {
  try {
    if (!habit.id) throw new Error('Habit ID is missing');
    const batch = firestore().batch();
    batch.delete(habitsCollection.doc(habit.id));

    const trackingSnapshot = await getCompletedHabitsCollection(userId)
      .where('habitId', '==', habit.id)
      .get();
    trackingSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
    return { success: true, msg: 'Habit deleted successfully' };
  } catch (error: any) {
    return { success: false, msg: error.message || 'Failed to delete habit' };
  }
};

// ========================================================================
// JOURNALS
// ========================================================================

/**
 * Creates or updates a journal entry for a specific date.
 */
export const saveJournalEntry = async (
  journal: Omit<JournalType, 'id'>,
): Promise<JournalType> => {
  const { userId, journalDate } = journal;
  const docId = `${userId}_${journalDate}`;
  const docRef = journalsCollection.doc(docId);
  await docRef.set(journal, { merge: true });
  const updatedDoc = await docRef.get();
  return { id: docRef.id, ...updatedDoc.data() } as JournalType;
};

/**
 * Fetches a single journal entry for a user and date.
 */
export const fetchJournalEntry = async (
  userId: string,
  journalDate: string,
): Promise<JournalType | null> => {
  const snapshot = await journalsCollection
    .where('userId', '==', userId)
    .where('journalDate', '==', journalDate)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as JournalType;
};

/**
 * Fetches all journal entries for a user within a date range.
 */
export const fetchJournalsForUserInRange = async (
  userId: string,
  startDate: string,
  endDate: string,
): Promise<BaseResponseType<JournalType[]>> => {
  try {
    const snapshot = await journalsCollection
      .where('userId', '==', userId)
      .where('journalDate', '>=', startDate)
      .where('journalDate', '<=', endDate)
      .orderBy('journalDate', 'asc')
      .get();
    const journals = snapshot.docs.map(
      doc => ({ id: doc.id, ...doc.data() } as JournalType),
    );
    return { success: true, data: journals };
  } catch (error: any) {
    return { success: false, msg: error.message || 'Failed to fetch journals' };
  }
};

export const fetchAllJournalsForUser = async (
  userId: string,
): Promise<BaseResponseType<JournalType[]>> => {
  try {
    const snapshot = await journalsCollection
      .where('userId', '==', userId)
      .orderBy('journalDate', 'desc')
      .get();

    const journals = snapshot.docs.map(
      doc => ({ id: doc.id, ...doc.data() } as JournalType),
    );

    return { success: true, data: journals };
  } catch (error: any) {
    return { success: false, msg: error.message || 'Failed to fetch journals' };
  }
};

export const deleteJournalEntry = async (userId: string, journalId: string) => {
  try {
    await journalsCollection.doc(journalId).delete();
    return { success: true };
  } catch (error: any) {
    return { success: false, msg: error.message || 'Delete failed' };
  }
};
