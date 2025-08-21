import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Local imports
import { resetAndNavigate } from '@/utils/NavigationUtils';
import { AppStrings } from '@/utils/AppStrings';
import { ScreenRoutes } from '@/utils/screen_routes';
import AppLoader from '@/component/AppLoader';
import AppButton from '@/component/AppButton';
import { firebaseSignUp } from '@/services/FirebaseService';
import { useAppDispatch } from '@/redux/hook';
import { setUserData } from '@/redux/slices/authSlice';
import AppTextInput from '@/component/AppTextInput';
import { useAppTheme } from '@/utils/ThemeContext';

/**
 * SignupScreen Component
 *
 * A user registration screen that provides account creation functionality for new users.
 * Handles user input validation, Firebase account creation, and navigation to the main app.
 *
 * Features:
 * - User name, email, and password input fields
 * - Password confirmation with matching validation
 * - Password visibility toggles for both password fields
 * - Input validation and error handling
 * - Firebase account creation integration
 * - Navigation to login screen for existing users
 * - Responsive keyboard handling
 * - Loading states and error display
 */
const SignupScreen: React.FC = () => {
  // Theme and styles
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  // Redux hooks
  const dispatch = useAppDispatch();

  // Local state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Event handlers

  /**
   * Handles user signup process
   * Validates input fields, creates Firebase account, and navigates to main app
   * @returns Promise<void>
   */
  const handleSignup = async (): Promise<void> => {
    // Clear previous errors
    setError('');

    // Validate required fields
    if (!email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res: Awaited<ReturnType<typeof firebaseSignUp>> =
        await firebaseSignUp(name, email, password);

      if (!res.success) {
        Alert.alert('Sign up', res.msg);
      } else {
        console.log('Successfully registered user data:', res?.data);

        // Dispatch user data to Redux store
        dispatch(
          setUserData({
            userData: res.data,
            isLoggedIn: true,
          }),
        );

        // Navigate to main app
        resetAndNavigate(ScreenRoutes.MainTab);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles navigation to login screen
   * Navigates user to existing account login functionality
   */
  const handleLogin = (): void => {
    resetAndNavigate(ScreenRoutes.LoginScreen);
  };

  /**
   * Toggles password visibility for main password field
   * Switches between showing and hiding the password text
   */
  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  };

  /**
   * Toggles password visibility for confirm password field
   * Switches between showing and hiding the confirm password text
   */
  const toggleConfirmPasswordVisibility = (): void => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Render methods

  /**
   * Renders the app logo and branding section
   * @returns JSX element for the logo display
   */
  const renderLogoSection = () => (
    <View style={styles.logoContainer}>
      <View style={styles.logoCircle}>
        <FontAwesome name="leaf" size={48} color={colors.white} />
      </View>
    </View>
  );

  /**
   * Renders the main signup form
   * @returns JSX element for the signup form
   */
  const renderSignupForm = () => (
    <View style={styles.card}>
      <Text style={styles.title}>{'Sign Up'}</Text>
      <Text style={styles.subtitle}>
        {'Create a new account to get started.'}
      </Text>

      {/* Name field */}
      <AppTextInput
        label={AppStrings.userName}
        iconName="person"
        placeholder={AppStrings.userNamePlaceholder}
        keyboardType="default"
        autoCapitalize="none"
        value={name}
        onChangeText={setName}
        returnKeyType="next"
      />

      {/* Email field */}
      <AppTextInput
        label={AppStrings.emailLabel}
        iconName="alternate-email"
        placeholder={AppStrings.emailPlaceholder}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        returnKeyType="next"
      />

      {/* Password field */}
      <AppTextInput
        label={AppStrings.passwordLabel}
        iconName="lock-outline"
        placeholder={AppStrings.passwordPlaceholder}
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={setPassword}
        returnKeyType="next"
        rightIcon={
          <TouchableOpacity onPress={togglePasswordVisibility}>
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={22}
              color={colors.inputPlaceholder}
            />
          </TouchableOpacity>
        }
      />

      {/* Confirm Password field */}
      <AppTextInput
        label={'Confirm Password'}
        iconName="lock-outline"
        placeholder={'Confirm Password'}
        secureTextEntry={!showConfirmPassword}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        returnKeyType="done"
        rightIcon={
          <TouchableOpacity onPress={toggleConfirmPasswordVisibility}>
            <MaterialIcons
              name={showConfirmPassword ? 'visibility' : 'visibility-off'}
              size={22}
              color={colors.inputPlaceholder}
            />
          </TouchableOpacity>
        }
      />

      {/* Error display */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Signup button */}
      <AppButton
        title={AppStrings.signUp}
        onPress={handleSignup}
        style={styles.button}
      />
    </View>
  );

  /**
   * Renders the footer section with login link
   * @returns JSX element for the footer
   */
  const renderFooter = () => (
    <View style={styles.footerContainer}>
      <Text style={styles.footerText}>{AppStrings.alreadyHaveAnAccount}</Text>
      <TouchableOpacity onPress={handleLogin}>
        <Text style={styles.signupText}>{AppStrings.loginButton}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppLoader visible={isLoading} size="large" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {renderLogoSection()}
            {renderSignupForm()}
            {renderFooter()}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;

/**
 * Generates styles for the SignupScreen component
 * @param colors - Theme colors object containing surface, cardBg, text, primary, subtitle, cardShadow, inputPlaceholder, white, and error colors
 * @returns StyleSheet object with component styles including layout, cards, inputs, buttons, and error display
 */
const getStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    logoContainer: {
      alignItems: 'center',
      marginTop: 60,
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
