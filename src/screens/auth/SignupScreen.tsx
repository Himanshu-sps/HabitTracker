import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { resetAndNavigate } from '@utils/NavigationUtils';
import AppColors from '@utils/colors';
import { AppStrings } from '@utils/strings';
import { screenRoutes } from '@utils/screen_routes';

const SignupScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = () => {
    if (!email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    // TODO: Implement signup logic
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.logoContainer}>
        {/* Replace with your logo asset if available */}
        <View style={styles.logoCircle}>
          <FontAwesome name="leaf" size={48} color={AppColors.white} />
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>{'Sign Up'}</Text>
        <Text style={styles.subtitle}>
          {'Create a new account to get started.'}
        </Text>
        <View style={styles.inputLabelContainer}>
          <Text style={styles.inputLabel}>{AppStrings.emailLabel}</Text>
        </View>
        <View style={styles.inputWithIcon}>
          <MaterialIcons
            name="alternate-email"
            size={22}
            color={AppColors.inputPlaceholder}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder={AppStrings.emailPlaceholder}
            placeholderTextColor={AppColors.inputPlaceholder}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={styles.inputLabelContainer}>
          <Text style={styles.inputLabel}>{AppStrings.passwordLabel}</Text>
        </View>
        <View style={styles.inputWithIcon}>
          <MaterialIcons
            name="lock-outline"
            size={22}
            color={AppColors.inputPlaceholder}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder={AppStrings.passwordPlaceholder}
            placeholderTextColor={AppColors.inputPlaceholder}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={22}
              color={AppColors.inputPlaceholder}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.inputLabelContainer}>
          <Text style={styles.inputLabel}>{'Confirm Password'}</Text>
        </View>
        <View style={styles.inputWithIcon}>
          <MaterialIcons
            name="lock-outline"
            size={22}
            color={AppColors.inputPlaceholder}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder={'Confirm Password'}
            placeholderTextColor={AppColors.inputPlaceholder}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <MaterialIcons
              name={showConfirmPassword ? 'visibility' : 'visibility-off'}
              size={22}
              color={AppColors.inputPlaceholder}
            />
          </TouchableOpacity>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>{AppStrings.signUp}</Text>
        </TouchableOpacity>
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            {AppStrings.alreadyHaveAnAccount}
          </Text>
          <TouchableOpacity
            onPress={() => resetAndNavigate(screenRoutes.LoginScreen)}
          >
            <Text style={styles.signupText}>{AppStrings.loginButton}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 40 : 60,
    marginBottom: 16,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  card: {
    width: '92%',
    backgroundColor: AppColors.cardBg,
    borderRadius: 24,
    padding: 24,
    alignSelf: 'center',
    shadowColor: AppColors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.text,
    alignSelf: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: AppColors.subtitle,
    textAlign: 'center',
    marginBottom: 18,
  },
  inputLabelContainer: {
    marginTop: 8,
    marginBottom: 2,
  },
  inputLabel: {
    fontSize: 14,
    color: AppColors.text,
    fontWeight: '500',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.inputBorder,
  },
  inputIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: AppColors.text,
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonText: {
    color: AppColors.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
  error: {
    color: AppColors.error,
    marginBottom: 8,
    alignSelf: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    color: AppColors.subtitle,
    fontSize: 14,
  },
  signupText: {
    color: AppColors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
});

export default SignupScreen;
