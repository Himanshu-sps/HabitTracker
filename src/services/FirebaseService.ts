import { UserDataType, BaseResponseType, HabitType, JournalType } from '@/type';
import { getAuth } from '@react-native-firebase/auth';
import { fetch } from '@react-native-community/netinfo';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  onSnapshot,
  limit,
  writeBatch,
} from '@react-native-firebase/firestore';
import { getApp } from '@react-native-firebase/app';
import moment from 'moment';

// Firestore instance and collections
const db = getFirestore(getApp());
const usersCollection = collection(db, 'users');
const habitsCollection = collection(db, 'habits');
const journalsCollection = collection(db, 'journals');

// ========================================================================
// AUTHENTICATION SERVICES
// ========================================================================

/**
 * Creates a new user account with email and password
 *
 * @param name - User's display name
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with success status and user data or error message
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
    await setDoc(doc(usersCollection, response.user.uid), userData);
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
 * Authenticates a user with email and password
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with success status and message
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
 * Signs out the currently authenticated user
 *
 * @returns Promise with success status and message
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
// HABIT MANAGEMENT SERVICES
// ========================================================================

/**
 * Creates a reusable query for fetching habits for a specific user
 *
 * @param userId - The user's unique identifier
 * @returns Firestore query object
 */
const getHabitsQuery = (userId: string) =>
  query(
    habitsCollection,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );

/**
 * Adds a new habit to Firestore
 *
 * @param habit - Habit data without ID and createdAt fields
 * @returns Promise with success status and created habit data or error message
 */
export const addHabitToFirestore = async (
  habit: Omit<HabitType, 'id' | 'createdAt'>,
): Promise<BaseResponseType> => {
  try {
    const netState = await fetch();
    const isConnected = netState?.isConnected;
    const newBody = {
      ...habit,
      createdAt: new Date().toISOString(),
    };

    let docRef;
    if (isConnected) {
      docRef = await addDoc(habitsCollection, newBody);
    } else {
      docRef = addDoc(habitsCollection, newBody);
    }

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
 * Updates an existing habit in Firestore
 *
 * @param habit - Complete habit object with ID
 * @returns Promise with success status and message
 */
export const updateHabitInFirestore = async (
  habit: HabitType,
): Promise<BaseResponseType> => {
  try {
    if (!habit.id) throw new Error('Habit ID is missing');

    const netState = await fetch();
    const isConnected = netState?.isConnected;

    if (isConnected) {
      await updateDoc(doc(habitsCollection, habit.id), habit);
    } else {
      // When offline, just queue the update operation
      // Firebase will handle the sync when network is available
      updateDoc(doc(habitsCollection, habit.id), habit);
    }

    return { success: true, msg: 'Habit updated successfully' };
  } catch (error: any) {
    return { success: false, msg: error.message || 'Failed to update habit' };
  }
};

/**
 * Subscribes to real-time updates for a user's habits
 *
 * @param userId - The user's unique identifier
 * @param onUpdate - Callback function to handle habit updates
 * @returns Unsubscribe function for the listener
 */
export const subscribeToHabitsForUser = (
  userId: string,
  onUpdate: (habits: HabitType[]) => void,
) => {
  const habitsQuery = getHabitsQuery(userId);
  return onSnapshot(habitsQuery, snapshot => {
    const habits = snapshot.docs.map(
      (docSnap: any) => ({ id: docSnap.id, ...docSnap.data() } as HabitType),
    );
    onUpdate(habits);
  });
};

// ========================================================================
// HABIT COMPLETION & STREAK SERVICES
// ========================================================================

/**
 * Gets the sub-collection reference for completed habits for a user
 *
 * @param userId - The user's unique identifier
 * @returns Firestore collection reference
 */
const getCompletedHabitsCollection = (userId: string) =>
  collection(db, 'users', userId, 'completedHabits');

/**
 * Tracks the completion of a habit for a user on a specific date
 *
 * @param userId - The user's unique identifier
 * @param habitId - The habit's unique identifier
 * @param trackingDate - Date string in YYYY-MM-DD format
 * @returns Promise with success status and message
 */
export const trackHabitCompletion = async (
  userId: string,
  habitId: string,
  trackingDate: string,
): Promise<BaseResponseType> => {
  try {
    const docId = `${habitId}_${trackingDate}`;
    await setDoc(doc(getCompletedHabitsCollection(userId), docId), {
      habitId,
      date: trackingDate,
    });
    return { success: true, msg: 'Habit completion tracked' };
  } catch (error: any) {
    return { success: false, msg: error.message || 'Failed to track' };
  }
};

/**
 * Subscribes to real-time updates for completed habit IDs for a user on a specific date
 *
 * @param userId - The user's unique identifier
 * @param date - Date string in YYYY-MM-DD format
 * @param onUpdate - Callback function to handle completion updates
 * @returns Unsubscribe function for the listener
 */
export const subscribeToCompletedHabitsForDate = (
  userId: string,
  date: string,
  onUpdate: (completedHabitIds: string[]) => void,
) => {
  const completedHabitsQuery = query(
    getCompletedHabitsCollection(userId),
    where('date', '==', date),
  );
  return onSnapshot(completedHabitsQuery, snapshot => {
    const completedHabitIds = snapshot.docs.map(
      (docSnap: any) => docSnap.data().habitId,
    );
    onUpdate(completedHabitIds);
  });
};

/**
 * Fetches all completion dates for a specific habit
 *
 * @param userId - The user's unique identifier
 * @param habitId - The habit's unique identifier
 * @returns Promise with success status and array of completion dates
 */
export async function fetchCompletedHabitsForHabit(
  userId: string,
  habitId: string,
): Promise<BaseResponseType<string[]>> {
  try {
    const completedHabitsQuery = query(
      getCompletedHabitsCollection(userId),
      where('habitId', '==', habitId),
      orderBy('date', 'asc'),
    );
    const snapshot = await getDocs(completedHabitsQuery);
    const dates = snapshot.docs.map((docSnap: any) => docSnap.data().date);
    return { success: true, data: dates };
  } catch (error: any) {
    console.error('Error fetching completed habits for habit:', error);
    return {
      success: false,
      msg: error?.message || 'Error fetching completed habits for habit',
      data: [],
    };
  }
}

/**
 * Calculates the current and best streaks from a sorted list of completion dates
 *
 * @param dates - Array of completion date strings in YYYY-MM-DD format
 * @returns Object containing current and best streak counts
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
 * Fetches the complete streak data for a specific habit
 *
 * @param userId - The user's unique identifier
 * @param habitId - The habit's unique identifier
 * @returns Promise with success status and streak data including completion count
 */
export async function getHabitStreaks(
  userId: string,
  habitId: string,
): Promise<
  BaseResponseType<{
    currentStreak: number;
    bestStreak: number;
    completedDays: number;
  }>
> {
  const completedRes = await fetchCompletedHabitsForHabit(userId, habitId);
  const completedDates = completedRes.data || [];
  const streaks = calculateStreaks(completedDates);
  return {
    success: completedRes.success,
    msg: completedRes.msg,
    data: {
      ...streaks,
      completedDays: completedDates.length,
    },
  };
}

/**
 * Deletes a habit and all its completion records using a batch operation
 *
 * @param habit - The habit object to delete
 * @param userId - The user's unique identifier
 * @returns Promise with success status and message
 */
export const deleteHabitsForUser = async (
  habit: HabitType,
  userId: string,
): Promise<BaseResponseType> => {
  try {
    if (!habit.id) throw new Error('Habit ID is missing');
    const batch = writeBatch(db);
    batch.delete(doc(habitsCollection, habit.id));

    const trackingQuery = query(
      getCompletedHabitsCollection(userId),
      where('habitId', '==', habit.id),
    );
    const trackingSnapshot = await getDocs(trackingQuery);
    trackingSnapshot.docs.forEach((docSnap: any) => batch.delete(docSnap.ref));

    await batch.commit();
    return { success: true, msg: 'Habit deleted successfully' };
  } catch (error: any) {
    return { success: false, msg: error.message || 'Failed to delete habit' };
  }
};

/**
 * Deletes a completed habit record for a specific user, habit, and date
 *
 * @param userId - The user's unique identifier
 * @param habitId - The habit's unique identifier
 * @param date - Date string in YYYY-MM-DD format
 * @returns Promise with success status and message
 */
export const deleteHabitCompletionForDate = async (
  userId: string,
  habitId: string,
  date: string,
): Promise<BaseResponseType> => {
  try {
    const docId = `${habitId}_${date}`;
    await deleteDoc(doc(getCompletedHabitsCollection(userId), docId));
    return { success: true, msg: 'Deleted habit completion for date' };
  } catch (error: any) {
    return { success: false, msg: error?.message || 'Failed to delete record' };
  }
};

// ========================================================================
// JOURNAL MANAGEMENT SERVICES
// ========================================================================

/**
 * Creates or updates a journal entry for a specific date
 *
 * @param journal - Journal data without ID field
 * @returns Promise with success status and saved journal data or error message
 */
export const saveJournalEntry = async (
  journal: Omit<JournalType, 'id'>,
): Promise<BaseResponseType<JournalType>> => {
  try {
    const { userId, journalDate } = journal;
    const docId = `${userId}_${journalDate}`;
    const docRef = doc(journalsCollection, docId);
    await setDoc(docRef, journal, { merge: true });
    const updatedDoc = await getDocs(
      query(journalsCollection, where('__name__', '==', docId)),
    );
    const updatedData = updatedDoc.docs[0]?.data();
    return {
      success: true,
      data: { id: docId, ...updatedData } as JournalType,
      msg: 'Journal saved',
    };
  } catch (error: any) {
    return { success: false, msg: error?.message || 'Failed to save journal' };
  }
};

/**
 * Fetches a single journal entry for a user and specific date
 *
 * @param userId - The user's unique identifier
 * @param journalDate - Date string in YYYY-MM-DD format
 * @returns Promise with success status and journal data or null if not found
 */
export const fetchJournalEntry = async (
  userId: string,
  journalDate: string,
): Promise<BaseResponseType<JournalType | null>> => {
  try {
    const journalQuery = query(
      journalsCollection,
      where('userId', '==', userId),
      where('journalDate', '==', journalDate),
      limit(1),
    );
    const snapshot = await getDocs(journalQuery);
    if (snapshot.empty)
      return { success: true, data: null, msg: 'No journal for date' };
    const docSnap = snapshot.docs[0];
    return {
      success: true,
      data: { id: docSnap.id, ...docSnap.data() } as JournalType,
    };
  } catch (error: any) {
    return { success: false, msg: error?.message || 'Failed to fetch journal' };
  }
};

/**
 * Fetches all journal entries for a user within a specified date range
 *
 * @param userId - The user's unique identifier
 * @param startDate - Start date string in YYYY-MM-DD format
 * @param endDate - End date string in YYYY-MM-DD format
 * @returns Promise with success status and array of journal entries
 */
export const fetchJournalsForUserInRange = async (
  userId: string,
  startDate: string,
  endDate: string,
): Promise<BaseResponseType<JournalType[]>> => {
  try {
    const journalsQuery = query(
      journalsCollection,
      where('userId', '==', userId),
      where('journalDate', '>=', startDate),
      where('journalDate', '<=', endDate),
      orderBy('journalDate', 'asc'),
    );
    const snapshot = await getDocs(journalsQuery);
    const journals = snapshot.docs.map(
      (docSnap: any) => ({ id: docSnap.id, ...docSnap.data() } as JournalType),
    );
    return { success: true, data: journals };
  } catch (error: any) {
    return { success: false, msg: error.message || 'Failed to fetch journals' };
  }
};

/**
 * Fetches all journal entries for a user, ordered by date (newest first)
 *
 * @param userId - The user's unique identifier
 * @returns Promise with success status and array of all journal entries
 */
export const fetchAllJournalsForUser = async (
  userId: string,
): Promise<BaseResponseType<JournalType[]>> => {
  try {
    const journalsQuery = query(
      journalsCollection,
      where('userId', '==', userId),
      orderBy('journalDate', 'desc'),
    );
    const snapshot = await getDocs(journalsQuery);
    const journals = snapshot.docs.map(
      (docSnap: any) => ({ id: docSnap.id, ...docSnap.data() } as JournalType),
    );
    return { success: true, data: journals };
  } catch (error: any) {
    return { success: false, msg: error.message || 'Failed to fetch journals' };
  }
};

/**
 * Deletes a specific journal entry by ID
 *
 * @param userId - The user's unique identifier
 * @param journalId - The journal entry's unique identifier
 * @returns Promise with success status and message
 */
export const deleteJournalEntry = async (
  userId: string,
  journalId: string,
): Promise<BaseResponseType> => {
  try {
    await deleteDoc(doc(journalsCollection, journalId));
    return { success: true, msg: 'Journal deleted' };
  } catch (error: any) {
    return { success: false, msg: error.message || 'Delete failed' };
  }
};
