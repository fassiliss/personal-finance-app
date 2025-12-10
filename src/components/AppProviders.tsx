"use client";

import { ThemeProvider } from "@/lib/theme-store";
import { AuthProvider, useAuth } from "@/lib/auth-store";
import { SupabaseFinanceProvider } from "@/lib/supabase-finance-store";
import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function ProtectedContent({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center">
                    <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-3 text-sm text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <SupabaseFinanceProvider>
            <div className="flex min-h-screen flex-col">
                <MainHeader />
                <main className="flex-1">{children}</main>
                <Footer />
            </div>
        </SupabaseFinanceProvider>
    );
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <ProtectedContent>{children}</ProtectedContent>
            </AuthProvider>
        </ThemeProvider>
    );
}