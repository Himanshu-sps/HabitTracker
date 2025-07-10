import { UserDataType, BaseResponseType } from '@/type';
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
