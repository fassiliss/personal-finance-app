"use client";
import { ThemeProvider } from "@/lib/theme-store";
import { AuthProvider, useAuth } from "@/lib/auth-store";
import { SupabaseFinanceProvider } from "@/lib/supabase-finance-store";
import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function ProtectedContent({ children }: { children: React.ReactNode }) {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const [approved, setApproved] = useState<boolean | null>(null);
    const [checkingApproval, setCheckingApproval] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        async function checkApproval() {
            if (!user) {
                setCheckingApproval(false);
                return;
            }

            const { data, error } = await supabase
                .from("user_approvals")
                .select("approved")
                .eq("user_id", user.id)
                .single();

            if (error || !data) {
                setApproved(false);
            } else {
                setApproved(data.approved);
            }
            setCheckingApproval(false);
        }

        if (user) {
            checkApproval();
        }
    }, [user]);

    if (loading || checkingApproval) {
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

    if (!approved) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
                <div className="max-w-md w-full text-center">
                    <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-8">
                        <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                            <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-slate-50 mb-2">Pending Approval</h1>
                        <p className="text-slate-400 mb-6">
                            Your account is waiting for admin approval. You&apos;ll be able to access the app once approved.
                        </p>
                        <p className="text-sm text-slate-500 mb-6">
                            Signed in as: {user.email}
                        </p>
                        <button
                            onClick={() => signOut()}
                            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        );
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