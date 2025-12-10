// src/app/(main)/accounts/[id]/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    useSupabaseFinance,
    Transaction,
    TransactionInput,
} from "@/lib/supabase-finance-store";

function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ---------- Icons ---------- */

function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M15 10H5M5 10l4-4M5 10l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function BankIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 17h14M4 14h12M5 14V9M9 14V9M11 14V9M15 14V9M2 9l8-5 8 5H2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CreditCardIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 8h16" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function CopyIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="6" y="6" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M4 14V5.5A1.5 1.5 0 0 1 5.5 4H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    );
}

/* ---------- Confirm Delete Modal ---------- */

function ConfirmDeleteModal({
                                open,
                                title,
                                message,
                                onCancel,
                                onConfirm,
                            }: {
    open: boolean;
    title: string;
    message: string;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
            <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <h2 className="text-sm font-semibold text-slate-50">{title}</h2>
                <p className="mt-2 text-xs text-slate-400">{message}</p>
                <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={onCancel} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800">Cancel</button>
                    <button type="button" onClick={onConfirm} className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-slate-50 hover:bg-rose-400">Delete</button>
                </div>
            </div>
        </div>
    );
}

/* ---------- Account Detail Page ---------- */

export default function AccountDetailPage() {
    const params = useParams();
    const router = useRouter();
    const accountId = params.id as string;

    const {
        accounts,
        transactions,
        loading,
        deleteTransaction,
        addTransaction,
    } = useSupabaseFinance();

    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const account = accounts.find((a) => a.id === accountId);
    const accountTransactions = transactions.filter((tx) => tx.account_id === accountId);

    const getAccountTypeName = (type: string) => {
        switch (type) {
            case "checking": return "Checking";
            case "savings": return "Savings";
            case "credit_card": return "Credit Card";
            case "cash": return "Cash";
            case "investment": return "Investment";
            default: return type;
        }
    };

    // Stats
    const totalIncome = accountTransactions
        .filter((tx) => tx.type === "income")
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const totalExpenses = accountTransactions
        .filter((tx) => tx.type === "expense")
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

    // Top spending categories for this account
    const categorySpending = useMemo(() => {
        const spending: Record<string, number> = {};
        accountTransactions
            .filter((tx) => tx.type === "expense")
            .forEach((tx) => {
                spending[tx.category] = (spending[tx.category] || 0) + Number(tx.amount);
            });
        return Object.entries(spending)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }, [accountTransactions]);

    const maxCategorySpending = categorySpending.length > 0 ? Math.max(...categorySpending.map(([, v]) => v)) : 0;

    // Monthly net change
    const monthlyChange = useMemo(() => {
        const changes: Record<string, number> = {};
        accountTransactions.forEach((tx) => {
            const month = tx.date.slice(0, 7);
            if (!changes[month]) changes[month] = 0;
            if (tx.type === "income") {
                changes[month] += Number(tx.amount);
            } else {
                changes[month] -= Number(tx.amount);
            }
        });
        return Object.entries(changes)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-6);
    }, [accountTransactions]);

    const maxMonthlyChange = monthlyChange.length > 0
        ? Math.max(...monthlyChange.map(([, v]) => Math.abs(v)))
        : 0;

    function handleDuplicate(tx: Transaction) {
        addTransaction({
            payee: tx.payee,
            category: tx.category,
            account_id: tx.account_id,
            amount: tx.amount,
            type: tx.type,
            date: new Date().toISOString().slice(0, 10),
        });
    }

    function handleDelete(id: string, name: string) {
        setDeleteTarget({ id, name });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        deleteTransaction(deleteTarget.id);
        setDeleteTarget(null);
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-3 text-sm text-slate-400">Loading...</p>
                </div>
            </main>
        );
    }

    if (!account) {
        return (
            <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400">Account not found.</p>
                    <Link href="/" className="mt-4 inline-block text-emerald-400 hover:underline">Back to Dashboard</Link>
                </div>
            </main>
        );
    }

    const isCredit = account.type === "credit_card";

    return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-8">
                {/* Header */}
                <header className="mb-8">
                    <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-emerald-400 mb-4">
                        <ArrowLeftIcon className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isCredit ? "bg-rose-500/10" : "bg-emerald-500/10"}`}>
                            {isCredit ? (
                                <CreditCardIcon className="h-6 w-6 text-rose-400" />
                            ) : (
                                <BankIcon className="h-6 w-6 text-emerald-400" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold">{account.name}</h1>
                            <p className="text-sm text-slate-400">{getAccountTypeName(account.type)}</p>
                        </div>
                    </div>
                </header>

                {/* Stats Cards */}
                <section className="mb-8 grid gap-4 sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Current Balance</p>
                        <p className={`mt-2 text-2xl font-semibold ${Number(account.balance) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                            {formatCurrency(Number(account.balance))}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Starting Balance</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-200">
                            {formatCurrency(Number(account.starting_balance))}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">Total Income</p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-300">{formatCurrency(totalIncome)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-rose-400">Total Expenses</p>
                        <p className="mt-2 text-2xl font-semibold text-rose-300">{formatCurrency(totalExpenses)}</p>
                    </div>
                </section>

                {/* Charts */}
                <section className="mb-8 grid gap-4 lg:grid-cols-2">
                    {/* Top Spending Categories */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                        <h3 className="text-sm font-semibold text-slate-200">Top Spending Categories</h3>
                        <p className="text-xs text-slate-500">Based on expenses from this account.</p>
                        {categorySpending.length === 0 ? (
                            <p className="mt-8 text-center text-sm text-slate-500">No expense data yet.</p>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {categorySpending.map(([category, amount]) => (
                                    <div key={category}>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-300">{category}</span>
                                            <span className="text-slate-400">{formatCurrency(amount)}</span>
                                        </div>
                                        <div className="mt-1 h-2 rounded-full bg-slate-800">
                                            <div
                                                className="h-2 rounded-full bg-rose-500"
                                                style={{ width: `${(amount / maxCategorySpending) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Monthly Net Change */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                        <h3 className="text-sm font-semibold text-slate-200">Monthly Net Change</h3>
                        <p className="text-xs text-slate-500">Last 6 months with activity.</p>
                        {monthlyChange.length === 0 ? (
                            <p className="mt-8 text-center text-sm text-slate-500">No monthly data yet.</p>
                        ) : (
                            <div className="mt-4 flex items-end gap-2 h-32">
                                {monthlyChange.map(([month, net]) => {
                                    const height = maxMonthlyChange > 0 ? (Math.abs(net) / maxMonthlyChange) * 100 : 0;
                                    return (
                                        <div key={month} className="flex-1 flex flex-col items-center">
                                            <div
                                                className={`w-full rounded-t ${net >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                                                style={{ height: `${Math.max(height, 4)}%` }}
                                            />
                                            <span className="mt-2 text-[10px] text-slate-500">
                                                {new Date(month + "-01").toLocaleDateString("en-US", { month: "short" })}
                                            </span>
                                            <span className={`text-[10px] ${net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                {formatCurrency(net)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* Transactions Table */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-100">Transactions</h2>
                        <span className="text-sm text-slate-500">{accountTransactions.length} total</span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50">
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Payee</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">Category</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Amount</th>
                                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {accountTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                        No transactions for this account yet.
                                    </td>
                                </tr>
                            ) : (
                                accountTransactions.map((tx) => (
                                    <tr key={tx.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                        <td className="px-4 py-3 text-slate-400">{formatDate(tx.date)}</td>
                                        <td className="px-4 py-3 text-slate-100">{tx.payee}</td>
                                        <td className="px-4 py-3 text-slate-400">{tx.category}</td>
                                        <td className={`px-4 py-3 text-right font-medium ${tx.type === "income" ? "text-emerald-300" : "text-rose-300"}`}>
                                            {tx.type === "income" ? "+" : "-"}{formatCurrency(Number(tx.amount))}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleDuplicate(tx)}
                                                    className="text-xs text-slate-500 hover:text-emerald-400"
                                                >
                                                    Duplicate
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tx.id, tx.payee)}
                                                    className="text-xs text-slate-500 hover:text-rose-400"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                open={deleteTarget !== null}
                title="Delete transaction?"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
            />
        </main>
    );
}