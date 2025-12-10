"use client";

import { ThemeProvider } from "@/lib/theme-store";
import { AuthProvider } from "@/lib/auth-store";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </ThemeProvider>
    );
}