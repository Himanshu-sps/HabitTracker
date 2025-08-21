import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HabitType } from '@/type';

/**
 * Habit State Interface
 *
 * Manages habit-related state including all habits and today's specific habits.
 * This slice handles the core habit data management for the habit tracker app.
 */
interface HabitState {
  /** Array of all habits created by the user */
  allHabits: HabitType[];
  /** Array of habits scheduled for today */
  todaysHabits: HabitType[];
}

/**
 * Initial habit state
 *
 * Sets default values for habit state when the app starts
 * or when habits are reset.
 */
const initialState: HabitState = {
  allHabits: [],
  todaysHabits: [],
};

/**
 * Habit Slice
 *
 * Redux Toolkit slice that manages habit state and provides
 * actions for updating habit collections.
 *
 * @example
 * // Set all habits
 * dispatch(setAllHabits(habitsArray));
 *
 * // Set today's habits
 * dispatch(setTodaysHabits(todaysHabitsArray));
 *
 * // Reset all habit data
 * dispatch(resetHabits());
 */
const habitSlice = createSlice({
  name: 'habit',
  initialState,
  reducers: {
    /**
     * Sets the complete list of all habits
     *
     * Updates the state with a new array of all user habits.
     * Typically used when fetching habits from backend or after CRUD operations.
     *
     * @param state - Current habit state
     * @param action - Payload containing array of all habits
     */
    setAllHabits: (state, action: PayloadAction<HabitType[]>) => {
      state.allHabits = action.payload;
    },

    /**
     * Sets the list of habits for today
     *
     * Updates the state with habits that are scheduled for the current day.
     * Used to show daily habit progress and completion status.
     *
     * @param state - Current habit state
     * @param action - Payload containing array of today's habits
     */
    setTodaysHabits: (state, action: PayloadAction<HabitType[]>) => {
      state.todaysHabits = action.payload;
    },

    /**
     * Resets habit state to initial values
     *
     * Clears all habit data and returns to initial state.
     * Typically used when user logs out or when clearing app data.
     *
     * @returns Initial habit state
     */
    resetHabits: () => initialState,
  },
});

// Export actions for use in components
export const { setAllHabits, setTodaysHabits, resetHabits } =
  habitSlice.actions;

// Export reducer for store configuration
export default habitSlice.reducer;
