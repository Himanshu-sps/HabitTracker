import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ListRenderItem,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hook';
import { setAllHabits, setTodaysHabits } from '@/redux/slices/habitSlice';
import AppSpacer from '@/component/AppSpacer';
import { navigate } from '@/utils/NavigationUtils';
import { ScreenRoutes } from '@/utils/screen_routes';
import {
  subscribeToHabitsForUser,
  trackHabitCompletion,
  subscribeToCompletedHabitsForDate,
  deleteHabitsForUser,
} from '@/services/FirebaseService';
import { HabitType } from '@/type';
import { useTheme } from '@/utils/ThemeContext';
import { getAppTextStyles } from '@/utils/AppTextStyles';
import moment from 'moment';
import {
  DATE_FORMAT_DISPLAY_DAY_MONTH_DATE,
  DATE_FORMAT_ZERO,
  formatDate,
} from '@/utils/DateTimeUtils';
import HabitListItem from '../habits/HabitListItem';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AppRootState } from '@/redux/store';
import {
  showConfirmAlert,
  showInfoAlert,
  showErrorAlert,
} from '@/utils/AlertUtils';
import AppLoader from '@/component/AppLoader';
import { fetchMotivation } from '@/redux/slices/motivationSlice';
import * as Progress from 'react-native-progress';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HomeScreen = () => {
  const { colors } = useTheme();
  const textStyles = getAppTextStyles(colors);
  const [loading, setLoading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [activeTodayCount, setActiveTodayCount] = useState(0);
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);

  const user = useAppSelector(
    (state: AppRootState & any) => state.authReducer.userData,
  );

  const todaysHabits = useAppSelector(
    (state: AppRootState) => state.habitReducer.todaysHabits,
  );

  const dispatch = useAppDispatch();
  const swipeableRefs = useRef<{ [key: string]: any }>({});
  const motivation = useAppSelector(
    (state: AppRootState) => state.motivation.motivationMessage,
  );
  const motivationLoading = useAppSelector(
    (state: AppRootState) => state.motivation.loading,
  );

  useEffect(() => {
    if (!user?.id) return;
    const today = formatDate(new Date(), DATE_FORMAT_ZERO);

    const unsubscribeHabits = subscribeToHabitsForUser(
      user.id,
      (habits: HabitType[]) => {
        dispatch(setAllHabits(habits));
        const activeHabits = habits.filter(
          (habit: HabitType) =>
            today >= habit.startDate && today <= habit.endDate,
        );
        setActiveTodayCount(activeHabits.length);

        const unsubscribeCompleted = subscribeToCompletedHabitsForDate(
          user.id,
          today,
          (completedHabitIds: string[]) => {
            setCompletedCount(completedHabitIds.length);
            const filtered = activeHabits.filter(
              (habit: HabitType) => !completedHabitIds.includes(habit.id ?? ''),
            );
            dispatch(setTodaysHabits(filtered));
          },
        );

        return () => unsubscribeCompleted();
      },
    );
    return () => unsubscribeHabits();
  }, [user?.id, dispatch]);

  useEffect(() => {
    dispatch(fetchMotivation());
  }, []);

  const handleDeleteAction = (
    habit: HabitType,
    closeSwipeable: () => void,
  ): void => {
    showConfirmAlert(
      'Delete Habit',
      `Are you sure you want to delete entire "${habit.name}"?`,
      async () => {
        setLoading(true);
        await deleteHabitsForUser(habit, user?.id);
        setLoading(false);
      },
      closeSwipeable,
      'Delete',
      'Cancel',
    );
  };

  const handleCompleteAction = async (habit: HabitType): Promise<void> => {
    if (!user?.id || !habit.id) return;
    const today = formatDate(new Date(), DATE_FORMAT_ZERO);
    await trackHabitCompletion(user.id, habit.id, today);
  };

  const renderItem: ListRenderItem<HabitType> = ({ item }) => {
    if (!swipeableRefs.current[item.id || item.userId]) {
      swipeableRefs.current[item.id || item.userId] = React.createRef();
    }
    return (
      <HabitListItem
        ref={swipeableRefs.current[item.id || item.userId]}
        habit={item}
        onPress={() =>
          navigate(ScreenRoutes.AddEditHabitScreen, { habit: item })
        }
        onDelete={handleDeleteAction}
        onComplete={handleCompleteAction}
      />
    );
  };

  const progress = activeTodayCount > 0 ? completedCount / activeTodayCount : 0;

  const getProgressIcon = () => {
    if (progress === 0) {
      return <Icon name="flower-outline" size={28} color={colors.subtitle} />;
    }
    if (progress < 0.5) {
      return (
        <Icon name="flower-tulip-outline" size={28} color={colors.primary} />
      );
    }
    if (progress < 1) {
      return <Icon name="flower-tulip" size={28} color={colors.primary} />;
    }
    return <Icon name="trophy-award" size={28} color={'#FFD700'} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={textStyles.greetingHello}>Hello, {user?.name}</Text>
            <Text style={styles.datePill}>
              {moment().format(DATE_FORMAT_DISPLAY_DAY_MONTH_DATE)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => navigate(ScreenRoutes.ProfileScreen)}
          >
            <Icon name="account" size={48} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        style={{ marginTop: 20 }}
        data={todaysHabits}
        keyExtractor={(item: HabitType, index: number) =>
          (item.id || item.userId.toString()) + index.toString()
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.progressCard}>
              <View style={{ flex: 1 }}>
                <View style={styles.progressHeader}>
                  {getProgressIcon()}
                  <Text style={styles.progressTitle}>Your Progress</Text>
                </View>
                <Text style={styles.progressSubtitle}>
                  {completedCount} of {activeTodayCount} habits completed
                </Text>
              </View>
              <Progress.Circle
                size={60}
                progress={progress}
                showsText
                formatText={() => `${Math.round(progress * 100)}%`}
                color={colors.primary}
                unfilledColor={colors.inputBg}
                borderColor={colors.cardBg}
                textStyle={styles.progressText}
              />
            </View>

            <AppSpacer vertical={28} />

            <Text style={textStyles.subtitle}>Today's Motivation ✨</Text>

            <View style={styles.card}>
              {motivationLoading ? (
                <Text style={styles.motivation}>Loading...</Text>
              ) : (
                <Text style={styles.motivation}>{motivation}</Text>
              )}
            </View>

            <AppSpacer vertical={24} />

            <Text style={textStyles.subtitle}>Today's Habits</Text>
          </>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.7}
        onPress={() => navigate(ScreenRoutes.AddEditHabitScreen)}
      >
        <MaterialIcons name="add" size={32} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

function getStyles(colors: any, insets: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    headerContainer: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingTop: insets.top + 8,
      paddingBottom: 60,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 0,
    },
    greetingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    avatarCircle: {
      width: 70,
      height: 70,
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    datePill: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '600',
      opacity: 0.8,
    },
    listContent: {
      paddingTop: insets.top + 90, // Header height + overlap
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    card: {
      width: '100%',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 12,
      backgroundColor: colors.cardBg,
      margin: 2,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      marginTop: 8,
    },
    motivation: {
      fontStyle: 'italic',
      color: colors.text,
    },
    fab: {
      position: 'absolute',
      right: 24,
      bottom: 32,
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
      zIndex: 100,
    },
    progressCard: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      padding: 18,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 4,
    },
    progressHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 4,
    },
    progressTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    progressSubtitle: {
      fontSize: 14,
      color: colors.subtitle,
      marginTop: 4,
      paddingLeft: 4,
    },
    progressText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.text,
    },
  });
}
