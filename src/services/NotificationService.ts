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
    console.log(
      '[NotificationService] syncHabitNotifications called with habits:',
      habits.map(h => ({
        id: h.id,
        name: h.name,
        completed: h.completed,
        reminderEnabled: h.reminderEnabled,
        reminderTime: h.reminderTime,
        startDate: h.startDate,
        endDate: h.endDate,
      })),
    );
    for (const habit of habits) {
      if (NotificationService.shouldSchedule(habit)) {
        console.log(
          `[NotificationService] Scheduling notification for habit: ${habit.name} (id: ${habit.id})`,
        );
        await NotificationService.scheduleHabitNotification(habit);
      } else if (habit.id) {
        console.log(
          `[NotificationService] Cancelling notification for habit: ${habit.name} (id: ${habit.id})`,
        );
        await NotificationService.cancelHabitNotification(habit.id);
      } else {
        console.log(
          `[NotificationService] Skipping notification for habit: ${habit.name} (id: ${habit.id}). Reason: shouldSchedule returned false and no id to cancel.`,
        );
      }
    }
  }

  static shouldSchedule(habit: HabitType): boolean {
    if (!habit.reminderTime) {
      console.log(
        `[NotificationService] shouldSchedule=false for habit: ${habit.name} (id: ${habit.id}) | No reminderTime`,
      );
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
    console.log(
      `[NotificationService] shouldSchedule=${should} for habit: ${
        habit.name
      } (id: ${
        habit.id
      }) | today: ${today.toISOString()}, startDay: ${startDay.toISOString()}, endDay: ${endDay.toISOString()}, isWithinRange: ${isWithinRange}, notCompleted: ${notCompleted}, hasReminder: ${hasReminder}`,
    );
    return should;
  }

  static getTodayReminderTimestamp(reminderTime?: string): number {
    if (!reminderTime) {
      console.log(
        '[NotificationService] getTodayReminderTimestamp: No reminderTime provided, using Date.now()',
      );
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
      console.log(
        `[NotificationService] scheduleHabitNotification: Missing id or reminderTime for habit: ${habit.name}`,
      );
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
      console.log(
        `[NotificationService] Creating trigger notification for habit: ${habit.name} at timestamp: ${trigger.timestamp}`,
      );
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
      console.log(
        `[NotificationService] Notification scheduled for habit: ${habit.name} (id: ${habit.id})`,
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
      console.log(
        `[NotificationService] Notification cancelled for habitId: ${habitId}`,
      );
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
        console.log(
          '[NotificationService] Android notification channel created.',
        );
      } catch (error) {
        console.error(
          '[NotificationService] Error creating Android channel:',
          error,
        );
      }
    }
  }
}
