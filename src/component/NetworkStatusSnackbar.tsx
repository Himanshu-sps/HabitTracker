import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '@/utils/ThemeContext';
import { NetworkStatus, subscribeToNetworkStatus } from '@/utils/NetworkUtils';

interface NetworkStatusSnackbarProps {
  visible?: boolean;
}

const NetworkStatusSnackbar: React.FC<NetworkStatusSnackbarProps> = ({
  visible = true,
}) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });
  const [previousNetworkStatus, setPreviousNetworkStatus] =
    useState<NetworkStatus>({
      isConnected: true,
      isInternetReachable: true,
      type: 'unknown',
    });
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarType, setSnackbarType] = useState<'offline' | 'online' | null>(
    null,
  );
  const [isCurrentlyOffline, setIsCurrentlyOffline] = useState(false);
  const slideAnim = useState(new Animated.Value(-36))[0];

  const { colors } = useAppTheme();

  useEffect(() => {
    if (!visible) return;

    // Get initial network status
    const getInitialNetworkStatus = async () => {
      try {
        const { getNetworkStatus } = await import('@/utils/NetworkUtils');
        const initialStatus = await getNetworkStatus();
        setNetworkStatus(initialStatus);
        setPreviousNetworkStatus(initialStatus);
        // Set initial offline state
        setIsCurrentlyOffline(
          !initialStatus.isConnected || !initialStatus.isInternetReachable,
        );
      } catch (error) {
        // Handle silently
      }
    };

    getInitialNetworkStatus();

    const unsubscribe = subscribeToNetworkStatus(status => {
      const isNowOnline = status.isConnected && status.isInternetReachable;
      const isNowOffline = !status.isConnected || !status.isInternetReachable;

      setPreviousNetworkStatus(networkStatus);
      setNetworkStatus(status);

      // Show snackbar when network status changes
      if (isNowOffline) {
        // Going offline
        setIsCurrentlyOffline(true);
        setSnackbarType('offline');
        setShowSnackbar(true);
        slideDown();
        // Auto-hide offline message after 3 seconds
        setTimeout(() => {
          slideUp();
          setTimeout(() => {
            setShowSnackbar(false);
            setSnackbarType(null);
          }, 300);
        }, 3000);
      } else if (isCurrentlyOffline && isNowOnline) {
        // Coming back online from offline state
        setIsCurrentlyOffline(false);
        setSnackbarType('online');
        setShowSnackbar(true);
        slideDown(); // Show the online message
        // Auto-hide online message after 3 seconds
        setTimeout(() => {
          slideUp();
          setTimeout(() => {
            setShowSnackbar(false);
            setSnackbarType(null);
          }, 300);
        }, 3000);
      }
    });

    return () => unsubscribe();
  }, [visible]);

  const slideDown = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const slideUp = () => {
    Animated.timing(slideAnim, {
      toValue: -36,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  if (!visible || !showSnackbar || !snackbarType) return null;

  const backgroundColor =
    snackbarType === 'online'
      ? colors.success || '#4CAF50'
      : colors.error || '#F44336';
  const iconName = snackbarType === 'online' ? 'wifi' : 'wifi-off';
  const message =
    snackbarType === 'online' ? 'Back Online' : 'No Internet Connection';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Icon name={iconName} size={16} color="white" style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  icon: {
    marginRight: 6,
    size: 16,
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default NetworkStatusSnackbar;
