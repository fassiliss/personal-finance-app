// src/app/transactions/page.tsx
"use client";

import {
    useMemo,
    useState,
    useEffect,
    useRef,
    FormEvent,
} from "react";
import {
    useFinance,
    Transaction,
    TransactionInput,
} from "@/lib/finance-store";

const accountOptions = [
    "All accounts",
    "Checking",
    "Savings",
    "Credit Card",
] as const;

const typeOptions = ["All", "Income", "Expense"] as const;

type AccountFilter = (typeof accountOptions)[number];
type TypeFilter = (typeof typeOptions)[number];

function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
}

/* ---------- Icons (inline SVG) ---------- */

function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
        >
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
        <svg
            {...props}
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
        >
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
        <svg
            {...props}
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
        >
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
``

/* ---------- Transaction Modal (Add/Edit) ---------- */

type TransactionFormMode = "add" | "edit";

type TransactionModalProps = {
    open: boolean;
    mode: TransactionFormMode;
    initial?: Transaction | null;
    onClose: () => void;
    onSave: (input: TransactionInput) => void;
};

function TransactionModal({
                              open,
                              mode,
                              initial,
                              onClose,
                              onSave,
                          }: TransactionModalProps) {
    const isEdit = mode === "edit";

    const initialFormState: TransactionInput = {
        date: new Date().toISOString().slice(0, 10),
        payee: "",
        category: "",
        account: "Checking",
        amount: 0,
        type: "expense",
    };

    const [form, setForm] = useState<TransactionInput>(initialFormState);
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const headingId = "transaction-modal-title";

    // populate form when opening / when initial changes
    useEffect(() => {
        if (!open) return;
        if (initial) {
            setForm({
                date: initial.date.slice(0, 10),
                payee: initial.payee,
                category: initial.category,
                account: initial.account,
                amount: initial.amount,
                type: initial.type,
            });
        } else {
            setForm(initialFormState);
        }
    }, [open, initial]);

    // close on Escape
    useEffect(() => {
        if (!open) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                onClose();
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

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
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={headingId}
                className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
            >
                <h2 id={headingId} className="text-lg font-semibold text-slate-50">
                    {isEdit ? "Edit transaction" : "Add transaction"}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                    {isEdit
                        ? "Update the details of this transaction."
                        : "Basic manual entry for now – later we can sync with a real API."}
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
                                <option value="Checking">Checking</option>
                                <option value="Savings">Savings</option>
                                <option value="Credit Card">Credit Card</option>
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
                            {isEdit ? "Save changes" : "Save transaction"}
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
    const headingId = "confirm-delete-title";

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
                <h2
                    id={headingId}
                    className="text-sm font-semibold text-slate-50"
                >
                    Delete transaction?
                </h2>
                <p className="mt-2 text-xs text-slate-400">
                    This action cannot be undone.{" "}
                    {description && (
                        <span className="block mt-1 text-slate-300">
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
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
    } = useFinance();

    const [accountFilter, setAccountFilter] =
        useState<AccountFilter>("All accounts");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("All");
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<TransactionFormMode>("add");
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(
        null,
    );

    const filtered = useMemo(() => {
        return transactions.filter((tx) => {
            if (accountFilter !== "All accounts" && tx.account !== accountFilter) {
                return false;
            }

            if (typeFilter === "Income" && tx.type !== "income") return false;
            if (typeFilter === "Expense" && tx.type !== "expense") return false;

            if (!search.trim()) return true;
            const term = search.toLowerCase();

            return (
                tx.payee.toLowerCase().includes(term) ||
                tx.category.toLowerCase().includes(term) ||
                tx.account.toLowerCase().includes(term)
            );
        });
    }, [transactions, accountFilter, typeFilter, search]);

    const { inflow, outflow, net } = useMemo(() => {
        let inflow = 0;
        let outflow = 0;

        for (const tx of filtered) {
            if (tx.type === "income") inflow += tx.amount;
            else outflow += tx.amount;
        }

        return { inflow, outflow, net: inflow - outflow };
    }, [filtered]);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-8">
                {/* Page header */}
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Transactions
                        </h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Review and filter your recent income and spending.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setModalMode("add");
                            setEditingTx(null);
                            setModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-500 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 shadow-sm hover:bg-emerald-500/20"
                    >
                        <span className="text-base leading-none">+</span>
                        <span>Add transaction</span>
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
                <section className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                        <select
                            value={accountFilter}
                            onChange={(e) =>
                                setAccountFilter(e.target.value as AccountFilter)
                            }
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
                                setTypeFilter(e.target.value as TypeFilter)
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
                            {filtered.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-6 text-center text-slate-500"
                                    >
                                        No transactions match your filters yet.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((tx) => (
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
                                                        setModalMode("edit");
                                                        setEditingTx(tx);
                                                        setModalOpen(true);
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
                                                        const { id, ...cloneInput } = tx; // strip id
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
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <TransactionModal
                open={modalOpen}
                mode={modalMode}
                initial={editingTx ?? undefined}
                onClose={() => setModalOpen(false)}
                onSave={(input) => {
                    if (modalMode === "edit" && editingTx) {
                        updateTransaction(editingTx.id, input);
                    } else {
                        addTransaction(input);
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
