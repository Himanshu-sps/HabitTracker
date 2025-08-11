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

const SignupScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSignup = async (): Promise<void> => {
    if (!email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setIsLoading(true);

    const res: Awaited<ReturnType<typeof firebaseSignUp>> =
      await firebaseSignUp(name, email, password);

    setIsLoading(false);
    console.log('Sign up result:', res);

    if (!res.success) {
      Alert.alert('Sign up', res.msg);
    } else {
      console.log('on success register user data: ', res?.data);
      dispatch(
        setUserData({
          userData: res.data,
          isLoggedIn: true,
        }),
      );
      resetAndNavigate(ScreenRoutes.MainTab);
    }
  };

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
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <FontAwesome name="leaf" size={48} color={colors.white} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>{'Sign Up'}</Text>
              <Text style={styles.subtitle}>
                {'Create a new account to get started.'}
              </Text>

              {/* name fields */}
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
              <AppTextInput
                label={AppStrings.passwordLabel}
                iconName="lock-outline"
                placeholder={AppStrings.passwordPlaceholder}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                returnKeyType="next"
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialIcons
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={22}
                      color={colors.inputPlaceholder}
                    />
                  </TouchableOpacity>
                }
              />
              <AppTextInput
                label={'Confirm Password'}
                iconName="lock-outline"
                placeholder={'Confirm Password'}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                returnKeyType="done"
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <MaterialIcons
                      name={
                        showConfirmPassword ? 'visibility' : 'visibility-off'
                      }
                      size={22}
                      color={colors.inputPlaceholder}
                    />
                  </TouchableOpacity>
                }
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <AppButton
                title={AppStrings.signUp}
                onPress={handleSignup}
                style={styles.button}
              />
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>
                  {AppStrings.alreadyHaveAnAccount}
                </Text>
                <TouchableOpacity
                  onPress={() => resetAndNavigate(ScreenRoutes.LoginScreen)}
                >
                  <Text style={styles.signupText}>
                    {AppStrings.loginButton}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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

export default SignupScreen;
