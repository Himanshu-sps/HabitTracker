import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchCompletedHabitsForHabit,
  calculateStreaks,
} from '@/services/FirebaseService';

/**
 * Habit Statistics State Interface
 *
 * Manages habit completion statistics including completion dates, streaks,
 * loading states, and error handling. This slice handles analytics data
 * for individual habits.
 */
interface HabitStatisticsState {
  /** Boolean flag indicating whether statistics are being fetched */
  loading: boolean;
  /** Array of dates when the habit was completed */
  completedDates: string[];
  /** Object containing current and best streak information */
  streaks: {
    /** Current consecutive days streak */
    currentStreak: number;
    /** Longest consecutive days streak achieved */
    bestStreak: number;
  };
  /** Error message if statistics fetch fails */
  error: string | null;
}

/**
 * Initial habit statistics state
 *
 * Sets default values for statistics state when the slice is initialized
 * or when statistics are reset.
 */
const initialState: HabitStatisticsState = {
  loading: false,
  completedDates: [],
  streaks: { currentStreak: 0, bestStreak: 0 },
  error: null,
};

/**
 * Async thunk to fetch habit statistics
 *
 * Fetches completion data for a specific habit and calculates
 * streak information including current and best streaks.
 *
 * @example
 * // Fetch statistics for a specific habit
 * dispatch(fetchHabitStatistics({ userId: 'user123', habitId: 'habit456' }));
 *
 * @param userId - Unique identifier for the user
 * @param habitId - Unique identifier for the habit
 * @returns Promise resolving to completion dates and streak data
 */
export const fetchHabitStatistics = createAsyncThunk(
  'habitStatistics/fetchHabitStatistics',
  async ({ userId, habitId }: { userId: string; habitId: string }) => {
    const res = await fetchCompletedHabitsForHabit(userId, habitId);
    const completedDates = res.data || [];
    const streaks = calculateStreaks(completedDates);
    return { completedDates, streaks };
  },
);

/**
 * Habit Statistics Slice
 *
 * Redux Toolkit slice that manages habit completion statistics and provides
 * async actions for fetching and calculating habit performance data.
 *
 * @example
 * // Access statistics state
 * const { loading, completedDates, streaks, error } = useSelector(state => state.habitStatistics);
 *
 * // Fetch new statistics
 * dispatch(fetchHabitStatistics({ userId, habitId }));
 */
const habitStatisticsSlice = createSlice({
  name: 'habitStatistics',
  initialState,
  reducers: {
    // Future synchronous actions can be added here
    // Example: clearStatistics, updateStreak, etc.
  },
  extraReducers: builder => {
    builder
      /**
       * Handle pending state when fetching statistics
       *
       * Sets loading to true and clears any previous errors
       * when a statistics request starts.
       */
      .addCase(fetchHabitStatistics.pending, state => {
        state.loading = true;
        state.error = null;
      })

      /**
       * Handle successful statistics fetch
       *
       * Updates state with completion dates and calculated streak data,
       * and sets loading to false.
       *
       * @param state - Current statistics state
       * @param action - Payload containing completion dates and streaks
       */
      .addCase(
        fetchHabitStatistics.fulfilled,
        (
          state,
          action: PayloadAction<{
            completedDates: string[];
            streaks: { currentStreak: number; bestStreak: number };
          }>,
        ) => {
          state.loading = false;
          state.completedDates = action.payload.completedDates;
          state.streaks = action.payload.streaks;
        },
      )

      /**
       * Handle failed statistics fetch
       *
       * Sets error message and loading to false when
       * statistics request fails.
       *
       * @param state - Current statistics state
       * @param action - Action containing error information
       */
      .addCase(fetchHabitStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to fetch habit statistics';
      });
  },
});

// Export reducer for store configuration
export default habitStatisticsSlice.reducer;
