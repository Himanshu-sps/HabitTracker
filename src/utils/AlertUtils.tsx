import { Alert } from 'react-native';

export function showConfirmAlert(
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmText = 'OK',
  cancelText = 'Cancel',
) {
  Alert.alert(title, message, [
    {
      text: cancelText,
      style: 'cancel',
      onPress: onCancel,
    },
    {
      text: confirmText,
      style: 'destructive',
      onPress: onConfirm,
    },
  ]);
}

export function showInfoAlert(
  title: string,
  message: string,
  onClose?: () => void,
) {
  Alert.alert(title, message, [
    {
      text: 'OK',
      onPress: onClose,
    },
  ]);
}

export function showErrorAlert(message: string, onClose?: () => void) {
  Alert.alert('Error', message, [
    {
      text: 'OK',
      onPress: onClose,
      style: 'destructive',
    },
  ]);
}

export function showSuccessAlert(message: string, onClose?: () => void) {
  Alert.alert('Success', message, [
    {
      text: 'OK',
      onPress: onClose,
      style: 'default',
    },
  ]);
}
