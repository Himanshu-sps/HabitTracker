// Common text styles for use across the app
import { StyleSheet } from 'react-native';

export const getAppTextStyles = (colors: any) =>
  StyleSheet.create({
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
    },
    subtitle: {
      fontSize: 18,
      color: colors.text,
      fontWeight: 'bold',
    },
    body: {
      fontSize: 16,
      color: colors.text,
      fontWeight: 'bold',
    },
    label: {
      fontSize: 14,
      color: colors.text,
    },
    small: {
      fontSize: 12,
      color: colors.text,
    },
    greetingHello: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.white,
      marginBottom: 4,
    },
    greetingName: {
      fontSize: 22,
      color: colors.primary,
      fontWeight: 'bold',
      textTransform: 'capitalize',
    },
  });
