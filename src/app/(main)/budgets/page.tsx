// src/app/budgets/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSupabaseFinance, Budget, BudgetInput } from "@/lib/supabase-finance-store";

function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
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

function AlertIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

/* ---------- Add/Edit Budget Modal ---------- */

const BUDGET_COLORS = [
    { name: "Emerald", value: "#10b981" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Red", value: "#ef4444" },
    { name: "Violet", value: "#8b5cf6" },
    { name: "Pink", value: "#ec4899" },
    { name: "Cyan", value: "#06b6d4" },
    { name: "Orange", value: "#f97316" },
];

const SUGGESTED_CATEGORIES = [
    "Groceries",
    "Dining",
    "Entertainment",
    "Transportation",
    "Shopping",
    "Utilities",
    "Healthcare",
    "Housing",
    "Subscriptions",
    "Travel",
    "Education",
    "Personal Care",
];

type BudgetModalProps = {
    open: boolean;
    budget?: Budget | null;
    existingCategories: string[];
    onClose: () => void;
    onSave: (input: BudgetInput) => void;
};

function BudgetModal({ open, budget, existingCategories, onClose, onSave }: BudgetModalProps) {
    const [form, setForm] = useState<BudgetInput>({
        category: "",
        amount: 0,
        color: BUDGET_COLORS[0].value,
    });

    useEffect(() => {
        if (!open) return;
        if (budget) {
            setForm({ category: budget.category, amount: budget.amount, color: budget.color });
        } else {
            setForm({ category: "", amount: 0, color: BUDGET_COLORS[Math.floor(Math.random() * BUDGET_COLORS.length)].value });
        }
    }, [open, budget]);

    if (!open) return null;

    const isEditing = !!budget;
    const availableSuggestions = SUGGESTED_CATEGORIES.filter(
        (cat) => !existingCategories.includes(cat.toLowerCase()) || cat.toLowerCase() === budget?.category.toLowerCase()
    );

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.category.trim() || form.amount <= 0) return;
        onSave(form);
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-slate-50">{isEditing ? "Edit Budget" : "Add Budget"}</h2>
                <p className="mt-1 text-xs text-slate-400">Set a monthly spending limit for a category.</p>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-300">Category</label>
                        <input
                            type="text"
                            value={form.category}
                            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                            placeholder="e.g., Groceries"
                            disabled={isEditing}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                        />
                        {!isEditing && availableSuggestions.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {availableSuggestions.slice(0, 6).map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setForm((prev) => ({ ...prev, category: cat }))}
                                        className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-300">Monthly Limit (USD)</label>
                        <input
                            type="number"
                            value={form.amount || ""}
                            onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                            step="0.01"
                            min="0"
                            placeholder="500"
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-medium text-slate-300">Color</label>
                        <div className="flex flex-wrap gap-2">
                            {BUDGET_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setForm((prev) => ({ ...prev, color: color.value }))}
                                    className={`h-8 w-8 rounded-full border-2 transition-all ${form.color === color.value ? "border-white scale-110" : "border-transparent"}`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800">Cancel</button>
                        <button type="submit" className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400">{isEditing ? "Save Changes" : "Add Budget"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ---------- Confirm Delete Modal ---------- */

function ConfirmDeleteModal({ open, budgetName, onCancel, onConfirm }: { open: boolean; budgetName: string; onCancel: () => void; onConfirm: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
            <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <h2 className="text-sm font-semibold text-slate-50">Delete budget?</h2>
                <p className="mt-2 text-xs text-slate-400">
                    Remove the budget for <span className="text-slate-200">{budgetName}</span>? This won&apos;t affect your transactions.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={onCancel} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800">Cancel</button>
                    <button type="button" onClick={onConfirm} className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-slate-50 hover:bg-rose-400">Delete</button>
                </div>
            </div>
        </div>
    );
}

/* ---------- Budgets Page ---------- */

export default function BudgetsPage() {
    const { budgets, addBudget, updateBudget, deleteBudget, getBudgetProgress } = useSupabaseFinance();

    const [modalOpen, setModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);

    const budgetProgress = getBudgetProgress();
    const existingCategories = budgets.map((b) => b.category.toLowerCase());

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgetProgress.reduce((sum, bp) => sum + bp.spent, 0);
    const overBudgetCount = budgetProgress.filter((bp) => bp.isOver).length;

    const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

    return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-8">
                {/* Header */}
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Personal Finance</p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Budgets</h1>
                        <p className="mt-1 text-sm text-slate-400">Track your spending limits for {currentMonth}.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setEditingBudget(null); setModalOpen(true); }}
                        className="inline-flex items-center justify-center rounded-lg border border-emerald-500 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 shadow-sm hover:bg-emerald-500/20"
                    >
                        + Add Budget
                    </button>
                </header>

                {/* Summary Cards */}
                <section className="mb-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Budget</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-100">{formatCurrency(totalBudget)}</p>
                        <p className="mt-1 text-xs text-slate-500">{budgets.length} categories</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Spent</p>
                        <p className={`mt-2 text-2xl font-semibold ${totalSpent > totalBudget ? "text-rose-300" : "text-emerald-300"}`}>
                            {formatCurrency(totalSpent)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{formatCurrency(totalBudget - totalSpent)} remaining</p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Over Budget</p>
                        <p className={`mt-2 text-2xl font-semibold ${overBudgetCount > 0 ? "text-rose-300" : "text-emerald-300"}`}>
                            {overBudgetCount}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{overBudgetCount > 0 ? "categories exceeded" : "All on track!"}</p>
                    </div>
                </section>

                {/* Budget List */}
                {budgets.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-center">
                        <p className="text-slate-400">No budgets set yet.</p>
                        <p className="mt-1 text-sm text-slate-500">Create a budget to start tracking your spending.</p>
                        <button
                            type="button"
                            onClick={() => { setEditingBudget(null); setModalOpen(true); }}
                            className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                        >
                            Create your first budget
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {budgetProgress.map(({ budget, spent, remaining, percentage, isOver }) => (
                            <div
                                key={budget.id}
                                className={`rounded-xl border bg-slate-900/70 p-5 ${isOver ? "border-rose-500/50" : "border-slate-800"}`}
                            >
                                <div className="mb-3 flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: budget.color }} />
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-100">{budget.category}</h3>
                                            <p className="text-xs text-slate-500">
                                                {formatCurrency(spent)} of {formatCurrency(budget.amount)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isOver && (
                                            <div className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs text-rose-400">
                                                <AlertIcon className="h-3 w-3" />
                                                <span>Over by {formatCurrency(Math.abs(remaining))}</span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => { setEditingBudget(budget); setModalOpen(true); }}
                                            className="rounded border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                        >
                                            <PencilIcon className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setDeleteTarget(budget); setDeleteModalOpen(true); }}
                                            className="rounded border border-rose-500/60 p-1.5 text-rose-400 hover:bg-rose-500/10"
                                        >
                                            <TrashIcon className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="relative h-3 overflow-hidden rounded-full bg-slate-800">
                                    <div
                                        className={`absolute inset-y-0 left-0 rounded-full transition-all ${isOver ? "bg-rose-500" : ""}`}
                                        style={{
                                            width: `${Math.min(percentage, 100)}%`,
                                            backgroundColor: isOver ? undefined : budget.color,
                                        }}
                                    />
                                    {isOver && (
                                        <div
                                            className="absolute inset-y-0 right-0 animate-pulse bg-rose-500/30"
                                            style={{ width: `${Math.min((spent / budget.amount - 1) * 100, 20)}%` }}
                                        />
                                    )}
                                </div>

                                <div className="mt-2 flex justify-between text-xs">
                                    <span className={`font-medium ${isOver ? "text-rose-400" : "text-slate-400"}`}>
                                        {percentage.toFixed(0)}% used
                                    </span>
                                    <span className={`${remaining < 0 ? "text-rose-400" : "text-slate-500"}`}>
                                        {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <BudgetModal
                open={modalOpen}
                budget={editingBudget}
                existingCategories={existingCategories}
                onClose={() => setModalOpen(false)}
                onSave={(input) => {
                    if (editingBudget) {
                        updateBudget(editingBudget.id, input);
                    } else {
                        addBudget(input);
                    }
                }}
            />

            <ConfirmDeleteModal
                open={deleteModalOpen}
                budgetName={deleteTarget?.category ?? ""}
                onCancel={() => { setDeleteModalOpen(false); setDeleteTarget(null); }}
                onConfirm={() => {
                    if (deleteTarget) deleteBudget(deleteTarget.id);
                    setDeleteTarget(null);
                    setDeleteModalOpen(false);
                }}
            />
        </main>
    );
}