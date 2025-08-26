import React, { useEffect, useState, useRef } from 'react';
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
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const isOnlineRef = useRef(true);
  const hasShownInitialStatus = useRef(false);
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
        const isConnected =
          initialStatus.isConnected && initialStatus.isInternetReachable;
        setIsOnline(isConnected);
        isOnlineRef.current = isConnected;

        // Only show snackbar if internet is NOT available on initial load
        if (!isConnected) {
          showOfflineSnackbar();
        }
        hasShownInitialStatus.current = true;
      } catch (error) {
        // Handle silently
      }
    };

    getInitialNetworkStatus();

    const unsubscribe = subscribeToNetworkStatus(status => {
      const isConnected = status.isConnected && status.isInternetReachable;

      setNetworkStatus(status);

      // Only show snackbar if status actually changed AND we've already shown initial status
      if (
        isConnected !== isOnlineRef.current &&
        hasShownInitialStatus.current
      ) {
        console.log('Network status changed:', {
          wasOnline: isOnlineRef.current,
          isNowOnline: isConnected,
          status,
        });

        isOnlineRef.current = isConnected;
        setIsOnline(isConnected);

        if (isConnected) {
          showOnlineSnackbar();
        } else {
          showOfflineSnackbar();
        }
      } else if (hasShownInitialStatus.current) {
        // Update state without showing snackbar for initial load
        isOnlineRef.current = isConnected;
        setIsOnline(isConnected);
      }
    });

    return () => unsubscribe();
  }, [visible]);

  const showOnlineSnackbar = () => {
    console.log('Showing online snackbar');
    setShowSnackbar(true);
    slideDown();

    // Hide after 3 seconds
    setTimeout(() => {
      slideUp();
      setTimeout(() => {
        setShowSnackbar(false);
      }, 300);
    }, 3000);
  };

  const showOfflineSnackbar = () => {
    console.log('Showing offline snackbar');
    setShowSnackbar(true);
    slideDown();

    // Hide after 3 seconds
    setTimeout(() => {
      slideUp();
      setTimeout(() => {
        setShowSnackbar(false);
      }, 300);
    }, 3000);
  };

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

  if (!visible || !showSnackbar) return null;

  const backgroundColor = isOnline
    ? colors.success || '#4CAF50'
    : colors.error || '#F44336';
  const iconName = isOnline ? 'wifi' : 'wifi-off';
  const message = isOnline ? 'Internet Available' : 'No Internet Connection';

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
      <Icon
        name={iconName}
        size={16}
        color={colors.white}
        style={styles.icon}
      />
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
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default NetworkStatusSnackbar;
