"use client";

import { useState } from "react";
import { useSupabaseFinance, RecurringInput, RecurrenceFrequency, TransactionType } from "@/lib/supabase-finance-store";

function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function RecurringPage() {
    const { accounts, recurringTransactions, addRecurringTransaction, deleteRecurringTransaction, toggleRecurringTransaction, markAsPaid, skipNextOccurrence } = useSupabaseFinance();
    const [showForm, setShowForm] = useState(false);
    const [payee, setPayee] = useState("");
    const [category, setCategory] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<TransactionType>("expense");
    const [frequency, setFrequency] = useState<RecurrenceFrequency>("monthly");
    const [accountId, setAccountId] = useState("");
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!payee || !amount || !accountId) return;

        const input: RecurringInput = {
            payee,
            category: category || "Uncategorized",
            amount: parseFloat(amount),
            type,
            frequency,
            account_id: accountId,
            start_date: startDate,
            next_due_date: startDate,
            is_active: true,
        };

        await addRecurringTransaction(input);
        setShowForm(false);
        setPayee("");
        setCategory("");
        setAmount("");
        setType("expense");
        setFrequency("monthly");
        setAccountId("");
        setStartDate(new Date().toISOString().slice(0, 10));
    }

    const today = new Date().toISOString().slice(0, 10);

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-50">Recurring Transactions</h1>
                    <p className="text-sm text-slate-400">Manage your recurring bills and income</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
                >
                    {showForm ? "Cancel" : "+ Add Recurring"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Payee</label>
                            <input
                                type="text"
                                value={payee}
                                onChange={(e) => setPayee(e.target.value)}
                                required
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                placeholder="e.g., Netflix"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                placeholder="e.g., Entertainment"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Account</label>
                            <select
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                required
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                            >
                                <option value="">Select account</option>
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as TransactionType)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                            >
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Frequency</label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                            >
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Biweekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
                    >
                        Add Recurring Transaction
                    </button>
                </form>
            )}

            {recurringTransactions.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <p>No recurring transactions yet.</p>
                    <p className="text-sm mt-1">Add your first recurring bill or income.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {recurringTransactions.map((rt) => {
                        const account = accounts.find((a) => a.id === rt.account_id);
                        const isDue = rt.next_due_date <= today;

                        return (
                            <div
                                key={rt.id}
                                className={`rounded-xl border bg-slate-900 p-4 ${isDue ? "border-amber-500/50" : "border-slate-800"} ${!rt.is_active ? "opacity-50" : ""}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-100">{rt.payee}</span>
                                            {isDue && rt.is_active && (
                                                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">Due</span>
                                            )}
                                            {!rt.is_active && (
                                                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-400">Paused</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-400">
                                            {rt.category} • {rt.frequency} • {account?.name || "Unknown"}
                                        </p>
                                        <p className="text-xs text-slate-500">Next: {rt.next_due_date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${rt.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                                            {rt.type === "income" ? "+" : "-"}{formatCurrency(rt.amount)}
                                        </p>
                                        <div className="flex gap-1 mt-2">
                                            {rt.is_active && (
                                                <>
                                                    <button
                                                        onClick={() => markAsPaid(rt.id)}
                                                        className="rounded px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                                    >
                                                        Pay
                                                    </button>
                                                    <button
                                                        onClick={() => skipNextOccurrence(rt.id)}
                                                        className="rounded px-2 py-1 text-xs bg-slate-700 text-slate-300 hover:bg-slate-600"
                                                    >
                                                        Skip
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => toggleRecurringTransaction(rt.id)}
                                                className="rounded px-2 py-1 text-xs bg-slate-700 text-slate-300 hover:bg-slate-600"
                                            >
                                                {rt.is_active ? "Pause" : "Resume"}
                                            </button>
                                            <button
                                                onClick={() => deleteRecurringTransaction(rt.id)}
                                                className="rounded px-2 py-1 text-xs bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}