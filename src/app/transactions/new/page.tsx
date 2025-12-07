"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type TransactionType = "income" | "expense";

type NewTransactionForm = {
    date: string;
    payee: string;
    category: string;
    account: string;
    amount: string;
    type: TransactionType;
};

const accounts = ["Checking", "Savings", "Credit Card"];

export default function NewTransactionPage() {
    const [form, setForm] = useState<NewTransactionForm>({
        date: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
        payee: "",
        category: "",
        account: "Checking",
        amount: "",
        type: "expense",
    });

    function handleChange<K extends keyof NewTransactionForm>(
        key: K,
        value: NewTransactionForm[K]
    ) {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        // For now just log it – later this will call an API / DB
        const parsedAmount = parseFloat(form.amount || "0");

        console.log("New transaction:", {
            ...form,
            amount: parsedAmount,
        });

        alert("Transaction captured in the UI. Backend saving will come in Phase 2.");

        // optional: simple reset
        setForm((prev) => ({
            ...prev,
            payee: "",
            category: "",
            amount: "",
        }));
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
            <div className="mx-auto max-w-3xl px-4 py-8">
                {/* Top bar */}
                <header className="mb-6 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                            Transactions
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                            Add Transaction
                        </h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Record a new income or expense into your personal finance tracker.
                        </p>
                    </div>

                    <Link
                        href="/transactions"
                        className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                    >
                        ← Back to transactions
                    </Link>
                </header>

                {/* Form card */}
                <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Row 1: date + type */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-200">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => handleChange("date", e.target.value)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                <span className="block text-sm font-medium text-slate-200">
                  Type
                </span>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleChange("type", "expense")}
                                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                            form.type === "expense"
                                                ? "border-rose-500 bg-rose-500/10 text-rose-200"
                                                : "border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900"
                                        }`}
                                    >
                                        Expense
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleChange("type", "income")}
                                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                            form.type === "income"
                                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                                                : "border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900"
                                        }`}
                                    >
                                        Income
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: payee + category */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-200">
                                    Payee
                                </label>
                                <input
                                    type="text"
                                    placeholder="Kroger, Rent, Paycheck..."
                                    value={form.payee}
                                    onChange={(e) => handleChange("payee", e.target.value)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-200">
                                    Category
                                </label>
                                <input
                                    type="text"
                                    placeholder="Groceries, Salary, Rent..."
                                    value={form.category}
                                    onChange={(e) => handleChange("category", e.target.value)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                        </div>

                        {/* Row 3: account + amount */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-200">
                                    Account
                                </label>
                                <select
                                    value={form.account}
                                    onChange={(e) => handleChange("account", e.target.value)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                    {accounts.map((acc) => (
                                        <option key={acc} value={acc}>
                                            {acc}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-200">
                                    Amount (USD)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={form.amount}
                                    onChange={(e) => handleChange("amount", e.target.value)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    required
                                />
                                <p className="text-xs text-slate-500">
                                    You chose{" "}
                                    <span className="font-semibold">
                    {form.type === "expense" ? "Expense" : "Income"}
                  </span>
                                    , so we’ll treat this as{" "}
                                    {form.type === "expense" ? "money going out." : "money coming in."}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex items-center justify-end gap-3">
                            <Link
                                href="/transactions"
                                className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                className="rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-400"
                            >
                                Save transaction (UI only)
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}
