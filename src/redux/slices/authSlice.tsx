import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserDataType } from '@/type';

// Define the type for the auth state
interface AuthState {
  userData: UserDataType | null;
  isLoggedIn: boolean;
}

const initialState: AuthState = {
  userData: null,
  isLoggedIn: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
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
    resetUserData: state => {
      return initialState;
    },
  },
  extraReducers: builder => {},
});

export const { setUserData, resetUserData } = authSlice.actions;
export default authSlice.reducer;
