import {
  createSlice,
  createAsyncThunk,
  ActionReducerMapBuilder,
} from '@reduxjs/toolkit';
import { analyzeSentiment } from '@/services/AIServices';
import { BaseResponseType, MoodType, SentimentResult } from '@/type';
import {
  fetchAllJournalsForUser,
  saveJournalEntry,
  deleteJournalEntry,
} from '@/services/FirebaseService';
import { JournalType } from '@/type';
import { fetchJournalEntry } from '@/services/FirebaseService';
import { invalidateHistoryCache } from './historySlice';

//Step:1
interface JournalState {
  journal: JournalType | null;
  error: string | null;
  allJournals: JournalType[] | [];
}

//Step:2
const initialState: JournalState = {
  journal: null,
  error: null,
  allJournals: [],
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
    handleFetchAllJournals(builder);
    handleDeleteJournal(builder);
  },
});

// Step:4 : create async thunks
export const saveAndAnalyzeSentiment = createAsyncThunk(
  'journal/saveAndAnalyzeSentiment',
  async (
    {
      journalEntry,
      journalDate,
      userId,
    }: {
      journalEntry: string;
      journalDate: string;
      userId: string;
    },
    { dispatch },
  ): Promise<
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

      // Invalidate history cache to force refresh when navigating to history screen
      dispatch(invalidateHistoryCache());
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

export const fetchAllJournalsByUserId = createAsyncThunk(
  'journal/fetchAllJournalsByUserId',
  async (userId: string) => {
    const journals = await fetchAllJournalsForUser(userId);
    return journals;
  },
);

export const deleteJournalById = createAsyncThunk(
  'journal/deleteJournalById',
  async ({ userId, journalId }: { userId: string; journalId: string }) => {
    const response = await deleteJournalEntry(userId, journalId);
    return { journalId, ...response };
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

const handleFetchAllJournals = (
  builder: ActionReducerMapBuilder<JournalState>,
) => {
  builder
    .addCase(fetchAllJournalsByUserId.pending, (state, action) => {
      (state.allJournals = []), (state.error = null);
    })
    .addCase(fetchAllJournalsByUserId.fulfilled, (state, action) => {
      if (action.payload.success && action.payload.data) {
        state.allJournals = action.payload.data;
      } else {
        state.error = action.payload.msg || 'Failed to fetch all Journals';
      }
    })
    .addCase(fetchAllJournalsByUserId.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to fetch all journals';
      state.allJournals = [];
    });
};

const handleDeleteJournal = (
  builder: ActionReducerMapBuilder<JournalState>,
) => {
  builder
    .addCase(deleteJournalById.fulfilled, (state, action) => {
      if (action.payload.success) {
        state.allJournals = state.allJournals.filter(
          j => j.id !== action.payload.journalId,
        );
      } else {
        state.error = action.payload.msg || 'Failed to delete journal';
      }
    })
    .addCase(deleteJournalById.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to delete journal';
    });
};

export const { resetJournal } = journalSlice.actions;
export default journalSlice.reducer;
