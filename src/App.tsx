import React from 'react';
import { Provider } from 'react-redux';
import { store, persistor } from '@/redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import AppNavigator from '@/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/utils/ThemeContext';

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <ThemeProvider>
          <PersistGate loading={null} persistor={persistor}>
            <AppNavigator />
          </PersistGate>
        </ThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
