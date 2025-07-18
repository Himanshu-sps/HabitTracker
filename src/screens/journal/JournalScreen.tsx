import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useState } from 'react';
import moment from 'moment';
import { AppTextStyles } from '@/utils/AppTextStyles';
import AppColors from '@/utils/AppColors';
import AppLoader from '@/component/AppLoader';
import { useAppSelector, useAppDispatch } from '@/redux/hook';
import {
  DATE_FORMAT_DISPLAY_DAY_MONTH_DATE,
  DATE_FORMAT_ZERO,
} from '@/utils/DateTimeUtils';
import { saveAndAnalyzeSentiment } from '@/redux/slices/journalSlice';
import { AppRootState } from '@/redux/store';
import AppSpacer from '@/component/AppSpacer';
import { useIsFocused } from '@react-navigation/native';
import { useEffect } from 'react';
import { getJournalEntry } from '@/redux/slices/journalSlice';
import { moodList } from '@/utils/AppConstants';

const JournalScreen = () => {
  // redux related stuffs
  const dispatch = useAppDispatch();
  const user = useAppSelector(
    (state: AppRootState) => state.authReducer.userData,
  );
  const journalState = useAppSelector(
    (state: AppRootState) => state.journalReducer,
  );

  // local useState
  const [journal, setJournal] = useState(
    journalState.journal?.journalEntry || '',
  );

  const todayDisplayDate = moment().format(DATE_FORMAT_DISPLAY_DAY_MONTH_DATE);
  const todayDateWithoutTime = moment().format(DATE_FORMAT_ZERO);

  let isFocused = useIsFocused();
  const [loading, setLoading] = useState(false);

  // useEffect to fetch data from firestore
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

  // to set the journal
  useEffect(() => {
    setJournal(journalState.journal?.journalEntry || '');
  }, [journalState.journal]);

  /**
   * function to dispatch the action to perform analysis and save the state to redux and firestore
   * @returns
   */
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
      <AppLoader visible={loading} size="large" />
      <Text style={[AppTextStyles.title, styles.header]}>Journal</Text>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={[AppTextStyles.body, styles.date]}>
          {`Today, ${todayDisplayDate}`}
        </Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder="How was your day? Write your thoughts here..."
            placeholderTextColor={AppColors.inputPlaceholder}
            value={journal}
            onChangeText={text => {
              setJournal(text);
            }}
            editable={!loading}
          />
        </View>

        {journalState.error && <Text>{journalState.error}</Text>}

        {journalState.journal && (
          <View>
            <Text style={AppTextStyles.body}>
              Your detected mood is :{' '}
              <Text
                style={{
                  color: AppColors.primary,
                  fontSize: 18,
                  textTransform: 'capitalize',
                }}
              >
                {journalState.journal.sentimentLabel}
              </Text>
            </Text>
            <AppSpacer vertical={10} />
            <Text style={styles.moodIcon}>
              {moodList[journalState.journal.sentimentScore - 1].moodIcon}
            </Text>
            <AppSpacer vertical={10} />
          </View>
        )}

        {journalState.journal && journalState.journal.aiTips && (
          <View style={styles.tipContainer}>
            <Text style={styles.tipHeader}>✨ AI tips</Text>
            <AppSpacer vertical={10} />
            <Text
              style={styles.tipContent}
            >{`"${journalState.journal.aiTips}"`}</Text>
          </View>
        )}

        <View style={styles.bottomButtonWrapper}>
          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={handleAnalyze}
            disabled={loading || !journal || !journal.trim()}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.surface,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: AppColors.surface,
    justifyContent: 'flex-start',
  },
  header: {
    textAlign: 'center',
    marginVertical: 8,
  },
  date: {
    textAlign: 'center',
    color: AppColors.primary,
    marginBottom: 24,
  },
  inputWrapper: {
    backgroundColor: AppColors.inputBg,
    borderColor: AppColors.inputBorder,
    borderWidth: 2,
    borderRadius: 18,
    padding: 8,
    marginBottom: 24,
    minHeight: 160,
    justifyContent: 'center',
  },
  textInput: {
    ...AppTextStyles.body,
    minHeight: 140,
    color: AppColors.text,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'transparent',
    textAlignVertical: 'top',
  },
  error: {
    color: AppColors.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  bottomButtonWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  analyzeButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  analyzeButtonText: {
    ...AppTextStyles.body,
    color: AppColors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  tipContainer: {
    flexDirection: 'column',
    backgroundColor: AppColors.inputBg,
    borderColor: AppColors.inputBorder,
    borderWidth: 2,
    borderRadius: 18,
    padding: 8,
    justifyContent: 'center',
  },
  tipHeader: {
    ...AppTextStyles.body,
  },
  tipContent: {
    ...AppTextStyles.body,
    color: AppColors.habitBlue,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  moodIcon: {
    fontSize: 80,
    textAlign: 'center',
  },
});
