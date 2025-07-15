import {
  StyleSheet,
  Text,
  Alert,
  View,
  FlatList,
  ListRenderItem,
  TouchableOpacity,
} from 'react-native';
import React, { useRef, useState } from 'react';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector, useAppDispatch } from '@/redux/hook';
import { setAllHabits, setTodaysHabits } from '@/redux/slices/habitSlice';
import AppSpacer from '@/component/AppSpacer';
import { navigate } from '@/utils/NavigationUtils';
import { ScreenRoutes } from '@/utils/screen_routes';
import {
  subscribeToHabitsForUser,
  trackHabitCompletion,
  fetchCompletedHabitsForUserOnDate,
} from '@/services/FirebaseService';
import { HabitType } from '@/type';
import AppColors from '@/utils/AppColors';
import { AppTextStyles } from '@/utils/AppTextStyles';
import moment from 'moment';
import {
  DATE_FORMAT_DISPLAY,
  DATE_FORMAT_ZERO,
  formatDate,
} from '@/utils/DateTimeUtils';
import HabitListItem from './components/HabitListItem';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { RootState } from '@/redux/store';
import {
  showConfirmAlert,
  showInfoAlert,
  showErrorAlert,
} from '@/utils/AlertUtils';

const HomeScreen = () => {
  const user = useAppSelector(
    (state: RootState & any) => state.authReducer.userData,
  );
  const allHabits = useAppSelector(
    (state: RootState & any) => state.habitReducer.allHabits,
  );
  const todaysHabits = useAppSelector(
    (state: RootState & any) => state.habitReducer.todaysHabits,
  );
  const dispatch = useAppDispatch();

  const flatListRef = useRef<FlatList>(null);
  const swipeableRefs = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    if (!user?.id) return;
    const today = formatDate(new Date(), DATE_FORMAT_ZERO);
    const unsubscribe = subscribeToHabitsForUser(user.id, async habits => {
      dispatch(setAllHabits(habits));
      // Filter for today's habits (active today)
      const activeHabits = habits.filter((habit: HabitType) => {
        return today >= habit.startDate && today <= habit.endDate;
      });
      // Fetch completed habits for today
      const completedHabitIds = await fetchCompletedHabitsForUserOnDate(
        user.id,
        today,
      );
      // Filter out completed habits
      const filtered = activeHabits.filter(
        (habit: HabitType) => !completedHabitIds.includes(habit.id ?? ''),
      );
      dispatch(setTodaysHabits(filtered));
    });
    return () => unsubscribe();
  }, [user?.id, dispatch]);

  /**
   * Flat list item function
   * @returns ListRenderItem<Recipe>
   */
  const renderItem: ListRenderItem<HabitType> = ({ item }) => {
    if (!swipeableRefs.current[item.id || item.userId]) {
      swipeableRefs.current[item.id || item.userId] = React.createRef();
    }
    return (
      <HabitListItem
        ref={swipeableRefs.current[item.id || item.userId]}
        habit={item}
        onPress={() => {}}
        onEdit={() => {}}
        onDelete={(habit, closeSwipeable) => {
          showConfirmAlert(
            'Delete Habit',
            `Are you sure you want to delete "${habit.name}"?`,
            () =>
              dispatch(
                setAllHabits(
                  allHabits.filter((h: HabitType) => h.id !== habit.id),
                ),
              ),
            closeSwipeable,
            'Delete',
            'Cancel',
          );
        }}
        onComplete={async habit => {
          if (!user?.id || !habit.id) return;
          const today = formatDate(new Date(), DATE_FORMAT_ZERO);
          const result = await trackHabitCompletion(user.id, habit.id, today);
          if (result.success) {
            dispatch(
              setTodaysHabits(
                todaysHabits.filter(
                  (h: HabitType) => (h.id ?? '') !== (habit.id ?? ''),
                ),
              ),
            );
          }
          if (result.success) {
            showInfoAlert(
              'Habit Completed',
              `You marked "${habit.name}" as completed!`,
            );
          } else {
            showErrorAlert(result.msg || 'Failed to track completion');
          }
        }}
      />
    );
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <FlatList
          data={todaysHabits}
          keyExtractor={(item: HabitType, index: number) =>
            (item.id || item.userId.toString()) + index.toString()
          }
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <View style={styles.greetingCard}>
                <View style={styles.greetingRow}>
                  <View style={styles.avatarCircle}>
                    <FontAwesome
                      name="user"
                      size={24}
                      color={AppColors.white}
                    />
                  </View>
                  <View style={styles.greetingTextCol}>
                    <Text style={styles.greetingHello}>Hello,</Text>
                    <Text style={styles.greetingName}>{user?.name}</Text>
                  </View>
                  <View style={styles.datePillContainer}>
                    <Text style={styles.datePill}>
                      {moment().format('dddd, MMMM D')}
                    </Text>
                  </View>
                </View>
              </View>
              <AppSpacer vertical={28} />
              <Text style={AppTextStyles.subtitle}>Today's Motivation ✨</Text>
              <View style={styles.card}>
                <Text style={styles.motivation}>Get-up</Text>
              </View>
              <AppSpacer vertical={24} />
              <Text style={AppTextStyles.subtitle}>Today's Habits</Text>
            </>
          }
        />
      </SafeAreaView>
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.7}
        onPress={() => navigate(ScreenRoutes.AddEditHabitScreen)}
      >
        <MaterialIcons name="add" size={32} color={AppColors.white} />
      </TouchableOpacity>
    </>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: AppColors.secondary,
  },
  greetingCard: {
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  greetingTextCol: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  greetingHello: {
    fontSize: 16,
    color: AppColors.subtitle,
    fontWeight: '600',
    marginBottom: 2,
  },
  greetingName: {
    fontSize: 22,
    color: AppColors.primary,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  datePillContainer: {
    marginLeft: 12,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  datePill: {
    backgroundColor: AppColors.primary,
    color: AppColors.white,
    fontSize: 14,
    fontWeight: 'bold',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    overflow: 'hidden',
    textAlign: 'center',
    minWidth: 90,
  },
  card: {
    width: '100%',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
    margin: 2,
    // iOS Shadow Properties
    shadowColor: AppColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 8,
  },
  motivation: {
    fontStyle: 'italic',
  },
  addButton: {
    marginTop: 24,
    width: '80%',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: AppColors.primary,
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
    zIndex: 100,
  },
});
