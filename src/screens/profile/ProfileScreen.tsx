import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '@/component/AppButton';
import { useAppSelector, useAppDispatch } from '@/redux/hook';
import { resetUserData } from '@/redux/slices/authSlice';
import { resetAndNavigate } from '@/utils/NavigationUtils';
import { ScreenRoutes } from '@/utils/screen_routes';

const ProfileScreen = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.authReducer.userData);

  const handleLogout = async () => {
    dispatch(resetUserData());
    resetAndNavigate(ScreenRoutes.AuthStack);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>ProfileScreen</Text>
      <Text>{user?.name}</Text>
      <AppButton
        title="Logout"
        onPress={handleLogout}
        style={styles.logoutButton}
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  logoutButton: {
    width: 200,
  },
});
