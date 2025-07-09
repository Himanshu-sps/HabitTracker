import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '@screens/SplashScreen';
import { navigationRef } from '@utils/NavigationUtils';
import { ScreenRoutes } from '@utils/screen_routes';
import AuthStack from '@navigation/AuthStack';
import MainTabs from './MainTabs';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={ScreenRoutes.SplashScreen}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name={ScreenRoutes.SplashScreen}
          component={SplashScreen}
        />

        <Stack.Screen name={ScreenRoutes.AuthStack} component={AuthStack} />

        <Stack.Screen name={ScreenRoutes.MainTab} component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
