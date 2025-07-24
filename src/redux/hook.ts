import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { AppRootState, AppDispatch } from './store';

export const useAppSelector: TypedUseSelectorHook<AppRootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();
