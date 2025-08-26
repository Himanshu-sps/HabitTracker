import NetInfo from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

export const getNetworkStatus = async (): Promise<NetworkStatus> => {
  const state = await NetInfo.fetch();
  return {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable ?? false,
    type: state.type || 'unknown',
  };
};

export const subscribeToNetworkStatus = (
  callback: (status: NetworkStatus) => void
) => {
  return NetInfo.addEventListener(state => {
    const status: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
      type: state.type || 'unknown',
    };
    callback(status);
  });
};
