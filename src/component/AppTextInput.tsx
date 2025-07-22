import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAppTheme } from '@/utils/ThemeContext';

interface AppTextInputProps extends TextInputProps {
  label: string;
  iconName?: string;
  rightIcon?: React.ReactNode;
}

const AppTextInput: React.FC<AppTextInputProps> = ({
  label,
  iconName,
  rightIcon,
  multiline,
  numberOfLines,
  style,
  ...props
}) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  // Calculate minHeight for multiline
  const inputStyle = [
    styles.input,
    multiline && numberOfLines
      ? { minHeight: 24 * numberOfLines, textAlignVertical: 'top' as const }
      : {},
    style,
  ];
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWithIcon}>
        {iconName ? (
          <MaterialIcons
            name={iconName}
            size={22}
            color={colors.inputPlaceholder}
            style={styles.inputIcon}
          />
        ) : null}
        <TextInput
          style={inputStyle}
          placeholderTextColor={colors.inputPlaceholder}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...props}
        />
        {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
      </View>
    </View>
  );
};

function getStyles(colors: any) {
  return StyleSheet.create({
    label: {
      fontSize: 16,
      color: colors.text,
      fontWeight: 'bold',
      marginBottom: 6,
      marginLeft: 2,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderRadius: 10,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    inputIcon: {
      marginRight: 6,
    },
    input: {
      flex: 1,
      minHeight: 48,
      fontSize: 16,
      color: colors.text,
      backgroundColor: 'transparent',
    },
    rightIcon: {
      marginLeft: 6,
    },
  });
}

export default AppTextInput;
