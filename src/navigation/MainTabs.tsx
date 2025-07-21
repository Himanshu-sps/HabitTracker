import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStack from '@/navigation/HomeStack';
import HistoryScreen from '@/screens/history/HistoryScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import { ScreenRoutes } from '@/utils/screen_routes';
import AppColors from '@/utils/AppColors';
import HabitListScreen from '@/screens/habits/HabitListScreen';
import JournalScreen from '@/screens/journal/JournalScreen';
import { useTheme } from '@/utils/ThemeContext';

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
        },
      }}
    >
      <Tab.Screen
        name={ScreenRoutes.HomeStack}
        component={HomeStack}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="home" color={color} size={24} />
          ),
          title: 'Home',
        }}
      />

      <Tab.Screen
        name={ScreenRoutes.HabitListScreen}
        component={HabitListScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon name="leaf" color={color} size={24} />
          ),
          title: 'Habits',
        }}
      />

      <Tab.Screen
        name={ScreenRoutes.HistoryScreen}
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="history" color={color} size={24} />
          ),
          title: 'History',
        }}
      />

      <Tab.Screen
        name={ScreenRoutes.ProfileScreen}
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="person" color={color} size={24} />
          ),
          title: 'Profile',
        }}
      />

      <Tab.Screen
        name={ScreenRoutes.JournalScreen}
        component={JournalScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="book" color={color} size={24} />
          ),
          title: 'Journal',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;
