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
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { navigate, resetAndNavigate } from '@/utils/NavigationUtils';
import AppColors from '@/utils/AppColors';
import { AppStrings } from '@/utils/AppStrings';
import AppButton from '@/component/AppButton';
import { ScreenRoutes } from '@/utils/screen_routes';
import AppLoader from '@/component/AppLoader';
import { firebaseLogin } from '@/services/FirebaseService';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { setUserData } from '@/redux/slices/authSlice';
import { useAppDispatch } from '@/redux/hook';
import { UserDataType } from '@/type';

const LoginScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const dispatch = useAppDispatch();

  const handleLogin = async (): Promise<void> => {
    setIsLoading(true);
    const response: Awaited<ReturnType<typeof firebaseLogin>> =
      await firebaseLogin(email, password);
    setIsLoading(false);

    if (response.success) {
      // Fetch user data from Firestore
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .get();
        let userData: UserDataType | null = null;
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data && data.id && data.name && data.email) {
            userData = {
              id: data.id,
              name: data.name,
              email: data.email,
            };
          }
        }

        // dispatch action to fill the userData state
        dispatch(
          setUserData({
            userData,
            isLoggedIn: true,
          }),
        );
      }

      // then navigate to Main tabs
      resetAndNavigate(ScreenRoutes.MainTab);
    } else {
      Alert.alert('Login', response?.msg);
    }
  };

  const handleForgotPassword = (): void => {
    navigate('ForgotPasswordScreen');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS == 'android' ? 'height' : 'padding'}
        style={{ flex: 1 }}
      >
        <ScrollView
          // contentContainerStyle={styles.scrollViewContainerStyle}
          keyboardShouldPersistTaps={'handled'}
        >
          <AppLoader visible={isLoading} size="large" />
          <View style={styles.logoContainer}>
            {/* Replace with your logo asset if available */}
            <View style={styles.logoCircle}>
              <FontAwesome name="leaf" size={48} color={AppColors.white} />
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>{AppStrings.loginTitle}</Text>
            <Text style={styles.subtitle}>{AppStrings.loginSubtitle}</Text>
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
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPassword}>
                {AppStrings.forgotPassword}
              </Text>
            </TouchableOpacity>
            <AppButton
              title={AppStrings.loginButton}
              onPress={handleLogin}
              style={styles.button}
            />
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>{AppStrings.noAccount}</Text>
              <TouchableOpacity
                onPress={() => resetAndNavigate('SignupScreen')}
              >
                <Text style={styles.signupText}>{AppStrings.signUp}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    marginTop: 2,
  },
  forgotPassword: {
    color: AppColors.primary,
    fontWeight: '500',
    fontSize: 13,
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
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  orText: {
    marginHorizontal: 10,
    color: '#b0b8c1',
    fontSize: 13,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f6fa',
    borderRadius: 10,
    paddingVertical: 12,
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  },
});

export default LoginScreen;
