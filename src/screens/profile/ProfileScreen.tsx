import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Local imports
import AppHeader from '@/component/AppHeader';
import { useAppSelector } from '@/redux/hook';
import { useAppTheme } from '@/utils/ThemeContext';
import { navigate } from '@/utils/NavigationUtils';
import { ScreenRoutes } from '@/utils/screen_routes';
import NetworkStatusSnackbar from '@/component/NetworkStatusSnackbar';

/**
 * ProfileScreen Component
 *
 * A user profile screen that displays user information and provides
 * access to various profile-related settings and features.
 *
 * Features:
 * - User avatar and profile information display
 * - Theme selection (Light/Dark mode toggle)
 * - Navigation to journals view
 * - Responsive theme-based styling
 */
const ProfileScreen = () => {
  // Redux state
  const userData = useAppSelector(state => state.authReducer.userData);

  // Theme context
  const { theme, colors, setTheme } = useAppTheme();

  // Styles
  const styles = getStyles(colors);

  // Event handlers

  /**
   * Handles theme change between light and dark modes
   * @param selected - The selected theme ('light' or 'dark')
   */
  const handleThemeChange = (selected: 'light' | 'dark') => {
    setTheme(selected);
  };

  /**
   * Navigates to the View All Journals screen
   */
  const handleViewJournals = () => {
    navigate(ScreenRoutes.ViewAllJournalsScreen);
  };

  // Render methods

  /**
   * Renders the user avatar section
   * @returns JSX element for the avatar display
   */
  const renderAvatarSection = () => (
    <View style={styles.avatarWrapper}>
      <View style={styles.avatarCircle}>
        <Icon name="account" size={90} color={colors.white} />
      </View>
    </View>
  );

  /**
   * Renders the user information section
   * @returns JSX element for user details
   */
  const renderUserInfo = () => (
    <>
      <Text style={styles.name}>{userData?.name || 'User Name'}</Text>
      <Text style={styles.email}>{userData?.email || 'user@email.com'}</Text>
    </>
  );

  /**
   * Renders the theme selection toggle
   * @returns JSX element for theme selection
   */
  const renderThemeSection = () => (
    <View style={styles.listItem}>
      <Text style={styles.listItemText}>Theme</Text>
      <View style={styles.themeToggleRow}>
        <TouchableOpacity
          style={[
            styles.themeOption,
            theme === 'light' && styles.themeOptionSelected,
          ]}
          onPress={() => handleThemeChange('light')}
        >
          <Icon
            name="white-balance-sunny"
            size={20}
            color={theme === 'light' ? colors.primary : colors.subtitle}
          />
          <Text
            style={[
              styles.themeOptionText,
              theme === 'light' && styles.themeOptionTextSelected,
            ]}
          >
            Light
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.themeOption,
            theme === 'dark' && styles.themeOptionSelected,
          ]}
          onPress={() => handleThemeChange('dark')}
        >
          <Icon
            name="weather-night"
            size={20}
            color={theme === 'dark' ? colors.primary : colors.subtitle}
          />
          <Text
            style={[
              styles.themeOptionText,
              theme === 'dark' && styles.themeOptionTextSelected,
            ]}
          >
            Dark
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Renders the journals navigation item
   * @returns JSX element for journals navigation
   */
  const renderJournalsSection = () => (
    <TouchableOpacity style={styles.listItem} onPress={handleViewJournals}>
      <Text style={styles.listItemText}>View All Journals</Text>
      <Icon name="chevron-right" size={26} color={colors.text} />
    </TouchableOpacity>
  );

  /**
   * Renders the main content list section
   * @returns JSX element for the content list
   */
  const renderContentList = () => (
    <View style={styles.listSection}>
      {renderThemeSection()}
      {renderJournalsSection()}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <NetworkStatusSnackbar />
      <AppHeader title="Profile" showBackButton />

      {renderAvatarSection()}
      {renderUserInfo()}
      {renderContentList()}
    </SafeAreaView>
  );
};

export default ProfileScreen;

/**
 * Generates styles for the ProfileScreen component
 * @param colors - Theme colors object
 * @returns StyleSheet object with component styles
 */
function getStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    backButton: {
      padding: 8,
    },
    avatarWrapper: {
      alignItems: 'center',
      margin: 18,
    },
    avatarCircle: {
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    name: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 4,
    },
    email: {
      fontSize: 16,
      color: colors.subtitle,
      textAlign: 'center',
      marginBottom: 28,
    },
    listSection: {
      width: '100%',
      backgroundColor: 'transparent',
      paddingHorizontal: 0,
      marginTop: 0,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 28,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.inputBorder,
      backgroundColor: 'transparent',
    },
    listItemText: {
      fontSize: 17,
      color: colors.text,
      fontWeight: '500',
    },
    themeToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    themeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 16,
      backgroundColor: colors.inputBg,
      marginHorizontal: 2,
    },
    themeOptionSelected: {
      backgroundColor: colors.primary + '22',
    },
    themeOptionText: {
      marginLeft: 4,
      color: colors.subtitle,
      fontWeight: '500',
      fontSize: 15,
    },
    themeOptionTextSelected: {
      color: colors.primary,
      fontWeight: 'bold',
    },
    logoutButton: {
      marginTop: 32,
      alignSelf: 'center',
      backgroundColor: colors.error,
      paddingHorizontal: 48,
      paddingVertical: 14,
      borderRadius: 24,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    logoutButtonText: {
      color: colors.white,
      fontSize: 17,
      fontWeight: 'bold',
      letterSpacing: 0.2,
    },
  });
}
