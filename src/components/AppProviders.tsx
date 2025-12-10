"use client";

import { FinanceProvider } from "@/lib/finance-store";
import { ThemeProvider } from "@/lib/theme-store";
import { AuthProvider } from "@/lib/auth-store";
import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";

export default function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <FinanceProvider>
                    <div className="flex min-h-screen flex-col">
                        <MainHeader />
                        <main className="flex-1">{children}</main>
                        <Footer />
                    </div>
                </FinanceProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}