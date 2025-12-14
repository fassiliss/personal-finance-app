"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type UserApproval = {
    id: string;
    user_id: string;
    email: string;
    name: string;
    approved: boolean;
    is_admin: boolean;
    created_at: string;
};

export default function AdminPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<UserApproval[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        checkAdminAndLoadUsers();
    }, [user]);

    async function checkAdminAndLoadUsers() {
        if (!user) return;

        // Check if current user is admin
        const { data: adminCheck } = await supabase
            .from("user_approvals")
            .select("is_admin")
            .eq("user_id", user.id)
            .single();

        if (!adminCheck?.is_admin) {
            router.push("/");
            return;
        }

        setIsAdmin(true);

        // Load all users
        const { data } = await supabase
            .from("user_approvals")
            .select("*")
            .order("created_at", { ascending: false });

        setUsers(data || []);
        setLoading(false);
    }

    async function handleApprove(userId: string) {
        const { error } = await supabase
            .from("user_approvals")
            .update({ approved: true })
            .eq("id", userId);

        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, approved: true } : u));
            setMessage("User approved!");
            setTimeout(() => setMessage(""), 3000);
        }
    }

    async function handleRevoke(userId: string) {
        const { error } = await supabase
            .from("user_approvals")
            .update({ approved: false })
            .eq("id", userId);

        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, approved: false } : u));
            setMessage("Access revoked");
            setTimeout(() => setMessage(""), 3000);
        }
    }

    async function handleToggleAdmin(userId: string, currentStatus: boolean) {
        const { error } = await supabase
            .from("user_approvals")
            .update({ is_admin: !currentStatus })
            .eq("id", userId);

        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, is_admin: !currentStatus } : u));
            setMessage(currentStatus ? "Admin removed" : "Admin granted");
            setTimeout(() => setMessage(""), 3000);
        }
    }

    if (loading) {
        return (
            <div className="p-6 text-center text-slate-400">Loading...</div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    const pendingUsers = users.filter(u => !u.approved);
    const approvedUsers = users.filter(u => u.approved);

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-50 mb-2">Admin Dashboard</h1>
            <p className="text-sm text-slate-400 mb-6">Manage user access and approvals</p>

            {message && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-sm">
                    {message}
                </div>
            )}

            {/* Pending Approvals */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    Pending Approvals
                    {pendingUsers.length > 0 && (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                            {pendingUsers.length}
                        </span>
                    )}
                </h2>

                {pendingUsers.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400">
                        No pending approvals
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingUsers.map((u) => (
                            <div key={u.id} className="rounded-xl border border-amber-500/30 bg-slate-900 p-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-100">{u.name || "No name"}</p>
                                    <p className="text-sm text-slate-400">{u.email}</p>
                                    <p className="text-xs text-slate-500">
                                        Signed up: {new Date(u.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleApprove(u.id)}
                                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
                                >
                                    Approve
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Approved Users */}
            <section>
                <h2 className="text-lg font-semibold text-slate-100 mb-4">
                    Approved Users ({approvedUsers.length})
                </h2>

                <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">User</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Role</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {approvedUsers.map((u) => (
                            <tr key={u.id} className="border-t border-slate-800">
                                <td className="px-4 py-3">
                                    <p className="font-medium text-slate-100">{u.name || "No name"}</p>
                                    <p className="text-xs text-slate-400">{u.email}</p>
                                </td>
                                <td className="px-4 py-3">
                                    {u.is_admin ? (
                                        <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-400">Admin</span>
                                    ) : (
                                        <span className="rounded-full bg-slate-700 px-2 py-1 text-xs text-slate-300">User</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right space-x-2">
                                    <button
                                        onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                                        className="rounded px-2 py-1 text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                                    >
                                        {u.is_admin ? "Remove Admin" : "Make Admin"}
                                    </button>
                                    <button
                                        onClick={() => handleRevoke(u.id)}
                                        className="rounded px-2 py-1 text-xs bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                                    >
                                        Revoke
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}