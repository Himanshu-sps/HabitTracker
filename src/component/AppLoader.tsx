import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, View, Text } from 'react-native';
import { useAppTheme } from '@/utils/ThemeContext';

interface AppLoaderProps {
  visible: boolean;
  color?: string;
  size?: 'small' | 'large';
}

const AppLoader: React.FC<AppLoaderProps> = ({
  visible,
  color,
  size = 'large',
}) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size={size} color={color || colors.primary} />
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Loading...</Text>
        </View>
      </View>
    </Modal>
  );
};

export default AppLoader;

function getStyles(colors: any) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loaderContainer: {
      backgroundColor: colors.white,
      padding: 20,
      borderRadius: 12,
      elevation: 8,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      width: 'auto',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    },
  });
}
