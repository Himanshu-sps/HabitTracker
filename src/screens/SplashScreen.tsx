import React, { useEffect } from 'react';
import { View, Text, StatusBar, Platform, StyleSheet } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

// Local imports
import { resetAndNavigate } from '@/utils/NavigationUtils';
import { useAppTheme } from '@/utils/ThemeContext';
import { getAppTextStyles } from '@/utils/AppTextStyles';
import { ScreenRoutes } from '@/utils/screen_routes';
import { useAppSelector } from '@/redux/hook';
import { NotificationService } from '@/services/NotificationService';

/**
 * SplashScreen Component
 *
 * The initial loading screen that appears when the app starts.
 * Handles app initialization, user authentication check, and navigation
 * to the appropriate screen based on user state.
 *
 * Features:
 * - App branding and logo display
 * - 3-second loading delay for smooth UX
 * - Automatic navigation based on authentication state
 * - Notification service synchronization for existing users
 * - Platform-specific status bar handling
 */
const SplashScreen = () => {
  // Redux state
  const user = useAppSelector(state => state.authReducer.userData);
  const allHabits = useAppSelector(state => state.habitReducer.allHabits);

  // Theme and styles
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const textStyles = getAppTextStyles(colors);

  // Effects

  /**
   * Effect: Handle app initialization and navigation
   *
   * Process:
   * 1. Waits 3 seconds for smooth loading experience
   * 2. Checks if user is authenticated
   * 3. If authenticated: syncs notifications and navigates to main app
   * 4. If not authenticated: navigates to auth stack
   * 5. Cleans up timeout on component unmount
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (user?.email) {
        // User is authenticated - sync notifications and go to main app
        if (allHabits && allHabits.length > 0) {
          NotificationService.syncHabitNotifications(allHabits);
        }
        resetAndNavigate(ScreenRoutes.MainTab);
      } else {
        // User is not authenticated - go to auth stack
        resetAndNavigate(ScreenRoutes.AuthStack);
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [user, allHabits]);

  // Render methods

  /**
   * Renders the app logo and branding section
   * @returns JSX element for the logo display
   */
  const renderLogoSection = () => (
    <View style={styles.logoCircle}>
      <FontAwesome name="leaf" size={48} color={colors.white} />
    </View>
  );

  /**
   * Renders the app title and tagline
   * @returns JSX element for the text content
   */
  const renderTextContent = () => (
    <>
      <Text style={textStyles.title}>Habit Tracker</Text>
      <Text style={textStyles.subtitle}>Good habits starts here.</Text>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden={Platform.OS !== 'android'} />

      {renderLogoSection()}
      {renderTextContent()}
    </View>
  );
};

export default SplashScreen;

/**
 * Generates styles for the SplashScreen component
 * @param colors - Theme colors object
 * @returns StyleSheet object with component styles
 */
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
