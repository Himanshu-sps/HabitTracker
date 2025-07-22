import { View, Text, StatusBar, Platform, StyleSheet } from 'react-native';
import React, { useEffect } from 'react';
import { resetAndNavigate } from '@/utils/NavigationUtils';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAppTheme } from '@/utils/ThemeContext';
import { getAppTextStyles } from '@/utils/AppTextStyles';
import { ScreenRoutes } from '@/utils/screen_routes';
import { useAppSelector } from '@/redux/hook';

const SplashScreen = () => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const textStyles = getAppTextStyles(colors);
  const user = useAppSelector(state => state.authReducer.userData);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      {
        user?.email
          ? resetAndNavigate(ScreenRoutes.MainTab)
          : resetAndNavigate(ScreenRoutes.AuthStack);
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [user]);

  return (
    <View style={styles.container}>
      <StatusBar hidden={Platform.OS !== 'android'} />
      <View style={styles.logoCircle}>
        <FontAwesome name="leaf" size={48} color={colors.white} />
      </View>
      <Text style={textStyles.title}>Habit Tracker</Text>
      <Text style={textStyles.subtitle}>Good habits starts here.</Text>
    </View>
  );
};

export default SplashScreen;

function getStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 16,
      letterSpacing: 1,
    },
    tagline: {
      color: colors.subtitle,
      fontSize: 16,
      fontWeight: '400',
      marginBottom: 4,
      opacity: 0.85,
      textAlign: 'center',
    },
  });
}
