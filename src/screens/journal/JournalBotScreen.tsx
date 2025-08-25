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
  getHabitsByJournalAction,
  resetJournal,
  saveJournalEntryAction,
  setChatMessages,
  appendChatMessages,
  setIsAnalysisDone,
  setDraftJournalEntry,
  setAiLoading,
} from '@/redux/slices/journalSlice';
import { goBack } from '@/utils/NavigationUtils';
import AILoader from '@/component/AILoader';
import { moodList } from '@/utils/AppConstants';

export const MessageType = {
  GREET: 'greet',
  JOURNAL_HELP: 'journal-help',
  BOT_SENDER: 'bot-sender',
  USER_SENDER: 'user-sender',
};

const JournalBotScreen = () => {
  const flatListRef = useRef<FlatList>(null);
  const [journalEntry, setJournalEntry] = useState('');

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
      appendChatMessages([
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
    // TODO: check
    if (analyzeRes.success && analyzeRes.data && textToAnalyze) {
      sentimentData = analyzeRes.data;

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

    const aiHabits = await dispatch(
      getHabitsByJournalAction({
        moodLabel: sentimentData?.mood.moodLabel || moodList[2].moodLabel,
        journalEntry: textToAnalyze,
      }),
    ).unwrap();

    console.log(`TAGE ==> ${JSON.stringify(aiHabits.data)}`);

    if (aiHabits.success) {
      dispatch(
        appendChatMessages([
          {
            id: `${MessageType.BOT_SENDER}-6`,
            sender: 'bot',
            message: `Here are a few tiny habits for today:`,
          },
          {
            id: `${MessageType.BOT_SENDER}-7}`,
            sender: 'bot',
            message: aiHabits.data?.map(h => `• ${h}`).join('\n'),
          },
          {
            id: `${MessageType.BOT_SENDER}-8}`,
            sender: 'bot',
            message: 'All set! Tap Done to save your journal.',
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

  useEffect(() => {
    // If chat already reached completion in a previous session, ensure Done is shown
    if (!isAnalysisDone && chatMsg && chatMsg.length > 0) {
      const hasCompletionMsg = chatMsg.some(m =>
        (m.message || '').includes('All set! Tap Done to save your journal.'),
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

        {!isAnalysisDone && user && !isAiLoading && (
          <View style={styles.bottomContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a few lines about your day..."
              placeholderTextColor={colors.inputPlaceholder}
              value={journalEntry}
              onChangeText={text => {
                setJournalEntry(text);
                dispatch(setDraftJournalEntry(text));
              }}
              multiline
              numberOfLines={4}
              returnKeyType="done"
            />

            <TouchableOpacity onPress={handleAnalyze}>
              <Icon name="send" size={28} color={colors.primary} />
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

export default JournalBotScreen;

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
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBg,
      color: colors.text,
      borderRadius: 8,
      width: '90%',
      padding: 16,
      marginRight: 10,
      fontSize: 14,
    },
    flatListContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },
    botText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
  });
}
