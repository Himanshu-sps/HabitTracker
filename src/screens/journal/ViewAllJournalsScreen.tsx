import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList } from 'react-native-gesture-handler';
import { useIsFocused } from '@react-navigation/native';

// Local imports
import AppHeader from '@/component/AppHeader';
import JournalListItem from './JournalListItem';
import AppLoader from '@/component/AppLoader';
import { useAppSelector, useAppDispatch } from '@/redux/hook';
import { useAppTheme } from '@/utils/ThemeContext';
import { getAppTextStyles } from '@/utils/AppTextStyles';
import { showConfirmAlert } from '@/utils/AlertUtils';
import {
  fetchAllJournalsByUserId,
  deleteJournalById,
} from '@/redux/slices/journalSlice';
import { invalidateHistoryCache } from '@/redux/slices/historySlice';
import { JournalType } from '@/type';
import NetworkStatusSnackbar from '@/component/NetworkStatusSnackbar';

/**
 * ViewAllJournalsScreen Component
 *
 * A screen that displays all journal entries for the authenticated user.
 * Provides functionality to view, scroll through, and delete journal entries.
 *
 * Features:
 * - List view of all user journals
 * - Journal deletion with confirmation
 * - Auto-refresh when screen is focused
 * - Loading states and error handling
 * - Empty state display when no journals exist
 */
const ViewAllJournalsScreen = () => {
  // Local state
  const [loading, setLoading] = useState(false);

  // Hooks
  const isFocused = useIsFocused();
  const { colors } = useAppTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.authReducer.userData);
  const { allJournals, error } = useAppSelector(state => state.journalReducer);

  // Styles
  const style = getStyles(colors);
  const textStyles = getAppTextStyles(colors);

  // Effects

  /**
   * Effect: Fetch all journals when screen is focused
   * Automatically loads user's journals when navigating to this screen
   * and refreshes data when returning from other screens
   */
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

  // Render methods

  /**
   * Renders individual journal list items
   * @param item - Journal object to render
   * @returns JSX element for the journal item
   */
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

  /**
   * Renders the empty state when no journals exist
   * @returns JSX element for empty state
   */
  const renderEmptyState = () => (
    <View style={style.emptyContainer}>
      <Text style={textStyles.title}>No Journals found</Text>
    </View>
  );

  /**
   * Renders the journal list when journals exist
   * @returns JSX element for the journal list
   */
  const renderJournalList = () => {
    if (!allJournals || allJournals.length === 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={allJournals}
        renderItem={renderJournalItem}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={style.safeAreaContainer}>
      <NetworkStatusSnackbar />
      <AppHeader title={'All Journals'} showBackButton />
      <AppLoader visible={loading} />

      {error && (
        <View style={style.errorContainer}>
          <Text style={style.errorText}>{error}</Text>
        </View>
      )}

      <View style={style.container}>{renderJournalList()}</View>
    </SafeAreaView>
  );
};

export default ViewAllJournalsScreen;

/**
 * Generates styles for the ViewAllJournalsScreen component
 * @param colors - Theme colors object
 * @returns StyleSheet object with component styles
 */
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
    errorContainer: {
      padding: 16,
      backgroundColor: colors.error + '20',
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 8,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      textAlign: 'center',
    },
  });
}
