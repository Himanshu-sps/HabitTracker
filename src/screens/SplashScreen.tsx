import { View, Text, StatusBar, Platform, StyleSheet } from 'react-native';
import React, { useEffect } from 'react';
import { resetAndNavigate } from '@utils/NavigationUtils';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import COLORS from '../utils/colors';
import { ScreenRoutes } from '@utils/screen_routes';

const SplashScreen = () => {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      {
        false
          ? resetAndNavigate(ScreenRoutes.AuthStack)
          : resetAndNavigate(ScreenRoutes.MainTab);
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar hidden={Platform.OS !== 'android'} />
      <View style={styles.logoCircle}>
        <FontAwesome name="leaf" size={48} color={COLORS.white} />
      </View>
      <Text style={styles.title}>Habit Tracker</Text>
      <Text style={styles.tagline}>Good habits starts here.</Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 1,
  },
  tagline: {
    color: COLORS.subtitle,
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 4,
    opacity: 0.85,
    textAlign: 'center',
  },
});
