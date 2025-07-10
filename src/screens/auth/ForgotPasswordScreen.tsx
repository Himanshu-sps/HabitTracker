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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { resetAndNavigate } from '@/utils/NavigationUtils';
import AppColors from '@/utils/AppColors';
import { AppStrings } from '@/utils/AppStrings';
import { ScreenRoutes } from '@/utils/screen_routes';

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleForgotPassword = () => {
    if (!email) {
      setError(AppStrings.pleaseEnterYourEmail);
      setMessage('');
      return;
    }
    setError('');
    setMessage(AppStrings.forgotSuccess);
    // TODO: Implement actual forgot password logic
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <MaterialIcons
            name="question-mark"
            size={48}
            color={AppColors.white}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>{AppStrings.forgotTitle}</Text>
        <Text style={styles.subtitle}>{AppStrings.forgotSubtitle}</Text>

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

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleForgotPassword}>
          <Text style={styles.buttonText}>{AppStrings.forgotSubmit}</Text>
        </TouchableOpacity>
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>{AppStrings.forgotFooter}</Text>
          <TouchableOpacity
            onPress={() => resetAndNavigate(ScreenRoutes.LoginScreen)}
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
  message: {
    color: AppColors.primary,
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

export default ForgotPasswordScreen;
