import { StyleSheet, Text, View, FlatList } from 'react-native';
import React, { useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hook';
import { HabitType } from '@/type';
import HabitListItem from '@/screens/home/components/HabitListItem';
import { RootState } from '@/redux/store';
import { setAllHabits } from '@/redux/slices/habitSlice';
import { showConfirmAlert, showInfoAlert } from '@/utils/AlertUtils';
import { SafeAreaView } from 'react-native-safe-area-context';

const HabitListScreen = () => {
  const allHabits = useAppSelector(
    (state: RootState & any) => state.habitReducer.allHabits,
  );
  const dispatch = useAppDispatch();
  const swipeableRefs = useRef<{ [key: string]: any }>({});

  const renderItem = ({ item }: { item: HabitType }) => {
    if (!swipeableRefs.current[item.id || item.userId]) {
      swipeableRefs.current[item.id || item.userId] = React.createRef();
    }
    return (
      <HabitListItem
        ref={swipeableRefs.current[item.id || item.userId]}
        habit={item}
        onPress={() => {}}
        onEdit={() => {}}
        onDelete={(habit, closeSwipeable) => {
          showConfirmAlert(
            'Delete Habit',
            `Are you sure you want to delete "${habit.name}"?`,
            () =>
              dispatch(
                setAllHabits(
                  allHabits.filter((h: HabitType) => h.id !== habit.id),
                ),
              ),
            closeSwipeable,
            'Delete',
            'Cancel',
          );
        }}
        onComplete={habit => {
          showInfoAlert(
            'Info',
            'Completion is only tracked for today in the Home screen.',
          );
        }}
      />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        data={allHabits}
        keyExtractor={(item: HabitType, index: number) =>
          (item.id || item.userId.toString()) + index.toString()
        }
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 32 }}>
            No habits found.
          </Text>
        }
      />
    </SafeAreaView>
  );
};

export default HabitListScreen;

const styles = StyleSheet.create({});
