// src/app/transactions/page.tsx
"use client";

import { useMemo, useState, FormEvent } from "react";
import { useFinance } from "@/lib/finance-store";

type TransactionType = "income" | "expense";

const accountOptions = ["All accounts", "Checking", "Savings", "Credit Card"] as const;
const typeOptions = ["All", "Income", "Expense"] as const;

function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
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
};

function AddTransactionModal({ open, onClose, onSave }: AddTransactionModalProps) {
    const [form, setForm] = useState<AddTransactionInput>({
        date: new Date().toISOString().slice(0, 10),
        payee: "",
        category: "",
        account: "Checking",
        amount: 0,
        type: "expense",
    });

    if (!open) return null;

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
        // reset payee/category/amount for next time
        setForm((prev) => ({
            ...prev,
            payee: "",
            category: "",
            amount: 0,
        }));
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur">
            <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-slate-50">
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
                            Save transaction
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ---------- Transactions Page ---------- */

export default function TransactionsPage() {
    const { transactions, addTransaction } = useFinance();
    const [accountFilter, setAccountFilter] =
        useState<(typeof accountOptions)[number]>("All accounts");
    const [typeFilter, setTypeFilter] =
        useState<(typeof typeOptions)[number]>("All");
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);

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
                        onClick={() => setModalOpen(true)}
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
                <section className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                        <select
                            value={accountFilter}
                            onChange={(e) =>
                                setAccountFilter(
                                    e.target.value as (typeof accountOptions)[number]
                                )
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
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
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
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <AddTransactionModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={(input) => {
                    // assumes useFinance exposes addTransaction(input)
                    addTransaction(input);
                }}
            />
        </main>
    );
}
