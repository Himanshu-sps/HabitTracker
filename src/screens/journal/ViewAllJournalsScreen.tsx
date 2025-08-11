import { StyleSheet, Text, View, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useAppTheme } from '@/utils/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '@/component/AppHeader';
import JournalListItem from './JournalListItem';
import { useAppSelector, useAppDispatch } from '@/redux/hook';
import {
  fetchAllJournalsByUserId,
  deleteJournalById,
} from '@/redux/slices/journalSlice';
import { invalidateHistoryCache } from '@/redux/slices/historySlice';
import AppLoader from '@/component/AppLoader';
import { FlatList } from 'react-native-gesture-handler';
import { getAppTextStyles } from '@/utils/AppTextStyles';
import { useIsFocused } from '@react-navigation/native';
import { showConfirmAlert } from '@/utils/AlertUtils';
import { JournalType } from '@/type';

const ViewAllJournalsScreen = () => {
  const [loading, setLoading] = useState(false);

  const isFocused = useIsFocused();
  const { colors } = useAppTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.authReducer.userData);
  const { allJournals, error } = useAppSelector(state => state.journalReducer);

  const style = getStyles(colors);
  const textStyles = getAppTextStyles(colors);

  useEffect(() => {
    if (isFocused && user?.id) {
      const fetchAllJournal = async () => {
        setLoading(true);
        await dispatch(fetchAllJournalsByUserId(user.id)).unwrap();
        setLoading(false);
      };

      fetchAllJournal();
    }
  }, [isFocused, user?.id, dispatch]);

  const renderJournalItem = ({ item }: { item: JournalType }) => (
    <JournalListItem
      journal={item}
      onDelete={() => {
        if (user?.id && typeof item.id === 'string') {
          showConfirmAlert(
            'Delete Journal',
            'Are you sure you want to delete this journal?',
            () => {
              dispatch(
                deleteJournalById({
                  userId: user.id,
                  journalId: item.id as string,
                }),
              );
              dispatch(invalidateHistoryCache());
            },
          );
        }
      }}
    />
  );

  return (
    <SafeAreaView style={style.safeAreaContainer}>
      <AppHeader title={'All Journals'} showBackButton />
      <AppLoader visible={loading} />
      {error && <Text>{error}</Text>}
      <View style={style.container}>
        {allJournals?.length > 0 ? (
          <FlatList data={allJournals} renderItem={renderJournalItem} />
        ) : (
          <View style={style.emptyContainer}>
            <Text style={textStyles.title}>No Journals found</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ViewAllJournalsScreen;

function getStyles(colors: any) {
  return StyleSheet.create({
    safeAreaContainer: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    container: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
}
