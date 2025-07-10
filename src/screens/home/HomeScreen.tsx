import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '@/redux/hook';

const HomeScreen = () => {
  const user = useAppSelector(state => state.authReducer.userData);
  return (
    <SafeAreaView>
      <Text>HomeScreen - {JSON.stringify(user)}</Text>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({});
