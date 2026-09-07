import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from './colors';

const ThemeContext = createContext();

const getInitialDarkMode = (systemColorScheme) => {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('theme') === 'dark') return true;
      if (params.get('theme') === 'light') return false;
      const saved = localStorage.getItem('user_theme_mode');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return true;
      }
    } catch {
      // fallback
    }
  }
  return systemColorScheme === 'dark';
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(() => getInitialDarkMode(systemColorScheme));

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          if (params.get('theme') === 'dark') {
            setIsDarkMode(true);
            return;
          }
          if (params.get('theme') === 'light') {
            setIsDarkMode(false);
            return;
          }
        }
        const saved = await AsyncStorage.getItem('user_theme_mode');
        if (saved !== null) {
          setIsDarkMode(saved === 'dark');
        } else {
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch {
        setIsDarkMode(systemColorScheme === 'dark');
      }
    };
    loadThemePreference();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    try {
      await AsyncStorage.setItem('user_theme_mode', nextMode ? 'dark' : 'light');
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('user_theme_mode', nextMode ? 'dark' : 'light');
      }
    } catch (e) {
      console.warn('Failed to save theme preference', e);
    }
  };

  const setThemeMode = async (mode) => {
    const isDark = mode === 'dark';
    setIsDarkMode(isDark);
    try {
      await AsyncStorage.setItem('user_theme_mode', mode);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('user_theme_mode', mode);
      }
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

