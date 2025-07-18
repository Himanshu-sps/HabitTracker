import {
  createSlice,
  PayloadAction,
  createAsyncThunk,
  ActionReducerMapBuilder,
} from '@reduxjs/toolkit';
import { analyzeSentiment } from '@/services/AIServices';
import { BaseResponseType, MoodType, SentimentResult } from '@/type';
import { saveJournalEntry } from '@/services/FirebaseService';
import { JournalType } from '@/type';
import { fetchJournalEntry } from '@/services/FirebaseService';
import { moodList } from '@/utils/AppConstants';

//Step:1
interface JournalState {
  journal: JournalType | null;
  error: string | null;
}

//Step:2
const initialState: JournalState = {
  journal: null,
  error: null,
};

//Step:3
const journalSlice = createSlice({
  name: 'journal',
  initialState,
  reducers: {
    resetJournal: () => initialState,
  },
  extraReducers: builder => {
    handleSentimentAnalysis(builder);
    handleFetchJournal(builder);
  },
});

// Step:4 : create async thunks
export const saveAndAnalyzeSentiment = createAsyncThunk(
  'journal/saveAndAnalyzeSentiment',
  async ({
    journalEntry,
    journalDate,
    userId,
  }: {
    journalEntry: string;
    journalDate: string;
    userId: string;
  }): Promise<
    BaseResponseType<SentimentResult> & { savedJournal?: JournalType }
  > => {
    // perform AI analysis
    const sentimentResponse = await analyzeSentiment(journalEntry);

    // JournalType object to be saved
    let savedJournal: JournalType | undefined = undefined;

    if (sentimentResponse.success && sentimentResponse.data) {
      const journalToSave = {
        userId,
        journalEntry,
        journalDate: journalDate, // already formatted in screen
        sentimentLabel: sentimentResponse.data.mood.moodLabel,
        sentimentScore: sentimentResponse.data.mood.moodLevel,
        aiTips: sentimentResponse.data.tip,
        updatedAt: new Date().toISOString(),
      };

      // Saving in firestore
      savedJournal = await saveJournalEntry(journalToSave);
    }

    return { ...sentimentResponse, savedJournal };
  },
);

export const getJournalEntry = createAsyncThunk(
  'journal/getJournalEntry',
  async ({ userId, journalDate }: { userId: string; journalDate: string }) => {
    const journal = await fetchJournalEntry(userId, journalDate);
    return journal;
  },
);

// Step:5
const handleSentimentAnalysis = (
  builder: ActionReducerMapBuilder<JournalState>,
) => {
  builder
    .addCase(saveAndAnalyzeSentiment.fulfilled, (state, action) => {
      if (
        action.payload.success &&
        action.payload.data &&
        action.payload.savedJournal
      ) {
        state.journal = action.payload.savedJournal;
        state.error = null;
      } else {
        state.error = action.payload.msg || 'Failed to analyze sentiment';
        state.journal = null;
      }
    })
    .addCase(saveAndAnalyzeSentiment.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to analyze sentiment';
      state.journal = null;
    });
};

const handleFetchJournal = (builder: ActionReducerMapBuilder<JournalState>) => {
  builder
    .addCase(getJournalEntry.fulfilled, (state, action) => {
      state.journal = action.payload;
      state.error = null;
    })
    .addCase(getJournalEntry.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to fetch journal entry';
      state.journal = null;
    });
};

export const { resetJournal } = journalSlice.actions;
export default journalSlice.reducer;
