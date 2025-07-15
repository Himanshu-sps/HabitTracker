import { UserDataType, BaseResponseType, HabitType } from '@/type';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

/**
 *
 * @param name
 * @param email
 * @param password
 * @returns
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

    // make user object
    const userData: UserDataType = {
      id: response?.user?.uid,
      name: name,
      email: email,
    };

    // store in the collection
    await firestore()
      .collection('users')
      .doc(response?.user?.uid)
      .set(userData);

    return {
      success: true,
      data: userData,
      msg: 'data stored successfully',
    };
  } catch (error: any) {
    let msg = 'Something went wrong';
    // Use error.code for robust error handling
    switch (error.code) {
      case 'auth/email-already-in-use':
        msg = 'Email already registered';
        break;
      case 'auth/invalid-email':
        msg = 'Invalid email';
        break;
      case 'auth/network-request-failed':
        msg = 'Network error, please try again';
        break;
      // Add more cases as needed
      default:
        if (error.message) msg = error.message;
        break;
    }

    return {
      success: false,
      msg: msg,
    };
  }
};

/**
 *
 * @param email
 * @param password
 * @returns
 */
export const firebaseLogin = async (
  email: string,
  password: string,
): Promise<BaseResponseType> => {
  try {
    const response = await getAuth().signInWithEmailAndPassword(
      email,
      password,
    );

    return {
      success: true,
      msg: 'logged in successfully',
    };
  } catch (error: any) {
    let msg = 'Something went wrong';
    // Use error.code for robust error handling
    switch (error.code) {
      case 'auth/invalid-credential':
        msg = 'Invalid credentials';
        break;
      case 'auth/network-request-failed':
        msg = 'Network error, please try again';
        break;
      // Add more cases as needed
      default:
        if (error.message) msg = error.message;
        break;
    }

    return {
      success: false,
      msg: msg,
    };
  }
};

/**
 * Logs out the current user from Firebase Auth.
 * @returns {Promise<BaseResponseType>} Success or error response
 */
export const firebaseLogout = async (): Promise<BaseResponseType> => {
  try {
    await getAuth().signOut();
    return {
      success: true,
      msg: 'Logged out successfully',
    };
  } catch (error: any) {
    let msg = 'Something went wrong';
    switch (error.code) {
      case 'auth/network-request-failed':
        msg = 'Network error, please try again';
        break;
      default:
        if (error.message) msg = error.message;
        break;
    }
    return {
      success: false,
      msg: msg,
    };
  }
};

/**
 * Adds a new habit to Firestore for the current user.
 * @param habit HabitType (without id/createdAt, those will be set here)
 * @returns BaseResponseType
 */
export const addHabitToFirestore = async (
  habit: Omit<HabitType, 'id' | 'createdAt'>,
): Promise<BaseResponseType> => {
  try {
    const docRef = await firestore()
      .collection('habits')
      .add({
        ...habit,
        createdAt: new Date().toISOString(),
      });
    return {
      success: true,
      data: { ...habit, id: docRef.id, createdAt: new Date().toISOString() },
      msg: 'Habit added successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      msg: error.message || 'Failed to add habit',
    };
  }
};

/**
 * Fetches all habits for a given userId from Firestore.
 * @param userId The user's unique ID
 * @returns BaseResponseType with an array of HabitType
 */
export const fetchHabitsForUser = async (
  userId: string,
): Promise<BaseResponseType<HabitType[]>> => {
  try {
    const snapshot = await firestore()
      .collection('habits')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    const habits: HabitType[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<HabitType, 'id'>),
    }));
    return {
      success: true,
      data: habits,
    };
  } catch (error: any) {
    return {
      success: false,
      msg: error.message || 'Failed to fetch habits',
    };
  }
};

/**
 * Subscribes to real-time updates for all habits for a given userId from Firestore.
 * @param userId The user's unique ID
 * @param onUpdate Callback to receive the updated array of HabitType
 * @returns Unsubscribe function
 */
export const subscribeToHabitsForUser = (
  userId: string,
  onUpdate: (habits: HabitType[]) => void,
) => {
  return firestore()
    .collection('habits')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const habits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<HabitType, 'id'>),
      }));
      onUpdate(habits);
    });
};

/**
 * Tracks the completion of a habit for a user on a specific date.
 * Adds an entry to the 'habitTracking' collection in Firestore.
 * @param userId The user's unique ID
 * @param habitId The habit's unique ID
 * @param trackingDate The date of completion in Zero format
 * @returns BaseResponseType
 */
export const trackHabitCompletion = async (
  userId: string,
  habitId: string,
  trackingDate: string,
): Promise<BaseResponseType> => {
  try {
    await firestore().collection('habitTracking').add({
      userId,
      habitId,
      trackingDate,
    });
    return {
      success: true,
      msg: 'Habit completion tracked successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      msg: error.message || 'Failed to track habit completion',
    };
  }
};

/**
 * Fetches all completed habit IDs for a user on a specific date from habitTracking collection.
 * @param userId The user's unique ID
 * @param date The date to check (in DATE_FORMAT_ZERO)
 * @returns Promise<string[]> Array of completed habit IDs
 */
export const fetchCompletedHabitsForUserOnDate = async (
  userId: string,
  date: string,
): Promise<string[]> => {
  try {
    const snapshot = await firestore()
      .collection('habitTracking')
      .where('userId', '==', userId)
      .where('trackingDate', '==', date)
      .get();
    return snapshot.docs.map(doc => doc.data().habitId);
  } catch (error) {
    return [];
  }
};

export const deleteHabitsForUser = async (
  habit: HabitType,
  userId: string,
): Promise<BaseResponseType> => {
  try {
    if (!habit.id) {
      throw new Error('Habit ID is missing');
    }

    const batch = firestore().batch();

    const habitRef = firestore().collection('habits').doc(habit.id);
    batch.delete(habitRef);

    const trackingSnapshot = await firestore()
      .collection('habitTracking')
      .where('habitId', '==', habit.id)
      .where('userId', '==', userId)
      .get();

    trackingSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return {
      success: true,
      msg: 'Habit deleted successfully.',
    };
  } catch (error: any) {
    return {
      success: false,
      msg: error.message || 'Failed to delete habit.',
    };
  }
};
