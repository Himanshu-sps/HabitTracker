import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HabitListScreen from '@/screens/habits/HabitListScreen';
import AddEditHabitScreen from '@/screens/home/AddEditHabitScreen';
import HabitStatisticsScreen from '@/screens/habits/HabitStatisticsScreen';
import { ScreenRoutes } from '@/utils/screen_routes';

const Stack = createNativeStackNavigator();

const HabitStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      name={ScreenRoutes.HabitListScreen}
      component={HabitListScreen}
    />
    <Stack.Screen
      name={ScreenRoutes.AddEditHabitScreen}
      component={AddEditHabitScreen}
    />
    <Stack.Screen
      name={ScreenRoutes.HabitStatisticsScreen}
      component={HabitStatisticsScreen}
    />
  </Stack.Navigator>
);

export default HabitStack;
