"use client";

import { useMemo, useState } from "react";

type TransactionType = "income" | "expense";

type Transaction = {
    id: string;
    date: string; // ISO or yyyy-mm-dd
    payee: string;
    category: string;
    account: string;
    amount: number; // positive number
    type: TransactionType;
};

const MOCK_TRANSACTIONS: Transaction[] = [
    {
        id: "1",
        date: "2025-11-01",
        payee: "Kroger",
        category: "Groceries",
        account: "Checking",
        amount: 82.35,
        type: "expense",
    },
    {
        id: "2",
        date: "2025-11-02",
        payee: "United Airlines Payroll",
        category: "Salary",
        account: "Checking",
        amount: 1850,
        type: "income",
    },
    {
        id: "3",
        date: "2025-11-03",
        payee: "Starbucks",
        category: "Eating Out",
        account: "Credit Card",
        amount: 6.75,
        type: "expense",
    },
    {
        id: "4",
        date: "2025-11-04",
        payee: "Rent",
        category: "Housing",
        account: "Checking",
        amount: 1200,
        type: "expense",
    },
    {
        id: "5",
        date: "2025-11-05",
        payee: "Amazon",
        category: "Shopping",
        account: "Credit Card",
        amount: 54.99,
        type: "expense",
    },
];

const accounts = ["All accounts", "Checking", "Savings", "Credit Card"] as const;
const types = ["All", "Income", "Expense"] as const;

function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
}

export default function TransactionsPage() {
    const [accountFilter, setAccountFilter] =
        useState<(typeof accounts)[number]>("All accounts");
    const [typeFilter, setTypeFilter] =
        useState<(typeof types)[number]>("All");
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        return MOCK_TRANSACTIONS.filter((tx) => {
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
    }, [accountFilter, typeFilter, search]);

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
            <div className="mx-auto max-w-5xl px-4 py-8">
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
                        className="inline-flex items-center justify-center rounded-lg border border-emerald-500 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 shadow-sm hover:bg-emerald-500/20"
                    >
                        + Add transaction (coming soon)
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
                                setAccountFilter(e.target.value as (typeof accounts)[number])
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:max-w-xs"
                        >
                            {accounts.map((acc) => (
                                <option key={acc} value={acc}>
                                    {acc}
                                </option>
                            ))}
                        </select>

                        <select
                            value={typeFilter}
                            onChange={(e) =>
                                setTypeFilter(e.target.value as (typeof types)[number])
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:max-w-xs"
                        >
                            {types.map((t) => (
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
        </main>
    );
}
