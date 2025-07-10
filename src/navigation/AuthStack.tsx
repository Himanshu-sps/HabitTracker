import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@/screens/auth/LoginScreen';
import SignUpScreen from '@/screens/auth/SignupScreen';
import { ScreenRoutes } from '@/utils/screen_routes';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name={ScreenRoutes.LoginScreen} component={LoginScreen} />
    <Stack.Screen name={ScreenRoutes.SignupScreen} component={SignUpScreen} />
    <Stack.Screen
      name={ScreenRoutes.ForgotPasswordScreen}
      component={ForgotPasswordScreen}
    />
  </Stack.Navigator>
);

export default AuthStack;
