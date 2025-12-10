// src/app/(main)/page.tsx
"use client";

import React, { useMemo, useState, useEffect, FormEvent } from "react";
import {
    useSupabaseFinance,
    Transaction,
    TransactionInput,
    Account,
    AccountInput,
} from "@/lib/supabase-finance-store";
import Link from "next/link";

function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/* ---------- Icons ---------- */

function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-8.086 8.086-3.328.5.5-3.328 8.086-8.086Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 6h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M8 6V4h4v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M6.5 6h7l-.5 9h-6l-.5-9Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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

/* ---------- Account Modal (Add/Edit) ---------- */

type AccountFormData = {
    name: string;
    type: "checking" | "savings" | "credit_card" | "cash" | "investment";
    starting_balance: number;
    color: string;
};

function AccountModal({
                          open,
                          onClose,
                          onSave,
                          onUpdate,
                          editAccount,
                      }: {
    open: boolean;
    onClose: () => void;
    onSave: (data: AccountInput) => void;
    onUpdate: (id: string, data: Partial<AccountInput>) => void;
    editAccount: Account | null;
}) {
    const [form, setForm] = useState<AccountFormData>({
        name: "",
        type: "checking",
        starting_balance: 0,
        color: "#10b981",
    });

    useEffect(() => {
        if (open) {
            if (editAccount) {
                setForm({
                    name: editAccount.name,
                    type: editAccount.type as AccountFormData["type"],
                    starting_balance: Number(editAccount.starting_balance),
                    color: editAccount.color || "#10b981",
                });
            } else {
                setForm({
                    name: "",
                    type: "checking",
                    starting_balance: 0,
                    color: "#10b981",
                });
            }
        }
    }, [open, editAccount]);

    if (!open) return null;

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        if (name === "starting_balance") {
            setForm((prev) => ({ ...prev, starting_balance: Number(value) }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!form.name.trim()) return;
        if (editAccount) {
            onUpdate(editAccount.id, form);
        } else {
            onSave(form);
        }
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-slate-50">{editAccount ? "Edit Account" : "Add Account"}</h2>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Account Name</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="e.g., Chase Checking"
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Account Type</label>
                        <select
                            name="type"
                            value={form.type}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                        >
                            <option value="checking">Checking</option>
                            <option value="savings">Savings</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="cash">Cash</option>
                            <option value="investment">Investment</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Starting Balance</label>
                        <input
                            type="number"
                            name="starting_balance"
                            value={form.starting_balance || ""}
                            onChange={handleChange}
                            step="0.01"
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800">Cancel</button>
                        <button type="submit" className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">
                            {editAccount ? "Save Changes" : "Add Account"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ---------- Transaction Modal (Add/Edit) ---------- */

type TransactionFormData = {
    payee: string;
    category: string;
    account_id: string;
    amount: number;
    type: "income" | "expense";
    date: string;
};

function TransactionModal({
                              open,
                              onClose,
                              onSave,
                              onUpdate,
                              accounts,
                              editTransaction,
                          }: {
    open: boolean;
    onClose: () => void;
    onSave: (data: TransactionInput) => void;
    onUpdate: (id: string, data: Partial<TransactionInput>) => void;
    accounts: Account[];
    editTransaction: Transaction | null;
}) {
    const today = new Date().toISOString().slice(0, 10);
    const [form, setForm] = useState<TransactionFormData>({
        payee: "",
        category: "",
        account_id: accounts[0]?.id ?? "",
        amount: 0,
        type: "expense",
        date: today,
    });

    useEffect(() => {
        if (!open) return;
        if (editTransaction) {
            setForm({
                payee: editTransaction.payee,
                category: editTransaction.category,
                account_id: editTransaction.account_id,
                amount: editTransaction.amount,
                type: editTransaction.type,
                date: editTransaction.date,
            });
        } else {
            setForm({
                payee: "",
                category: "",
                account_id: accounts[0]?.id ?? "",
                amount: 0,
                type: "expense",
                date: today,
            });
        }
    }, [open, editTransaction, accounts, today]);

    if (!open) return null;

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!form.payee.trim() || !form.category.trim() || form.amount <= 0) return;
        if (editTransaction) {
            onUpdate(editTransaction.id, form);
        } else {
            onSave(form);
        }
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-slate-50">{editTransaction ? "Edit Transaction" : "Add Transaction"}</h2>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1">Payee</label>
                            <input
                                type="text"
                                value={form.payee}
                                onChange={(e) => setForm((p) => ({ ...p, payee: e.target.value }))}
                                placeholder="e.g., Grocery Store"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                            <input
                                type="text"
                                value={form.category}
                                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                                placeholder="e.g., Groceries"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Account</label>
                            <select
                                value={form.account_id}
                                onChange={(e) => setForm((p) => ({ ...p, account_id: e.target.value }))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                            >
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Amount</label>
                            <input
                                type="number"
                                value={form.amount || ""}
                                onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))}
                                step="0.01"
                                min="0"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "income" | "expense" }))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800">Cancel</button>
                        <button type="submit" className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">
                            {editTransaction ? "Save Changes" : "Add Transaction"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
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

/* ---------- Dashboard Page ---------- */

export default function DashboardPage() {
    const {
        accounts,
        transactions,
        loading,
        addAccount,
        updateAccount,
        deleteAccount,
        addTransaction,
        updateTransaction,
        deleteTransaction,
    } = useSupabaseFinance();

    const [accountModalOpen, setAccountModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [transactionModalOpen, setTransactionModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [timeFilter, setTimeFilter] = useState<"all" | "month">("all");
    const [deleteTarget, setDeleteTarget] = useState<{ type: "account" | "transaction"; id: string; name: string } | null>(null);

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

    // Summary calculations
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const totalIncome = transactions
        .filter((tx) => tx.type === "income")
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const totalExpenses = transactions
        .filter((tx) => tx.type === "expense")
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

    // Recent transactions (last 10)
    const recentTransactions = transactions.slice(0, 10);

    // Filtered transactions for charts
    const filteredTransactions = useMemo(() => {
        if (timeFilter === "all") return transactions;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        return transactions.filter((tx) => tx.date >= startOfMonth);
    }, [transactions, timeFilter]);

    // Spending by category
    const categorySpending = useMemo(() => {
        const spending: Record<string, number> = {};
        filteredTransactions
            .filter((tx) => tx.type === "expense")
            .forEach((tx) => {
                spending[tx.category] = (spending[tx.category] || 0) + Number(tx.amount);
            });
        return Object.entries(spending)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }, [filteredTransactions]);

    const maxCategorySpending = categorySpending.length > 0 ? Math.max(...categorySpending.map(([, v]) => v)) : 0;

    // Monthly cashflow
    const monthlyCashflow = useMemo(() => {
        const cashflow: Record<string, { income: number; expenses: number }> = {};
        filteredTransactions.forEach((tx) => {
            const month = tx.date.slice(0, 7);
            if (!cashflow[month]) cashflow[month] = { income: 0, expenses: 0 };
            if (tx.type === "income") {
                cashflow[month].income += Number(tx.amount);
            } else {
                cashflow[month].expenses += Number(tx.amount);
            }
        });
        return Object.entries(cashflow)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-6);
    }, [filteredTransactions]);

    const maxCashflow = monthlyCashflow.length > 0
        ? Math.max(...monthlyCashflow.map(([, v]) => Math.max(v.income, v.expenses)))
        : 0;

    function handleEditAccount(acc: Account) {
        setEditingAccount(acc);
        setAccountModalOpen(true);
    }

    function handleEditTransaction(tx: Transaction) {
        setEditingTransaction(tx);
        setTransactionModalOpen(true);
    }

    function handleDelete(type: "account" | "transaction", id: string, name: string) {
        setDeleteTarget({ type, id, name });
    }

    function confirmDelete() {
        if (!deleteTarget) return;
        if (deleteTarget.type === "account") {
            deleteAccount(deleteTarget.id);
        } else {
            deleteTransaction(deleteTarget.id);
        }
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

    return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-8">
                {/* Header */}
                <header className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Personal Finance</p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Personal Finance Dashboard</h1>
                    <p className="mt-1 text-sm text-slate-400">Simple overview of your accounts and recent activity.</p>
                </header>

                {/* Summary Cards */}
                <section className="mb-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Balance</p>
                        <p className={`mt-2 text-2xl font-semibold ${totalBalance >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                            {formatCurrency(totalBalance)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Across all linked accounts</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">Total Income</p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-300">{formatCurrency(totalIncome)}</p>
                        <p className="mt-1 text-xs text-slate-500">Recent inflows</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-rose-400">Total Expenses</p>
                        <p className="mt-2 text-2xl font-semibold text-rose-300">-{formatCurrency(totalExpenses)}</p>
                        <p className="mt-1 text-xs text-slate-500">Recent outflows</p>
                    </div>
                </section>

                {/* Accounts & Recent Transactions - Side by Side */}
                <section className="mb-8 grid gap-6 lg:grid-cols-2">
                    {/* Accounts */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-100">Accounts</h2>
                            <span className="text-xs text-slate-500">{accounts.length} total</span>
                        </div>
                        <div className="space-y-3">
                            {accounts.map((acc) => (
                                <div
                                    key={acc.id}
                                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-3 hover:border-emerald-500/50 hover:bg-slate-900/50 transition-colors"
                                >
                                    <Link href={`/accounts/${acc.id}`} className="flex-1">
                                        <p className="text-sm font-medium text-slate-100">{acc.name}</p>
                                        <p className="text-xs text-slate-500">{getAccountTypeName(acc.type)}</p>
                                    </Link>
                                    <div className="flex items-center gap-3">
                                        <p className={`text-sm font-semibold ${Number(acc.balance) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                                            {formatCurrency(Number(acc.balance))}
                                        </p>
                                        <button
                                            onClick={() => handleEditAccount(acc)}
                                            className="text-xs text-slate-500 hover:text-emerald-400"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete("account", acc.id, acc.name)}
                                            className="text-xs text-slate-500 hover:text-rose-400"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => { setEditingAccount(null); setAccountModalOpen(true); }}
                                className="w-full rounded-lg border border-dashed border-slate-700 bg-slate-900/30 p-3 text-center text-sm text-slate-400 hover:border-emerald-500 hover:text-emerald-400"
                            >
                                + Add account
                            </button>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-100">Recent Transactions</h2>
                            <span className="text-xs text-slate-500">Last {recentTransactions.length} records</span>
                        </div>
                        <div className="space-y-2">
                            {recentTransactions.length === 0 ? (
                                <p className="py-8 text-center text-sm text-slate-500">No transactions yet. Add one to get started.</p>
                            ) : (
                                recentTransactions.slice(0, 5).map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-3 hover:border-emerald-500/50 hover:bg-slate-900/50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-100">{tx.payee}</p>
                                            <p className="text-xs text-slate-500">{tx.category} • {new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className={`text-sm font-semibold ${tx.type === "income" ? "text-emerald-300" : "text-rose-300"}`}>
                                                {tx.type === "income" ? "+" : "-"}{formatCurrency(Number(tx.amount))}
                                            </p>
                                            <button
                                                onClick={() => handleEditTransaction(tx)}
                                                className="text-xs text-slate-500 hover:text-emerald-400"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete("transaction", tx.id, tx.payee)}
                                                className="text-xs text-slate-500 hover:text-rose-400"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                            <button
                                onClick={() => { setEditingTransaction(null); setTransactionModalOpen(true); }}
                                className="w-full rounded-lg border border-dashed border-slate-700 bg-slate-900/30 p-3 text-center text-sm text-slate-400 hover:border-emerald-500 hover:text-emerald-400"
                            >
                                + Add transaction
                            </button>
                        </div>
                    </div>
                </section>

                {/* Insights Section */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-100">Insights</h2>
                        <p className="text-xs text-slate-500">Switch between all-time and this month only.</p>
                    </div>
                    <div className="mb-4 flex gap-2">
                        <button
                            onClick={() => setTimeFilter("all")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${timeFilter === "all" ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                        >
                            All time
                        </button>
                        <button
                            onClick={() => setTimeFilter("month")}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${timeFilter === "month" ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                        >
                            This month
                        </button>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        {/* Spending by Category */}
                        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                            <h3 className="text-sm font-semibold text-slate-200">Spending by category</h3>
                            <p className="text-xs text-slate-500">Based on all expense transactions.</p>
                            {categorySpending.length === 0 ? (
                                <p className="mt-8 text-center text-sm text-slate-500">No spending data yet for this view. Add some expense transactions.</p>
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

                        {/* Monthly Cashflow */}
                        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                            <h3 className="text-sm font-semibold text-slate-200">Net cashflow by month</h3>
                            <p className="text-xs text-slate-500">Income minus expenses (last 6 months with activity).</p>
                            {monthlyCashflow.length === 0 ? (
                                <p className="mt-8 text-center text-sm text-slate-500">No monthly data yet for this view. Add some income and expense transactions.</p>
                            ) : (
                                <div className="mt-4 flex items-end gap-2 h-32">
                                    {monthlyCashflow.map(([month, data]) => {
                                        const net = data.income - data.expenses;
                                        const height = maxCashflow > 0 ? (Math.abs(net) / maxCashflow) * 100 : 0;
                                        return (
                                            <div key={month} className="flex-1 flex flex-col items-center">
                                                <div
                                                    className={`w-full rounded-t ${net >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                                                    style={{ height: `${Math.max(height, 4)}%` }}
                                                />
                                                <span className="mt-2 text-[10px] text-slate-500">
                                                    {new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
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
                    </div>
                </section>
            </div>

            {/* Modals */}
            <AccountModal
                open={accountModalOpen}
                onClose={() => { setAccountModalOpen(false); setEditingAccount(null); }}
                onSave={addAccount}
                onUpdate={updateAccount}
                editAccount={editingAccount}
            />

            <TransactionModal
                open={transactionModalOpen}
                onClose={() => { setTransactionModalOpen(false); setEditingTransaction(null); }}
                onSave={addTransaction}
                onUpdate={updateTransaction}
                accounts={accounts}
                editTransaction={editingTransaction}
            />

            <ConfirmDeleteModal
                open={deleteTarget !== null}
                title={deleteTarget?.type === "account" ? "Delete account?" : "Delete transaction?"}
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
            />
        </main>
    );
}