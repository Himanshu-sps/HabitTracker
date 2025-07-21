import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from './AppColors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'light' | 'dark';

const ThemeContext = createContext({
  theme: 'light' as ThemeType,
  colors: LightColors,
  setTheme: (theme: ThemeType) => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemTheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>(systemTheme || 'light');

  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = (await AsyncStorage.getItem(
        'theme',
      )) as ThemeType | null;
      // If a theme is stored in AsyncStorage, use it. Otherwise, use the system theme.
      setThemeState(storedTheme || systemTheme || 'light');
    };
    loadTheme();
  }, [systemTheme]);

  const colors = theme === 'light' ? LightColors : DarkColors;

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    AsyncStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
