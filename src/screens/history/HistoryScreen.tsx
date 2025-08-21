import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { useIsFocused } from '@react-navigation/native';
import moment from 'moment';

// Local imports
import AppLoader from '@/component/AppLoader';
import AppHeader from '@/component/AppHeader';
import AppSpacer from '@/component/AppSpacer';
import { useAppTheme } from '@/utils/ThemeContext';
import { getAppTextStyles } from '@/utils/AppTextStyles';
import { useAppSelector, useAppDispatch } from '@/redux/hook';
import { AppRootState } from '@/redux/store';
import { DATE_FORMAT_ZERO } from '@/utils/DateTimeUtils';
import { moodList, daysOfWeek } from '@/utils/AppConstants';
import { fetchHistoryData } from '@/redux/slices/historySlice';

/**
 * HistoryScreen Component
 *
 * A comprehensive history and analytics screen that displays the user's mood trends,
 * habit completion patterns, and emotional journey over time.
 *
 * Features:
 * - Weekly mood trends visualization with bar charts
 * - Average mood calculation and display
 * - Interactive mood legend with emoji indicators
 * - 30-day mood timeline with visual progression
 * - Real-time data refresh when screen is focused
 * - Responsive chart sizing and theme integration
 */
const HistoryScreen = () => {
  // Theme and styles
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const textStyles = getAppTextStyles(colors);

  // Redux hooks
  const dispatch = useAppDispatch();
  const user = useAppSelector(
    (state: AppRootState) => state.authReducer.userData,
  );
  const { loading, chartData, avgMood, timelineData, needsRefresh } =
    useAppSelector((state: AppRootState) => state.history);

  // Navigation state
  const isFocused = useIsFocused();

  // Chart configuration
  const maxValue = Math.max(...chartData.data, 1);
  const yAxisSegment = maxValue;

  // Effects

  /**
   * Effect: Fetch history data when screen is focused
   * Loads user's mood and habit data when navigating to this screen
   */
  useEffect(() => {
    if (isFocused && user?.id) {
      dispatch(fetchHistoryData(user.id));
    }
  }, [isFocused, user?.id, dispatch]);

  /**
   * Effect: Refresh history data when needed
   * Automatically refreshes data after journal saves or other updates
   */
  useEffect(() => {
    if (isFocused && user?.id && needsRefresh) {
      dispatch(fetchHistoryData(user.id));
    }
  }, [needsRefresh, isFocused, user?.id, dispatch]);

  // Render methods

  /**
   * Renders the average mood display card
   * Shows the user's average mood with emoji and label
   * @returns JSX element for the average mood card
   */
  const renderAverageMoodCard = () => (
    <View style={styles.avgMoodCard}>
      <Text style={[textStyles.body, styles.avgMoodLabel]}>Average Mood:</Text>
      <View style={styles.avgMoodPill}>
        <Text style={[textStyles.subtitle, styles.avgMoodValue]}>
          {avgMood ? moodList[Math.round(avgMood) - 1]?.moodLabel : 'Neutral'}
        </Text>
        <Text style={styles.avgMoodEmoji}>
          {avgMood ? moodList[Math.round(avgMood) - 1]?.moodIcon : '😐'}
        </Text>
      </View>
    </View>
  );

  /**
   * Renders the mood legend with scrollable pills
   * Displays all available mood options with emojis and labels
   * @returns JSX element for the mood legend section
   */
  const renderMoodLegend = () => (
    <View style={styles.moodLegendContainer}>
      <Text style={styles.moodLegendTitle}>Mood Legend</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moodLegendScroll}
      >
        {moodList.map((mood, idx) => (
          <View key={idx} style={styles.moodPill}>
            <Text style={styles.moodPillNumber}>{idx + 1}</Text>
            <Text style={styles.moodPillEmoji}>{mood.moodIcon}</Text>
            <Text style={styles.moodPillLabel}>{mood.moodLabel}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  /**
   * Renders the weekly mood trends bar chart
   * Displays mood data for the last 7 days in a visual chart
   * @returns JSX element for the bar chart
   */
  const renderMoodChart = () => (
    <View style={styles.barChartContainer}>
      <BarChart
        data={{
          labels: chartData.labels.length === 7 ? chartData.labels : daysOfWeek,
          datasets: [
            {
              data:
                chartData.data.length === 7
                  ? chartData.data
                  : [0, 0, 0, 0, 0, 0, 0],
            },
          ],
        }}
        width={Dimensions.get('window').width - 32}
        height={200}
        yAxisLabel={''}
        yAxisSuffix={''}
        yAxisInterval={1}
        chartConfig={{
          backgroundColor: colors.cardBg,
          backgroundGradientFrom: colors.cardBg,
          backgroundGradientTo: colors.cardBg,
          decimalPlaces: 0,
          color: (opacity = 1) =>
            colors.primary + Math.floor(opacity * 255).toString(16),
          labelColor: (opacity = 1) => colors.text,
          style: { borderRadius: 16 },
          propsForLabels: {
            fontSize: 13,
            fontWeight: 'bold',
          },
          barPercentage: 0.5,
        }}
        style={styles.chart}
        segments={yAxisSegment}
        withInnerLines={true}
        showBarTops={true}
        showValuesOnTopOfBars={true}
      />
    </View>
  );

  /**
   * Renders the main chart card containing legend and chart
   * @returns JSX element for the complete chart section
   */
  const renderChartCard = () => (
    <View style={styles.card}>
      {renderMoodLegend()}
      <AppSpacer vertical={10} />
      {renderMoodChart()}
    </View>
  );

  /**
   * Renders individual timeline items for mood history
   * @param item - Timeline data item
   * @param index - Index of the item in the timeline
   * @returns JSX element for timeline row
   */
  const renderTimelineItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => (
    <View style={styles.timelineRow}>
      <View style={styles.timelineDotLineWrap}>
        <Text>{item.mood ? moodList[item.mood - 1]?.moodIcon : '😐'}</Text>
        {index !== timelineData.length - 1 && (
          <View style={styles.timelineLine} />
        )}
      </View>
      <View style={styles.timelineContent}>
        <Text style={styles.timelineDate}>
          {moment(item.date, DATE_FORMAT_ZERO).format('MMM DD')}
        </Text>
        <Text style={styles.timelineMoodLabel}>
          {item.mood ? moodList[item.mood - 1]?.moodLabel : 'Neutral'}
        </Text>
      </View>
    </View>
  );

  /**
   * Renders the header component for the FlatList
   * Contains the title, average mood, and chart sections
   * @returns JSX element for the list header
   */
  const renderListHeader = () => (
    <View style={styles.container}>
      <AppLoader visible={loading} size="large" />
      <Text style={styles.sectionTitle}>Weekly Mood Trends</Text>
      <AppSpacer vertical={10} />

      {renderAverageMoodCard()}
      <AppSpacer vertical={18} />

      <View style={styles.moodChangeRow}>
        <Text style={styles.last7Label}>Last 7 Days</Text>
      </View>

      {renderChartCard()}
      <AppSpacer vertical={24} />

      <Text style={styles.timelineTitle}>Mood Timeline (Last 30 Days)</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.screenBg}>
      <AppHeader title="History" showBackButton={false} />
      <FlatList
        data={timelineData}
        keyExtractor={item => item.date}
        ListHeaderComponent={renderListHeader}
        renderItem={renderTimelineItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
};

export default HistoryScreen;

/**
 * Generates styles for the HistoryScreen component
 * @param colors - Theme colors object
 * @returns StyleSheet object with component styles
 */
const getStyles = (colors: any) => {
  return StyleSheet.create({
    screenBg: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    container: {
      flex: 1,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 4,
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 22,
      padding: 8,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
      alignItems: 'center',
      marginTop: 8,
    },
    avgMoodCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      paddingVertical: 10,
      paddingHorizontal: 18,
      alignSelf: 'flex-start',
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
      marginBottom: 2,
    },
    avgMoodLabel: {
      color: colors.text,
      marginRight: 8,
      fontWeight: '600',
      fontSize: 16,
    },
    avgMoodPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBg,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 4,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 1,
    },
    avgMoodValue: {
      color: colors.primary,
      marginRight: 8,
      fontWeight: 'bold',
      fontSize: 18,
    },
    avgMoodEmoji: {
      fontSize: 32,
      marginLeft: 2,
    },
    moodChangeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      justifyContent: 'flex-start',
    },
    last7Label: {
      fontSize: 16,
      color: colors.primary,
      marginRight: 8,
      fontWeight: 'bold',
      letterSpacing: 0.2,
    },
    barChartContainer: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      marginBottom: 4,
    },
    chart: {
      borderRadius: 16,
      alignSelf: 'center',
    },
    moodLegendContainer: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 0,
      padding: 8,
      marginBottom: 8,
      width: '100%',
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    moodLegendTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
      textAlign: 'left',
    },
    moodLegendScroll: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 2,
    },
    moodPill: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.inputBg,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginRight: 10,
      minWidth: 60,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    moodPillEmoji: {
      fontSize: 30,
      marginBottom: 2,
    },
    moodPillLabel: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.85,
      textAlign: 'center',
      fontWeight: '500',
    },
    moodPillNumber: {
      fontSize: 13,
      fontWeight: 'bold',
      color: colors.primary,
      backgroundColor: colors.inputBg,
      borderRadius: 10,
      paddingHorizontal: 7,
      paddingVertical: 1,
      marginBottom: 2,
      marginTop: -2,
      alignSelf: 'center',
    },
    timelineTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 10,
    },
    timelineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      paddingHorizontal: 16,
    },
    timelineDotLineWrap: {
      alignItems: 'center',
      width: 28,
      justifyContent: 'flex-start',
      position: 'relative',
    },
    timelineLine: {
      width: 2,
      flex: 1,
      backgroundColor: colors.text,
      opacity: 0.2,
      marginTop: 0,
      alignSelf: 'center',
    },
    timelineContent: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
      backgroundColor: colors.cardBg,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      flex: 1,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    timelineDate: {
      fontSize: 13,
      color: colors.text,
      marginRight: 12,
      minWidth: 60,
      fontWeight: '500',
    },
    timelineMoodLabel: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '600',
    },
  });
};
