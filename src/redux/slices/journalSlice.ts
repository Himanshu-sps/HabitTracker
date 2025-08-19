import {
  createSlice,
  createAsyncThunk,
  ActionReducerMapBuilder,
  PayloadAction,
} from '@reduxjs/toolkit';
import { analyzeSentiment, suggestHabitsFromAI } from '@/services/AIServices';
import { BaseResponseType, SentimentResult } from '@/type';
import {
  fetchAllJournalsForUser,
  saveJournalEntry,
  deleteJournalEntry,
} from '@/services/FirebaseService';
import { JournalType } from '@/type';
import { fetchJournalEntry } from '@/services/FirebaseService';
import { invalidateHistoryCache } from './historySlice';
import { DATE_FORMAT_ZERO, formatDate } from '@/utils/DateTimeUtils';
import { ChatMsg } from '@/type';

//Step:1
interface JournalState {
  sentimentResult: SentimentResult | null;
  isAiLoading: boolean;
  isAnalysisDone: boolean;

  journal: JournalType | null;
  error: string | null;
  allJournals: JournalType[] | [];
  suggestedHabitListByAi: string[];
  chatMessages: ChatMsg[];
  draftJournalEntry: string;
}

//Step:2
const initialState: JournalState = {
  sentimentResult: null,
  isAiLoading: false,
  isAnalysisDone: false,

  journal: null,
  error: null,
  allJournals: [],

  suggestedHabitListByAi: [],
  chatMessages: [],
  draftJournalEntry: '',
};

//Step:3
const journalSlice = createSlice({
  name: 'journal',
  initialState,
  reducers: {
    resetJournal: () => initialState,
    setChatMessages: (state, action: PayloadAction<ChatMsg[]>) => {
      state.chatMessages = action.payload;
    },
    appendChatMessages: (state, action: PayloadAction<ChatMsg[]>) => {
      state.chatMessages = [...state.chatMessages, ...action.payload];
    },
    setIsAnalysisDone: (state, action: PayloadAction<boolean>) => {
      state.isAnalysisDone = action.payload;
    },
    setDraftJournalEntry: (state, action: PayloadAction<string>) => {
      state.draftJournalEntry = action.payload;
    },
    setAiLoading: (state, action: PayloadAction<boolean>) => {
      state.isAiLoading = action.payload;
    },
  },
  extraReducers: builder => {
    handleSentimentAnalysisAction(builder);
    handleFetchJournal(builder);
    handleFetchAllJournals(builder);
    handleDeleteJournal(builder);
    handleHabitListByAI(builder);
  },
});

// Step:4 : create async thunks
export const analyzeSentimentAction = createAsyncThunk(
  'journal/analyzeSentiment',
  async (
    { journalEntry, userId }: { journalEntry: string; userId: string },
    { dispatch },
  ): Promise<BaseResponseType<SentimentResult>> => {
    // perform AI analysis
    const sentimentResponse = await analyzeSentiment(journalEntry);
    return sentimentResponse;
  },
);

/**
 *
 */
export const saveJournalEntryAction = createAsyncThunk(
  'journal/saveJournalEntry',
  async (
    {
      sentimentResult,
      journalEntry,
      journalDate,
      userId,
    }: {
      sentimentResult: SentimentResult;
      journalEntry: string;
      journalDate: string;
      userId: string;
    },
    { dispatch },
  ) => {
    const journalToSave = {
      userId,
      journalEntry,
      journalDate: journalDate, // already formatted in screen
      sentimentLabel: sentimentResult?.mood.moodLabel,
      sentimentScore: sentimentResult.mood.moodLevel,
      aiTips: sentimentResult.tip,
      updatedAt: new Date().toISOString(),
    };

    // Saving in firestore
    const saveRes = await saveJournalEntry(journalToSave);
    dispatch(invalidateHistoryCache());
  },
);

export const getJournalEntry = createAsyncThunk(
  'journal/getJournalEntry',
  async ({ userId, journalDate }: { userId: string; journalDate: string }) => {
    const res = await fetchJournalEntry(userId, journalDate);
    if (res.success) return res.data || null;
    throw new Error(res.msg || 'Failed to fetch journal entry');
  },
);

export const fetchAllJournalsByUserId = createAsyncThunk(
  'journal/fetchAllJournalsByUserId',
  async (userId: string) => {
    const journals: BaseResponseType<JournalType[]> =
      await fetchAllJournalsForUser(userId);
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

export const getHabitsByJournalAction = createAsyncThunk(
  'journal/getHabitsByJournal',
  async ({
    moodLabel,
    journalEntry,
  }: {
    moodLabel: string;
    journalEntry: string;
  }): Promise<BaseResponseType<string[]>> => {
    // perform AI analysis
    const habitListResponse = await suggestHabitsFromAI(
      moodLabel,
      journalEntry,
    );
    return habitListResponse;
  },
);

//Step: 5;
const handleSentimentAnalysisAction = (
  builder: ActionReducerMapBuilder<JournalState>,
) => {
  builder
    .addCase(analyzeSentimentAction.pending, state => {
      state.isAiLoading = true;
    })
    .addCase(analyzeSentimentAction.fulfilled, (state, action) => {
      if (action.payload.success && action.payload.data) {
        state.sentimentResult = action.payload.data;
        state.error = null;
        state.isAiLoading = false;
      } else {
        state.sentimentResult = null;
        state.error = action.payload.msg || 'Failed to analyze sentiment';
        state.isAiLoading = false;
      }
    })
    .addCase(analyzeSentimentAction.rejected, (state, action) => {
      state.sentimentResult = null;
      state.error = action.error.message || 'Failed to analyze sentiment';
      state.isAiLoading = false;
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

const handleHabitListByAI = (
  builder: ActionReducerMapBuilder<JournalState>,
) => {
  builder.addCase(getHabitsByJournalAction.pending, state => {
    state.isAiLoading = true;
  });
  builder.addCase(getHabitsByJournalAction.fulfilled, (state, action) => {
    if (action.payload.success && action.payload.data) {
      state.isAiLoading = false;
      state.error = null;
      state.suggestedHabitListByAi = action.payload.data ?? [];
    } else {
      state.isAiLoading = false;
      state.error = action.payload.msg || 'Failed to fetch habits';
      state.suggestedHabitListByAi = action.payload.data ?? [];
    }
  });
  builder.addCase(getHabitsByJournalAction.rejected, (state, action) => {
    state.isAiLoading = false;
    state.error = action.error.message || 'Failed to fetch habits';
    state.suggestedHabitListByAi = [];
  });
};

export const {
  resetJournal,
  setChatMessages,
  appendChatMessages,
  setIsAnalysisDone,
  setDraftJournalEntry,
  setAiLoading,
} = journalSlice.actions;
export default journalSlice.reducer;
