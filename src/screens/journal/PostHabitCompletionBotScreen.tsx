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
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/utils/ThemeContext';
import AppHeader from '@/component/AppHeader';
import { useAppSelector } from '@/redux/hook';
import { ChatMsg, SentimentResult, UserDataType } from '@/type';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppButton from '@/component/AppButton';
import { DATE_FORMAT_ZERO, formatDate } from '@/utils/DateTimeUtils';
import { useAppDispatch } from '@/redux/hook';
import {
  analyzeSentimentAction,
  resetJournal,
  saveJournalEntryAction,
  setIsAnalysisDone,
  setDraftJournalEntry,
  setAiLoading,
  setPostCompletionChatMessages,
  appendPostCompletionChatMessages,
} from '@/redux/slices/journalSlice';
import { goBack } from '@/utils/NavigationUtils';
import AILoader from '@/component/AILoader';

export const MessageType = {
  BOT_SENDER: 'bot-sender',
  USER_SENDER: 'user-sender',
};

const PostHabitCompletionBotScreen = () => {
  const flatListRef = useRef<FlatList>(null);
  const [journalEntry, setJournalEntry] = useState('');

  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.authReducer?.userData);
  const { journal, isAiLoading, sentimentResult, error } = useAppSelector(
    (state: any) => state.journalReducer || {},
  );
  const chatMsg = useAppSelector(
    state => state.journalReducer.postCompletionChatMessages ?? [],
  );
  const isAnalysisDone = useAppSelector(
    state => state.journalReducer.isAnalysisDone,
  );
  const draftJournalEntry = useAppSelector(
    state => state.journalReducer.draftJournalEntry,
  );

  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  const handleCompletion = async () => {
    if (sentimentResult && user?.id) {
      const journalObj = {
        sentimentResult: sentimentResult,
        journalEntry: journalEntry,
        journalDate: formatDate(new Date(), DATE_FORMAT_ZERO),
        userId: user?.id,
      };

      // save journal to firestore
      await dispatch(saveJournalEntryAction(journalObj));
      goBack();
    }
  };

  /**
   *
   * @returns
   */
  const handleAnalyze = async () => {
    const textToAnalyze = (journalEntry || draftJournalEntry || '').trim();
    if (!textToAnalyze) return;

    Keyboard.dismiss();
    dispatch(setAiLoading(true));

    // Echo user message
    dispatch(
      appendPostCompletionChatMessages([
        {
          id: `${MessageType.USER_SENDER}-3`,
          sender: 'user',
          message: textToAnalyze,
        },
      ]),
    );

    const analyzeRes = await dispatch(
      analyzeSentimentAction({
        journalEntry: textToAnalyze,
        userId: user?.id!!,
      }),
    ).unwrap();

    let sentimentData: SentimentResult | null = null;
    if (analyzeRes.success && analyzeRes.data && textToAnalyze) {
      sentimentData = analyzeRes.data;

      dispatch(
        appendPostCompletionChatMessages([
          {
            id: `${MessageType.BOT_SENDER}-4`,
            sender: 'bot',
            message: `${user?.name} \nI sense you're feeling ${sentimentData?.mood.moodLabel} ${sentimentData?.mood.moodIcon}. \n\nThanks for sharing I will update the journal entry`,
          },
          {
            id: `${MessageType.BOT_SENDER}-5`,
            sender: 'bot',
            message: `Beatiful AI Tip for keeping the momentum: ${sentimentData?.tip}`,
          },
        ]),
      );
    }

    // set analysis flag to true
    dispatch(setIsAnalysisDone(true));
  };

  useEffect(() => {
    // hydrate input from persisted draft
    if (draftJournalEntry && !journalEntry) {
      setJournalEntry(draftJournalEntry);
    }
  }, [draftJournalEntry]);

  useEffect(() => {
    if (chatMsg.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [chatMsg]);

  const initialBotGreeting = (name?: string) =>
    `Hi ${name ? ` ${name}` : ''}. \nHope you are doing well!`;

  useEffect(() => {
    // Ensure loader is off on first mount when prefilled data exists
    if (isAiLoading) {
      dispatch(setAiLoading(false));
    }
    if ((chatMsg?.length ?? 0) === 0) {
      dispatch(
        setPostCompletionChatMessages([
          {
            id: `${MessageType.BOT_SENDER}-1`,
            sender: 'bot',
            message: initialBotGreeting(user?.name),
          },
          {
            id: `${MessageType.BOT_SENDER}-2`,
            sender: 'bot',
            message:
              "Glad! You've completed all habits for today. \n\nPlease share few lines after completing all habits \n\nJust type your journal entry below and we will analyze your mood.",
          },
        ]),
      );
    }
  }, []);

  useEffect(() => {
    // If chat already reached completion in a previous session, ensure Done is shown
    if (!isAnalysisDone && chatMsg && chatMsg.length > 0) {
      const hasCompletionMsg = chatMsg.some(m =>
        (m.message || '').includes('Beatiful AI Tip for keeping the momentum'),
      );
      if (hasCompletionMsg) {
        dispatch(setIsAnalysisDone(true));
      }
    }
  }, [chatMsg, isAnalysisDone]);

  useEffect(() => {
    // Cleanup state when leaving the screen
    return () => {
      dispatch(resetJournal());
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <AppHeader
        title="Assessment"
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
          renderItem={({ item }: { item: ChatMsg }) => {
            const isUser = item.sender === 'user';
            return (
              <View style={isUser ? styles.userBubble : styles.botBubble}>
                <Text style={styles.botText}>{item.message}</Text>
              </View>
            );
          }}
          style={styles.flatListContainer}
          ListFooterComponent={
            isAiLoading ? (
              <View style={{ marginTop: 10 }}>
                <AILoader />
              </View>
            ) : null
          }
        />

        {!isAnalysisDone && user && (
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
        )}

        {isAnalysisDone && (
          <AppButton
            style={{ marginHorizontal: 16 }}
            title={'Done'}
            onPress={handleCompletion}
            disabled={!isAnalysisDone}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PostHabitCompletionBotScreen;

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
    flatListContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },
    botText: {
      fontSize: 14,
      fontWeight: '500',
    },
  });
}
