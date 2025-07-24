import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStack from '@/navigation/HomeStack';
import HistoryScreen from '@/screens/history/HistoryScreen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import { ScreenRoutes } from '@/utils/screen_routes';
import HabitStack from '@/navigation/HabitStack';
import JournalScreen from '@/screens/journal/JournalScreen';
import { useAppTheme } from '@/utils/ThemeContext';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { ViewStyle } from 'react-native';

const Tab = createBottomTabNavigator();

const getTabBarStyle = (route: any, colors: any): ViewStyle => {
  const hiddenRoutes = [
    'AddEditHabitScreen',
    'HabitStatisticsScreen',
    'ProfileScreen',
    'ViewAllJournalsScreen',
  ];

  const routeName = getFocusedRouteNameFromRoute(route) ?? '';
  if (hiddenRoutes.includes(routeName)) {
    return { display: 'none', backgroundColor: colors.surface };
  }
  return { display: 'flex', backgroundColor: colors.surface };
};

const MainTabs = () => {
  const { colors } = useAppTheme();

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
        options={({ route }) => ({
          tabBarIcon: ({ color }) => (
            <Icon name="home" color={color} size={24} />
          ),
          title: 'Home',
          tabBarStyle: getTabBarStyle(route, colors),
        })}
      />

      <Tab.Screen
        name={ScreenRoutes.HabitStack}
        component={HabitStack}
        options={({ route }) => ({
          tabBarIcon: ({ color }) => (
            <FontAwesomeIcon name="leaf" color={color} size={24} />
          ),
          title: 'Habits',
          tabBarStyle: getTabBarStyle(route, colors),
        })}
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
