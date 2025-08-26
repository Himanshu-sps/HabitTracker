import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';

// Local imports
import { useAppSelector, useAppDispatch } from '@/redux/hook';
import { HabitType } from '@/type';
import HabitListItem from '@/screens/habits/HabitListItem';
import { AppRootState } from '@/redux/store';
import { setAllHabits } from '@/redux/slices/habitSlice';
import { showConfirmAlert, showInfoAlert } from '@/utils/AlertUtils';
import {
  deleteHabitsForUser,
  subscribeToHabitsForUser,
  trackHabitCompletion,
} from '@/services/FirebaseService';
import AppLoader from '@/component/AppLoader';
import { HABIT_COLORS } from '@/utils/AppColors';
import { navigate } from '@/utils/NavigationUtils';
import { ScreenRoutes } from '@/utils/screen_routes';
import { useAppTheme } from '@/utils/ThemeContext';
import { getAppTextStyles } from '@/utils/AppTextStyles';
import AppHeader from '@/component/AppHeader';
import { NotificationService } from '@/services/NotificationService';
import AppTextInput from '@/component/AppTextInput';
import NetworkStatusSnackbar from '@/component/NetworkStatusSnackbar';

/**
 * HabitListScreen Component
 *
 * A comprehensive screen that displays all user habits with search, filtering,
 * and management capabilities. Provides functionality to view, complete, edit,
 * and delete habits with real-time updates.
 *
 * Features:
 * - List view of all user habits with real-time updates
 * - Search functionality for habit names and descriptions
 * - Color-based filtering system
 * - Habit completion tracking
 * - Swipe-to-delete functionality
 * - Navigation to habit creation and editing
 * - Real-time habit synchronization
 */
const HabitListScreen = () => {
  // Theme and styles
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const textStyles = getAppTextStyles(colors);

  // Redux state
  const user = useAppSelector(
    (state: AppRootState) => state.authReducer.userData,
  );
  const allHabits = useAppSelector(
    (state: AppRootState) => state.habitReducer.allHabits,
  );
  const dispatch = useAppDispatch();

  // Refs
  const swipeableRefs = useRef<{ [key: string]: any }>({});

  // Local state
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [filteredList, setFilteredList] = useState<HabitType[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFabVisible, setIsFabVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Effects

  /**
   * Effect: Reset color filter when screen is focused
   * Clears any active color filter when returning to the screen
   */
  useFocusEffect(
    React.useCallback(() => {
      setSelectedColor('');
    }, []),
  );

  /**
   * Effect: Filter habits based on color selection and search query
   * Updates the filtered list whenever filters change
   */
  useEffect(() => {
    let list = allHabits;

    // Apply color filter
    if (selectedColor !== '') {
      list = list.filter((habit: HabitType) => habit.color === selectedColor);
    }

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (habit: HabitType) =>
          (habit.name || '').toLowerCase().includes(q) ||
          (habit.description || '').toLowerCase().includes(q),
      );
    }

    setFilteredList(list);
  }, [selectedColor, allHabits, searchQuery]);

  /**
   * Effect: Subscribe to real-time habit updates
   * Sets up Firebase listener for habit changes and manages loading state
   */
  useFocusEffect(
    React.useCallback(() => {
      if (!user?.id) return;

      setLoading(true);

      // Subscribe to habits for user
      const unsubscribe = subscribeToHabitsForUser(user.id, habits => {
        dispatch(setAllHabits(habits));
        setLoading(false);
        setRefreshKey(prev => prev + 1); // Force HabitListItem to re-fetch streaks
      });

      return () => unsubscribe();
    }, [user?.id, dispatch]),
  );

  // Event handlers

  /**
   * Handles scroll events to show/hide FAB
   * Hides FAB when scrolling down, shows when scrolling up or stopping
   * @param event - Scroll event from FlatList
   */
  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;

    // Hide FAB when scrolling down, show when scrolling up
    if (currentScrollY > lastScrollY && currentScrollY > 10) {
      // Scrolling down and not at the very top
      setIsFabVisible(false);
    } else if (currentScrollY < lastScrollY || currentScrollY <= 10) {
      // Scrolling up or at the top
      setIsFabVisible(true);
    }

    setLastScrollY(currentScrollY);
  };

  /**
   * Handles habit completion for a specific habit
   * Tracks the completion in Firebase and refreshes streak data
   * @param habit - The habit to mark as completed
   */
  const handleComplete = async (habit: HabitType) => {
    if (!user?.id || !habit.id) return;

    const today = moment().format('YYYY-MM-DD');
    await trackHabitCompletion(user.id, habit.id, today);
    setRefreshKey(prev => prev + 1); // Force HabitListItem to re-fetch streaks
  };

  /**
   * Handles habit deletion with confirmation
   * Shows confirmation dialog and deletes habit with all related data
   * @param habit - The habit to delete
   * @param closeSwipeable - Function to close the swipeable item
   */
  const handleDelete = (habit: HabitType, closeSwipeable: () => void) => {
    if (!user?.id) return;

    showConfirmAlert(
      'Delete Habit',
      `Are you sure you want to delete entire "${habit.name}"?`,
      async () => {
        setLoading(true);

        // Delete habit from Firebase
        let res = await deleteHabitsForUser(habit, user?.id);

        // Cancel associated notifications
        if (habit.id) {
          await NotificationService.cancelHabitNotification(habit.id);
        }

        if (res.success) {
          setLoading(false);
          // Update local state
          dispatch(
            setAllHabits(allHabits.filter((h: HabitType) => h.id !== habit.id)),
          );
        } else {
          setLoading(false);
        }
      },
      closeSwipeable,
      'Delete',
      'Cancel',
    );
  };

  /**
   * Handles navigation to habit statistics screen
   * @param habit - The habit to view statistics for
   */
  const handleStatisticsPress = (habit: HabitType) => {
    navigate(ScreenRoutes.HabitStatisticsScreen, { habit });
  };

  /**
   * Handles navigation to habit creation screen
   */
  const handleCreateHabit = () => {
    navigate(ScreenRoutes.AddEditHabitScreen);
  };

  /**
   * Handles navigation to habit editing screen
   * @param habit - The habit to edit
   */
  const handleEditHabit = (habit: HabitType) => {
    navigate(ScreenRoutes.AddEditHabitScreen, { habit });
  };

  // Render methods

  /**
   * Renders individual habit list items
   * @param item - Habit object to render
   * @returns JSX element for the habit item
   */
  const renderItem = ({ item }: { item: HabitType }) => {
    if (!swipeableRefs.current[item.id || item.userId]) {
      swipeableRefs.current[item.id || item.userId] = React.createRef();
    }

    return (
      <HabitListItem
        ref={swipeableRefs.current[item.id || item.userId]}
        habit={item}
        onPress={() => handleEditHabit(item)}
        onDelete={(habit, closeSwipeable) =>
          handleDelete(habit, closeSwipeable)
        }
        onComplete={handleComplete}
        onStatisticsPress={handleStatisticsPress}
        enableLeftSwipe={false}
        refreshKey={refreshKey}
      />
    );
  };

  /**
   * Renders the search input field
   * @returns JSX element for the search functionality
   */
  const renderSearchSection = () => (
    <AppTextInput
      label=""
      iconName="search"
      placeholder="Search habits"
      value={searchQuery}
      onChangeText={setSearchQuery}
      rightIcon={
        searchQuery.trim() !== '' ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons
              name="close"
              size={20}
              color={colors.inputPlaceholder}
            />
          </TouchableOpacity>
        ) : null
      }
    />
  );

  /**
   * Renders the color filter section
   * @returns JSX element for color-based filtering
   */
  const renderColorFilter = () => (
    <>
      <Text style={styles.sectionTitle}>Filter by color tags</Text>
      <View style={styles.colorRow}>
        {/* Reset color option */}
        <TouchableOpacity
          key="reset"
          style={[
            styles.colorCircle,
            {
              backgroundColor: colors.white,
              borderWidth: selectedColor === '' ? 3 : 1,
              borderColor: selectedColor === '' ? colors.black : colors.text,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
          onPress={() => setSelectedColor('')}
        >
          <Text style={{ color: colors.text, fontSize: 12 }}>All</Text>
        </TouchableOpacity>

        {HABIT_COLORS.map(color => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorCircle,
              {
                backgroundColor: color,
                borderWidth: selectedColor === color ? 3 : 0,
                borderColor: colors.black,
              },
            ]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
      </View>
    </>
  );

  /**
   * Renders the empty state when no habits are found
   * @returns JSX element for empty state display
   */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={textStyles.title}>No habits found</Text>
    </View>
  );

  /**
   * Renders the habit list when habits exist
   * @returns JSX element for the habit list
   */
  const renderHabitList = () => {
    if (filteredList.length <= 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={filteredList}
        keyExtractor={(item: HabitType, index: number) =>
          (item.id || item.userId.toString()) + index.toString()
        }
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 32 }}>
            No habits found.
          </Text>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <NetworkStatusSnackbar />
      <AppHeader title="Habits" showBackButton={false} />
      <AppLoader visible={loading} size="large" />

      {renderSearchSection()}
      {renderColorFilter()}
      {renderHabitList()}

      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fab,
          {
            opacity: isFabVisible ? 1 : 0,
            transform: [{ scale: isFabVisible ? 1 : 0.8 }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          activeOpacity={0.7}
          onPress={handleCreateHabit}
        >
          <MaterialIcons name="add" size={32} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

export default HabitListScreen;

/**
 * Generates styles for the HabitListScreen component
 * @param colors - Theme colors object containing surface, text, primary, inputPlaceholder, white, black, and inputBg colors
 * @returns StyleSheet object with component styles including container, search, filters, and list styling
 */
function getStyles(colors: any) {
  return StyleSheet.create({
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      flex: 1,
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    colorRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    colorCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 4,
    },
    emptyStateButton: {
      marginTop: 16,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 25,
    },
    emptyStateButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: 'bold',
    },
    fab: {
      position: 'absolute',
      right: 24,
      bottom: 32,
      width: 56,
      height: 56,
      zIndex: 100,
    },
    fabButton: {
      backgroundColor: colors.primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
  });
}
