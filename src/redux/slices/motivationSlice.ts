import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getMotivationSuggestion } from '@/services/AIServices';

interface MotivationState {
  loading: boolean;
  motivationMessage: string | null;
  error: string | null;
}

const initialState: MotivationState = {
  loading: false,
  motivationMessage: '',
  error: null,
};

export const fetchMotivation = createAsyncThunk(
  'motivation/fetchMotivation',
  async () => {
    return await getMotivationSuggestion();
  },
);

const motivationSlice = createSlice({
  name: 'motivation',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchMotivation.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMotivation.fulfilled, (state, action) => {
        state.loading = false;
        state.motivationMessage = action.payload;
      })
      .addCase(fetchMotivation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch motivation';
      });
  },
});

export default motivationSlice.reducer;
