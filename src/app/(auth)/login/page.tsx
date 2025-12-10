"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";

export default function LoginPage() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const { error } = await signIn(email, password);

        if (error) {
            setError(error);
            setLoading(false);
        } else {
            router.push("/");
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-xl font-semibold text-emerald-500">$</div>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-50">Welcome back</h1>
                    <p className="text-sm text-slate-400 mt-1">Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-400 mt-4">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-emerald-500 hover:underline">Sign up</Link>
                </p>
            </div>
        </main>
    );
}