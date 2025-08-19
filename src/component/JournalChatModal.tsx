import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextStyle,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AppCustomModal from '@/component/AppCustomModal';
import AppTextInput from '@/component/AppTextInput';
import AppButton from '@/component/AppButton';
import { useAppTheme } from '@/utils/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch } from '@/redux/hook';
import { saveAndAnalyzeSentiment } from '@/redux/slices/journalSlice';
import { saveJournalEntry } from '@/services/FirebaseService';
import { invalidateHistoryCache } from '@/redux/slices/historySlice';
import { formatDate, DATE_FORMAT_ZERO } from '@/utils/DateTimeUtils';
import { SentimentResult } from '@/type';
import { suggestHabitsFromAI } from '@/services/AIServices';

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text?: string;
  moodResult?: SentimentResult;
};

interface JournalChatModalProps {
  visible: boolean;
  userId: string;
  userName?: string;
  onDismiss: () => void;
  onCompleted?: () => void; // called after successful save
}

const initialBotGreeting = (name?: string) =>
  `Hi${
    name ? ` ${name}` : ''
  }! I\'m here to help with today\'s journal. Share a few lines about your day—anything on your mind.`;

const JournalChatModal: React.FC<JournalChatModalProps> = ({
  visible,
  userId,
  userName,
  onDismiss,
  onCompleted,
}) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const dispatch = useAppDispatch();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [wasSaved, setWasSaved] = useState(false);
  const [lastJournalText, setLastJournalText] = useState<string>('');
  const [lastResult, setLastResult] = useState<SentimentResult | undefined>(
    undefined,
  );

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setMessages([
        { id: 'greet', sender: 'bot', text: initialBotGreeting(userName) },
        {
          id: 'ask',
          sender: 'bot',
          text: "When you're ready, type your journal below and tap Analyze.",
        },
      ]);
      setInput('');
      setSubmitting(false);
      setAnalysisDone(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
    }
  }, [visible, userName]);

  const suggestedHabitsByMood = useMemo(
    () => ({
      VeryHappy: [
        'Share gratitude with someone',
        'Go for a celebratory walk',
        "Plan tomorrow's win",
      ],
      Happy: [
        '10-min mindful walk',
        'Write 3 gratitudes',
        'Hydrate and stretch',
      ],
      Neutral: ['5-min breathing', 'Tidy your space', 'Light exercise'],
      Sad: ['Short outdoor walk', 'Text a friend', '2-min box breathing'],
      Angry: [
        'Deep breathing 5x',
        'Quick journaling on triggers',
        'Short workout',
      ],
    }),
    [],
  );

  const handleAnalyze = async () => {
    if (!input?.trim() || submitting) return;
    setSubmitting(true);

    const today = formatDate(new Date(), DATE_FORMAT_ZERO);
    const journalText = input.trim();

    // Echo user message
    setMessages(prev => [
      ...prev,
      { id: `u-${Date.now()}`, sender: 'user', text: journalText },
      {
        id: `bot-typing-${Date.now()}`,
        sender: 'bot',
        text: 'Analyzing your entry…',
      },
    ]);
    setInput('');

    try {
      const result = await dispatch(
        saveAndAnalyzeSentiment({
          journalEntry: journalText,
          journalDate: today,
          userId,
        }),
      ).unwrap();

      if (result.success && result.data) {
        const mood = result.data.mood;
        const tip = result.data.tip;
        const moodKey = (mood.moodLabel || 'Neutral').replace(/\s+/g, '');
        const habits =
          suggestedHabitsByMood[
            (moodKey as keyof typeof suggestedHabitsByMood) || 'Neutral'
          ] || suggestedHabitsByMood.Neutral;

        setAnalysisDone(true);
        setWasSaved(!!result.savedJournal);
        setLastJournalText(journalText);
        setLastResult(result.data);

        const suggestId = `suggest-${Date.now()}`;
        setMessages(prev => [
          ...prev.filter(m => !m.id.startsWith('bot-typing-')),
          {
            id: `mood-${Date.now()}`,
            sender: 'bot',
            text: `${
              mood.moodIcon
            } I sense you\'re feeling ${mood.moodLabel.toLowerCase()}.` as string,
            moodResult: result.data,
          },
          { id: `tip-${Date.now()}`, sender: 'bot', text: `Tip: ${tip}` },
          {
            id: suggestId,
            sender: 'bot',
            text: 'Generating personalized habit ideas...',
          },
        ]);

        // AI suggestions via Gemini with graceful fallback
        setLoadingSuggestions(true);
        const ai = await suggestHabitsFromAI(mood.moodLabel, journalText);
        setLoadingSuggestions(false);
        const aiSuggestions: string[] = Array.isArray(ai.data) ? ai.data : [];

        if (ai.success && aiSuggestions.length > 0) {
          setMessages(prev => [
            ...prev.filter(m => m.id !== suggestId),
            {
              id: `suggest2-${Date.now()}`,
              sender: 'bot',
              text: `Here are a few tiny habits for today:`,
            },
            {
              id: `habits-${Date.now()}`,
              sender: 'bot',
              text: aiSuggestions.map(h => `• ${h}`).join('\n'),
            },
            {
              id: `done-${Date.now()}`,
              sender: 'bot',
              text: 'All set! Your journal is saved. Tap Done to continue.',
            },
          ]);
        } else {
          setMessages(prev => [
            ...prev.filter(m => m.id !== suggestId),
            {
              id: `habits-fallback-${Date.now()}`,
              sender: 'bot',
              text: habits.map(h => `• ${h}`).join('\n'),
            },
            {
              id: `done-${Date.now()}`,
              sender: 'bot',
              text: 'All set! Your journal is saved. Tap Done to continue.',
            },
          ]);
        }
      } else {
        setMessages(prev => [
          ...prev.filter(m => !m.id.startsWith('bot-typing-')),
          {
            id: `err-${Date.now()}`,
            sender: 'bot',
            text: "Sorry, I couldn't analyze that right now. Please try again.",
          },
        ]);
      }
    } catch (e) {
      setMessages(prev => [
        ...prev.filter(m => !m.id.startsWith('bot-typing-')),
        {
          id: `err-${Date.now()}`,
          sender: 'bot',
          text: 'Something went wrong saving your journal. Please try again.',
        },
      ]);
    } finally {
      setSubmitting(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
    }
  };

  return (
    <AppCustomModal visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={{ width: '100%' }}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.botAvatar}>
              <Icon name="robot-happy-outline" size={20} color={colors.white} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Daily Journal</Text>
              <Text style={styles.headerSubtitle}>
                This helps tailor your habits
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.chatContainer}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.chatContent}
          >
            {messages.map(m => {
              const isUser = m.sender === 'user';
              return (
                <View
                  key={m.id}
                  style={[
                    styles.bubble,
                    isUser ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      isUser ? styles.userBubbleText : null,
                    ]}
                  >
                    {m.text}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {!analysisDone && (
          <>
            <AppTextInput
              label="Write your journal"
              placeholder="Type a few lines about your day..."
              value={input}
              onChangeText={setInput}
              multiline
              numberOfLines={4}
              iconName="chat"
              editable={!submitting}
            />
            <AppButton
              title={submitting ? 'Analyzing…' : 'Analyze'}
              onPress={handleAnalyze}
              disabled={submitting || !input.trim()}
            />
          </>
        )}
        {analysisDone && (
          <AppButton
            title="Done"
            onPress={async () => {
              // Safety: if for some reason it wasn't saved during analyze, save now
              if (!wasSaved && lastResult && lastJournalText) {
                const today = formatDate(new Date(), DATE_FORMAT_ZERO);
                const saveRes = await saveJournalEntry({
                  userId,
                  journalEntry: lastJournalText,
                  journalDate: today,
                  sentimentLabel: lastResult.mood.moodLabel,
                  sentimentScore: lastResult.mood.moodLevel,
                  aiTips: lastResult.tip,
                  updatedAt: new Date().toISOString(),
                } as any);
                if (saveRes.success) {
                  dispatch(invalidateHistoryCache());
                }
              }
              onCompleted?.();
              onDismiss();
            }}
          />
        )}
      </KeyboardAvoidingView>
    </AppCustomModal>
  );
};

export default JournalChatModal;

function getStyles(colors: any) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 12,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    botAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.subtitle,
    },
    closeBtn: {
      backgroundColor: colors.subtitle,
      borderRadius: 16,
      padding: 6,
    },
    chatContainer: {
      maxHeight: 280,
      width: '100%',
      backgroundColor: colors.cardBg,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    chatContent: {
      paddingBottom: 8,
    },
    bubble: {
      maxWidth: '86%',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      marginVertical: 4,
    },
    botBubble: {
      alignSelf: 'flex-start',
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
    },
    bubbleText: {
      color: colors.text,
    },
    userBubbleText: {
      color: colors.white,
    },
    secondaryAction: {
      alignSelf: 'center',
      paddingVertical: 4,
    },
    secondaryText: {
      color: colors.subtitle,
      fontWeight: '600',
    },
  });
}
