import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { HabitType } from '@/type';
import { useTheme } from '@/utils/ThemeContext';
import { getAppTextStyles } from '@/utils/AppTextStyles';
import AppSpacer from '@/component/AppSpacer';
import {
  DATE_FORMAT_DISPLAY,
  formatDate,
  TIME_FORMAT_DISPLAY,
} from '@/utils/DateTimeUtils';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

interface Props {
  habit: HabitType;
  onPress: () => void;
  onDelete: (habit: HabitType, closeSwipeable: () => void) => void;
  onComplete: (habit: HabitType) => void;
  enableLeftSwipe?: boolean;
  enableRightSwipe?: boolean;
}

const HabitListItem = forwardRef<any, Props>(
  (
    {
      habit,
      onPress,
      onDelete,
      onComplete,
      enableLeftSwipe = true,
      enableRightSwipe = true,
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const styles = getStyles(colors);
    const textStyles = getAppTextStyles(colors);
    const swipeableRef = useRef<any>(null);

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
              <Text style={[textStyles.body, styles.habit]}>{habit.name}</Text>

              <AppSpacer vertical={8} />

              <Text style={[textStyles.label, styles.habitDesc]}>
                {habit.description}
              </Text>
            </View>

            <AppSpacer vertical={18} />

            <View style={styles.dateRow}>
              <MaterialIcons
                name="calendar-today"
                size={18}
                color={colors.primary}
                style={{ marginRight: 6 }}
              />

              <Text style={textStyles.label}>
                {formatDate(habit.startDate, DATE_FORMAT_DISPLAY)} TO{' '}
                {formatDate(habit.endDate, DATE_FORMAT_DISPLAY)}
              </Text>
            </View>

            {/* Reminder Time */}
            {habit.reminderTime ? (
              <View style={styles.dateRow}>
                <MaterialIcons
                  name="alarm"
                  size={18}
                  color={colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text style={textStyles.label}>
                  {formatDate(habit.reminderTime, TIME_FORMAT_DISPLAY)}
                </Text>
              </View>
            ) : null}
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
    habit: {
      color: colors.white,
    },
    habitDesc: {
      color: colors.white,
      fontWeight: 'bold',
    },
    dateRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 8,
      paddingHorizontal: 8,
      marginBottom: 14,
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
  });
}
