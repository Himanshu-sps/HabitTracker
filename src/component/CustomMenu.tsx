import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '@/utils/ThemeContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface MenuItem {
  title: string;
  onPress: () => void;
  icon: string;
}

interface CustomMenuProps {
  visible: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  top: number;
  right: number;
}

const CustomMenu: React.FC<CustomMenuProps> = ({
  visible,
  onClose,
  menuItems,
  top,
  right,
}) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <View style={[styles.menuContainer, { top, right }]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => {
                  item.onPress();
                  onClose();
                }}
              >
                <MaterialIcons name={item.icon} size={24} color={colors.text} />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
    },
    menuContainer: {
      position: 'absolute',
      backgroundColor: colors.cardBg,
      borderRadius: 8,
      padding: 8,
      elevation: 5,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    menuItemText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 16,
    },
  });

export default CustomMenu;
