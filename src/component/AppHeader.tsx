import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppColors from '@/utils/AppColors';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface AppHeaderProps {
  title: string;
  onClose: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, onClose }) => {
  return (
    <View style={styles.headerRow}>
      <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
        <MaterialIcons name="close" size={28} color={AppColors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.text,
    textAlign: 'center',
    flex: 1,
  },
});

export default AppHeader;
