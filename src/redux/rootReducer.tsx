import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '@/redux/slices/authSlice';
import habitReducer from '@/redux/slices/habitSlice';

const rootReducer = combineReducers({
  authReducer: authReducer,
  habitReducer: habitReducer,
});

export default rootReducer;
