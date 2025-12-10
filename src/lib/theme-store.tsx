// src/lib/theme-store.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeContextValue = {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "pf-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark");

    // Load theme from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
            if (stored === "light" || stored === "dark") {
                setThemeState(stored);
                document.documentElement.setAttribute("data-theme", stored);
            } else {
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                const defaultTheme = prefersDark ? "dark" : "light";
                setThemeState(defaultTheme);
                document.documentElement.setAttribute("data-theme", defaultTheme);
            }
        } catch {
            // Ignore errors
        }
    }, []);

    // Apply theme to document when it changes
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // Ignore errors
        }
    }, [theme]);

    function toggleTheme() {
        setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
    }

    function setTheme(newTheme: Theme) {
        setThemeState(newTheme);
    }

    const value: ThemeContextValue = { theme, toggleTheme, setTheme };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return ctx;
}