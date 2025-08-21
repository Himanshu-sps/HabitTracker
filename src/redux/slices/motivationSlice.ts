import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getMotivationSuggestion } from '@/services/AIServices';

/**
 * Motivation State Interface
 *
 * Manages motivation-related state including loading states, motivation messages,
 * and error handling. This slice handles AI-powered motivation suggestions.
 */
interface MotivationState {
  /** Boolean flag indicating whether a motivation request is in progress */
  loading: boolean;
  /** Current motivation message from AI service */
  motivationMessage: string | null;
  /** Error message if motivation request fails */
  error: string | null;
}

/**
 * Initial motivation state
 *
 * Sets default values for motivation state when the app starts
 * or when motivation data is reset.
 */
const initialState: MotivationState = {
  loading: false,
  motivationMessage: '',
  error: null,
};

/**
 * Async thunk to fetch motivation suggestion
 *
 * Fetches a motivational message from the AI service to encourage
 * users in their habit-building journey.
 *
 * @example
 * // Fetch motivation message
 * dispatch(fetchMotivation());
 *
 * @returns Promise resolving to motivation message string
 */
export const fetchMotivation = createAsyncThunk(
  'motivation/fetchMotivation',
  async () => {
    return await getMotivationSuggestion();
  },
);

/**
 * Motivation Slice
 *
 * Redux Toolkit slice that manages motivation state and provides
 * async actions for fetching AI-generated motivation messages.
 *
 * @example
 * // Access motivation state
 * const { loading, motivationMessage, error } = useSelector(state => state.motivation);
 *
 * // Fetch new motivation
 * dispatch(fetchMotivation());
 */
const motivationSlice = createSlice({
  name: 'motivation',
  initialState,
  reducers: {
    // Future synchronous actions can be added here
    // Example: clearMotivation, setCustomMotivation, etc.
  },
  extraReducers: builder => {
    builder
      /**
       * Handle pending state when fetching motivation
       *
       * Sets loading to true and clears any previous errors
       * when a motivation request starts.
       */
      .addCase(fetchMotivation.pending, state => {
        state.loading = true;
        state.error = null;
      })

      /**
       * Handle successful motivation fetch
       *
       * Updates state with the fetched motivation message
       * and sets loading to false.
       *
       * @param state - Current motivation state
       * @param action - Payload containing the motivation message
       */
      .addCase(fetchMotivation.fulfilled, (state, action) => {
        state.loading = false;
        state.motivationMessage = action.payload;
      })

      /**
       * Handle failed motivation fetch
       *
       * Sets error message and loading to false when
       * motivation request fails.
       *
       * @param state - Current motivation state
       * @param action - Action containing error information
       */
      .addCase(fetchMotivation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch motivation';
      });
  },
});

// Export reducer for store configuration
export default motivationSlice.reducer;
