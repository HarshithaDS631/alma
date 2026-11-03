import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from './colors';

const ThemeContext = createContext();

// Signature Theme: Royal Midnight Navy & Warm Imperial Gold by default
const getInitialDarkMode = () => {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('theme') === 'light') return false;
      const saved = localStorage.getItem('user_theme_mode');
      if (saved === 'light') return false;
    } catch {
      // fallback
    }
  }
  return true;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => getInitialDarkMode());

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const bg = '#070C18';
      document.documentElement.style.backgroundColor = bg;
      document.body.style.backgroundColor = bg;
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.style.backgroundColor = bg;
      }
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', bg);
      }
    }
  }, [isDarkMode]);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          if (params.get('theme') === 'light') {
            setIsDarkMode(false);
            return;
          }
        }
        const saved = await AsyncStorage.getItem('user_theme_mode');
        if (saved !== null) {
          setIsDarkMode(saved === 'dark');
        } else {
          setIsDarkMode(true);
        }
      } catch {
        setIsDarkMode(true);
      }
    };
    loadThemePreference();
  }, []);

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
