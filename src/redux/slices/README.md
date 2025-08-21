# Redux Slices Documentation

This folder contains all the Redux Toolkit slices for the Habit Tracker application. Each slice manages a specific domain of the application's state and provides actions for state updates.

## Slice Organization

The slices are organized by complexity and dependency order:

### 1. **authSlice.ts** - Authentication Management

- **Purpose**: Manages user authentication state including login status and user data
- **State**: `userData`, `isLoggedIn`
- **Actions**: `setUserData`, `resetUserData`
- **Complexity**: Simple (Basic state management)

### 2. **habitSlice.ts** - Core Habit Management

- **Purpose**: Manages habit collections including all habits and today's habits
- **State**: `allHabits`, `todaysHabits`
- **Actions**: `setAllHabits`, `setTodaysHabits`, `resetHabits`
- **Complexity**: Simple (Basic state management)

### 3. **motivationSlice.ts** - AI Motivation System

- **Purpose**: Manages AI-powered motivation messages and loading states
- **State**: `loading`, `motivationMessage`, `error`
- **Actions**: `fetchMotivation` (async)
- **Complexity**: Simple (Async operations with basic state)

### 4. **habitStatisticsSlice.ts** - Habit Analytics

- **Purpose**: Manages habit completion statistics and streak calculations
- **State**: `loading`, `completedDates`, `streaks`, `error`
- **Actions**: `fetchHabitStatistics` (async)
- **Complexity**: Medium (Async operations with complex state)

### 5. **historySlice.ts** - Historical Data & Analytics

- **Purpose**: Manages historical journal data, mood charts, and timeline data with caching
- **State**: `loading`, `chartData`, `avgMood`, `timelineData`, `error`, `lastFetched`, `needsRefresh`
- **Actions**: `fetchHistoryData` (async), `invalidateHistoryCache`
- **Complexity**: High (Complex async operations, caching, data processing)

### 6. **journalSlice.ts** - Journal & AI Integration

- **Purpose**: Manages journal entries, AI sentiment analysis, chat interactions, and habit suggestions
- **State**: `sentimentResult`, `isAiLoading`, `journal`, `allJournals`, `chatMessages`, `draftJournalEntry`, etc.
- **Actions**: Multiple async actions for AI operations, CRUD operations, and chat management
- **Complexity**: Very High (Complex state, multiple async operations, AI integration, helper functions)

## State Structure Overview

```
Root State
├── auth
│   ├── userData: UserDataType | null
│   └── isLoggedIn: boolean
├── habit
│   ├── allHabits: HabitType[]
│   └── todaysHabits: HabitType[]
├── motivation
│   ├── loading: boolean
│   ├── motivationMessage: string | null
│   └── error: string | null
├── habitStatistics
│   ├── loading: boolean
│   ├── completedDates: string[]
│   ├── streaks: { currentStreak: number, bestStreak: number }
│   └── error: string | null
├── history
│   ├── loading: boolean
│   ├── chartData: { labels: string[], data: number[] }
│   ├── avgMood: number | null
│   ├── timelineData: Array<{ date: string, mood: number | null }>
│   ├── error: string | null
│   ├── lastFetched: number | null
│   └── needsRefresh: boolean
└── journal
    ├── sentimentResult: SentimentResult | null
    ├── isAiLoading: boolean
    ├── isAnalysisDone: boolean
    ├── journal: JournalType | null
    ├── error: string | null
    ├── allJournals: JournalType[]
    ├── suggestedHabitListByAi: string[]
    ├── chatMessages: ChatMsg[]
    ├── draftJournalEntry: string
    └── postCompletionChatMessages: ChatMsg[]
```

## Usage Patterns

### Basic State Access

```typescript
import { useSelector } from 'react-redux';

// Access specific slice state
const { userData, isLoggedIn } = useSelector(state => state.auth);
const { allHabits, todaysHabits } = useSelector(state => state.habit);
```

### Dispatching Actions

```typescript
import { useDispatch } from 'react-redux';
import { setUserData, fetchMotivation } from '@/redux/slices';

const dispatch = useDispatch();

// Synchronous actions
dispatch(setUserData({ userData: user, isLoggedIn: true }));

// Asynchronous actions
dispatch(fetchMotivation());
```

### Async Action States

```typescript
// Handle loading, success, and error states
const { loading, error, data } = useSelector(state => state.motivation);

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (data) return <DataDisplay data={data} />;
```

## Best Practices

### 1. **State Normalization**

- Keep state flat and normalized
- Use IDs as keys for arrays when possible
- Avoid nested objects in state

### 2. **Async Operations**

- Always handle pending, fulfilled, and rejected states
- Provide meaningful error messages
- Implement loading states for better UX

### 3. **Caching Strategy**

- Use timestamps for cache invalidation
- Implement cache duration constants
- Provide cache refresh mechanisms

### 4. **Error Handling**

- Centralize error messages
- Provide fallback values for failed operations
- Clear errors when starting new operations

### 5. **Performance Optimization**

- Use selectors for derived state
- Implement memoization where appropriate
- Avoid unnecessary re-renders

## Dependencies

### Internal Dependencies

- `@/type` - TypeScript type definitions
- `@/services/AIServices` - AI service functions
- `@/services/FirebaseService` - Firebase operations
- `@/utils/DateTimeUtils` - Date formatting utilities

### External Dependencies

- `@reduxjs/toolkit` - Redux Toolkit core
- `moment` - Date manipulation library

## Future Enhancements

### Planned Features

- **Real-time Updates**: WebSocket integration for live data
- **Offline Support**: Redux Persist for offline functionality
- **Advanced Caching**: Redis-like caching with TTL
- **State Synchronization**: Multi-device state sync
- **Performance Monitoring**: Redux DevTools integration

### Code Quality Improvements

- **Unit Tests**: Comprehensive test coverage for all slices
- **Type Safety**: Stricter TypeScript configurations
- **Documentation**: Auto-generated API documentation
- **Performance**: Bundle size optimization

## Contributing

When adding new slices or modifying existing ones:

1. **Follow the established patterns** for state structure and action naming
2. **Add comprehensive JSDoc documentation** for all public APIs
3. **Include usage examples** in the documentation
4. **Update this README** to reflect any changes
5. **Add unit tests** for new functionality
6. **Consider performance implications** of state changes

## Troubleshooting

### Common Issues

1. **State Not Updating**: Check if the action is being dispatched correctly
2. **Async Actions Failing**: Verify error handling in extraReducers
3. **Performance Issues**: Use Redux DevTools to identify unnecessary re-renders
4. **Type Errors**: Ensure all action payloads match their TypeScript interfaces

### Debug Tools

- **Redux DevTools**: Browser extension for debugging Redux state
- **Console Logging**: Add console.logs in reducers for debugging
- **TypeScript**: Use strict mode to catch type errors early

---

For more detailed information about specific slices, refer to the individual slice files and their inline documentation.
