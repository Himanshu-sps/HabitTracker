import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import { fetch } from '@react-native-community/netinfo';

// Local imports
import AppButton from '@/component/AppButton';
import AppHeader from '@/component/AppHeader';
import AppTextInput from '@/component/AppTextInput';
import AppSpacer from '@/component/AppSpacer';
import AppLoader from '@/component/AppLoader';
import { HABIT_COLORS } from '@/utils/AppColors';
import { goBack, navigationRef } from '@/utils/NavigationUtils';
import { useAppSelector } from '@/redux/hook';
import { useAppTheme } from '@/utils/ThemeContext';
import {
  DATE_FORMAT_DISPLAY,
  DATE_FORMAT_ZERO,
  formatDate,
  TIME_FORMAT_24_HOUR,
  TIME_FORMAT_12_HOUR,
} from '@/utils/DateTimeUtils';
import { HabitType } from '@/type';
import {
  addHabitToFirestore,
  updateHabitInFirestore,
  deleteHabitCompletionForDate,
} from '@/services/FirebaseService';
import NetworkStatusSnackbar from '@/component/NetworkStatusSnackbar';

/**
 * AddEditHabitScreen Component
 *
 * A comprehensive screen for creating new habits or editing existing ones.
 * Provides functionality for setting habit details, duration, reminders, and colors.
 *
 * Features:
 * - Habit name and description input
 * - Color selection from predefined palette
 * - Date range selection (start and end dates)
 * - Time picker for daily reminders
 * - Reminder toggle switch
 * - Validation for required fields and date logic
 * - Support for both create and edit modes
 */
const AddEditHabitScreen = () => {
  // Theme and styles
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  // Navigation params
  const habitToEdit = (
    navigationRef.getCurrentRoute()?.params as { habit?: HabitType }
  )?.habit;

  // Form state
  const [habitName, setHabitName] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [selectedColor, setSelectedColor] = useState(HABIT_COLORS[0]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reminderTime, setReminderTime] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Picker visibility states
  const [isStartDatePickerVisible, setStartDatePickerVisibility] =
    useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  // Redux state
  const user = useAppSelector(state => state.authReducer.userData);

  // Effects

  /**
   * Effect: Initialize form with existing habit data when editing
   * Populates all form fields with the habit being edited
   */
  useEffect(() => {
    if (habitToEdit) {
      setHabitName(habitToEdit.name || '');
      setHabitDesc(habitToEdit.description || '');
      setSelectedColor(habitToEdit.color || HABIT_COLORS[0]);
      setStartDate(
        habitToEdit.startDate
          ? formatDate(habitToEdit.startDate, DATE_FORMAT_DISPLAY)
          : '',
      );
      setEndDate(
        habitToEdit.endDate
          ? formatDate(habitToEdit.endDate, DATE_FORMAT_DISPLAY)
          : '',
      );
      setReminderEnabled(habitToEdit.reminderEnabled || false);
      if (habitToEdit.reminderTime) {
        // Always store as 'HH:mm'
        const m = moment(habitToEdit.reminderTime, TIME_FORMAT_24_HOUR);
        setReminderTime(m.isValid() ? m.format(TIME_FORMAT_24_HOUR) : '');
      } else {
        setReminderTime('');
      }
    }
  }, [habitToEdit]);

  // Event handlers

  /**
   * Toggles the start date picker visibility
   * @param visible - Whether to show or hide the picker
   */
  const handleStartDatePickerVisibility = (visible: boolean) =>
    setStartDatePickerVisibility(visible);

  /**
   * Toggles the end date picker visibility
   * @param visible - Whether to show or hide the picker
   */
  const handleEndDatePickerVisibility = (visible: boolean) =>
    setEndDatePickerVisibility(visible);

  /**
   * Saves the habit to Firestore (create or update)
   *
   * Process:
   * 1. Validates required fields and user authentication
   * 2. Validates date logic (start date before end date)
   * 3. Formats dates for storage
   * 4. Creates new habit or updates existing one
   * 5. Handles completion record cleanup for edited habits
   *
   * @returns Promise<void>
   */
  const handleSaveHabit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }

    if (
      !habitName.trim() ||
      !habitDesc.trim() ||
      !startDate.trim() ||
      !endDate.trim() ||
      !reminderTime.trim()
    ) {
      Alert.alert('Validation', 'Please fill out the mandatory fields (*)');
      return;
    }

    if (
      moment(startDate, DATE_FORMAT_DISPLAY).isAfter(
        moment(endDate, DATE_FORMAT_DISPLAY),
      )
    ) {
      Alert.alert(
        'Validation',
        'Start date cannot be after end date. Please select valid dates.',
      );
      return;
    }

    // Check network status first
    const netState = await fetch();
    const isConnected = netState?.isConnected;

    setLoading(true);

    const habitData = {
      userId: user.id,
      name: habitName.trim(),
      description: habitDesc.trim(),
      color: selectedColor,
      startDate: formatDate(startDate, DATE_FORMAT_ZERO, DATE_FORMAT_DISPLAY),
      endDate: formatDate(endDate, DATE_FORMAT_ZERO, DATE_FORMAT_DISPLAY),
      reminderEnabled,
      reminderTime, // already 'HH:mm'
    };

    let res;
    if (habitToEdit) {
      // Update existing habit
      res = await updateHabitInFirestore({
        ...habitData,
        id: habitToEdit.id,
        createdAt: habitToEdit.createdAt,
      });

      // If editing for today, and time is changed, remove today's completion record
      // Only do this when online to avoid hanging
      if (isConnected) {
        const today = moment().format(DATE_FORMAT_ZERO);
        const wasCompletedToday =
          habitToEdit.reminderTime !== habitData.reminderTime &&
          moment(today).isBetween(
            habitData.startDate,
            habitData.endDate,
            undefined,
            '[]',
          );

        if (wasCompletedToday && habitToEdit.id) {
          try {
            await deleteHabitCompletionForDate(user.id, habitToEdit.id, today);
          } catch (e) {
            // Ignore error, not critical
          }
        }
      }
    } else {
      // Create new habit
      res = await addHabitToFirestore(habitData);
    }

    setLoading(false);

    if (res.success) {
      if (!isConnected) {
        // Show offline message but still navigate back
        Alert.alert(
          'Offline Mode',
          "Habit saved locally. It will be synced to the cloud when you're back online.",
          [{ text: 'OK', onPress: goBack }],
        );
      } else {
        goBack();
      }
    } else {
      Alert.alert('Error', res.msg || 'Failed to save habit');
    }
  };

  // Render methods

  /**
   * Renders the color selection section
   * @returns JSX element for color picker
   */
  const renderColorSection = () => (
    <>
      <Text style={styles.sectionTitle}>Color *</Text>
      <View style={styles.colorRow}>
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
   * Renders the duration section with start and end date pickers
   * @returns JSX element for duration selection
   */
  const renderDurationSection = () => (
    <>
      <Text style={styles.sectionTitle}>Duration *</Text>
      <View style={styles.durationRow}>
        {/* Start date */}
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => handleStartDatePickerVisibility(true)}
        >
          <MaterialIcons
            name="date-range"
            size={22}
            color={colors.primary}
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.dateText,
              !startDate && { color: colors.inputPlaceholder },
            ]}
          >
            {startDate === '' ? 'Start date' : startDate}
          </Text>
        </TouchableOpacity>

        <DatePicker
          modal
          open={isStartDatePickerVisible}
          date={
            startDate
              ? moment(startDate, DATE_FORMAT_DISPLAY).toDate()
              : new Date()
          }
          onConfirm={date => {
            const newStartDate = formatDate(date, DATE_FORMAT_DISPLAY);
            setStartDate(newStartDate);
            // Clear end date if it's now invalid
            if (
              endDate &&
              moment(newStartDate, DATE_FORMAT_DISPLAY).isAfter(
                moment(endDate, DATE_FORMAT_DISPLAY),
              )
            ) {
              setEndDate('');
            }
            setStartDatePickerVisibility(false);
          }}
          onCancel={() => {
            setStartDatePickerVisibility(false);
          }}
          mode="date"
          minimumDate={new Date()}
        />

        {/* End date */}
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => {
            if (!startDate) {
              Alert.alert(
                'Validation',
                'Please select a start date before selecting an end date.',
              );
              return;
            }
            handleEndDatePickerVisibility(true);
          }}
        >
          <MaterialIcons
            name="date-range"
            size={22}
            color={colors.primary}
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.dateText,
              !endDate && { color: colors.inputPlaceholder },
              !startDate && { color: colors.inputPlaceholder },
            ]}
          >
            {endDate === '' ? 'End date' : endDate}
          </Text>
        </TouchableOpacity>

        <DatePicker
          modal
          open={isEndDatePickerVisible}
          date={
            endDate ? moment(endDate, DATE_FORMAT_DISPLAY).toDate() : new Date()
          }
          onConfirm={date => {
            setEndDate(formatDate(date, DATE_FORMAT_DISPLAY));
            setEndDatePickerVisibility(false);
          }}
          onCancel={() => {
            setEndDatePickerVisibility(false);
          }}
          mode="date"
          minimumDate={
            startDate
              ? moment(startDate, DATE_FORMAT_DISPLAY).toDate()
              : undefined
          }
        />
      </View>
    </>
  );

  /**
   * Renders the time selection section with reminder toggle
   * @returns JSX element for time and reminder settings
   */
  const renderTimeSection = () => (
    <>
      <Text style={styles.sectionTitle}>Time *</Text>
      <TouchableOpacity
        style={styles.timeRow}
        activeOpacity={0.7}
        onPress={() => {
          if (!startDate || !endDate) {
            Alert.alert(
              'Validation',
              'Please select both start and end dates before selecting a time.',
            );
            return;
          }
          setTimePickerVisibility(true);
        }}
      >
        <MaterialIcons
          name="access-time"
          size={22}
          color={colors.primary}
          style={{ marginRight: 8 }}
        />
        <Text
          style={[
            styles.reminderTime,
            !reminderTime && { color: colors.inputPlaceholder },
          ]}
        >
          {reminderTime && moment(reminderTime, TIME_FORMAT_24_HOUR).isValid()
            ? moment(reminderTime, TIME_FORMAT_24_HOUR).format(
                TIME_FORMAT_12_HOUR,
              )
            : 'Select Time'}
        </Text>
      </TouchableOpacity>

      <DatePicker
        modal
        open={isTimePickerVisible}
        date={(() => {
          // Calculate the minimum allowed time (2 minutes from now if today is in range)
          const minTime = (() => {
            const isTodayInRange =
              startDate &&
              endDate &&
              moment().isBetween(
                moment(startDate, DATE_FORMAT_DISPLAY),
                moment(endDate, DATE_FORMAT_DISPLAY).endOf('day'),
                undefined,
                '[]',
              );
            if (isTodayInRange) {
              return moment().add(2, 'minutes');
            }
            return null;
          })();

          // If reminderTime is set, use it, else use minTime or now
          if (reminderTime) {
            const [hour, minute] = reminderTime.split(':').map(Number);
            const base = minTime ? minTime.clone() : moment();
            base.set({ hour, minute, second: 0, millisecond: 0 });
            // If base is before minTime, use minTime
            if (minTime && base.isBefore(minTime)) {
              return minTime.toDate();
            }
            return base.toDate();
          }
          return minTime ? minTime.toDate() : new Date();
        })()}
        onConfirm={date => {
          const hour = date.getHours().toString().padStart(2, '0');
          const minute = date.getMinutes().toString().padStart(2, '0');
          setReminderTime(`${hour}:${minute}`);
          setTimePickerVisibility(false);
        }}
        onCancel={() => setTimePickerVisibility(false)}
        mode="time"
        minimumDate={(() => {
          const isTodayInRange =
            startDate &&
            endDate &&
            moment().isBetween(
              moment(startDate, DATE_FORMAT_DISPLAY),
              moment(endDate, DATE_FORMAT_DISPLAY).endOf('day'),
              undefined,
              '[]',
            );
          if (isTodayInRange) {
            return moment().add(2, 'minutes').toDate();
          }
          return undefined;
        })()}
      />

      <View style={styles.reminderSwitchRow}>
        <View>
          <Text style={styles.reminderLabel}>Allow Reminders</Text>
        </View>
        <Switch
          value={reminderEnabled}
          onValueChange={setReminderEnabled}
          trackColor={{
            false: colors.inputBg,
            true: colors.surface,
          }}
          thumbColor={reminderEnabled ? colors.primary : '#f4f3f4'}
        />
      </View>
    </>
  );

  /**
   * Renders the action buttons at the bottom
   * @returns JSX element for cancel and save buttons
   */
  const renderActionButtons = () => (
    <View style={styles.buttonRow}>
      <AppButton
        title="Cancel"
        onPress={goBack}
        style={styles.cancelBtn}
        textStyle={styles.cancelBtnText}
      />
      <AppButton
        title="Save Habit"
        onPress={handleSaveHabit}
        disabled={loading}
        style={styles.saveBtn}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <NetworkStatusSnackbar />
      <AppHeader
        title={habitToEdit ? 'Edit Habit' : 'New Habit'}
        showBackButton
      />

      <AppLoader visible={loading} />
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Habit Name */}
          <AppTextInput
            label="Habit Name *"
            placeholder="Enter habit name"
            value={habitName}
            onChangeText={setHabitName}
          />

          {/* Habit Description */}
          <AppSpacer vertical={6} />
          <AppTextInput
            label="Description *"
            placeholder="Enter description"
            value={habitDesc}
            onChangeText={setHabitDesc}
            multiline
            numberOfLines={4}
          />

          {/* Color Picker */}
          {renderColorSection()}

          {/* Duration */}
          {renderDurationSection()}

          {/* Reminders */}
          {renderTimeSection()}
        </ScrollView>

        {/* Action Buttons */}
        {renderActionButtons()}
      </View>
    </SafeAreaView>
  );
};

export default AddEditHabitScreen;

/**
 * Utility function to get a Date object from reminder time string
 * @param reminderTime - Time string in 'HH:mm' format
 * @returns Date object with the specified time
 */
function getReminderTimeDate(reminderTime: string): Date {
  if (!reminderTime) return new Date();
  const [hour, minute] = reminderTime.split(':').map(Number);
  const now = new Date();
  now.setHours(hour || 0, minute || 0, 0, 0);
  return now;
}

/**
 * Generates styles for the AddEditHabitScreen component
 * @param colors - Theme colors object
 * @returns StyleSheet object with component styles
 */
function getStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
      paddingHorizontal: 16,
    },
    scrollView: {
      flex: 1,
      paddingTop: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 10,
      marginBottom: 8,
    },
    colorRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginBottom: 16,
    },
    colorCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 12,
      marginBottom: 12,
    },
    durationRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    dateInput: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      paddingHorizontal: 12,
    },
    dateText: {
      color: colors.primary,
      fontSize: 15,
    },
    reminderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    reminderLabel: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    reminderTime: {
      color: colors.primary,
      fontSize: 15,
    },
    reminderSwitchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 18,
      marginVertical: 24,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
    },
    cancelBtn: {
      flex: 1,
      backgroundColor: '#f3e9ef',
    },
    cancelBtnText: {
      color: colors.primary,
      fontWeight: 'bold',
    },
    saveBtn: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 10,
      marginTop: 2,
    },
  });
}
