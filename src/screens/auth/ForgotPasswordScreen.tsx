import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { resetAndNavigate } from '@/utils/NavigationUtils';
import { AppStrings } from '@/utils/AppStrings';
import { ScreenRoutes } from '@/utils/screen_routes';
import AppTextInput from '@/component/AppTextInput';
import { useAppTheme } from '@/utils/ThemeContext';
import { firebaseForgotPassword } from '@/services/FirebaseService';
import AppLoader from '@/component/AppLoader';

const ForgotPasswordScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError(AppStrings.pleaseEnterYourEmail);
      setMessage('');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      setMessage('');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await firebaseForgotPassword(email.trim());

      if (result.success) {
        setMessage(result.msg || 'Password reset email sent successfully');
        // Clear email after successful request
        setEmail('');

        // Show success alert
        Alert.alert(
          'Password Reset Email Sent',
          'Please check your email inbox and follow the instructions to reset your password.',
          [{ text: 'OK' }],
        );
      } else {
        setError(result.msg || 'Failed to send password reset email');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <MaterialIcons name="question-mark" size={48} color={colors.white} />
        </View>
      </View>

      <AppLoader visible={loading} />
      <View style={styles.card}>
        <Text style={styles.title}>{AppStrings.forgotTitle}</Text>
        <Text style={styles.subtitle}>{AppStrings.forgotSubtitle}</Text>

        <AppTextInput
          label={AppStrings.emailLabel}
          iconName="alternate-email"
          placeholder={AppStrings.emailPlaceholder}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={text => {
            setEmail(text);
            // Clear error when user starts typing
            if (error) setError('');
            if (message) setMessage('');
          }}
          returnKeyType="done"
          onSubmitEditing={handleForgotPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleForgotPassword}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.buttonText}>Sending...</Text>
          ) : (
            <Text style={styles.buttonText}>{AppStrings.forgotSubmit}</Text>
          )}
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

const getStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
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
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    card: {
      width: '92%',
      backgroundColor: colors.cardBg,
      borderRadius: 24,
      padding: 24,
      alignSelf: 'center',
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      marginTop: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      alignSelf: 'center',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 13,
      color: colors.subtitle,
      textAlign: 'center',
      marginBottom: 18,
    },
    inputLabelContainer: {
      marginTop: 8,
      marginBottom: 2,
    },
    inputLabel: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderRadius: 10,
      paddingHorizontal: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    inputIcon: {
      marginRight: 6,
    },
    input: {
      flex: 1,
      height: 48,
      fontSize: 16,
      color: colors.text,
      backgroundColor: 'transparent',
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 10,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 2,
    },
    buttonDisabled: {
      backgroundColor: colors.subtitle,
      opacity: 0.6,
    },
    buttonText: {
      color: colors.white,
      fontSize: 17,
      fontWeight: 'bold',
    },
    error: {
      color: colors.error,
      marginBottom: 8,
      alignSelf: 'center',
      fontWeight: '500',
      fontSize: 14,
    },
    message: {
      color: colors.primary,
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
      color: colors.subtitle,
      fontSize: 14,
    },
    signupText: {
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: 14,
      marginLeft: 4,
    },
  });

export default ForgotPasswordScreen;
