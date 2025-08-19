import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchCompletedHabitsForHabit,
  calculateStreaks,
} from '@/services/FirebaseService';

interface HabitStatisticsState {
  loading: boolean;
  completedDates: string[];
  streaks: {
    currentStreak: number;
    bestStreak: number;
  };
  error: string | null;
}

const initialState: HabitStatisticsState = {
  loading: false,
  completedDates: [],
  streaks: { currentStreak: 0, bestStreak: 0 },
  error: null,
};

export const fetchHabitStatistics = createAsyncThunk(
  'habitStatistics/fetchHabitStatistics',
  async ({ userId, habitId }: { userId: string; habitId: string }) => {
    const res = await fetchCompletedHabitsForHabit(userId, habitId);
    const completedDates = res.data || [];
    const streaks = calculateStreaks(completedDates);
    return { completedDates, streaks };
  },
);

const habitStatisticsSlice = createSlice({
  name: 'habitStatistics',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchHabitStatistics.pending, state => {
        state.loading = true;
        state.error = null;
      })
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
      .addCase(fetchHabitStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to fetch habit statistics';
      });
  },
});

export default habitStatisticsSlice.reducer;
