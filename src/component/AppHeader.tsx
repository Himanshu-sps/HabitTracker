import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/utils/ThemeContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface AppHeaderProps {
  title: string;
  onClose?: () => void;
  showLeftIcon?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onClose,
  showLeftIcon = true,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.headerRow}>
      {showLeftIcon ? (
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <MaterialIcons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 32 }} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
};

function getStyles(colors: any) {
  return StyleSheet.create({
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
      color: colors.text,
      textAlign: 'center',
      flex: 1,
    },
  });
}

export default AppHeader;
