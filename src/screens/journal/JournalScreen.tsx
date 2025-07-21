import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import moment from 'moment';
import AppLoader from '@/component/AppLoader';
import { useAppSelector, useAppDispatch } from '@/redux/hook';
import {
  DATE_FORMAT_DISPLAY_DAY_MONTH_DATE,
  DATE_FORMAT_ZERO,
} from '@/utils/DateTimeUtils';
import { saveAndAnalyzeSentiment } from '@/redux/slices/journalSlice';
import { AppRootState } from '@/redux/store';
import { useIsFocused } from '@react-navigation/native';
import { getJournalEntry } from '@/redux/slices/journalSlice';
import { moodList } from '@/utils/AppConstants';
import { useTheme } from '@/utils/ThemeContext';
import { getAppTextStyles } from '@/utils/AppTextStyles';
import AppHeader from '@/component/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

const JournalScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const textStyles = getAppTextStyles(colors);
  const dispatch = useAppDispatch();
  const user = useAppSelector(
    (state: AppRootState) => state.authReducer.userData,
  );
  const journalState = useAppSelector(
    (state: AppRootState) => state.journalReducer,
  );

  const [journal, setJournal] = useState(
    journalState.journal?.journalEntry || '',
  );

  const todayDisplayDate = moment().format(DATE_FORMAT_DISPLAY_DAY_MONTH_DATE);
  const todayDateWithoutTime = moment().format(DATE_FORMAT_ZERO);

  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isFocused && user?.id) {
      const fetchJournal = async () => {
        setLoading(true);
        await dispatch(
          getJournalEntry({
            userId: user.id,
            journalDate: todayDateWithoutTime,
          }),
        ).unwrap();
        setLoading(false);
      };
      fetchJournal();
    }
  }, [isFocused, user?.id, todayDateWithoutTime, dispatch]);

  useEffect(() => {
    setJournal(journalState.journal?.journalEntry || '');
  }, [journalState.journal]);

  const handleAnalyze = async () => {
    if (!user?.id) return;
    setLoading(true);
    await dispatch(
      saveAndAnalyzeSentiment({
        journalEntry: journal || '',
        journalDate: todayDateWithoutTime,
        userId: user.id,
      }),
    ).unwrap();
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Journal" showLeftIcon={false} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <AppLoader visible={loading} size="large" />
          <Text style={[textStyles.body, styles.date]}>
            {`Today, ${todayDisplayDate}`}
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="How was your day? Write your thoughts here..."
              placeholderTextColor={colors.inputPlaceholder}
              value={journal}
              onChangeText={setJournal}
              editable={!loading}
            />
          </View>

          {journalState.error && <Text>{journalState.error}</Text>}

          {journalState.journal && (
            <View style={styles.moodContainer}>
              <Text style={textStyles.body}>
                Your detected mood is :{' '}
                <Text style={styles.moodLabel}>
                  {journalState.journal.sentimentLabel}
                </Text>
              </Text>
              <Text style={styles.moodIcon}>
                {moodList[journalState.journal.sentimentScore - 1]?.moodIcon}
              </Text>
            </View>
          )}

          {journalState.journal && journalState.journal.aiTips && (
            <View style={styles.tipContainer}>
              <Text style={styles.tipHeader}>✨ AI tips</Text>
              <Text style={styles.tipContent}>
                {`"${journalState.journal.aiTips}"`}
              </Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.bottomButtonWrapper}>
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              (loading || !journal.trim()) && styles.disabledButton,
            ]}
            onPress={handleAnalyze}
            disabled={loading || !journal.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.analyzeButtonText}>Save and Analyze!</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default JournalScreen;

function getStyles(colors: any) {
  const textStyles = getAppTextStyles(colors);

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    container: {
      flexGrow: 1,
      padding: 16,
      justifyContent: 'space-between',
    },
    header: {
      textAlign: 'center',
      marginVertical: 8,
    },
    date: {
      textAlign: 'center',
      color: colors.primary,
      marginBottom: 16,
    },
    inputWrapper: {
      backgroundColor: colors.inputBg,
      borderColor: colors.inputBorder,
      borderWidth: 1,
      borderRadius: 12,
      padding: 8,
      marginBottom: 16,
    },
    textInput: {
      ...textStyles.body,
      minHeight: 200,
      color: colors.text,
      textAlignVertical: 'top',
    },
    error: {
      color: colors.error,
      textAlign: 'center',
      marginBottom: 8,
    },
    bottomButtonWrapper: {
      padding: 16,
      borderTopColor: colors.divider,
      borderTopWidth: 1,
      backgroundColor: colors.surface,
    },
    analyzeButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabledButton: {
      backgroundColor: colors.inputBorder,
    },
    analyzeButtonText: {
      ...textStyles.body,
      color: colors.white,
      fontWeight: 'bold',
      fontSize: 18,
    },
    tipContainer: {
      backgroundColor: colors.inputBg,
      borderColor: colors.inputBorder,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    tipHeader: {
      ...textStyles.subtitle,
      marginBottom: 8,
    },
    tipContent: {
      ...textStyles.body,
      fontStyle: 'italic',
    },
    moodContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    moodLabel: {
      color: colors.primary,
      fontSize: 18,
      textTransform: 'capitalize',
      fontWeight: 'bold',
    },
    moodIcon: {
      fontSize: 60,
      marginTop: 8,
    },
  });
}
