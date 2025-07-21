import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import AppColors, { HABIT_COLORS } from '@/utils/AppColors';
import AppButton from '@/component/AppButton';
import { goBack } from '@/utils/NavigationUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '@/component/AppHeader';
import AppTextInput from '@/component/AppTextInput';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { addHabitToFirestore } from '@/services/FirebaseService';
import { useAppSelector } from '@/redux/hook';
import AppSpacer from '@/component/AppSpacer';
import DatePicker from 'react-native-date-picker';
import moment from 'moment';
import {
  DATE_FORMAT_DISPLAY,
  DATE_FORMAT_ZERO,
  formatDate,
  TIME_FORMAT_DISPLAY,
  // toUTCISOString, // No longer needed for start/end date
  toUTCTimeString,
} from '@/utils/DateTimeUtils';
import { navigationRef } from '@/utils/NavigationUtils';
import { HabitType } from '@/type';
import { useTheme } from '@/utils/ThemeContext';
import { getAppTextStyles } from '@/utils/AppTextStyles';

const AddEditHabitScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const textStyles = getAppTextStyles(colors);
  const habitToEdit = (
    navigationRef.getCurrentRoute()?.params as { habit?: HabitType }
  )?.habit;
  const [habitName, setHabitName] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [selectedColor, setSelectedColor] = useState(HABIT_COLORS[0]);
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reminderTime, setReminderTime] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const [isStartDatePickerVisible, setStartDatePickerVisibility] =
    useState(false);
  const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  const user = useAppSelector(state => state.authReducer.userData);

  React.useEffect(() => {
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
      setReminderTime(
        habitToEdit.reminderTime
          ? formatDate(habitToEdit.reminderTime, TIME_FORMAT_DISPLAY)
          : '',
      );
    }
  }, [habitToEdit]);

  const handleStartDatePickerVisisbility = (visible: boolean) =>
    setStartDatePickerVisibility(visible);

  const handleEndDatePickerVisibility = (visible: boolean) =>
    setEndDatePickerVisibility(visible);

  const handleSaveHabit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please login again.');
      return;
    }
    if (
      !habitName.trim() &&
      !habitDesc.trim() &&
      !startDate.trim() &&
      !endDate.trim() &&
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
    setLoading(true);

    // Prepare date-only values for API with zero timestamp
    const startDateFormatted = formatDate(
      startDate,
      DATE_FORMAT_ZERO,
      DATE_FORMAT_DISPLAY,
    );

    const endDateFormatted = formatDate(
      endDate,
      DATE_FORMAT_ZERO,
      DATE_FORMAT_DISPLAY,
    );

    // Combining time with startdate to make UTC date time
    const reminderTimeUTC =
      reminderTime && startDate
        ? toUTCTimeString(
            startDate,
            reminderTime,
            DATE_FORMAT_DISPLAY,
            TIME_FORMAT_DISPLAY,
          )
        : '';

    const habit = {
      userId: user.id,
      name: habitName.trim(),
      description: habitDesc.trim(),
      color: selectedColor,
      startDate: startDateFormatted, // Date-only string (YYYY-MM-DD)
      endDate: endDateFormatted, // Date-only string (YYYY-MM-DD)
      reminderEnabled,
      reminderTime: reminderTimeUTC, // UTC ISO string (date+time)
    };

    const res = await addHabitToFirestore(habit);
    setLoading(false);
    if (res.success) {
      goBack();
    } else {
      Alert.alert('Error', res.msg || 'Failed to save habit');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="New Habit" onClose={goBack} />

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

          {/* Duration */}
          <Text style={styles.sectionTitle}>Duration *</Text>
          <View style={styles.durationRow}>
            {/* Start date */}
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => handleStartDatePickerVisisbility(true)}
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
                {startDate == '' ? 'Start date' : startDate}
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
                  !endDate && {
                    color: colors.inputPlaceholder,
                  },
                  !startDate && {
                    color: colors.inputPlaceholder,
                  },
                ]}
              >
                {endDate == '' ? 'End date' : endDate}
              </Text>
            </TouchableOpacity>
            <DatePicker
              modal
              open={isEndDatePickerVisible}
              date={
                endDate
                  ? moment(endDate, DATE_FORMAT_DISPLAY).toDate()
                  : new Date()
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

          {/* Reminders */}
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
            //disabled={!startDate || !endDate}
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
              {reminderTime ? reminderTime : 'Select Time'}
            </Text>
          </TouchableOpacity>
          <DatePicker
            modal
            open={isTimePickerVisible}
            date={
              reminderTime
                ? moment(reminderTime, 'hh:mm A').toDate()
                : new Date()
            }
            onConfirm={date => {
              // If startDate is today, ensure time is not before now
              const isToday =
                startDate &&
                moment(startDate, DATE_FORMAT_DISPLAY).isSame(moment(), 'day');
              const selectedTime = moment(date);
              const now = moment();
              if (isToday && selectedTime.isBefore(now, 'minute')) {
                Alert.alert(
                  'Validation',
                  'Please select a time later than or equal to the current time for today.',
                );
                return;
              }
              setReminderTime(selectedTime.format('hh:mm A'));
              setTimePickerVisibility(false);
            }}
            onCancel={() => setTimePickerVisibility(false)}
            mode="time"
            minimumDate={(() => {
              const isToday =
                startDate &&
                moment(startDate, DATE_FORMAT_DISPLAY).isSame(moment(), 'day');
              return isToday ? new Date() : undefined;
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
        </ScrollView>

        {/* Buttons */}
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
      </View>
    </SafeAreaView>
  );
};

export default AddEditHabitScreen;

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
