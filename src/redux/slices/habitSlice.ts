import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HabitType } from '@/type';

interface HabitState {
  allHabits: HabitType[];
  todaysHabits: HabitType[];
}

const initialState: HabitState = {
  allHabits: [],
  todaysHabits: [],
};

const habitSlice = createSlice({
  name: 'habit',
  initialState,
  reducers: {
    setAllHabits: (state, action: PayloadAction<HabitType[]>) => {
      state.allHabits = action.payload;
    },
    setTodaysHabits: (state, action: PayloadAction<HabitType[]>) => {
      state.todaysHabits = action.payload;
    },
    resetHabits: () => initialState,
  },
});

export const { setAllHabits, setTodaysHabits, resetHabits } =
  habitSlice.actions;
export default habitSlice.reducer;
