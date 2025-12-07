// src/app/page.tsx
"use client";

import { useFinance } from "@/lib/finance-store";
import { useMemo } from "react";

function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
}

export default function DashboardPage() {
    const { accounts, transactions } = useFinance();

    const { totalBalance, totalIncome, totalExpenses, recentTransactions } =
        useMemo(() => {
            const totalBalance = accounts.reduce(
                (sum, acc) => sum + acc.balance,
                0,
            );

            const totalIncome = transactions
                .filter((t) => t.type === "income")
                .reduce((sum, t) => sum + t.amount, 0);

            const totalExpenses = transactions
                .filter((t) => t.type === "expense")
                .reduce((sum, t) => sum + t.amount, 0);

            const recentTransactions = [...transactions]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 5);

            return {
                totalBalance,
                totalIncome,
                totalExpenses: -totalExpenses, // show as negative
                recentTransactions,
            };
        }, [accounts, transactions]);

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
                            <h2 className="text-sm font-semibold text-slate-100">
                                Accounts
                            </h2>
                            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                {accounts.length} total
              </span>
                        </div>

                        <div className="space-y-3">
                            {accounts.map((acc) => (
                                <div
                                    key={acc.id}
                                    className="flex items-center justify-between rounded-lg border border-slate-800/70 bg-slate-950/70 px-3 py-3"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-slate-100">
                                            {acc.name}
                                        </p>
                                        <p className="text-xs uppercase tracking-wide text-slate-500">
                                            {acc.type}
                                        </p>
                                    </div>
                                    <p
                                        className={`text-sm font-semibold ${
                                            acc.balance < 0
                                                ? "text-rose-300"
                                                : "text-emerald-300"
                                        }`}
                                    >
                                        {formatCurrency(acc.balance)}
                                    </p>
                                </div>
                            ))}
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
                                    </tr>
                                ))}

                                {recentTransactions.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
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
            </div>
        </main>
    );
}
