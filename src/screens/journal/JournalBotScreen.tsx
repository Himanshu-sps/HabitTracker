import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TouchableOpacity,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Local imports
import AppHeader from '@/component/AppHeader';
import AppButton from '@/component/AppButton';
import AILoader from '@/component/AILoader';
import { useAppTheme } from '@/utils/ThemeContext';
import { useAppSelector, useAppDispatch } from '@/redux/hook';
import { ChatMsg, SentimentResult, UserDataType } from '@/type';
import { DATE_FORMAT_ZERO, formatDate } from '@/utils/DateTimeUtils';
import { goBack } from '@/utils/NavigationUtils';
import { moodList } from '@/utils/AppConstants';
import {
  analyzeSentimentAction,
  getHabitsByJournalAction,
  resetJournal,
  saveJournalEntryAction,
  setChatMessages,
  appendChatMessages,
  setIsAnalysisDone,
  setDraftJournalEntry,
  setAiLoading,
} from '@/redux/slices/journalSlice';

/**
 * Message type constants for chat functionality
 */
export const MessageType = {
  GREET: 'greet',
  JOURNAL_HELP: 'journal-help',
  BOT_SENDER: 'bot-sender',
  USER_SENDER: 'user-sender',
} as const;

/**
 * JournalBotScreen Component
 *
 * An AI-powered journal assistant that helps users analyze their daily entries,
 * provides sentiment analysis, and suggests relevant habits based on mood.
 *
 * Features:
 * - Interactive chat interface with AI bot
 * - Sentiment analysis of journal entries
 * - AI-powered habit suggestions
 * - Draft saving and restoration
 * - Journal entry completion and storage
 */
const JournalBotScreen = () => {
  // Refs
  const flatListRef = useRef<FlatList>(null);

  // Local state
  const [journalEntry, setJournalEntry] = useState('');

  // Redux hooks
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.authReducer.userData);
  const { journal, isAiLoading, sentimentResult, error } = useAppSelector(
    state => state.journalReducer,
  );
  const chatMsg = useAppSelector(
    state => state.journalReducer.chatMessages ?? [],
  );
  const isAnalysisDone = useAppSelector(
    state => state.journalReducer.isAnalysisDone,
  );
  const draftJournalEntry = useAppSelector(
    state => state.journalReducer.draftJournalEntry,
  );

  // Theme
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  /**
   * Handles the completion of journal entry analysis
   * Saves the journal entry with sentiment analysis to Firestore
   * and navigates back to the previous screen
   */
  const handleCompletion = async () => {
    if (sentimentResult && user?.id) {
      const journalObj = {
        sentimentResult: sentimentResult,
        journalEntry: journalEntry,
        journalDate: formatDate(new Date(), DATE_FORMAT_ZERO),
        userId: user?.id,
      };

      // Save journal to Firestore
      await dispatch(saveJournalEntryAction(journalObj));
      goBack();
    }
  };

  /**
   * Analyzes the journal entry using AI services
   *
   * Process:
   * 1. Echoes user message in chat
   * 2. Analyzes sentiment using AI
   * 3. Generates mood-based response
   * 4. Suggests relevant habits
   * 5. Marks analysis as complete
   *
   * @returns Promise<void>
   */
  const handleAnalyze = async () => {
    const textToAnalyze = (journalEntry || draftJournalEntry || '').trim();
    if (!textToAnalyze) return;

    Keyboard.dismiss();
    dispatch(setAiLoading(true));

    // Echo user message
    dispatch(
      appendChatMessages([
        {
          id: `${MessageType.USER_SENDER}-3`,
          sender: 'user',
          message: textToAnalyze,
        },
      ]),
    );

    // Analyze sentiment
    const analyzeRes = await dispatch(
      analyzeSentimentAction({
        journalEntry: textToAnalyze,
        userId: user?.id!!,
      }),
    ).unwrap();

    let sentimentData: SentimentResult | null = null;

    if (analyzeRes.success && analyzeRes.data && textToAnalyze) {
      sentimentData = analyzeRes.data;

      // Add sentiment analysis response
      dispatch(
        appendChatMessages([
          {
            id: `${MessageType.BOT_SENDER}-4`,
            sender: 'bot',
            message: `${user?.name} \nI sense you're feeling ${sentimentData?.mood.moodLabel} ${sentimentData?.mood.moodIcon}`,
          },
          {
            id: `${MessageType.BOT_SENDER}-5`,
            sender: 'bot',
            message: `AI Tip: ${sentimentData?.tip}`,
          },
        ]),
      );
    }

    // Get AI-powered habit suggestions
    const aiHabits = await dispatch(
      getHabitsByJournalAction({
        moodLabel: sentimentData?.mood.moodLabel || moodList[2].moodLabel,
        journalEntry: textToAnalyze,
      }),
    ).unwrap();

    console.log(`AI Habits Response: ${JSON.stringify(aiHabits.data)}`);

    if (aiHabits.success) {
      dispatch(
        appendChatMessages([
          {
            id: `${MessageType.BOT_SENDER}-6`,
            sender: 'bot',
            message: `Here are a few tiny habits for today:`,
          },
          {
            id: `${MessageType.BOT_SENDER}-7`,
            sender: 'bot',
            message: aiHabits.data?.map(h => `• ${h}`).join('\n'),
          },
          {
            id: `${MessageType.BOT_SENDER}-8`,
            sender: 'bot',
            message: 'All set! Tap Done to save your journal.',
          },
        ]),
      );
    }

    // Mark analysis as complete
    dispatch(setIsAnalysisDone(true));
  };

  /**
   * Generates initial bot greeting message
   * @param name - User's name (optional)
   * @returns Formatted greeting string
   */
  const initialBotGreeting = (name?: string) =>
    `Hi ${name ? ` ${name}` : ''}. \nHope you are doing well!`;

  // Effects

  /**
   * Effect: Hydrate input from persisted draft
   * Restores any previously saved draft journal entry
   */
  useEffect(() => {
    if (draftJournalEntry && !journalEntry) {
      setJournalEntry(draftJournalEntry);
    }
  }, [draftJournalEntry]);

  /**
   * Effect: Auto-scroll chat to bottom
   * Ensures latest messages are visible when new messages arrive
   */
  useEffect(() => {
    if (chatMsg.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [chatMsg]);

  /**
   * Effect: Initialize chat with bot greeting
   * Sets up initial bot messages and ensures AI loading state is reset
   */
  useEffect(() => {
    // Ensure loader is off on first mount when prefilled data exists
    if (isAiLoading) {
      dispatch(setAiLoading(false));
    }

    if ((chatMsg?.length ?? 0) === 0) {
      dispatch(
        setChatMessages([
          {
            id: `${MessageType.BOT_SENDER}-1`,
            sender: 'bot',
            message: initialBotGreeting(user?.name),
          },
          {
            id: `${MessageType.BOT_SENDER}-2`,
            sender: 'bot',
            message:
              "I'm here to help with today's journal. \n\nShare a few lines about your day—anything on your mind. \n\nWhen you're ready, type your journal below and analyze.",
          },
        ]),
      );
    }
  }, []);

  /**
   * Effect: Restore completion state from previous session
   * Checks if chat already reached completion and restores the Done button
   */
  useEffect(() => {
    if (!isAnalysisDone && chatMsg && chatMsg.length > 0) {
      const hasCompletionMsg = chatMsg.some(m =>
        (m.message || '').includes('All set! Tap Done to save your journal.'),
      );
      if (hasCompletionMsg) {
        dispatch(setIsAnalysisDone(true));
      }
    }
  }, [chatMsg, isAnalysisDone]);

  /**
   * Effect: Cleanup on component unmount
   * Resets journal state when leaving the screen
   */
  useEffect(() => {
    return () => {
      dispatch(resetJournal());
    };
  }, []);

  // Render methods

  /**
   * Renders individual chat message bubbles
   * @param item - Chat message object
   * @returns JSX element for the message bubble
   */
  const renderChatMessage = ({ item }: { item: ChatMsg }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={isUser ? styles.userBubble : styles.botBubble}>
        <Text style={styles.botText}>{item.message}</Text>
      </View>
    );
  };

  /**
   * Renders the input section for journal entry
   * Only shown when analysis is not complete
   */
  const renderInputSection = () => {
    if (isAnalysisDone || !user) return null;

    return (
      <View
        style={[
          styles.bottomContainer,
          isAiLoading ? { opacity: 0.6 } : undefined,
        ]}
        pointerEvents={isAiLoading ? 'none' : 'auto'}
      >
        <TextInput
          style={styles.textInput}
          placeholder="Type a few lines about your day..."
          value={journalEntry}
          onChangeText={text => {
            setJournalEntry(text);
            dispatch(setDraftJournalEntry(text));
          }}
          multiline
          numberOfLines={4}
          returnKeyType="done"
          editable={!isAiLoading}
        />

        <TouchableOpacity onPress={handleAnalyze} disabled={isAiLoading}>
          {isAiLoading ? (
            <ActivityIndicator size={24} color={colors.primary} />
          ) : (
            <Icon name="send" size={28} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Renders the completion button
   * Only shown when analysis is complete
   */
  const renderCompletionButton = () => {
    if (!isAnalysisDone) return null;

    return (
      <AppButton
        style={{ marginHorizontal: 16 }}
        title={'Done'}
        onPress={handleCompletion}
        disabled={!isAnalysisDone}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <AppHeader
        title="AI Journal Assistant"
        showBackButton={true}
        leftMaterialIcon="cancel"
      />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        style={styles.container}
      >
        <FlatList
          keyExtractor={(item: ChatMsg, index: number) =>
            (item.id || item.id.toString()) + index.toString()
          }
          ref={flatListRef}
          data={chatMsg}
          renderItem={renderChatMessage}
          style={styles.flatListContainer}
          ListFooterComponent={
            isAiLoading ? (
              <View style={{ marginTop: 10 }}>
                <AILoader />
              </View>
            ) : null
          }
        />

        {renderInputSection()}
        {renderCompletionButton()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default JournalBotScreen;

/**
 * Generates styles for the JournalBotScreen component
 * @param colors - Theme colors object
 * @returns StyleSheet object with component styles
 */
function getStyles(colors: any) {
  return StyleSheet.create({
    safeContainer: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    container: {
      width: '100%',
      flex: 1,
    },
    flatListContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },
    botBubble: {
      width: 'auto',
      alignSelf: 'flex-start',
      borderWidth: 1,
      backgroundColor: colors.pinkBg,
      borderColor: colors.primary,
      borderRadius: 16,
      padding: 8,
      borderBottomStartRadius: 0,
      marginTop: 8,
    },
    userBubble: {
      width: 'auto',
      borderWidth: 1,
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      borderRadius: 16,
      padding: 8,
      borderBottomEndRadius: 0,
      marginTop: 8,
    },
    bottomContainer: {
      width: '100%',
      marginVertical: 20,
      alignItems: 'center',
      flexDirection: 'row',
      paddingHorizontal: 16,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.inputBg,
      borderRadius: 8,
      width: '90%',
      padding: 16,
      marginRight: 10,
    },
    botText: {
      fontSize: 14,
      fontWeight: '500',
    },
  });
}
