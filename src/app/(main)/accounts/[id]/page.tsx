// src/app/accounts/[id]/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFinance, Transaction, TransactionInput } from "@/lib/finance-store";

function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
}

/* ---------- Icons ---------- */

function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
                d="M12 4l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
                d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-8.086 8.086-3.328.5.5-3.328 8.086-8.086Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
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
            <rect x="7" y="5" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            <rect x="5" y="3" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" opacity="0.65" />
        </svg>
    );
}

function BankIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CreditCardIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

/* ---------- Edit Transaction Modal ---------- */

type EditTransactionModalProps = {
    open: boolean;
    transaction?: Transaction | null;
    onClose: () => void;
    onSave: (input: TransactionInput) => void;
    accounts: { name: string }[];
};

function EditTransactionModal({ open, transaction, onClose, onSave, accounts }: EditTransactionModalProps) {
    const initialFormState: TransactionInput = {
        date: new Date().toISOString().slice(0, 10),
        payee: "",
        category: "",
        account: accounts[0]?.name ?? "",
        amount: 0,
        type: "expense",
    };

    const [form, setForm] = useState<TransactionInput>(initialFormState);

    React.useEffect(() => {
        if (!open) return;
        if (transaction) {
            setForm({
                date: transaction.date.slice(0, 10),
                payee: transaction.payee,
                category: transaction.category,
                account: transaction.account,
                amount: transaction.amount,
                type: transaction.type,
            });
        } else {
            setForm(initialFormState);
        }
    }, [open, transaction, accounts]);

    if (!open) return null;

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;
        if (name === "amount") {
            setForm((prev) => ({ ...prev, amount: Number(value) }));
        } else {
            setForm((prev) => ({ ...prev, [name]: value }));
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.payee.trim() || !form.category.trim() || !form.amount || !form.account) return;
        onSave(form);
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-slate-50">Edit transaction</h2>
                <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-slate-300">Date</label>
                            <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none" />
                        </div>
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-slate-300">Type</label>
                            <select name="type" value={form.type} onChange={handleChange} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none">
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-300">Payee</label>
                        <input type="text" name="payee" value={form.payee} onChange={handleChange} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-300">Category</label>
                        <input type="text" name="category" value={form.category} onChange={handleChange} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none" />
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-slate-300">Account</label>
                            <select name="account" value={form.account} onChange={handleChange} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none">
                                {accounts.map((acc) => (<option key={acc.name} value={acc.name}>{acc.name}</option>))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-slate-300">Amount (USD)</label>
                            <input type="number" name="amount" value={form.amount || ""} onChange={handleChange} step="0.01" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none" />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800">Cancel</button>
                        <button type="submit" className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400">Save changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ---------- Confirm Delete Modal ---------- */

function ConfirmDeleteModal({ open, description, onCancel, onConfirm }: { open: boolean; description?: string; onCancel: () => void; onConfirm: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
            <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <h2 className="text-sm font-semibold text-slate-50">Delete transaction?</h2>
                <p className="mt-2 text-xs text-slate-400">
                    This action cannot be undone.
                    {description && <span className="mt-1 block text-slate-300">{description}</span>}
                </p>
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

    const { accounts, transactions, updateTransaction, deleteTransaction, addTransaction } = useFinance();

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

    // Find the account
    const account = useMemo(() => {
        return accounts.find((a) => a.id === accountId);
    }, [accounts, accountId]);

    // Get transactions for this account
    const accountTransactions = useMemo(() => {
        if (!account) return [];
        return transactions
            .filter((tx) => tx.account === account.name)
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [transactions, account]);

    // Calculate stats
    const stats = useMemo(() => {
        let totalIncome = 0;
        let totalExpenses = 0;
        const categoryMap = new Map<string, number>();
        const monthlyData = new Map<string, { income: number; expense: number }>();

        for (const tx of accountTransactions) {
            if (tx.type === "income") {
                totalIncome += tx.amount;
            } else {
                totalExpenses += tx.amount;
                categoryMap.set(tx.category, (categoryMap.get(tx.category) ?? 0) + tx.amount);
            }

            // Monthly data
            const monthKey = tx.date.slice(0, 7);
            const existing = monthlyData.get(monthKey) ?? { income: 0, expense: 0 };
            if (tx.type === "income") existing.income += tx.amount;
            else existing.expense += tx.amount;
            monthlyData.set(monthKey, existing);
        }

        // Top categories
        const topCategories = Array.from(categoryMap.entries())
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        // Monthly net (last 6 months)
        const monthlyNet = Array.from(monthlyData.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([month, data]) => ({
                month,
                label: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
                net: data.income - data.expense,
            }));

        return { totalIncome, totalExpenses, topCategories, monthlyNet };
    }, [accountTransactions]);

    if (!account) {
        return (
            <main className="min-h-screen bg-slate-950 text-slate-50">
                <div className="mx-auto max-w-6xl px-4 py-8">
                    <p className="text-slate-400">Account not found.</p>
                    <Link href="/" className="mt-4 inline-block text-emerald-400 hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </main>
        );
    }

    const maxCategory = stats.topCategories.length > 0 ? stats.topCategories[0].amount : 0;
    const maxMonthlyAbs = stats.monthlyNet.length > 0
        ? stats.monthlyNet.reduce((max, m) => Math.max(max, Math.abs(m.net)), 0)
        : 0;

    return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-8">
                {/* Back button */}
                <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                {/* Account Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-4">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${account.type === "bank" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                            {account.type === "bank" ? (
                                <BankIcon className="h-7 w-7 text-emerald-400" />
                            ) : (
                                <CreditCardIcon className="h-7 w-7 text-rose-400" />
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                {account.type === "bank" ? "Bank Account" : "Credit Card"}
                            </p>
                            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                {account.name}
                            </h1>
                        </div>
                    </div>
                </header>

                {/* Stats Cards */}
                <section className="mb-8 grid gap-4 sm:grid-cols-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Current Balance</p>
                        <p className={`mt-2 text-2xl font-semibold ${account.balance < 0 ? "text-rose-300" : "text-emerald-300"}`}>
                            {formatCurrency(account.balance)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Starting Balance</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-100">
                            {formatCurrency(account.startingBalance)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">Total Income</p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-300">
                            {formatCurrency(stats.totalIncome)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-rose-400">Total Expenses</p>
                        <p className="mt-2 text-2xl font-semibold text-rose-300">
                            {formatCurrency(stats.totalExpenses)}
                        </p>
                    </div>
                </section>

                {/* Charts Row */}
                <div className="mb-8 grid gap-6 lg:grid-cols-2">
                    {/* Top Spending Categories */}
                    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                        <h2 className="text-sm font-semibold text-slate-100">Top Spending Categories</h2>
                        <p className="mt-1 text-xs text-slate-500">Based on expenses in this account.</p>

                        {stats.topCategories.length === 0 ? (
                            <p className="mt-4 text-sm text-slate-500">No expenses yet.</p>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {stats.topCategories.map((cat) => {
                                    const widthPercent = maxCategory > 0 ? Math.max(6, (cat.amount / maxCategory) * 100) : 0;
                                    return (
                                        <div key={cat.name}>
                                            <div className="mb-1 flex items-center justify-between text-xs">
                                                <span className="font-medium text-slate-200">{cat.name}</span>
                                                <span className="tabular-nums text-slate-400">{formatCurrency(cat.amount)}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-slate-800">
                                                <div className="h-2 rounded-full bg-rose-500/80" style={{ width: `${widthPercent}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Monthly Net Change */}
                    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                        <h2 className="text-sm font-semibold text-slate-100">Monthly Net Change</h2>
                        <p className="mt-1 text-xs text-slate-500">Income minus expenses per month.</p>

                        {stats.monthlyNet.length === 0 ? (
                            <p className="mt-4 text-sm text-slate-500">No monthly data yet.</p>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {stats.monthlyNet.map((m) => {
                                    const isPositive = m.net >= 0;
                                    const widthPercent = maxMonthlyAbs > 0 ? Math.max(6, (Math.abs(m.net) / maxMonthlyAbs) * 100) : 0;
                                    return (
                                        <div key={m.month}>
                                            <div className="mb-1 flex items-center justify-between text-xs">
                                                <span className="font-medium text-slate-200">{m.label}</span>
                                                <span className={`tabular-nums ${isPositive ? "text-emerald-300" : "text-rose-300"}`}>
                                                    {isPositive ? "+" : "-"}{formatCurrency(Math.abs(m.net))}
                                                </span>
                                            </div>
                                            <div className="h-2 rounded-full bg-slate-800">
                                                <div
                                                    className={`h-2 rounded-full ${isPositive ? "bg-emerald-500/80" : "bg-rose-500/80"}`}
                                                    style={{ width: `${widthPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                {/* Transactions Table */}
                <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-100">Transactions</h2>
                            <p className="text-xs text-slate-500">{accountTransactions.length} total transactions</p>
                        </div>
                        <Link
                            href="/transactions"
                            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                        >
                            View All →
                        </Link>
                    </div>

                    <div className="max-h-[400px] overflow-auto rounded-lg border border-slate-800/70">
                        <table className="min-w-full text-sm">
                            <thead className="sticky top-0 bg-slate-900/90 backdrop-blur">
                            <tr>
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
                                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                                        No transactions for this account yet.
                                    </td>
                                </tr>
                            ) : (
                                accountTransactions.map((tx) => (
                                    <tr key={tx.id} className="border-t border-slate-800/70 hover:bg-slate-800/60">
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-200">
                                            {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </td>
                                        <td className="px-4 py-3 text-slate-100">{tx.payee}</td>
                                        <td className="px-4 py-3 text-slate-300">{tx.category}</td>
                                        <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${tx.type === "income" ? "text-emerald-300" : "text-rose-300"}`}>
                                            {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => { setEditingTx(tx); setEditModalOpen(true); }}
                                                    className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                                                >
                                                    <PencilIcon className="h-3.5 w-3.5" />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const { id, ...rest } = tx;
                                                        addTransaction(rest as TransactionInput);
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                                                >
                                                    <CopyIcon className="h-3.5 w-3.5" />
                                                    <span>Duplicate</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setDeleteTarget(tx); setDeleteModalOpen(true); }}
                                                    className="inline-flex items-center gap-1 rounded border border-rose-500/60 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
                                                >
                                                    <TrashIcon className="h-3.5 w-3.5" />
                                                    <span>Delete</span>
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

            {/* Modals */}
            <EditTransactionModal
                open={editModalOpen}
                transaction={editingTx}
                accounts={accounts}
                onClose={() => setEditModalOpen(false)}
                onSave={(input) => {
                    if (editingTx) updateTransaction(editingTx.id, input);
                }}
            />

            <ConfirmDeleteModal
                open={deleteModalOpen}
                description={deleteTarget ? `${deleteTarget.payee} · ${formatCurrency(deleteTarget.amount)}` : undefined}
                onCancel={() => { setDeleteModalOpen(false); setDeleteTarget(null); }}
                onConfirm={() => {
                    if (deleteTarget) deleteTransaction(deleteTarget.id);
                    setDeleteTarget(null);
                    setDeleteModalOpen(false);
                }}
            />
        </main>
    );
}