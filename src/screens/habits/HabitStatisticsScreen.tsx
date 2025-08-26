import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Animated } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import * as Progress from 'react-native-progress';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Local imports
import { HabitType } from '@/type';
import { useAppTheme } from '@/utils/ThemeContext';
import { getAppTextStyles } from '@/utils/AppTextStyles';
import AppHeader from '@/component/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDate, getDaysDifference } from '@/utils/DateTimeUtils';
import AppSpacer from '@/component/AppSpacer';
import { useAppSelector, useAppDispatch } from '@/redux/hook';
import { STREAK_CHALLENGES } from '@/utils/AppConstants';
import StreakChallengeCard from '@/component/StreakChallengeCard';
import { fetchHabitStatistics } from '@/redux/slices/habitStatisticsSlice';
import { AppRootState } from '@/redux/store';

// Type definitions
type ParamList = {
  HabitStatistics: {
    habit: HabitType;
  };
};

type HabitStatisticsScreenRouteProp = RouteProp<ParamList, 'HabitStatistics'>;

/**
 * HabitStatisticsScreen Component
 *
 * A comprehensive statistics screen that displays detailed analytics for a specific habit,
 * including progress tracking, streak information, and achievement challenges.
 *
 * Features:
 * - Visual progress circle showing completion percentage
 * - Current and best streak tracking
 * - Streak challenge achievements with badges
 * - Animated progress indicators
 * - Real-time statistics updates
 */
const HabitStatisticsScreen = () => {
  // Route parameters
  const route = useRoute<HabitStatisticsScreenRouteProp>();
  const { habit } = route.params;

  // Theme and styles
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const textStyles = getAppTextStyles(colors);

  // Redux hooks
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.authReducer.userData);
  const { completedDates, streaks } = useAppSelector(
    (state: AppRootState) => state.habitStatistics,
  );

  // Local state
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Animation refs
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Calculated values
  const totalDays = getDaysDifference(habit.startDate, habit.endDate) + 1;
  const completedDays = completedDates.length;
  const progress = totalDays > 0 ? completedDays / totalDays : 0;

  // Effects

  /**
   * Effect: Set up progress animation listener
   * Listens to progress animation updates and updates local state
   */
  useEffect(() => {
    progressAnim.addListener(animation => {
      setAnimatedProgress(animation.value);
    });
    return () => {
      progressAnim.removeAllListeners();
    };
  }, [progressAnim]);

  /**
   * Effect: Fetch habit statistics when component mounts
   * Loads completion data and streak information for the habit
   */
  useEffect(() => {
    if (user?.id && habit.id) {
      dispatch(fetchHabitStatistics({ userId: user.id, habitId: habit.id }));
    }
  }, [user?.id, habit.id, dispatch]);

  /**
   * Effect: Animate progress and fade in when progress changes
   * Creates smooth animations for progress circle and screen fade-in
   */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [progress, progressAnim, fadeAnim]);

  // Render methods

  /**
   * Renders the habit progress section with circular progress indicator
   * Shows completion percentage, start/end dates, and visual progress
   * @returns JSX element for the progress section
   */
  const renderProgressSection = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="flag" size={24} color={colors.primary} />
        <Text style={styles.sectionTitle}>Habit progress</Text>
      </View>
      <AppSpacer vertical={16} />
      <View style={styles.progressContainer}>
        <Progress.Circle
          progress={animatedProgress}
          size={150}
          showsText={true}
          formatText={() => `${completedDays} / ${totalDays}\nDAYS`}
          color={colors.primary}
          unfilledColor={colors.inputBg}
          borderColor={colors.surface}
          borderWidth={2}
          thickness={12}
          strokeCap="round"
          textStyle={styles.progressText}
        />
      </View>
      <AppSpacer vertical={16} />
      <View style={styles.dateRow}>
        <View>
          <Text style={textStyles.label}>Start</Text>
          <Text style={textStyles.body}>
            {formatDate(habit.startDate, 'DD/MM/YY')}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={textStyles.label}>End</Text>
          <Text style={textStyles.body}>
            {formatDate(habit.endDate, 'DD/MM/YY')}
          </Text>
        </View>
      </View>
    </View>
  );

  /**
   * Renders the streak information section
   * Displays current and best streak counts with visual separation
   * @returns JSX element for the streak section
   */
  const renderStreakSection = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="link" size={24} color={colors.primary} />
        <Text style={styles.sectionTitle}>Streak</Text>
      </View>
      <AppSpacer vertical={16} />
      <View style={styles.streakRow}>
        <View style={styles.streakBox}>
          <Text style={styles.streakLabel}>Current</Text>
          <Text style={styles.streakValue}>{streaks.currentStreak} DAYS</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.streakBox}>
          <Text style={styles.streakLabel}>Best</Text>
          <Text style={styles.streakValue}>{streaks.bestStreak} DAYS</Text>
        </View>
      </View>
    </View>
  );

  /**
   * Renders the streak challenge section
   * Shows available challenges with completion status and badges
   * @returns JSX element for the challenge section
   */
  const renderChallengeSection = () => (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="star" size={24} color={colors.primary} />
        <Text style={styles.sectionTitle}>Streak Challenge</Text>
      </View>
      <AppSpacer vertical={10} />
      {STREAK_CHALLENGES.map(challenge => (
        <StreakChallengeCard
          key={challenge.days}
          days={challenge.days}
          badge={challenge.badge}
          description={challenge.description}
          isCompleted={streaks.bestStreak >= challenge.days}
          isDisabled={challenge.days > totalDays}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <AppHeader title={habit.name} showBackButton />
        <ScrollView style={styles.content}>
          {renderProgressSection()}
          <AppSpacer vertical={16} />
          {renderStreakSection()}
          <AppSpacer vertical={16} />
          {renderChallengeSection()}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

export default HabitStatisticsScreen;

/**
 * Generates styles for the HabitStatisticsScreen component
 * @param colors - Theme colors object containing surface, cardBg, text, primary, inputBg, cardShadow, and divider colors
 * @returns StyleSheet object with component styles including container, cards, progress indicators, and streak displays
 */
const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      padding: 16,
    },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 12,
      padding: 16,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 8,
    },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    progressContainer: {
      alignItems: 'center',
    },
    progressText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
    },
    streakRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    streakBox: {
      alignItems: 'center',
      flex: 1,
    },
    streakValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      marginTop: 4,
    },
    streakLabel: {
      fontSize: 16,
      color: colors.text,
    },
    divider: {
      width: 1,
      height: '80%',
      backgroundColor: colors.divider,
    },
  });
