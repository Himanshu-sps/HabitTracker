import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchJournalsForUserInRange } from '@/services/FirebaseService';
import { JournalType } from '@/type';
import moment from 'moment';
import { DATE_FORMAT_ZERO, formatDate } from '@/utils/DateTimeUtils';

/**
 * History State Interface
 *
 * Manages historical data including chart data, mood averages, timeline data,
 * loading states, caching, and error handling. This slice handles analytics
 * and historical journal data for the habit tracker app.
 */
interface HistoryState {
  /** Boolean flag indicating whether history data is being fetched */
  loading: boolean;
  /** Chart data for the last 7 days including labels and mood values */
  chartData: {
    /** Day labels (e.g., Mon, Tue, Wed) */
    labels: string[];
    /** Mood values corresponding to each day */
    data: number[];
  };
  /** Average mood score calculated from the last 7 days */
  avgMood: number | null;
  /** Timeline data for the last 30 days with dates and mood values */
  timelineData: {
    /** Date in formatted string */
    date: string;
    /** Mood score for the specific date */
    mood: number | null;
  }[];
  /** Error message if history data fetch fails */
  error: string | null;
  /** Timestamp of last successful data fetch for caching */
  lastFetched: number | null;
  /** Boolean flag indicating if cache needs refresh */
  needsRefresh: boolean;
}

/**
 * Initial history state
 *
 * Sets default values for history state when the slice is initialized
 * or when history data is reset.
 */
const initialState: HistoryState = {
  loading: false,
  chartData: { labels: [], data: [] },
  avgMood: null,
  timelineData: [],
  error: null,
  lastFetched: null,
  needsRefresh: false,
};

/**
 * Cache duration constant
 *
 * Defines how long (in milliseconds) fetched data should be considered valid.
 * Currently set to 5 minutes to balance performance and data freshness.
 */
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Return type for fetch history data action
 *
 * Defines the structure of data returned by the fetchHistoryData async thunk,
 * including cache information and optional data fields.
 */
type FetchHistoryDataReturnType = {
  /** Boolean indicating if data was retrieved from cache */
  fromCache: boolean;
  /** Optional chart data for last 7 days */
  chartData?: {
    labels: string[];
    data: number[];
  };
  /** Optional average mood score */
  avgMood?: number | null;
  /** Optional timeline data for last 30 days */
  timelineData?: {
    date: string;
    mood: number | null;
  }[];
  /** Optional timestamp of when data was fetched */
  lastFetched?: number;
};

/**
 * Async thunk to fetch history data
 *
 * Fetches historical journal data including chart data for the last 7 days
 * and timeline data for the last 30 days. Implements caching to improve
 * performance and reduce unnecessary API calls.
 *
 * @example
 * // Fetch history data for a user
 * dispatch(fetchHistoryData('user123'));
 *
 * @param userId - Unique identifier for the user
 * @returns Promise resolving to history data with cache information
 */
export const fetchHistoryData = createAsyncThunk<
  FetchHistoryDataReturnType,
  string,
  { state: { history: HistoryState } }
>('history/fetchHistoryData', async (userId, { getState }) => {
  const { history } = getState();
  const now = Date.now();

  // Check if cached data is still valid
  if (history.lastFetched && now - history.lastFetched < CACHE_DURATION) {
    return { fromCache: true };
  }

  // --- Chart Data for last 7 days ---
  const chartEndDate = moment();
  const chartStartDate = moment().subtract(6, 'days');
  const chartRes = await fetchJournalsForUserInRange(
    userId,
    formatDate(chartStartDate.toDate(), DATE_FORMAT_ZERO),
    formatDate(chartEndDate.toDate(), DATE_FORMAT_ZERO),
  );

  let chartData: { labels: string[]; data: number[] } = {
    labels: [],
    data: [],
  };
  let avgMood: number | null = null;

  if (chartRes.success && chartRes.data) {
    const journals: JournalType[] = chartRes.data;
    const dateAndMoodmap = new Map<string, number>();
    const last7dateList: { dayLabel: string; journalDate: string }[] = [];

    // Generate list of last 7 days with labels
    for (let index = 0; index < 7; index++) {
      const momentDate = moment(
        formatDate(chartStartDate.toDate(), DATE_FORMAT_ZERO),
        DATE_FORMAT_ZERO,
      )
        .add(index, 'days')
        .toDate();
      const dateWithZeroTs = formatDate(momentDate, DATE_FORMAT_ZERO);
      last7dateList.push({
        dayLabel: formatDate(dateWithZeroTs, 'ddd'),
        journalDate: dateWithZeroTs,
      });
    }

    // Map journal data to dates
    journals.forEach(journal => {
      dateAndMoodmap.set(journal.journalDate, journal.sentimentScore);
    });

    const journalDaysList = last7dateList.map(d => d.dayLabel);
    const sentimentLevels = last7dateList.map(
      d => dateAndMoodmap.get(d.journalDate) ?? 0,
    );

    chartData = {
      labels: journalDaysList,
      data: sentimentLevels,
    };

    // Calculate average mood from non-zero values
    const moodData = sentimentLevels.filter(x => x !== 0);
    avgMood = moodData.length
      ? moodData.reduce((a, b) => a + b, 0) / moodData.length
      : null;
  }

  // --- Timeline Data for last 30 days ---
  const timelineEndDate = moment();
  const timelineStartDate = moment().subtract(29, 'days');
  const timelineRes = await fetchJournalsForUserInRange(
    userId,
    formatDate(timelineStartDate.toDate(), DATE_FORMAT_ZERO),
    formatDate(timelineEndDate.toDate(), DATE_FORMAT_ZERO),
  );

  let timelineData: { date: string; mood: number | null }[] = [];
  if (timelineRes.success && timelineRes.data) {
    timelineData = timelineRes.data.map(journal => ({
      date: journal.journalDate,
      mood: journal.sentimentScore,
    }));
  }

  return {
    chartData,
    avgMood,
    timelineData,
    lastFetched: now,
    fromCache: false,
  };
});

/**
 * History Slice
 *
 * Redux Toolkit slice that manages historical data and provides
 * async actions for fetching analytics data with intelligent caching.
 *
 * @example
 * // Access history state
 * const { loading, chartData, avgMood, timelineData, error } = useSelector(state => state.history);
 *
 * // Fetch new history data
 * dispatch(fetchHistoryData(userId));
 *
 * // Invalidate cache to force refresh
 * dispatch(invalidateHistoryCache());
 */
const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    /**
     * Invalidates history cache
     *
     * Resets the lastFetched timestamp and sets needsRefresh flag to true,
     * forcing the next fetch to retrieve fresh data from the server.
     *
     * @param state - Current history state
     */
    invalidateHistoryCache: state => {
      state.lastFetched = null;
      state.needsRefresh = true;
    },
  },
  extraReducers: builder => {
    builder
      /**
       * Handle pending state when fetching history data
       *
       * Sets loading to true and clears any previous errors
       * when a history data request starts.
       */
      .addCase(fetchHistoryData.pending, state => {
        state.loading = true;
        state.error = null;
      })

      /**
       * Handle successful history data fetch
       *
       * Updates state with fetched data only if not from cache,
       * updates lastFetched timestamp, and sets loading to false.
       *
       * @param state - Current history state
       * @param action - Action containing fetched data and cache information
       */
      .addCase(fetchHistoryData.fulfilled, (state, action) => {
        if (!action.payload.fromCache) {
          state.chartData = action.payload.chartData ?? {
            labels: [],
            data: [],
          };
          state.avgMood = action.payload.avgMood ?? null;
          state.timelineData = action.payload.timelineData ?? [];
          state.lastFetched = action.payload.lastFetched ?? null;
        }
        state.loading = false;
        state.needsRefresh = false;
      })

      /**
       * Handle failed history data fetch
       *
       * Sets error message and loading to false when
       * history data request fails.
       *
       * @param state - Current history state
       * @param action - Action containing error information
       */
      .addCase(fetchHistoryData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch history data';
      });
  },
});

// Export actions for use in components
export const { invalidateHistoryCache } = historySlice.actions;

// Export reducer for store configuration
export default historySlice.reducer;
