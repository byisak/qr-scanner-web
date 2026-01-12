"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// Settings types
export interface SystemSettings {
  // Language & Theme
  language: string;
  theme: "light" | "dark" | "system";

  // Notifications
  scanSound: boolean;
  browserNotification: boolean;
  soundVolume: number;
  soundType: "default" | "beep" | "none";

  // Display
  tableRowsPerPage: number;
  dateFormat: "YYYY-MM-DD" | "DD/MM/YYYY" | "MM/DD/YYYY";
  timeFormat: "24h" | "12h";
  fontSize: "small" | "medium" | "large";
}

const defaultSettings: SystemSettings = {
  language: "en",
  theme: "system",
  scanSound: true,
  browserNotification: false,
  soundVolume: 50,
  soundType: "default",
  tableRowsPerPage: 25,
  dateFormat: "YYYY-MM-DD",
  timeFormat: "24h",
  fontSize: "medium",
};

const SETTINGS_STORAGE_KEY = "system_settings";

interface SettingsContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.warn("Failed to load settings:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.warn("Failed to save settings:", error);
      }
    }
  }, [settings, isLoaded]);

  const updateSettings = useCallback((newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
