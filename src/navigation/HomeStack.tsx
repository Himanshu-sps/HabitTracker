import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@/screens/home/HomeScreen';
import AddEditHabitScreen from '@/screens/home/AddEditHabitScreen';
import { ScreenRoutes } from '@/utils/screen_routes';
import HabitStatisticsScreen from '../screens/habits/HabitStatisticsScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import ViewAllJournalsScreen from '@/screens/journal/ViewAllJournalsScreen';
import JournalBotScreen from '@/screens/journal/JournalBotScreen';
import PostHabitCompletionBotScreen from '@/screens/journal/PostHabitCompletionBotScreen';

const Stack = createNativeStackNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ScreenRoutes.HomeScreen} component={HomeScreen} />

    <Stack.Screen
      name={ScreenRoutes.AddEditHabitScreen}
      component={AddEditHabitScreen}
    />
    <Stack.Screen
      name={ScreenRoutes.HabitStatisticsScreen}
      component={HabitStatisticsScreen}
    />

    <Stack.Screen name={ScreenRoutes.ProfileScreen} component={ProfileScreen} />

    <Stack.Screen
      name={ScreenRoutes.ViewAllJournalsScreen}
      component={ViewAllJournalsScreen}
    />

    <Stack.Screen
      name={ScreenRoutes.JournalBotScreen}
      component={JournalBotScreen}
      options={{ presentation: 'modal', gestureEnabled: false }}
    />

    <Stack.Screen
      name={ScreenRoutes.PostHabitCompletionBotScreen}
      component={PostHabitCompletionBotScreen}
      options={{ presentation: 'modal', gestureEnabled: false }}
    />
  </Stack.Navigator>
);

export default HomeStack;
