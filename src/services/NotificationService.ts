import notifee, {
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
} from '@notifee/react-native';
import { HabitType } from '../type';
import { Platform } from 'react-native';
import moment from 'moment';

export class NotificationService {
  // Call this at app startup or when habits change
  static async syncHabitNotifications(habits: HabitType[]) {
    for (const habit of habits) {
      if (NotificationService.shouldSchedule(habit)) {
        await NotificationService.scheduleHabitNotification(habit);
      } else if (habit.id) {
        await NotificationService.cancelHabitNotification(habit.id);
      }
    }
  }

  static shouldSchedule(habit: HabitType): boolean {
    if (!habit.reminderTime) {
      return false;
    }
    const today = moment().startOf('day');
    const startDay = moment(habit.startDate).startOf('day');
    const endDay = moment(habit.endDate).endOf('day');
    const isWithinRange =
      today.isSameOrAfter(startDay) && today.isSameOrBefore(endDay);
    const notCompleted = !habit.completed;
    const hasReminder = habit.reminderEnabled && !!habit.reminderTime;
    const should = isWithinRange && notCompleted && hasReminder;
    return should;
  }

  static getTodayReminderTimestamp(reminderTime?: string): number {
    if (!reminderTime) {
      return Date.now();
    }
    // reminderTime: 'HH:mm' (24-hour format)
    const [hour, minute] = reminderTime.split(':').map(Number);
    const now = new Date();
    const reminder = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute,
      0,
      0,
    );
    // If the time has already passed today, schedule for tomorrow
    if (reminder.getTime() < now.getTime()) {
      reminder.setDate(reminder.getDate() + 1);
    }
    return reminder.getTime();
  }

  static async scheduleHabitNotification(habit: HabitType) {
    if (!habit.id || !habit.reminderTime) {
      return;
    }
    try {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: NotificationService.getTodayReminderTimestamp(
          habit.reminderTime,
        ),
        repeatFrequency: RepeatFrequency.DAILY,
        alarmManager:
          Platform.OS === 'android' ? { allowWhileIdle: true } : undefined,
      };
      await notifee.createTriggerNotification(
        {
          id: habit.id, // Use habit ID for easy cancellation
          title: `${habit.name}`,
          body: `Don't forget to complete your habit!`,
          android: { channelId: 'habit-reminders', sound: 'default' },
          ios: { sound: 'default' },
        },
        trigger,
      );
    } catch (error) {
      console.error(
        `[NotificationService] Error scheduling notification for habit: ${habit.name} (id: ${habit.id}):`,
        error,
      );
    }
  }

  static async cancelHabitNotification(habitId: string) {
    try {
      await notifee.cancelNotification(habitId);
    } catch (error) {
      console.error(
        `[NotificationService] Error cancelling notification for habitId: ${habitId}:`,
        error,
      );
    }
  }

  // Call this once (e.g., at app startup) to create the notification channel on Android
  static async setupChannels() {
    if (Platform.OS === 'android') {
      try {
        await notifee.createChannel({
          id: 'habit-reminders',
          name: 'Habit Reminders',
          importance: 4,
          sound: 'default',
        });
      } catch (error) {
        console.error(
          '[NotificationService] Error creating Android channel:',
          error,
        );
      }
    }
  }
}
