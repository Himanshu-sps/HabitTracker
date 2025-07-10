import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '@/redux/slices/authSlice';

const rootReducer = combineReducers({
  authReducer: authReducer,
});

export default rootReducer;
