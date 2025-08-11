import { useAppTheme } from '@/utils/ThemeContext';
import React, { ReactNode } from 'react';
import { Modal, View, StyleSheet } from 'react-native';

// Define the props interface for the modal
interface CustomModalProps {
  visible: boolean;
  children: ReactNode; // This allows any valid React component to be passed as content
}

const AppCustomModal: React.FC<CustomModalProps> = ({ visible, children }) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View style={styles.container}>
        <View style={styles.modalContainer}>{children}</View>
      </View>
    </Modal>
  );
};

function getStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: 16,
    },
    modalContainer: {
      backgroundColor: colors.white,
      padding: 8,
      borderRadius: 12,
      elevation: 8,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      width: '100%',
      height: 'auto',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    },
  });
}

export default AppCustomModal;
