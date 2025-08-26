import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
} from 'react';
import { HabitType } from '@/type';
import { useAppTheme } from '@/utils/ThemeContext';
import { getAppTextStyles } from '@/utils/AppTextStyles';
import AppSpacer from '@/component/AppSpacer';
import {
  DATE_FORMAT_DISPLAY,
  formatDate,
  getDaysDifference,
  TIME_FORMAT_24_HOUR,
  TIME_FORMAT_12_HOUR,
} from '@/utils/DateTimeUtils';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { getHabitStreaks } from '@/services/FirebaseService';
import { useAppSelector } from '@/redux/hook';
import moment from 'moment';

interface Props {
  habit: HabitType;
  onPress: () => void;
  onDelete: (habit: HabitType, closeSwipeable: () => void) => void;
  onComplete: (habit: HabitType) => void;
  onStatisticsPress: (habit: HabitType) => void;
  enableLeftSwipe?: boolean;
  enableRightSwipe?: boolean;
  refreshKey?: number; // Add this line
}

const HabitListItem = forwardRef<any, Props>(
  (
    {
      habit,
      onPress,
      onDelete,
      onComplete,
      onStatisticsPress,
      enableLeftSwipe = true,
      enableRightSwipe = true,
      refreshKey, // Add this line
    },
    ref,
  ) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    const textStyles = getAppTextStyles(colors);
    const swipeableRef = useRef<any>(null);
    const [streaks, setStreaks] = useState({
      currentStreak: 0,
      bestStreak: 0,
      completedDays: 0,
    });
    const user = useAppSelector(state => state.authReducer.userData);

    useEffect(() => {
      if (user?.id && habit.id) {
        getHabitStreaks(user.id, habit.id).then(res => {
          if (res.success && res.data) setStreaks(res.data);
        });
      }
    }, [user?.id, habit.id, refreshKey]); // Add refreshKey as dependency

    const totalDays = getDaysDifference(habit.startDate, habit.endDate) + 1;

    // Helper: is notification scheduled for this habit?
    const isNotificationScheduled =
      habit.reminderEnabled && !!habit.reminderTime && !habit.completed;

    useImperativeHandle(ref, () => ({
      close: () => swipeableRef.current?.close(),
    }));

    // Render right action (swipe right to left)
    const renderRightActions = enableRightSwipe
      ? () => (
          <View style={styles.rightActionContainer}>
            <MaterialIcons name="delete" size={28} color={colors.white} />
            <Text style={styles.actionText}>Delete</Text>
          </View>
        )
      : undefined;

    // Render left action (swipe left to right)
    const renderLeftActions = enableLeftSwipe
      ? () => (
          <View style={styles.leftActionContainer}>
            <MaterialIcons name="check-circle" size={28} color={colors.white} />
            <Text style={styles.actionText}>Completed</Text>
          </View>
        )
      : undefined;

    return (
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        onSwipeableOpen={direction => {
          if (direction === 'right' && enableLeftSwipe) {
            onComplete(habit);
          } else if (direction === 'left' && enableRightSwipe) {
            onDelete(habit, () => swipeableRef.current?.close());
          }
        }}
      >
        <TouchableOpacity style={styles.shadowContainer} onPress={onPress}>
          <View style={styles.card}>
            <View
              style={[
                styles.highlightedHabit,
                { backgroundColor: habit.color },
              ]}
            >
              <View style={styles.habitHeader}>
                <Text style={[textStyles.body, styles.habit]}>
                  {habit.name}
                </Text>
                {/* Alarm icon if notification scheduled */}
                {isNotificationScheduled && (
                  <MaterialIcons
                    name="alarm"
                    size={22}
                    color={colors.white}
                    style={{ marginLeft: 8 }}
                  />
                )}
              </View>

              <AppSpacer vertical={8} />

              <Text style={[textStyles.label, styles.habitDesc]}>
                {habit.description}
              </Text>
            </View>

            <AppSpacer vertical={18} />

            {/* Catchy Start/End Date UI */}
            <View style={styles.dateRow}>
              <MaterialIcons
                name="calendar-today"
                size={18}
                color={colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={[textStyles.label, styles.dateRangeText]}>
                {moment(habit.startDate).format('MMM DD, YYYY')}{' '}
                <Text style={{ color: colors.subtitle }}>to</Text>{' '}
                {moment(habit.endDate).format('MMM DD, YYYY')}
              </Text>
            </View>
            <View style={[styles.dateRow, styles.footerContainer]}>
              {/* Left: Reminder */}
              <View style={styles.footerInfo}>
                {habit.reminderTime && (
                  <>
                    <MaterialIcons
                      name="alarm"
                      size={18}
                      color={colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={textStyles.label}>
                      {(() => {
                        // Always display in 12-hour format with AM/PM
                        let timeStr = habit.reminderTime;
                        if (!timeStr) return '';
                        // If it's already in HH:mm, format to 12-hour
                        if (timeStr.length <= 5) {
                          return moment(timeStr, TIME_FORMAT_24_HOUR).format(
                            TIME_FORMAT_12_HOUR,
                          );
                        }
                        // If it's a date string, extract time and format
                        const m = moment(timeStr);
                        return m.isValid()
                          ? m.format(TIME_FORMAT_12_HOUR)
                          : timeStr;
                      })()}
                    </Text>
                  </>
                )}
              </View>

              {/* Right: Actions */}
              <View style={styles.footerActions}>
                <View
                  style={[
                    styles.streakContainer,
                    { backgroundColor: habit.color },
                  ]}
                >
                  <MaterialIcons name="star" size={18} color={colors.white} />
                  <Text style={styles.streakText}>{streaks.currentStreak}</Text>
                  <View style={styles.divider} />
                  <MaterialIcons
                    name="bookmark"
                    size={18}
                    color={colors.white}
                  />
                  <Text style={styles.streakText}>
                    {streaks.completedDays}/{totalDays}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => onStatisticsPress(habit)}>
                  <MaterialIcons
                    name="insert-chart-outlined"
                    size={24}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  },
);

export default HabitListItem;

function getStyles(colors: any) {
  return StyleSheet.create({
    shadowContainer: {
      marginVertical: 10,
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: 8,
      margin: 2,
      // iOS Shadow Properties
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    highlightedHabit: {
      borderRadius: 4,
      borderBottomStartRadius: 0,
      borderBottomEndRadius: 0,
      padding: 8,
    },
    habitHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    habit: {
      color: colors.white,
      flex: 1,
    },
    habitDesc: {
      color: colors.white,
      fontWeight: 'bold',
    },
    streakContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    streakText: {
      color: colors.white,
      fontWeight: 'bold',
      marginLeft: 4,
    },
    divider: {
      width: 1,
      height: '80%',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      marginHorizontal: 8,
    },
    dateRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 8,
      paddingHorizontal: 8,
      marginBottom: 14,
    },
    footerContainer: {
      justifyContent: 'space-between',
    },
    footerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    footerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    rightActionContainer: {
      backgroundColor: colors.habitRed || 'red',
      justifyContent: 'center',
      alignItems: 'center',
      width: 96,
      height: '90%',
      marginVertical: 10,
      borderRadius: 8,
      flexDirection: 'column',
      alignSelf: 'center',
    },
    leftActionContainer: {
      backgroundColor: colors.habitGreen || 'green',
      justifyContent: 'center',
      alignItems: 'center',
      width: 120,
      height: '90%',
      marginVertical: 10,
      borderRadius: 8,
      flexDirection: 'column',
      alignSelf: 'center',
    },
    actionText: {
      color: colors.white,
      fontWeight: 'bold',
      marginTop: 4,
    },
    dateRangeText: {
      fontWeight: 'bold',
      fontSize: 15,
      color: colors.primary,
      letterSpacing: 0.2,
    },
  });
}
