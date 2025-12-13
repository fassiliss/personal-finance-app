"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setSent(true);
        }
        setLoading(false);
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-xl font-semibold text-emerald-500">$</div>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-50">Reset password</h1>
                    <p className="text-sm text-slate-400 mt-1">Enter your email to receive a reset link</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
                    {sent ? (
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-sm text-slate-300">Check your email for a password reset link.</p>
                            <Link href="/login" className="text-sm text-emerald-500 hover:underline">
                                Back to login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="rounded-lg bg-rose-500/10 border border-rose-500/50 p-3 text-sm text-rose-400">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                            >
                                {loading ? "Sending..." : "Send reset link"}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-sm text-slate-400 mt-4">
                    Remember your password?{" "}
                    <Link href="/login" className="text-emerald-500 hover:underline">Sign in</Link>
                </p>
            </div>
        </main>
    );
}