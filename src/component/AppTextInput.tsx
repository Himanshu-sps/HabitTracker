import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AppColors from '@/utils/AppColors';

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
            color={AppColors.inputPlaceholder}
            style={styles.inputIcon}
          />
        ) : null}
        <TextInput
          style={inputStyle}
          placeholderTextColor={AppColors.inputPlaceholder}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...props}
        />
        {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    color: AppColors.text,
    fontWeight: 'bold',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: AppColors.inputBorder,
  },
  inputIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontSize: 16,
    color: AppColors.text,
    backgroundColor: 'transparent',
  },
  rightIcon: {
    marginLeft: 6,
  },
});

export default AppTextInput;
