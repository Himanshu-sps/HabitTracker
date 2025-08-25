import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '@/utils/ThemeContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { goBack } from '@/utils/NavigationUtils';

interface AppHeaderProps {
  title: string;
  leftMaterialIcon?: string;
  showBackButton?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  leftMaterialIcon = 'chevron-left',
  showBackButton = false,
}) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.headerContainer}>
      {showBackButton ? (
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <MaterialIcons
            name={leftMaterialIcon}
            size={32}
            color={colors.text}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.placeholder} />
    </View>
  );
};

function getStyles(colors: any) {
  return StyleSheet.create({
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.inputBorder,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    placeholder: {
      width: 48,
    },
  });
}

export default AppHeader;
