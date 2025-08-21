import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ListRenderItem,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
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
import { useAppTheme } from '@/utils/ThemeContext';
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
import { showConfirmAlert } from '@/utils/AlertUtils';
import AppLoader from '@/component/AppLoader';
import { fetchMotivation } from '@/redux/slices/motivationSlice';
import * as Progress from 'react-native-progress';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomMenu from '@/component/CustomMenu';
import { useDispatch } from 'react-redux';
import { firebaseLogout } from '@/services/FirebaseService';
import { resetUserData } from '@/redux/slices/authSlice';
import { resetAndNavigate } from '@/utils/NavigationUtils';
import { NotificationService } from '@/services/NotificationService';
import notifee from '@notifee/react-native';
import { getJournalEntry } from '@/redux/slices/journalSlice';
import { useIsFocused } from '@react-navigation/native';
import ConfettiCannon from 'react-native-confetti-cannon';
import AppCustomModal from '@/component/AppCustomModal';
import AppButton from '@/component/AppButton';

/**
 * HomeScreen - Main dashboard screen for habit tracking
 *
 * Features:
 * - Display today's habits and progress
 * - Track habit completion
 * - Show motivational messages
 * - Handle user profile and logout
 * - Celebrate achievements with confetti
 * - Prompt for journal updates
 *
 * Performance Optimizations:
 * - Memoized progress calculation
 * - Callback memoization for event handlers
 * - Optimized FlatList rendering
 * - Efficient state management
 */
const HomeScreen = () => {
  // Theme and styling
  const { colors } = useAppTheme();
  const textStyles = getAppTextStyles(colors);
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);

  // State management
  const [loading, setLoading] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [activeTodayCount, setActiveTodayCount] = useState(0);
  const [refreshId, setRefreshId] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [showJournalChat, setShowJournalChat] = useState(false);
  const [showJournalUpdateModal, setShowJournalUpdateModal] = useState(false);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  // Refs
  const avatarRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const pendingConfettiRef = useRef(false);
  const swipeableRefs = useRef<{ [key: string]: any }>({});

  // Hooks
  const isFocused = useIsFocused();
  const dispatch = useAppDispatch();
  const rdxDispatch = useDispatch();

  const user = useAppSelector(
    (state: AppRootState & any) => state.authReducer.userData,
  );

  const todaysHabits = useAppSelector(
    (state: AppRootState) => state.habitReducer.todaysHabits,
  );

  const allHabits = useAppSelector(
    (state: AppRootState) => state.habitReducer.allHabits,
  );

  /**
   * Handles user logout process
   * - Logs out from Firebase
   * - Cancels all scheduled habit notifications
   * - Resets user data in Redux store
   * - Navigates to authentication stack
   */
  const handleLogout = useCallback(async () => {
    const res = await firebaseLogout();
    if (res.success) {
      // Cancel all scheduled notifications for all habits
      for (const habit of allHabits) {
        if (habit.id) {
          await NotificationService.cancelHabitNotification(habit.id);
        }
      }
      rdxDispatch(resetUserData());
      resetAndNavigate(ScreenRoutes.AuthStack);
    }
  }, [allHabits, rdxDispatch]);

  const menuItems = [
    {
      title: 'My Profile',
      onPress: () => navigate(ScreenRoutes.ProfileScreen),
      icon: 'person',
    },
    {
      title: 'Logout',
      onPress: handleLogout,
      icon: 'logout',
    },
  ];
  const motivation = useAppSelector(
    (state: AppRootState) => state.motivation.motivationMessage,
  );
  const motivationLoading = useAppSelector(
    (state: AppRootState) => state.motivation.loading,
  );

  /**
   * Main effect for habit management and real-time updates
   * - Subscribes to user habits and completion status
   * - Filters active habits for today
   * - Syncs notifications and triggers confetti celebration
   * - Manages cleanup of Firebase subscriptions
   */
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

            // Mark habits as completed or not for notification logic
            const habitsWithCompletion = activeHabits.map(habit => ({
              ...habit,
              completed: completedHabitIds.includes(habit.id ?? ''),
            }));
            console.log(
              '[HomeScreen] Calling NotificationService.syncHabitNotifications with:',
              habitsWithCompletion,
            );
            NotificationService.syncHabitNotifications(habitsWithCompletion);

            // Trigger confetti ONLY when all habits for today are completed
            if (
              pendingConfettiRef.current &&
              activeHabits.length > 0 &&
              completedHabitIds.length === activeHabits.length
            ) {
              pendingConfettiRef.current = false;
              // Show journal update dialog immediately with confetti inside
              setShowJournalUpdateModal(true);
            }
          },
        );

        return () => unsubscribeCompleted();
      },
    );
    return () => unsubscribeHabits();
  }, [user?.id, dispatch, refreshId]);

  /**
   * App initialization effect
   * - Requests notification permissions
   * - Sets up notification channels
   * - Fetches initial motivation message
   */
  useEffect(() => {
    // Request notification permissions on app start
    notifee.requestPermission().then(authStatus => {
      console.log('Auth status', authStatus);
    });
    NotificationService.setupChannels();
    dispatch(fetchMotivation());
  }, []);

  /**
   * Journal entry check effect - runs on screen focus
   * - Checks if user has journal entry for today
   * - Shows journal chat prompt if no entry exists
   * - Handles backend synchronization
   */
  useEffect(() => {
    if (!isFocused || !user?.id) return;
    const today = formatDate(new Date(), DATE_FORMAT_ZERO);
    dispatch(getJournalEntry({ userId: user.id, journalDate: today }))
      .unwrap()
      .then(journal => setShowJournalChat(!journal))
      .catch(() => setShowJournalChat(true));
  }, [isFocused, user?.id, dispatch]);

  /**
   * Journal chat navigation effect
   * - Automatically navigates to journal bot when chat is needed
   */
  useEffect(() => {
    if (showJournalChat) {
      navigate(ScreenRoutes.JournalBotScreen);
    }
  }, [showJournalChat]);

  /**
   * Confetti trigger effect for achievement modal
   * - Triggers confetti animation when modal becomes visible
   * - Includes small delay to ensure modal is fully rendered
   * - Resets confetti state when modal closes
   */
  useEffect(() => {
    if (showJournalUpdateModal) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        setTriggerConfetti(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setTriggerConfetti(false);
    }
  }, [showJournalUpdateModal]);

  /**
   * Handles habit deletion with confirmation dialog
   * @param habit - The habit to be deleted
   * @param closeSwipeable - Function to close the swipeable item
   */
  const handleDeleteAction = useCallback(
    (habit: HabitType, closeSwipeable: () => void): void => {
      showConfirmAlert(
        'Delete Habit',
        `Are you sure you want to delete entire "${habit.name}"?`,
        async () => {
          setLoading(true);
          await deleteHabitsForUser(habit, user?.id);
          if (habit.id) {
            await NotificationService.cancelHabitNotification(habit.id);
          }
          setLoading(false);
        },
        closeSwipeable,
        'Delete',
        'Cancel',
      );
    },
    [user?.id],
  );

  /**
   * Handles habit completion
   * - Tracks completion in Firebase
   * - Cancels scheduled notifications
   * - Triggers confetti celebration if all habits are completed
   * @param habit - The habit being completed
   */
  const handleCompleteAction = useCallback(
    async (habit: HabitType): Promise<void> => {
      if (!user?.id || !habit.id) return;
      // Mark that we should celebrate if this action completes the last habit
      pendingConfettiRef.current = true;
      const today = formatDate(new Date(), DATE_FORMAT_ZERO);
      await trackHabitCompletion(user.id, habit.id, today);
      // Mark as completed for notification logic
      habit.completed = true;
      console.log(
        `[HomeScreen] Habit completed: ${habit.name} (id: ${habit.id}). Cancelling notification.`,
      );
      await NotificationService.cancelHabitNotification(habit.id);
      setRefreshId(prev => prev + 1);
    },
    [user?.id],
  );

  /**
   * Renders individual habit list item
   * @param item - Habit data to render
   * @returns HabitListItem component
   */
  const renderItem = useCallback<ListRenderItem<HabitType>>(
    ({ item }) => {
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
          onStatisticsPress={habit => {
            navigate(ScreenRoutes.HabitStatisticsScreen, { habit });
          }}
        />
      );
    },
    [handleDeleteAction, handleCompleteAction],
  );

  // Memoized progress calculation
  const progress = useMemo(
    () => (activeTodayCount > 0 ? completedCount / activeTodayCount : 0),
    [activeTodayCount, completedCount],
  );

  /**
   * Returns appropriate progress icon based on completion percentage
   * @returns Icon component representing progress state
   */
  const getProgressIcon = useCallback(() => {
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
    return <Icon name="trophy" size={28} color={'#FFD700'} />;
  }, [progress, colors.subtitle, colors.primary]);

  /**
   * Renders empty state component based on habit status
   * - Shows celebration message if all habits are completed
   * - Shows create habit prompt if no habits exist
   * @returns Empty state component
   */
  const renderEmptyComponent = useCallback(() => {
    if (activeTodayCount > 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Icon name="party-popper" size={50} color={colors.primary} />
          <Text style={styles.emptyStateTitle}>You're all done!</Text>
          <Text style={styles.emptyStateSubtitle}>
            All your habits for today are complete. Keep it up!
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyStateContainer}>
        <Icon name="calendar-blank-outline" size={50} color={colors.subtitle} />
        <Text style={styles.emptyStateTitle}>A fresh start</Text>
        <Text style={styles.emptyStateSubtitle}>
          You don't have any habits scheduled for today.
        </Text>
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => navigate(ScreenRoutes.AddEditHabitScreen)}
        >
          <Text style={styles.emptyStateButtonText}>Create a Habit</Text>
        </TouchableOpacity>
      </View>
    );
  }, [activeTodayCount, colors.primary, colors.subtitle, styles]);

  return (
    <View style={styles.container}>
      <AppLoader visible={loading} />
      <View style={styles.headerContainer}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={textStyles.greetingHello}>Hello,</Text>
            <Text style={textStyles.greetingHello}>{user?.name}</Text>
            <Text style={styles.datePill}>
              {moment().format(DATE_FORMAT_DISPLAY_DAY_MONTH_DATE)}
            </Text>
          </View>
          <TouchableOpacity
            ref={avatarRef}
            style={styles.avatarCircle}
            onPress={() => {
              avatarRef.current?.measure(
                (
                  fx: number,
                  fy: number,
                  width: number,
                  height: number,
                  px: number,
                  py: number,
                ) => {
                  setMenuPosition({
                    top: py + height + 8,
                    right: 20,
                  });
                  setMenuVisible(true);
                },
              );
            }}
          >
            <Icon name="account" size={48} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={todaysHabits}
        keyExtractor={useCallback(
          (item: HabitType) => item.id || item.userId.toString(),
          [],
        )}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
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

            <AppSpacer vertical={16} />

            <Text style={textStyles.subtitle}>Today's Motivation ✨</Text>

            <View style={styles.card}>
              {motivationLoading ? (
                <Text style={styles.motivation}>Loading...</Text>
              ) : (
                <Text style={styles.motivation}>{motivation}</Text>
              )}
            </View>

            <AppSpacer vertical={16} />
            {activeTodayCount > 0 && (
              <Text style={textStyles.subtitle}>Today's Habits</Text>
            )}
          </>
        }
      />
      {activeTodayCount > 0 && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.7}
          onPress={() => navigate(ScreenRoutes.AddEditHabitScreen)}
        >
          <MaterialIcons name="add" size={32} color={colors.white} />
        </TouchableOpacity>
      )}
      <CustomMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        menuItems={menuItems}
        top={menuPosition.top}
        right={menuPosition.right}
      />
      {/* Background confetti removed - now inside the modal */}

      <AppCustomModal visible={showJournalUpdateModal}>
        <View style={styles.dialogContainer}>
          {/* Confetti inside the modal */}
          <View style={styles.modalConfettiContainer}>
            {triggerConfetti && (
              <ConfettiCannon
                key={triggerConfetti ? 'confetti-active' : 'confetti-inactive'}
                autoStart
                fadeOut
                count={100}
                origin={{ x: 150, y: -10 }}
                onAnimationEnd={() => {}}
              />
            )}
          </View>

          <Icon name="star" size={56} color="#FFD700" />
          <AppSpacer vertical={8} />
          <Text style={textStyles.title}>Amazing Achievement! 🎉</Text>
          <AppSpacer vertical={8} />
          <Text style={[textStyles.subtitle, { color: colors.primary }]}>
            You've crushed it!
          </Text>
          <AppSpacer vertical={8} />
          <Text style={styles.dialogMessage}>
            All your habits are complete! This is the perfect time to reflect on
            your success and update your journal.
            <Text style={styles.dialogHighlight}>
              {' '}
              Keep this momentum going!{' '}
            </Text>
          </Text>
          <View style={styles.dialogButtonContainer}>
            <AppButton
              title="Maybe Later"
              onPress={() => setShowJournalUpdateModal(false)}
              style={styles.dialogButtonSecondary}
              textStyle={styles.dialogButtonSecondaryText}
            />
            <AppButton
              title="Update Journal"
              onPress={() => {
                setShowJournalUpdateModal(false);
                navigate(ScreenRoutes.PostHabitCompletionBotScreen);
              }}
              style={styles.dialogButtonPrimary}
              textStyle={styles.dialogButtonPrimaryText}
            />
          </View>
        </View>
      </AppCustomModal>
    </View>
  );
};

export default HomeScreen;

/**
 * Generates styles for the HomeScreen component
 * @param colors - Theme colors from the app theme
 * @param insets - Safe area insets for proper spacing
 * @returns StyleSheet object with all component styles
 */
function getStyles(colors: any, insets: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    // Background confetti container removed - now inside modal
    headerContainer: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingTop: insets.top + 8,
      paddingBottom: 20,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
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
      marginTop: 30,
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
      padding: 8,
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
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      marginTop: 20,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 16,
      textAlign: 'center',
    },
    emptyStateSubtitle: {
      fontSize: 16,
      color: colors.subtitle,
      textAlign: 'center',
      marginTop: 8,
    },
    emptyStateButton: {
      marginTop: 24,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 25,
    },
    emptyStateButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: 'bold',
    },
    dialogContainer: {
      alignItems: 'center',
      paddingVertical: 24,
      minWidth: 300,
      position: 'relative',
    },
    modalConfettiContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1, // Put confetti behind the content
      pointerEvents: 'none', // Don't block touch events
    },
    dialogTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 20,
      marginBottom: 8,
      textAlign: 'center',
    },
    dialogSubtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 16,
      textAlign: 'center',
    },
    dialogMessage: {
      fontSize: 16,
      color: colors.subtitle,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    dialogHighlight: {
      color: colors.primary,
      fontWeight: '600',
    },
    dialogButtonContainer: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    dialogButtonPrimary: {
      flex: 1,
      marginTop: 0,
      marginBottom: 0,
    },
    dialogButtonSecondary: {
      flex: 1,
      marginTop: 0,
      marginBottom: 0,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    dialogButtonSecondaryText: {
      color: colors.text,
    },
    dialogButton: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 2,
    },
    dialogButtonText: {
      fontSize: 17,
      fontWeight: 'bold',
    },
    dialogButtonPrimaryText: {
      color: colors.white,
    },
  });
}
