"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";

export default function SignUpPage() {
    const { signUp } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        const { error } = await signUp(email, password, name);

        if (error) {
            setError(error);
            setLoading(false);
        } else {
            setSuccess(true);
        }
    }

    if (success) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
                <div className="w-full max-w-md text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-2xl text-emerald-500">✓</div>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-50">Check your email</h1>
                    <p className="text-sm text-slate-400 mt-2">
                        We sent a confirmation link to <strong className="text-slate-200">{email}</strong>
                    </p>
                    <p className="text-sm text-slate-400 mt-4">
                        Click the link in the email to activate your account, then{" "}
                        <Link href="/login" className="text-emerald-500 hover:underline">sign in</Link>
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-xl font-semibold text-emerald-500">$</div>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-50">Create an account</h1>
                    <p className="text-sm text-slate-400 mt-1">Start tracking your finances today</p>
                </div>

                <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
                    {error && (
                        <div className="rounded-lg bg-rose-500/10 border border-rose-500/50 p-3 text-sm text-rose-400">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="John Doe"
                        />
                    </div>

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

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-400 mt-4">
                    Already have an account?{" "}
                    <Link href="/login" className="text-emerald-500 hover:underline">Sign in</Link>
                </p>
            </div>
        </main>
    );
}