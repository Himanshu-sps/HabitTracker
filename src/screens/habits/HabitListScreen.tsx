import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hook';
import { HabitType } from '@/type';
import HabitListItem from '@/screens/habits/HabitListItem';
import { AppRootState } from '@/redux/store';
import { setAllHabits } from '@/redux/slices/habitSlice';
import { showConfirmAlert, showInfoAlert } from '@/utils/AlertUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  deleteHabitsForUser,
  subscribeToHabitsForUser,
  trackHabitCompletion,
} from '@/services/FirebaseService';
import moment from 'moment';
import AppLoader from '@/component/AppLoader';
import { HABIT_COLORS } from '@/utils/AppColors';
import { useFocusEffect } from '@react-navigation/native';
import { navigate } from '@/utils/NavigationUtils';
import { ScreenRoutes } from '@/utils/screen_routes';
import { useAppTheme } from '@/utils/ThemeContext';
import { getAppTextStyles } from '@/utils/AppTextStyles';
import AppHeader from '@/component/AppHeader';
import { NotificationService } from '@/services/NotificationService';
import AppTextInput from '@/component/AppTextInput';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const HabitListScreen = () => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const textStyles = getAppTextStyles(colors);
  const user = useAppSelector(
    (state: AppRootState) => state.authReducer.userData,
  );

  const allHabits = useAppSelector(
    (state: AppRootState) => state.habitReducer.allHabits,
  );
  const dispatch = useAppDispatch();
  const swipeableRefs = useRef<{ [key: string]: any }>({});

  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [filteredList, setFilteredList] = useState<HabitType[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      setSelectedColor('');
    }, []),
  );

  useEffect(() => {
    let list = allHabits;
    if (selectedColor !== '') {
      list = list.filter((habit: HabitType) => habit.color == selectedColor);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (habit: HabitType) =>
          (habit.name || '').toLowerCase().includes(q) ||
          (habit.description || '').toLowerCase().includes(q),
      );
    }
    setFilteredList(list);
  }, [selectedColor, allHabits, searchQuery]);

  useFocusEffect(
    React.useCallback(() => {
      if (!user?.id) return;
      setLoading(true);
      // Subscribe to habits for user
      const unsubscribe = subscribeToHabitsForUser(user.id, habits => {
        dispatch(setAllHabits(habits));
        setLoading(false);
        setRefreshKey(prev => prev + 1); // force HabitListItem to re-fetch streaks
      });
      return () => unsubscribe();
    }, [user?.id, dispatch]),
  );

  const handleComplete = async (habit: HabitType) => {
    if (!user?.id || !habit.id) return;
    const today = moment().format('YYYY-MM-DD');
    await trackHabitCompletion(user.id, habit.id, today);
    setRefreshKey(prev => prev + 1); // force HabitListItem to re-fetch streaks
  };

  const renderItem = ({ item }: { item: HabitType }) => {
    if (!swipeableRefs.current[item.id || item.userId]) {
      swipeableRefs.current[item.id || item.userId] = React.createRef();
    }
    return (
      <HabitListItem
        ref={swipeableRefs.current[item.id || item.userId]}
        habit={item}
        onPress={() =>
          navigate(ScreenRoutes.AddEditHabitScreen, { habit: item })
        }
        onDelete={(habit, closeSwipeable) => {
          if (!user?.id) {
            return;
          }

          showConfirmAlert(
            'Delete Habit',
            `Are you sure you want to delete entire "${habit.name}"?`,
            async () => {
              setLoading(true);
              let res = await deleteHabitsForUser(habit, user?.id);
              if (habit.id) {
                await NotificationService.cancelHabitNotification(habit.id);
              }
              if (res.success) {
                setLoading(false);
                dispatch(
                  setAllHabits(
                    allHabits.filter((h: HabitType) => h.id !== habit.id),
                  ),
                );
              } else {
                setLoading(false);
              }
            },
            closeSwipeable,
            'Delete',
            'Cancel',
          );
        }}
        onComplete={handleComplete}
        onStatisticsPress={habit => {
          navigate(ScreenRoutes.HabitStatisticsScreen, { habit });
        }}
        enableLeftSwipe={false}
        refreshKey={refreshKey}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Habits" showBackButton={false} />
      <AppLoader visible={loading} size="large" />

      {/* Search */}
      <AppTextInput
        label=""
        iconName="search"
        placeholder="Search habits"
        value={searchQuery}
        onChangeText={setSearchQuery}
        rightIcon={
          searchQuery.trim() !== '' ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons
                name="close"
                size={20}
                color={colors.inputPlaceholder}
              />
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Color Picker */}
      <Text style={styles.sectionTitle}>Filter by color tags</Text>
      <View style={styles.colorRow}>
        {/* Reset color option */}
        <TouchableOpacity
          key="reset"
          style={[
            styles.colorCircle,
            {
              backgroundColor: colors.white,
              borderWidth: selectedColor === '' ? 3 : 1,
              borderColor: selectedColor === '' ? colors.black : colors.text,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
          onPress={() => setSelectedColor('')}
        >
          <Text style={{ color: colors.text, fontSize: 12 }}>All</Text>
        </TouchableOpacity>

        {HABIT_COLORS.map(color => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorCircle,
              {
                backgroundColor: color,
                borderWidth: selectedColor === color ? 3 : 0,
                borderColor: colors.black,
              },
            ]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
      </View>

      {filteredList.length <= 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={textStyles.title}>No habits found</Text>

          {searchQuery.trim() === '' ? (
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigate(ScreenRoutes.AddEditHabitScreen)}
            >
              <Text style={styles.emptyStateButtonText}>Create a Habit</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item: HabitType, index: number) =>
            (item.id || item.userId.toString()) + index.toString()
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 32 }}>
              No habits found.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default HabitListScreen;

function getStyles(colors: any) {
  return StyleSheet.create({
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      flex: 1,
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    colorRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },
    colorCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 8,
    },
    emptyStateButton: {
      marginTop: 16,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 25,
    },
    emptyStateButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
}
