import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@screens/home/HomeScreen';
import AddEditHabitScreen from '@screens/home/AddEditHabitScreen';
import { ScreenRoutes } from '@utils/screen_routes';

const Stack = createNativeStackNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ScreenRoutes.HomeScreen} component={HomeScreen} />
    <Stack.Screen
      name={ScreenRoutes.AddEditHabitScreen}
      component={AddEditHabitScreen}
    />
  </Stack.Navigator>
);

export default HomeStack;
