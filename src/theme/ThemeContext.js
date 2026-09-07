import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from './colors';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const saved = await AsyncStorage.getItem('user_theme_mode');
        if (saved !== null) {
          setIsDarkMode(saved === 'dark');
        } else {
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch {
        setIsDarkMode(systemColorScheme === 'dark');
      } finally {
        setIsLoaded(true);
      }
    };
    loadThemePreference();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    try {
      await AsyncStorage.setItem('user_theme_mode', nextMode ? 'dark' : 'light');
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  };

  const setThemeMode = async (mode) => {
    const isDark = mode === 'dark';
    setIsDarkMode(isDark);
    try {
      await AsyncStorage.setItem('user_theme_mode', mode);
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

