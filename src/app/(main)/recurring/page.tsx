// src/app/recurring/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useFinance, RecurringTransaction, RecurringTransactionInput, RecurrenceFrequency } from "@/lib/finance-store";

function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDaysUntil(dateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function SkipIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 5l6 5-6 5V5zM14 5v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function RepeatIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 10a7 7 0 0114 0M17 10a7 7 0 01-14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M14 7l3 3-3 3M6 13l-3-3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function PauseIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M6 4v12M14 4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M6 4l10 6-10 6V4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* ---------- Add/Edit Modal ---------- */

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Every 2 Weeks" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
];

const SUGGESTED_RECURRING = [
    { payee: "Rent/Mortgage", category: "Housing", type: "expense" as const },
    { payee: "Salary", category: "Income", type: "income" as const },
    { payee: "Netflix", category: "Subscriptions", type: "expense" as const },
    { payee: "Spotify", category: "Subscriptions", type: "expense" as const },
    { payee: "Electric Bill", category: "Utilities", type: "expense" as const },
    { payee: "Internet", category: "Utilities", type: "expense" as const },
    { payee: "Phone Bill", category: "Utilities", type: "expense" as const },
    { payee: "Car Payment", category: "Transportation", type: "expense" as const },
    { payee: "Insurance", category: "Insurance", type: "expense" as const },
    { payee: "Gym Membership", category: "Health", type: "expense" as const },
];

type RecurringModalProps = {
    open: boolean;
    recurring?: RecurringTransaction | null;
    accounts: { name: string }[];
    onClose: () => void;
    onSave: (input: RecurringTransactionInput) => void;
};

function RecurringModal({ open, recurring, accounts, onClose, onSave }: RecurringModalProps) {
    const today = new Date().toISOString().slice(0, 10);

    const [form, setForm] = useState<RecurringTransactionInput>({
        payee: "",
        category: "",
        account: accounts[0]?.name ?? "",
        amount: 0,
        type: "expense",
        frequency: "monthly",
        startDate: today,
        nextDueDate: today,
        isActive: true,
    });

    useEffect(() => {
        if (!open) return;
        if (recurring) {
            setForm({
                payee: recurring.payee,
                category: recurring.category,
                account: recurring.account,
                amount: recurring.amount,
                type: recurring.type,
                frequency: recurring.frequency,
                startDate: recurring.startDate,
                nextDueDate: recurring.nextDueDate,
                isActive: recurring.isActive,
            });
        } else {
            setForm({
                payee: "",
                category: "",
                account: accounts[0]?.name ?? "",
                amount: 0,
                type: "expense",
                frequency: "monthly",
                startDate: today,
                nextDueDate: today,
                isActive: true,
            });
        }
    }, [open, recurring, accounts]);

    if (!open) return null;

    const isEditing = !!recurring;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.payee.trim() || !form.category.trim() || form.amount <= 0 || !form.account) return;
        onSave(form);
        onClose();
    }

    function applySuggestion(suggestion: typeof SUGGESTED_RECURRING[0]) {
        setForm((prev) => ({
            ...prev,
            payee: suggestion.payee,
            category: suggestion.category,
            type: suggestion.type,
        }));
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold text-slate-50">{isEditing ? "Edit Recurring" : "Add Recurring Transaction"}</h2>
                <p className="mt-1 text-xs text-slate-400">Set up automatic transactions that repeat on a schedule.</p>

                {!isEditing && (
                    <div className="mt-4">
                        <p className="text-xs font-medium text-slate-400 mb-2">Quick suggestions:</p>
                        <div className="flex flex-wrap gap-1">
                            {SUGGESTED_RECURRING.slice(0, 5).map((s) => (
                                <button
                                    key={s.payee}
                                    type="button"
                                    onClick={() => applySuggestion(s)}
                                    className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                                >
                                    {s.payee}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="mb-1 block text-xs font-medium text-slate-300">Payee</label>
                            <input
                                type="text"
                                value={form.payee}
                                onChange={(e) => setForm((prev) => ({ ...prev, payee: e.target.value }))}
                                placeholder="Netflix, Rent, Salary..."
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="mb-1 block text-xs font-medium text-slate-300">Category</label>
                            <input
                                type="text"
                                value={form.category}
                                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                                placeholder="Subscriptions, Housing..."
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-300">Amount (USD)</label>
                            <input
                                type="number"
                                value={form.amount || ""}
                                onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                                step="0.01"
                                min="0"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-300">Type</label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as "income" | "expense" }))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-300">Account</label>
                            <select
                                value={form.account}
                                onChange={(e) => setForm((prev) => ({ ...prev, account: e.target.value }))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                            >
                                {accounts.map((acc) => (
                                    <option key={acc.name} value={acc.name}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-300">Frequency</label>
                            <select
                                value={form.frequency}
                                onChange={(e) => setForm((prev) => ({ ...prev, frequency: e.target.value as RecurrenceFrequency }))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                            >
                                {FREQUENCY_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-300">Start Date</label>
                            <input
                                type="date"
                                value={form.startDate}
                                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value, nextDueDate: e.target.value }))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-300">Next Due Date</label>
                            <input
                                type="date"
                                value={form.nextDueDate}
                                onChange={(e) => setForm((prev) => ({ ...prev, nextDueDate: e.target.value }))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800">Cancel</button>
                        <button type="submit" className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400">
                            {isEditing ? "Save Changes" : "Add Recurring"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ---------- Confirm Delete Modal ---------- */

function ConfirmDeleteModal({ open, payee, onCancel, onConfirm }: { open: boolean; payee: string; onCancel: () => void; onConfirm: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
            <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <h2 className="text-sm font-semibold text-slate-50">Delete recurring transaction?</h2>
                <p className="mt-2 text-xs text-slate-400">
                    Remove <span className="text-slate-200">{payee}</span>? Past transactions won&apos;t be affected.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={onCancel} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800">Cancel</button>
                    <button type="button" onClick={onConfirm} className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-slate-50 hover:bg-rose-400">Delete</button>
                </div>
            </div>
        </div>
    );
}

/* ---------- Recurring Page ---------- */

export default function RecurringPage() {
    const {
        accounts,
        recurringTransactions,
        addRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
        toggleRecurringTransaction,
        markAsPaid,
        skipNextOccurrence,
        generateDueTransactions,
    } = useFinance();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<RecurringTransaction | null>(null);

    // Auto-generate due transactions on page load
    useEffect(() => {
        const generated = generateDueTransactions();
        if (generated.length > 0) {
            console.log(`Auto-generated ${generated.length} recurring transactions`);
        }
    }, []);

    const activeRecurring = recurringTransactions.filter((rt) => rt.isActive);
    const pausedRecurring = recurringTransactions.filter((rt) => !rt.isActive);

    const totalMonthlyExpenses = activeRecurring
        .filter((rt) => rt.type === "expense")
        .reduce((sum, rt) => {
            switch (rt.frequency) {
                case "weekly": return sum + rt.amount * 4.33;
                case "biweekly": return sum + rt.amount * 2.17;
                case "monthly": return sum + rt.amount;
                case "yearly": return sum + rt.amount / 12;
                default: return sum;
            }
        }, 0);

    const totalMonthlyIncome = activeRecurring
        .filter((rt) => rt.type === "income")
        .reduce((sum, rt) => {
            switch (rt.frequency) {
                case "weekly": return sum + rt.amount * 4.33;
                case "biweekly": return sum + rt.amount * 2.17;
                case "monthly": return sum + rt.amount;
                case "yearly": return sum + rt.amount / 12;
                default: return sum;
            }
        }, 0);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-8">
                {/* Header */}
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Personal Finance</p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Recurring Transactions</h1>
                        <p className="mt-1 text-sm text-slate-400">Manage your bills, subscriptions, and regular income.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setEditingRecurring(null); setModalOpen(true); }}
                        className="inline-flex items-center justify-center rounded-lg border border-emerald-500 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 shadow-sm hover:bg-emerald-500/20"
                    >
                        + Add Recurring
                    </button>
                </header>

                {/* Summary Cards */}
                <section className="mb-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">Monthly Income</p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-300">{formatCurrency(totalMonthlyIncome)}</p>
                        <p className="mt-1 text-xs text-slate-500">From recurring sources</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-rose-400">Monthly Expenses</p>
                        <p className="mt-2 text-2xl font-semibold text-rose-300">{formatCurrency(totalMonthlyExpenses)}</p>
                        <p className="mt-1 text-xs text-slate-500">Bills & subscriptions</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Net Recurring</p>
                        <p className={`mt-2 text-2xl font-semibold ${totalMonthlyIncome - totalMonthlyExpenses >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                            {formatCurrency(totalMonthlyIncome - totalMonthlyExpenses)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Per month</p>
                    </div>
                </section>

                {/* Active Recurring List */}
                {activeRecurring.length === 0 && pausedRecurring.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-center">
                        <RepeatIcon className="mx-auto h-12 w-12 text-slate-600" />
                        <p className="mt-4 text-slate-400">No recurring transactions yet.</p>
                        <p className="mt-1 text-sm text-slate-500">Set up your bills and income to track them automatically.</p>
                        <button
                            type="button"
                            onClick={() => { setEditingRecurring(null); setModalOpen(true); }}
                            className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                        >
                            Add your first recurring
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Active */}
                        {activeRecurring.length > 0 && (
                            <section>
                                <h2 className="mb-3 text-sm font-semibold text-slate-300">Active ({activeRecurring.length})</h2>
                                <div className="space-y-3">
                                    {activeRecurring.map((rt) => {
                                        const daysUntil = getDaysUntil(rt.nextDueDate);
                                        const isDue = daysUntil <= 0;
                                        const isUpcoming = daysUntil > 0 && daysUntil <= 3;

                                        return (
                                            <div
                                                key={rt.id}
                                                className={`rounded-xl border bg-slate-900/70 p-4 ${isDue ? "border-amber-500/50" : isUpcoming ? "border-sky-500/30" : "border-slate-800"}`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${rt.type === "income" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                                                            <RepeatIcon className={`h-5 w-5 ${rt.type === "income" ? "text-emerald-400" : "text-rose-400"}`} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-slate-100">{rt.payee}</h3>
                                                            <p className="text-xs text-slate-500">{rt.category} • {rt.account}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-sm font-semibold ${rt.type === "income" ? "text-emerald-300" : "text-rose-300"}`}>
                                                            {rt.type === "income" ? "+" : "-"}{formatCurrency(rt.amount)}
                                                        </p>
                                                        <p className="text-xs text-slate-500 capitalize">{rt.frequency}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {isDue ? (
                                                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">Due today!</span>
                                                        ) : isUpcoming ? (
                                                            <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs text-sky-400">Due in {daysUntil} day{daysUntil !== 1 ? "s" : ""}</span>
                                                        ) : (
                                                            <span className="text-xs text-slate-500">Next: {formatDate(rt.nextDueDate)}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => markAsPaid(rt.id)}
                                                            className="inline-flex items-center gap-1 rounded border border-emerald-500/60 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10"
                                                            title="Mark as paid"
                                                        >
                                                            <CheckIcon className="h-3.5 w-3.5" />
                                                            <span>Paid</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => skipNextOccurrence(rt.id)}
                                                            className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:bg-slate-800"
                                                            title="Skip this occurrence"
                                                        >
                                                            <SkipIcon className="h-3.5 w-3.5" />
                                                            <span>Skip</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRecurringTransaction(rt.id)}
                                                            className="rounded border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800"
                                                            title="Pause"
                                                        >
                                                            <PauseIcon className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setEditingRecurring(rt); setModalOpen(true); }}
                                                            className="rounded border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800"
                                                            title="Edit"
                                                        >
                                                            <PencilIcon className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setDeleteTarget(rt); setDeleteModalOpen(true); }}
                                                            className="rounded border border-rose-500/60 p-1.5 text-rose-400 hover:bg-rose-500/10"
                                                            title="Delete"
                                                        >
                                                            <TrashIcon className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Paused */}
                        {pausedRecurring.length > 0 && (
                            <section>
                                <h2 className="mb-3 text-sm font-semibold text-slate-500">Paused ({pausedRecurring.length})</h2>
                                <div className="space-y-3 opacity-60">
                                    {pausedRecurring.map((rt) => (
                                        <div key={rt.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                                                        <RepeatIcon className="h-5 w-5 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-semibold text-slate-400">{rt.payee}</h3>
                                                        <p className="text-xs text-slate-600">{rt.category} • {formatCurrency(rt.amount)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleRecurringTransaction(rt.id)}
                                                        className="inline-flex items-center gap-1 rounded border border-emerald-500/60 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10"
                                                    >
                                                        <PlayIcon className="h-3.5 w-3.5" />
                                                        <span>Resume</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setDeleteTarget(rt); setDeleteModalOpen(true); }}
                                                        className="rounded border border-rose-500/60 p-1.5 text-rose-400 hover:bg-rose-500/10"
                                                    >
                                                        <TrashIcon className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <RecurringModal
                open={modalOpen}
                recurring={editingRecurring}
                accounts={accounts}
                onClose={() => setModalOpen(false)}
                onSave={(input) => {
                    if (editingRecurring) {
                        updateRecurringTransaction(editingRecurring.id, input);
                    } else {
                        addRecurringTransaction(input);
                    }
                }}
            />

            <ConfirmDeleteModal
                open={deleteModalOpen}
                payee={deleteTarget?.payee ?? ""}
                onCancel={() => { setDeleteModalOpen(false); setDeleteTarget(null); }}
                onConfirm={() => {
                    if (deleteTarget) deleteRecurringTransaction(deleteTarget.id);
                    setDeleteTarget(null);
                    setDeleteModalOpen(false);
                }}
            />
        </main>
    );
}