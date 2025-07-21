import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/utils/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppSelector, useAppDispatch } from '@/redux/hook';
import { firebaseLogout } from '@/services/FirebaseService';
import { resetUserData } from '@/redux/slices/authSlice';
import { resetAndNavigate } from '@/utils/NavigationUtils';
import { ScreenRoutes } from '@/utils/screen_routes';

const ProfileScreen = () => {
  const userData = useAppSelector(state => state.authReducer.userData);
  const { theme, colors, setTheme } = useTheme();
  const dispatch = useAppDispatch();

  const handleThemeChange = (selected: 'light' | 'dark') => {
    setTheme(selected);
  };

  const handleViewJournals = () => {
    // TODO: Navigate to MyJournalsScreen
  };

  const handleLogout = async () => {
    const res = await firebaseLogout();
    if (res.success) {
      dispatch(resetUserData());
      resetAndNavigate(ScreenRoutes.AuthStack);
    } else {
      Alert.alert('Logout Failed', res.msg || 'Please try again.');
    }
  };

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.avatarWrapper}>
        <View style={styles.avatarCircle}>
          <Icon name="account" size={90} color={colors.white} />
        </View>
      </View>
      <Text style={styles.name}>{userData?.name || 'User Name'}</Text>
      <Text style={styles.email}>{userData?.email || 'user@email.com'}</Text>

      <View style={styles.listSection}>
        {/* Theme selection row */}
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
        {/* View All Journals */}
        <TouchableOpacity style={styles.listItem} onPress={handleViewJournals}>
          <Text style={styles.listItemText}>View All Journals</Text>
          <Icon name="chevron-right" size={26} color={colors.text} />
        </TouchableOpacity>
        {/* About */}
        <TouchableOpacity style={styles.listItem}>
          <Text style={styles.listItemText}>About</Text>
          <Icon name="chevron-right" size={26} color={colors.text} />
        </TouchableOpacity>
      </View>
      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

function getStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
      alignItems: 'center',
      paddingTop: 36,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 18,
      letterSpacing: 0.2,
    },
    avatarWrapper: {
      alignItems: 'center',
      marginBottom: 18,
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

export default ProfileScreen;
