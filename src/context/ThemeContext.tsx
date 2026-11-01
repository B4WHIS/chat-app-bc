import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  subtext: string;
  primary: string;
  primaryLight: string;
  gradient: [string, string, string];
  divider: string;
  inputBg: string;
  inputBorder: string;
  modalBg: string;
  modalOverlay: string;
  noteBg: string;
}

export const lightColors: ThemeColors = {
  background: "#FFFFFF",
  card: "#FFFFFF",
  cardBorder: "rgba(45, 106, 79, 0.08)",
  text: "#1F2937",
  subtext: "#6B7280",
  primary: "#2D6A4F",
  primaryLight: "#EBF5EE",
  gradient: ["#EAF5EE", "#F6FAF7", "#FFFFFF"],
  divider: "#F3F4F6",
  inputBg: "#F9FAFB",
  inputBorder: "#E5E7EB",
  modalBg: "#FFFFFF",
  modalOverlay: "rgba(0, 0, 0, 0.5)",
  noteBg: "#F9FAFB",
};

export const darkColors: ThemeColors = {
  background: "#111827",
  card: "#1F2937",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  text: "#F9FAFB",
  subtext: "#9CA3AF",
  primary: "#52B788",
  primaryLight: "#143D2B",
  gradient: ["#142E23", "#11221B", "#111827"],
  divider: "#374151",
  inputBg: "#374151",
  inputBorder: "#4B5563",
  modalBg: "#1F2937",
  modalOverlay: "rgba(0, 0, 0, 0.75)",
  noteBg: "#1E293B",
};

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = "@chat_app_theme_mode";

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  isDark: false,
  colors: lightColors,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeMode>("light");

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((savedTheme) => {
      if (savedTheme === "dark" || savedTheme === "light") {
        setThemeState(savedTheme);
      }
    });
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch((err) =>
      console.warn("Lỗi lưu theme vào AsyncStorage:", err)
    );
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  const isDark = theme === "dark";
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        colors,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
