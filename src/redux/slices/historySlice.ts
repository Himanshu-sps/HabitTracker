import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchJournalsForUserInRange } from '@/services/FirebaseService';
import { JournalType } from '@/type';
import moment from 'moment';
import { DATE_FORMAT_ZERO, formatDate } from '@/utils/DateTimeUtils';

interface HistoryState {
  loading: boolean;
  chartData: {
    labels: string[];
    data: number[];
  };
  avgMood: number | null;
  timelineData: {
    date: string;
    mood: number | null;
  }[];
  error: string | null;
  lastFetched: number | null;
  needsRefresh: boolean;
}

const initialState: HistoryState = {
  loading: false,
  chartData: { labels: [], data: [] },
  avgMood: null,
  timelineData: [],
  error: null,
  lastFetched: null,
  needsRefresh: false,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

type FetchHistoryDataReturnType = {
  fromCache: boolean;
  chartData?: {
    labels: string[];
    data: number[];
  };
  avgMood?: number | null;
  timelineData?: {
    date: string;
    mood: number | null;
  }[];
  lastFetched?: number;
};

export const fetchHistoryData = createAsyncThunk<
  FetchHistoryDataReturnType,
  string,
  { state: { history: HistoryState } }
>('history/fetchHistoryData', async (userId, { getState }) => {
  const { history } = getState();
  const now = Date.now();

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

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    invalidateHistoryCache: state => {
      state.lastFetched = null;
      state.needsRefresh = true;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchHistoryData.pending, state => {
        state.loading = true;
        state.error = null;
      })
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
      .addCase(fetchHistoryData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch history data';
      });
  },
});

export const { invalidateHistoryCache } = historySlice.actions;
export default historySlice.reducer;
