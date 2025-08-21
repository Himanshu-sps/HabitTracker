import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserDataType } from '@/type';

/**
 * Authentication State Interface
 *
 * Manages user authentication state including user data and login status.
 * This slice handles all authentication-related state management for the habit tracker app.
 */
interface AuthState {
  /** Current user data including profile information, preferences, and settings */
  userData: UserDataType | null;
  /** Boolean flag indicating whether the user is currently logged in */
  isLoggedIn: boolean;
}

/**
 * Initial authentication state
 *
 * Sets default values for authentication state when the app starts
 * or when user logs out.
 */
const initialState: AuthState = {
  userData: null,
  isLoggedIn: false,
};

/**
 * Authentication Slice
 *
 * Redux Toolkit slice that manages authentication state and provides
 * actions for updating user authentication status.
 *
 * @example
 * // Set user data and login status
 * dispatch(setUserData({ userData: user, isLoggedIn: true }));
 *
 * // Reset authentication state (logout)
 * dispatch(resetUserData());
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Sets user data and login status
     *
     * Updates the authentication state with new user information
     * and sets the login status accordingly.
     *
     * @param state - Current authentication state
     * @param action - Payload containing userData and isLoggedIn flag
     */
    setUserData: (
      state,
      action: PayloadAction<{
        userData: UserDataType | null;
        isLoggedIn: boolean;
      }>,
    ) => {
      state.userData = action.payload.userData;
      state.isLoggedIn = action.payload.isLoggedIn;
    },

    /**
     * Resets authentication state to initial values
     *
     * Clears all user data and sets login status to false.
     * Typically used when user logs out or session expires.
     *
     * @param state - Current authentication state
     * @returns Initial authentication state
     */
    resetUserData: state => {
      return initialState;
    },
  },
  extraReducers: builder => {
    // Future async actions can be added here
    // Example: login, logout, refresh token, etc.
  },
});

// Export actions for use in components
export const { setUserData, resetUserData } = authSlice.actions;

// Export reducer for store configuration
export default authSlice.reducer;
