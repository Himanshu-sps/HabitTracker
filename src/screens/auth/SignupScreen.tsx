import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
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
import AppColors from '@/utils/AppColors';
import { AppStrings } from '@/utils/AppStrings';
import { ScreenRoutes } from '@/utils/screen_routes';
import AppLoader from '@/component/AppLoader';
import AppButton from '@/component/AppButton';
import { firebaseSignUp } from '@/services/FirebaseService';
import { useAppDispatch } from '@/redux/hook';
import { setUserData } from '@/redux/slices/authSlice';

const SignupScreen: React.FC = () => {
  // use redux toolkit dispatch
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
                <FontAwesome name="leaf" size={48} color={AppColors.white} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>{'Sign Up'}</Text>
              <Text style={styles.subtitle}>
                {'Create a new account to get started.'}
              </Text>

              {/* name fields */}
              <View style={styles.inputLabelContainer}>
                <Text style={styles.inputLabel}>{AppStrings.userName}</Text>
              </View>

              <View style={styles.inputWithIcon}>
                <MaterialIcons
                  name="person"
                  size={22}
                  color={AppColors.inputPlaceholder}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={AppStrings.userNamePlaceholder}
                  placeholderTextColor={AppColors.inputPlaceholder}
                  keyboardType="default"
                  autoCapitalize="none"
                  value={name}
                  onChangeText={setName}
                  returnKeyType="next"
                />
              </View>

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
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputLabelContainer}>
                <Text style={styles.inputLabel}>
                  {AppStrings.passwordLabel}
                </Text>
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
                  //secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="next"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
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
                  //secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  returnKeyType="done"
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
