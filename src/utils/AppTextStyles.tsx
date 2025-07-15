// Common text styles for use across the app
import { StyleSheet } from 'react-native';
import AppColors from './AppColors';

export const AppTextStyles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.text,
  },
  subtitle: {
    fontSize: 18,
    color: AppColors.text,
    fontWeight: 'bold',
  },
  body: {
    fontSize: 16,
    color: AppColors.text,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    color: AppColors.text,
  },
  small: {
    fontSize: 12,
    color: AppColors.text,
  },
});
