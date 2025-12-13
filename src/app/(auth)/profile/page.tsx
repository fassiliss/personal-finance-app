"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            setName(user.user_metadata?.name || "");
            setEmail(user.email || "");
        }
    }, [user]);

    async function handleUpdateProfile(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            data: { name },
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage("Profile updated successfully!");
        }
        setLoading(false);
    }

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setMessage("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage("Password changed successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }
        setLoading(false);
    }

    return (
        <div className="p-4 md:p-6 max-w-2xl mx-auto">
            <h1 className="text-xl font-bold text-slate-50 mb-6">Profile Settings</h1>

            {message && (
                <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/50 p-3 text-sm text-emerald-400">
                    {message}
                </div>
            )}

            {error && (
                <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/50 p-3 text-sm text-rose-400">
                    {error}
                </div>
            )}

            {/* Profile Info */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 mb-6">
                <h2 className="text-sm font-semibold text-slate-100 mb-4">Profile Information</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Your name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            disabled
                            className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                        />
                        <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save changes"}
                    </button>
                </form>
            </div>

            {/* Change Password */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <h2 className="text-sm font-semibold text-slate-100 mb-4">Change Password</h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !newPassword || !confirmPassword}
                        className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
                    >
                        {loading ? "Changing..." : "Change password"}
                    </button>
                </form>
            </div>
        </div>
    );
}