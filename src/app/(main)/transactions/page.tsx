// src/app/transactions/page.tsx
"use client";

import React, {
    useMemo,
    useState,
    useEffect,
    FormEvent,
} from "react";
import {
    useSupabaseFinance,
    Transaction,
    TransactionInput,
} from "@/lib/supabase-finance-store";

type TransactionType = "income" | "expense";

const typeOptions = ["All", "Income", "Expense"] as const;

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

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect
                x="3"
                y="4"
                width="14"
                height="13"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.4"
            />
            <path d="M3 8h14" stroke="currentColor" strokeWidth="1.4" />
            <path d="M7 2v4M13 2v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    );
}

/* ---------- Date Range Presets ---------- */

type DatePreset = "all" | "today" | "week" | "month" | "year" | "custom";

function getDatePresetRange(preset: DatePreset): { start: string; end: string } {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().slice(0, 10);

    switch (preset) {
        case "today":
            return { start: formatDate(today), end: formatDate(today) };
        case "week": {
            const weekAgo = new Date(today);
            weekAgo.setDate(today.getDate() - 7);
            return { start: formatDate(weekAgo), end: formatDate(today) };
        }
        case "month": {
            const monthAgo = new Date(today);
            monthAgo.setMonth(today.getMonth() - 1);
            return { start: formatDate(monthAgo), end: formatDate(today) };
        }
        case "year": {
            const yearAgo = new Date(today);
            yearAgo.setFullYear(today.getFullYear() - 1);
            return { start: formatDate(yearAgo), end: formatDate(today) };
        }
        case "all":
        case "custom":
        default:
            return { start: "", end: "" };
    }
}

/* ---------- Add Transaction Modal ---------- */

type AddTransactionInput = {
    date: string;
    payee: string;
    category: string;
    account: string;
    amount: number;
    type: TransactionType;
};

type AddTransactionModalProps = {
    open: boolean;
    onClose: () => void;
    onSave: (tx: AddTransactionInput) => void;
    accounts: { name: string }[];
};

function AddTransactionModal({
                                 open,
                                 onClose,
                                 onSave,
                                 accounts,
                             }: AddTransactionModalProps) {
    const [form, setForm] = useState<AddTransactionInput>(() => ({
        date: new Date().toISOString().slice(0, 10),
        payee: "",
        category: "",
        account: accounts[0]?.name ?? "",
        amount: 0,
        type: "expense",
    }));

    const headingId = "transactions-add-transaction-title";

    useEffect(() => {
        if (!open) return;
        setForm((prev) => ({
            ...prev,
            date: new Date().toISOString().slice(0, 10),
            payee: "",
            category: "",
            account: accounts[0]?.name ?? prev.account ?? "",
            amount: 0,
            type: "expense",
        }));
    }, [open, accounts]);

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
                    Add transaction
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                    Basic manual entry for now – later we can sync with a real API.
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
                            Save transaction
                        </button>
                    </div>
                </form>
            </div>
        </div>
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
    const headingId = "transactions-edit-transaction-title";

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
    description?: string;
    onCancel: () => void;
    onConfirm: () => void;
};

function ConfirmDeleteModal({
                                open,
                                description,
                                onCancel,
                                onConfirm,
                            }: ConfirmDeleteModalProps) {
    const headingId = "transactions-confirm-delete-title";

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
                    Delete transaction?
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

/* ---------- Transactions Page ---------- */

export default function TransactionsPage() {
    const {
        accounts,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
    } = useSupabaseFinance();

    const [accountFilter, setAccountFilter] = useState<string>("All accounts");
    const [typeFilter, setTypeFilter] = useState<(typeof typeOptions)[number]>("All");
    const [search, setSearch] = useState("");

    // Date range filter state
    const [datePreset, setDatePreset] = useState<DatePreset>("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

    // Handle preset change
    const handlePresetChange = (preset: DatePreset) => {
        setDatePreset(preset);
        if (preset === "custom") {
            setShowDatePicker(true);
        } else {
            setShowDatePicker(false);
            const range = getDatePresetRange(preset);
            setStartDate(range.start);
            setEndDate(range.end);
        }
    };

    // Clear date filters
    const clearDateFilter = () => {
        setDatePreset("all");
        setStartDate("");
        setEndDate("");
        setShowDatePicker(false);
    };

    const accountOptions = useMemo(
        () => ["All accounts", ...accounts.map((a) => a.name)],
        [accounts],
    );

    const filtered = useMemo(() => {
        return transactions.filter((tx) => {
            // Account filter
            if (accountFilter !== "All accounts" && tx.account !== accountFilter) {
                return false;
            }

            // Type filter
            if (typeFilter === "Income" && tx.type !== "income") return false;
            if (typeFilter === "Expense" && tx.type !== "expense") return false;

            // Date range filter
            if (startDate && tx.date < startDate) return false;
            if (endDate && tx.date > endDate) return false;

            // Search filter
            if (!search.trim()) return true;
            const term = search.toLowerCase();

            return (
                tx.payee.toLowerCase().includes(term) ||
                tx.category.toLowerCase().includes(term) ||
                tx.account.toLowerCase().includes(term)
            );
        });
    }, [transactions, accountFilter, typeFilter, search, startDate, endDate]);

    const { inflow, outflow, net } = useMemo(() => {
        let inflow = 0;
        let outflow = 0;

        for (const tx of filtered) {
            if (tx.type === "income") inflow += tx.amount;
            else outflow += tx.amount;
        }

        return { inflow, outflow, net: inflow - outflow };
    }, [filtered]);

    // Sort transactions by date (newest first)
    const sortedFiltered = useMemo(() => {
        return [...filtered].sort((a, b) => b.date.localeCompare(a.date));
    }, [filtered]);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-8">
                {/* Page header */}
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                            Personal Finance
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                            Transactions
                        </h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Review and filter your recent income and spending.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setAddModalOpen(true)}
                        className="inline-flex items-center justify-center rounded-lg border border-emerald-500 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 shadow-sm hover:bg-emerald-500/20"
                    >
                        + Add transaction
                    </button>
                </header>

                {/* Summary cards */}
                <section className="mb-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">
                            Money In
                        </p>
                        <p className="mt-2 text-xl font-semibold">
                            {formatCurrency(inflow)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-rose-400">
                            Money Out
                        </p>
                        <p className="mt-2 text-xl font-semibold">
                            {formatCurrency(outflow)}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-sky-400">
                            Net
                        </p>
                        <p
                            className={`mt-2 text-xl font-semibold ${
                                net < 0 ? "text-rose-300" : "text-emerald-300"
                            }`}
                        >
                            {formatCurrency(net)}
                        </p>
                    </div>
                </section>

                {/* Filters */}
                <section className="mb-4 space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                    {/* Row 1: Account, Type, Search */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                            <select
                                value={accountFilter}
                                onChange={(e) => setAccountFilter(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:max-w-xs"
                            >
                                {accountOptions.map((acc) => (
                                    <option key={acc} value={acc}>
                                        {acc}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={typeFilter}
                                onChange={(e) =>
                                    setTypeFilter(e.target.value as (typeof typeOptions)[number])
                                }
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:max-w-xs"
                            >
                                {typeOptions.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Search payee, category, account..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Row 2: Date Range Filter */}
                    <div className="flex flex-col gap-2 border-t border-slate-800 pt-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-slate-400" />
                            <span className="text-xs font-medium text-slate-400">Date Range:</span>

                            {/* Preset buttons */}
                            <div className="flex flex-wrap gap-1">
                                {(["all", "today", "week", "month", "year", "custom"] as DatePreset[]).map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => handlePresetChange(preset)}
                                        className={`rounded-full px-2.5 py-1 text-xs capitalize transition-colors ${
                                            datePreset === preset
                                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                                                : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
                                        }`}
                                    >
                                        {preset === "all" ? "All Time" : preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Clear button */}
                        {(startDate || endDate) && (
                            <button
                                type="button"
                                onClick={clearDateFilter}
                                className="text-xs text-slate-400 hover:text-rose-400"
                            >
                                Clear dates
                            </button>
                        )}
                    </div>

                    {/* Row 3: Custom Date Inputs (shown when custom is selected) */}
                    {showDatePicker && (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-slate-400">From:</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-slate-400">To:</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Active filter summary */}
                    {(startDate || endDate) && (
                        <p className="text-xs text-slate-500">
                            Showing transactions
                            {startDate && ` from ${new Date(startDate).toLocaleDateString()}`}
                            {endDate && ` to ${new Date(endDate).toLocaleDateString()}`}
                            {` (${sortedFiltered.length} results)`}
                        </p>
                    )}
                </section>

                {/* Table */}
                <section className="rounded-xl border border-slate-800 bg-slate-900/60">
                    <div className="max-h-[520px] overflow-auto rounded-xl">
                        <table className="min-w-full text-sm">
                            <thead className="sticky top-0 bg-slate-900/90 backdrop-blur">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-slate-400">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-slate-400">
                                    Payee
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-slate-400">
                                    Category
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-slate-400">
                                    Account
                                </th>
                                <th className="px-4 py-3 text-right font-medium text-slate-400">
                                    Amount
                                </th>
                                <th className="px-4 py-3 text-right font-medium text-slate-400">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {sortedFiltered.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-6 text-center text-slate-500"
                                    >
                                        No transactions match your filters yet.
                                    </td>
                                </tr>
                            ) : (
                                sortedFiltered.map((tx) => (
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
                                        <td className="px-4 py-3 text-slate-100">{tx.payee}</td>
                                        <td className="px-4 py-3 text-slate-300">
                                            {tx.category}
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">
                                            {tx.account}
                                        </td>
                                        <td
                                            className={`whitespace-nowrap px-4 py-3 text-right font-medium ${
                                                tx.type === "income"
                                                    ? "text-emerald-300"
                                                    : "text-rose-300"
                                            }`}
                                        >
                                            {tx.type === "expense" ? "-" : "+"}
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
                                                        const duplicate: TransactionInput =
                                                            rest as TransactionInput;
                                                        addTransaction(duplicate);
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
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* Modals */}
            <AddTransactionModal
                open={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                accounts={accounts}
                onSave={(input) => {
                    addTransaction(input);
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
        </main>
    );
}