// src/app/page.tsx
"use client";

import React, {
    useMemo,
    useState,
    useEffect,
    FormEvent,
} from "react";
import {
    useFinance,
    Transaction,
    TransactionInput,
    Account,
} from "@/lib/finance-store";
import Link from "next/link";

// Theme-aware style helpers
const cardStyle = "rounded-xl border border-theme bg-theme-secondary/70 p-4";
const cardStyleLarge = "rounded-xl border border-theme bg-theme-secondary/70 p-5";
const inputStyle = "w-full rounded-lg border border-theme-light bg-theme-primary px-3 py-2 text-sm text-theme-primary focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";
const buttonSecondary = "rounded-lg border border-theme-light px-3 py-2 text-xs font-medium text-theme-secondary hover:bg-theme-tertiary";
const modalOverlay = "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur";
const modalContent = "w-full max-w-md rounded-xl border border-theme bg-theme-secondary p-6 shadow-xl";

function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
}

/* ---------- Icons (inline SVG) ---------- */

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
            <path
                d="M4 6h12"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
            <path
                d="M8 6V4h4v2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
            <path
                d="M6.5 6h7l-.5 9h-6l-.5-9Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function CopyIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect
                x="7"
                y="5"
                width="8"
                height="10"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.4"
            />
            <rect
                x="5"
                y="3"
                width="8"
                height="10"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.4"
                opacity="0.65"
            />
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

function EditTransactionModal({
                                  open,
                                  transaction,
                                  onClose,
                                  onSave,
                                  accounts,
                              }: EditTransactionModalProps) {
    const initialFormState: TransactionInput = {
        date: new Date().toISOString().slice(0, 10),
        payee: "",
        category: "",
        account: accounts[0]?.name ?? "",
        amount: 0,
        type: "expense",
    };

    const [form, setForm] = useState<TransactionInput>(initialFormState);
    const headingId = "dashboard-edit-transaction-title";

    useEffect(() => {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, transaction, accounts]);

    if (!open) return null;

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) {
        const { name, value } = e.target;

        if (name === "amount") {
            setForm((prev) => ({
                ...prev,
                amount: Number(value),
            }));
            return;
        }

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!form.payee.trim() || !form.category.trim() || !form.amount) return;
        if (!form.account) return;

        onSave(form);
        onClose();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={headingId}
                className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
            >
                <h2 id={headingId} className="text-lg font-semibold text-slate-50">
                    Edit transaction
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                    Adjust the details of this transaction.
                </p>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-slate-300">
                                Date
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={form.date}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-slate-300">
                                Type
                            </label>
                            <select
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-300">
                            Payee
                        </label>
                        <input
                            type="text"
                            name="payee"
                            value={form.payee}
                            onChange={handleChange}
                            placeholder="Kroger, Rent, Paycheck..."
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-300">
                            Category
                        </label>
                        <input
                            type="text"
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            placeholder="Groceries, Salary, Housing..."
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-slate-300">
                                Account
                            </label>
                            <select
                                name="account"
                                value={form.account}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                                {accounts.map((acc) => (
                                    <option key={acc.name} value={acc.name}>
                                        {acc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-slate-300">
                                Amount (USD)
                            </label>
                            <input
                                type="number"
                                name="amount"
                                value={form.amount || ""}
                                onChange={handleChange}
                                step="0.01"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                        >
                            Save changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ---------- Confirm Delete Modal ---------- */

type ConfirmDeleteModalProps = {
    open: boolean;
    title: string;
    description?: string;
    onCancel: () => void;
    onConfirm: () => void;
};

function ConfirmDeleteModal({
                                open,
                                title,
                                description,
                                onCancel,
                                onConfirm,
                            }: ConfirmDeleteModalProps) {
    const headingId = "dashboard-confirm-delete-title";

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur"
            onClick={(e) => {
                if (e.target === e.currentTarget) onCancel();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={headingId}
                className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl"
            >
                <h2 id={headingId} className="text-sm font-semibold text-slate-50">
                    {title}
                </h2>
                <p className="mt-2 text-xs text-slate-400">
                    This action cannot be undone.
                    {description && (
                        <span className="mt-1 block text-slate-300">
              {description}
            </span>
                    )}
                </p>

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-slate-50 hover:bg-rose-400"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ---------- Add Account Modal ---------- */

type AddAccountFormState = {
    name: string;
    type: "bank" | "credit";
    startingBalance: number;
};

type AddAccountModalProps = {
    open: boolean;
    onClose: () => void;
    onSave: (input: AddAccountFormState) => void;
};

function AddAccountModal({
                             open,
                             onClose,
                             onSave,
                         }: AddAccountModalProps) {
    const [form, setForm] = useState<AddAccountFormState>({
        name: "",
        type: "bank",
        startingBalance: 0,
    });

    const headingId = "dashboard-add-account-title";

    useEffect(() => {
        if (!open) return;
        setForm({
            name: "",
            type: "bank",
            startingBalance: 0,
        });
    }, [open]);

    if (!open) return null;

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) {
        const { name, value } = e.target;
        if (name === "startingBalance") {
            setForm((prev) => ({
                ...prev,
                startingBalance: Number(value),
            }));
        } else {
            setForm((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim()) return;
        onSave(form);
        onClose();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={headingId}
                className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
            >
                <h2 id={headingId} className="text-lg font-semibold text-slate-50">
                    Add account
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                    Create a local account with an optional starting balance.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-4 space-y-3 text-sm"
                >
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-300">
                            Account name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Brokerage, Cash, Travel fund..."
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-slate-300">
                                Type
                            </label>
                            <select
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="bank">Bank account</option>
                                <option value="credit">Credit card</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-slate-300">
                                Starting balance (USD)
                            </label>
                            <input
                                type="number"
                                name="startingBalance"
                                value={form.startingBalance || ""}
                                onChange={handleChange}
                                step="0.01"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                        >
                            Save account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ---------- Dashboard Page ---------- */

type ChartScope = "all" | "month";

export default function DashboardPage() {
    const {
        accounts,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        deleteAccount,
    } = useFinance();

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(
        null,
    );

    const [accountModalOpen, setAccountModalOpen] = useState(false);
    const [accountDeleteOpen, setAccountDeleteOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<Account | null>(
        null,
    );

    const [chartScope, setChartScope] = useState<ChartScope>("all");

    const {
        totalBalance,
        totalIncome,
        totalExpenses,
        recentTransactions,
        categoryTotalsAll,
        categoryTotalsThisMonth,
        maxCategoryAll,
        maxCategoryThisMonth,
        monthlyNetAll,
        monthlyNetThisMonth,
        maxMonthlyAbsAll,
        maxMonthlyAbsThisMonth,
    } = useMemo(() => {
        const now = new Date();
        const thisYear = now.getFullYear();
        const thisMonth = now.getMonth();

        const totalBalance = accounts.reduce(
            (sum, acc) => sum + acc.balance,
            0,
        );

        const totalIncome = transactions
            .filter((t) => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpensesRaw = transactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0);

        const recentTransactions = [...transactions]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5);

        // Spending by category (all-time + this month)
        const categoryMapAll = new Map<string, number>();
        const categoryMapThisMonth = new Map<string, number>();

        // Net cashflow by month
        type MonthEntry = { label: string; net: number };
        const monthMapAll = new Map<string, MonthEntry>();
        const monthMapThisMonth = new Map<string, MonthEntry>();

        for (const tx of transactions) {
            const d = new Date(tx.date);
            if (Number.isNaN(d.getTime())) continue;

            const inThisMonth =
                d.getFullYear() === thisYear && d.getMonth() === thisMonth;

            // category (expenses only)
            if (tx.type === "expense") {
                const key = tx.category || "Uncategorized";
                categoryMapAll.set(
                    key,
                    (categoryMapAll.get(key) ?? 0) + tx.amount,
                );
                if (inThisMonth) {
                    categoryMapThisMonth.set(
                        key,
                        (categoryMapThisMonth.get(key) ?? 0) + tx.amount,
                    );
                }
            }

            // monthly net
            const monthKey = `${d.getFullYear()}-${String(
                d.getMonth() + 1,
            ).padStart(2, "0")}`;
            const monthLabel = d.toLocaleString("en-US", {
                month: "short",
                year: "2-digit",
            });
            const delta =
                tx.type === "income" ? tx.amount : -tx.amount;

            const existingAll = monthMapAll.get(monthKey) ?? {
                label: monthLabel,
                net: 0,
            };
            existingAll.net += delta;
            monthMapAll.set(monthKey, existingAll);

            if (inThisMonth) {
                const existingMonth = monthMapThisMonth.get(monthKey) ?? {
                    label: monthLabel,
                    net: 0,
                };
                existingMonth.net += delta;
                monthMapThisMonth.set(monthKey, existingMonth);
            }
        }

        const categoryTotalsAll = Array.from(categoryMapAll.entries())
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);

        const categoryTotalsThisMonth = Array.from(
            categoryMapThisMonth.entries(),
        )
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);

        const maxCategoryAll =
            categoryTotalsAll.length > 0 ? categoryTotalsAll[0].amount : 0;

        const maxCategoryThisMonth =
            categoryTotalsThisMonth.length > 0
                ? categoryTotalsThisMonth[0].amount
                : 0;

        const monthlyNetAll = Array.from(monthMapAll.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([, v]) => v);

        const monthlyNetThisMonth = Array.from(
            monthMapThisMonth.entries(),
        )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, v]) => v);

        const maxMonthlyAbsAll =
            monthlyNetAll.length > 0
                ? monthlyNetAll.reduce(
                    (max, m) => Math.max(max, Math.abs(m.net)),
                    0,
                )
                : 0;

        const maxMonthlyAbsThisMonth =
            monthlyNetThisMonth.length > 0
                ? monthlyNetThisMonth.reduce(
                    (max, m) => Math.max(max, Math.abs(m.net)),
                    0,
                )
                : 0;

        return {
            totalBalance,
            totalIncome,
            totalExpenses: -totalExpensesRaw,
            recentTransactions,
            categoryTotalsAll,
            categoryTotalsThisMonth,
            maxCategoryAll,
            maxCategoryThisMonth,
            monthlyNetAll,
            monthlyNetThisMonth,
            maxMonthlyAbsAll,
            maxMonthlyAbsThisMonth,
        };
    }, [accounts, transactions]);

    const categoryTotalsToShow =
        chartScope === "all"
            ? categoryTotalsAll
            : categoryTotalsThisMonth;

    const maxCategoryToUse =
        chartScope === "all" ? maxCategoryAll : maxCategoryThisMonth;

    const monthlyNetToShow =
        chartScope === "all" ? monthlyNetAll : monthlyNetThisMonth;

    const maxMonthlyAbsToUse =
        chartScope === "all"
            ? maxMonthlyAbsAll
            : maxMonthlyAbsThisMonth;

    return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-8">
                {/* Page header */}
                <header className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                        Personal Finance
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                        Personal Finance Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Simple overview of your accounts and recent activity.
                    </p>
                </header>

                {/* Top summary cards */}
                <section className="mb-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Total Balance
                        </p>
                        <p className="mt-2 text-2xl font-semibold">
                            {formatCurrency(totalBalance)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Across all linked accounts
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">
                            Total Income
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-300">
                            {formatCurrency(totalIncome)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Recent inflows</p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-rose-400">
                            Total Expenses
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-rose-300">
                            {formatCurrency(totalExpenses)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Recent outflows</p>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Accounts card */}
                    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                        <div className="mb-4 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold text-slate-100">
                                    Accounts
                                </h2>
                                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {accounts.length} total
                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setAccountModalOpen(true)}
                                className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20"
                            >
                                + Add account
                            </button>
                        </div>

                        <div className="space-y-3">
                            {accounts.map((acc) => {
                                const hasTx = transactions.some(
                                    (tx) => tx.account === acc.name,
                                );

                                return (
                                    <div
                                        key={acc.id}
                                        className="flex items-center justify-between rounded-lg border border-slate-800/70 bg-slate-950/70 px-3 py-3 hover:bg-slate-900/70 transition-colors"
                                    >
                                        <Link href={`/accounts/${acc.id}`} className="flex-1">
                                            <p className="text-sm font-medium text-slate-100 hover:text-emerald-300">
                                                {acc.name}
                                            </p>
                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                {acc.type === "bank"
                                                    ? "Bank account"
                                                    : "Credit card"}
                                            </p>
                                        </Link>

                                        <div className="flex items-center gap-2">
                                            <p
                                                className={`text-sm font-semibold ${
                                                    acc.balance < 0
                                                        ? "text-rose-300"
                                                        : "text-emerald-300"
                                                }`}
                                            >
                                                {formatCurrency(acc.balance)}
                                            </p>

                                            {!hasTx && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAccountToDelete(acc);
                                                        setAccountDeleteOpen(true);
                                                    }}
                                                    className="rounded-lg border border-rose-500/60 px-2 py-1 text-[10px] text-rose-300 hover:bg-rose-500/10"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Recent transactions table */}
                    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                        <div className="mb-4 flex items-center justify-between gap-2">
                            <h2 className="text-sm font-semibold text-slate-100">
                                Recent Transactions
                            </h2>
                            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                Last {recentTransactions.length} records
              </span>
                        </div>

                        <div className="max-h-80 overflow-auto rounded-lg border border-slate-800/70">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-950/90 backdrop-blur">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                                        Payee
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                                        Category
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                                        Amount
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                                        Actions
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {recentTransactions.map((tx) => (
                                    <tr
                                        key={tx.id}
                                        className="border-t border-slate-800/70 hover:bg-slate-800/60"
                                    >
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-200">
                                            {new Date(tx.date).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-4 py-3 text-slate-100">
                                            {tx.payee}
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">
                                            {tx.category}
                                        </td>
                                        <td
                                            className={`whitespace-nowrap px-4 py-3 text-right font-medium ${
                                                tx.type === "income"
                                                    ? "text-emerald-300"
                                                    : "text-rose-300"
                                            }`}
                                        >
                                            {tx.type === "income" ? "+" : "-"}
                                            {formatCurrency(tx.amount)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                {/* Edit */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingTx(tx);
                                                        setEditModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                                                >
                                                    <PencilIcon className="h-3.5 w-3.5" />
                                                    <span>Edit</span>
                                                </button>

                                                {/* Duplicate */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const { id, ...rest } = tx;
                                                        const cloneInput = rest as TransactionInput;
                                                        addTransaction(cloneInput);
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                                                >
                                                    <CopyIcon className="h-3.5 w-3.5" />
                                                    <span>Duplicate</span>
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDeleteTarget(tx);
                                                        setDeleteModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded border border-rose-500/60 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
                                                >
                                                    <TrashIcon className="h-3.5 w-3.5" />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {recentTransactions.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-6 text-center text-slate-500"
                                        >
                                            No transactions yet. Add one to get started.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Charts row: scope toggle + 2 charts */}
                <div className="mt-8">
                    {/* Scope toggle */}
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Insights
                            </p>
                            <p className="text-xs text-slate-500">
                                Switch between all-time and this month only.
                            </p>
                        </div>
                        <div className="inline-flex rounded-full border border-slate-800 bg-slate-950/70 p-1 text-xs">
                            <button
                                type="button"
                                onClick={() => setChartScope("all")}
                                className={`rounded-full px-3 py-1 ${
                                    chartScope === "all"
                                        ? "bg-slate-800 text-slate-50"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                All time
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartScope("month")}
                                className={`rounded-full px-3 py-1 ${
                                    chartScope === "month"
                                        ? "bg-slate-800 text-slate-50"
                                        : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                                This month
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Spending by category chart */}
                        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                            <div className="mb-4 flex items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-100">
                                        Spending by category
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {chartScope === "all"
                                            ? "Based on all expense transactions."
                                            : "Based on this month's expense transactions."}
                                    </p>
                                </div>
                            </div>

                            {categoryTotalsToShow.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    No spending data yet for this view. Add some expense
                                    transactions.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {categoryTotalsToShow.map((cat) => {
                                        const widthPercent =
                                            maxCategoryToUse > 0
                                                ? Math.max(
                                                    6,
                                                    (cat.amount / maxCategoryToUse) * 100,
                                                )
                                                : 0;
                                        return (
                                            <div key={cat.name}>
                                                <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-200">
                            {cat.name}
                          </span>
                                                    <span className="tabular-nums text-slate-400">
                            {formatCurrency(cat.amount)}
                          </span>
                                                </div>
                                                <div className="h-2 rounded-full bg-slate-800">
                                                    <div
                                                        className="h-2 rounded-full bg-rose-500/80"
                                                        style={{ width: `${widthPercent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {/* Net cashflow by month */}
                        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                            <div className="mb-4 flex items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-100">
                                        Net cashflow by month
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {chartScope === "all"
                                            ? "Income minus expenses (last 6 months with activity)."
                                            : "Income minus expenses for this month."}
                                    </p>
                                </div>
                            </div>

                            {monthlyNetToShow.length === 0 ? (
                                <p className="text-sm text-slate-500">
                                    No monthly data yet for this view. Add some income and
                                    expense transactions.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {monthlyNetToShow.map((m) => {
                                        const isPositive = m.net >= 0;
                                        const widthPercent =
                                            maxMonthlyAbsToUse > 0
                                                ? Math.max(
                                                    6,
                                                    (Math.abs(m.net) / maxMonthlyAbsToUse) * 100,
                                                )
                                                : 0;
                                        return (
                                            <div key={m.label}>
                                                <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-200">
                            {m.label}
                              {chartScope === "month" && " (this month)"}
                          </span>
                                                    <span
                                                        className={`tabular-nums ${
                                                            isPositive
                                                                ? "text-emerald-300"
                                                                : "text-rose-300"
                                                        }`}
                                                    >
                            {isPositive ? "+" : "-"}
                                                        {formatCurrency(Math.abs(m.net))}
                          </span>
                                                </div>
                                                <div className="h-2 rounded-full bg-slate-800">
                                                    <div
                                                        className={`h-2 rounded-full ${
                                                            isPositive
                                                                ? "bg-emerald-500/80"
                                                                : "bg-rose-500/80"
                                                        }`}
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
                </div>
            </div>

            {/* Modals */}
            <AddAccountModal
                open={accountModalOpen}
                onClose={() => setAccountModalOpen(false)}
                onSave={(input) => {
                    addAccount({
                        name: input.name,
                        type: input.type,
                        startingBalance: input.startingBalance,
                    });
                }}
            />

            <EditTransactionModal
                open={editModalOpen}
                transaction={editingTx ?? undefined}
                accounts={accounts}
                onClose={() => setEditModalOpen(false)}
                onSave={(input) => {
                    if (editingTx) {
                        updateTransaction(editingTx.id, input);
                    }
                }}
            />

            <ConfirmDeleteModal
                open={deleteModalOpen}
                title="Delete transaction?"
                description={
                    deleteTarget
                        ? `${deleteTarget.payee} · ${formatCurrency(
                            deleteTarget.amount,
                        )}`
                        : undefined
                }
                onCancel={() => {
                    setDeleteModalOpen(false);
                    setDeleteTarget(null);
                }}
                onConfirm={() => {
                    if (deleteTarget) {
                        deleteTransaction(deleteTarget.id);
                    }
                    setDeleteTarget(null);
                    setDeleteModalOpen(false);
                }}
            />

            <ConfirmDeleteModal
                open={accountDeleteOpen}
                title="Delete account?"
                description={
                    accountToDelete
                        ? `${accountToDelete.name} · ${formatCurrency(
                            accountToDelete.balance,
                        )}`
                        : undefined
                }
                onCancel={() => {
                    setAccountDeleteOpen(false);
                    setAccountToDelete(null);
                }}
                onConfirm={() => {
                    if (accountToDelete) {
                        deleteAccount(accountToDelete.id);
                    }
                    setAccountToDelete(null);
                    setAccountDeleteOpen(false);
                }}
            />
        </main>
    );
}
