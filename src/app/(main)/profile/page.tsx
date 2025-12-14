"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";
import MainHeader from "@/components/MainHeader";
import MainFooter from "@/components/Footer";

export default function ProfilePage() {
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            setName(user.user_metadata?.name || user.user_metadata?.full_name || "");
        }
    }, [user]);

    async function handleUpdateProfile(e: React.FormEvent) {
        e.preventDefault();
        setMessage("");
        setError("");

        const { error } = await supabase.auth.updateUser({
            data: { name },
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage("Profile updated successfully!");
        }
    }

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault();
        setMessage("");
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage("Password changed successfully!");
            setNewPassword("");
            setConfirmPassword("");
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            <MainHeader />
            <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
                <h1 className="text-2xl font-bold text-slate-50 mb-6">Profile Settings</h1>

                {message && (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-sm">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleUpdateProfile} className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
                    <h2 className="text-lg font-semibold text-slate-100 mb-4">Profile Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                            <input
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-400"
                            />
                            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                        </div>
                        <button
                            type="submit"
                            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
                        >
                            Save changes
                        </button>
                    </div>
                </form>

                <form onSubmit={handleChangePassword} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                    <h2 className="text-lg font-semibold text-slate-100 mb-4">Change Password</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
                        >
                            Change password
                        </button>
                    </div>
                </form>
            </main>
            <MainFooter />
        </div>
    );
}