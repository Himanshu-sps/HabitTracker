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
import { deleteHabitsForUser } from '@/services/FirebaseService';
import AppLoader from '@/component/AppLoader';
import { HABIT_COLORS } from '@/utils/AppColors';
import { useFocusEffect } from '@react-navigation/native';
import { navigate } from '@/utils/NavigationUtils';
import { ScreenRoutes } from '@/utils/screen_routes';
import { useAppTheme } from '@/utils/ThemeContext';
import { getAppTextStyles } from '@/utils/AppTextStyles';
import AppHeader from '@/component/AppHeader';
import { NotificationService } from '@/services/NotificationService';

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

  useFocusEffect(
    React.useCallback(() => {
      setSelectedColor('');
    }, []),
  );

  useEffect(() => {
    if (selectedColor !== '') {
      setFilteredList(
        allHabits.filter((habit: HabitType) => habit.color == selectedColor),
      );
    } else {
      setFilteredList(allHabits);
    }
  }, [selectedColor, allHabits]);

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
        onComplete={habit => {}}
        onStatisticsPress={habit => {
          navigate(ScreenRoutes.HabitStatisticsScreen, { habit });
        }}
        enableLeftSwipe={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Habits" showBackButton={false} />
      <AppLoader visible={loading} size="large" />

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
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item: HabitType, index: number) =>
            (item.id || item.userId.toString()) + index.toString()
          }
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32 }}
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
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 10,
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
      marginRight: 12,
      marginBottom: 12,
    },
  });
}
