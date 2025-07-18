import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '@/redux/slices/authSlice';
import habitReducer from '@/redux/slices/habitSlice';
import journalReducer from '@/redux/slices/journalSlice';
import motivationReducer from '@/redux/slices/motivationSlice';

const rootReducer = combineReducers({
  authReducer: authReducer,
  habitReducer: habitReducer,
  journalReducer: journalReducer,
  motivation: motivationReducer,
});

export default rootReducer;
