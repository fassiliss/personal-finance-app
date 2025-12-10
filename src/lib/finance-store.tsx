// src/lib/finance-store.tsx
"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

export type TransactionType = "income" | "expense";
export type AccountType = "bank" | "credit";
export type RecurrenceFrequency = "weekly" | "biweekly" | "monthly" | "yearly";

export type Account = {
    id: string;
    name: string;
    type: AccountType;
    startingBalance: number;
    balance: number;
};

export type Transaction = {
    id: string;
    date: string;
    payee: string;
    category: string;
    account: string;
    amount: number;
    type: TransactionType;
    recurringId?: string; // Links to the recurring transaction that generated this
};

export type TransactionInput = Omit<Transaction, "id">;

export type AddAccountInput = {
    name: string;
    type: AccountType;
    startingBalance: number;
};

export type Budget = {
    id: string;
    category: string;
    amount: number;
    color: string;
};

export type BudgetInput = Omit<Budget, "id">;

// Recurring Transaction types
export type RecurringTransaction = {
    id: string;
    payee: string;
    category: string;
    account: string;
    amount: number;
    type: TransactionType;
    frequency: RecurrenceFrequency;
    startDate: string; // When the recurrence starts
    nextDueDate: string; // Next date this should be generated
    lastGeneratedDate?: string; // Last time a transaction was generated
    isActive: boolean;
};

export type RecurringTransactionInput = Omit<RecurringTransaction, "id" | "lastGeneratedDate">;

type FinanceState = {
    accounts: Account[];
    transactions: Transaction[];
    budgets: Budget[];
    recurringTransactions: RecurringTransaction[];
};

type FinanceContextValue = FinanceState & {
    addTransaction: (input: TransactionInput) => void;
    updateTransaction: (id: string, input: TransactionInput) => void;
    deleteTransaction: (id: string) => void;

    addAccount: (input: AddAccountInput) => void;
    updateAccount: (id: string, updates: Partial<Pick<Account, "name" | "type">>) => void;
    deleteAccount: (id: string) => void;

    addBudget: (input: BudgetInput) => void;
    updateBudget: (id: string, input: BudgetInput) => void;
    deleteBudget: (id: string) => void;

    getCategorySpending: (category: string) => number;
    getBudgetProgress: () => Array<{
        budget: Budget;
        spent: number;
        remaining: number;
        percentage: number;
        isOver: boolean;
    }>;

    // Recurring transaction methods
    addRecurringTransaction: (input: RecurringTransactionInput) => void;
    updateRecurringTransaction: (id: string, input: Partial<RecurringTransactionInput>) => void;
    deleteRecurringTransaction: (id: string) => void;
    toggleRecurringTransaction: (id: string) => void;
    generateDueTransactions: () => Transaction[];
    markAsPaid: (recurringId: string) => void;
    skipNextOccurrence: (recurringId: string) => void;
    getUpcomingRecurring: () => RecurringTransaction[];

    resetAll: () => void;
};

const STORAGE_KEY = "pf-finance-state-v3";

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

const BUDGET_COLORS = [
    "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
    "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

const defaultState: FinanceState = {
    accounts: [
        { id: "acc-checking", name: "Checking", type: "bank", startingBalance: 0, balance: 0 },
        { id: "acc-savings", name: "Savings", type: "bank", startingBalance: 0, balance: 0 },
        { id: "acc-credit", name: "Credit Card", type: "credit", startingBalance: 0, balance: 0 },
    ],
    transactions: [],
    budgets: [],
    recurringTransactions: [],
};

function recomputeBalances(state: FinanceState): FinanceState {
    const deltas = new Map<string, number>();
    for (const tx of state.transactions) {
        const sign = tx.type === "income" ? 1 : -1;
        deltas.set(tx.account, (deltas.get(tx.account) ?? 0) + sign * tx.amount);
    }
    const accounts: Account[] = state.accounts.map((acc) => {
        const starting = typeof acc.startingBalance === "number" ? acc.startingBalance : acc.balance ?? 0;
        const delta = deltas.get(acc.name) ?? 0;
        return { ...acc, startingBalance: starting, balance: starting + delta };
    });
    return { ...state, accounts };
}

// Calculate next due date based on frequency
function calculateNextDueDate(currentDate: string, frequency: RecurrenceFrequency): string {
    const date = new Date(currentDate);
    switch (frequency) {
        case "weekly":
            date.setDate(date.getDate() + 7);
            break;
        case "biweekly":
            date.setDate(date.getDate() + 14);
            break;
        case "monthly":
            date.setMonth(date.getMonth() + 1);
            break;
        case "yearly":
            date.setFullYear(date.getFullYear() + 1);
            break;
    }
    return date.toISOString().slice(0, 10);
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<FinanceState>(() => recomputeBalances(defaultState));

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            // Try current version first
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as FinanceState;
                setState(recomputeBalances({
                    ...parsed,
                    budgets: parsed.budgets || [],
                    recurringTransactions: parsed.recurringTransactions || [],
                }));
                return;
            }
            // Try older versions for migration
            const oldRaw = window.localStorage.getItem("pf-finance-state-v2") || window.localStorage.getItem("pf-finance-state-v1");
            if (oldRaw) {
                const parsed = JSON.parse(oldRaw) as FinanceState;
                setState(recomputeBalances({
                    ...parsed,
                    budgets: parsed.budgets || [],
                    recurringTransactions: [],
                }));
            }
        } catch {
            // ignore bad data
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
            // ignore storage errors
        }
    }, [state]);

    const value = useMemo<FinanceContextValue>(() => {
        function withRecompute(updater: (prev: FinanceState) => FinanceState) {
            setState((prev) => recomputeBalances(updater(prev)));
        }

        function getCategorySpending(category: string): number {
            const now = new Date();
            const thisYear = now.getFullYear();
            const thisMonth = now.getMonth();
            return state.transactions
                .filter((tx) => {
                    if (tx.type !== "expense") return false;
                    if (tx.category.toLowerCase() !== category.toLowerCase()) return false;
                    const d = new Date(tx.date);
                    return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
                })
                .reduce((sum, tx) => sum + tx.amount, 0);
        }

        function getBudgetProgress() {
            return state.budgets.map((budget) => {
                const spent = getCategorySpending(budget.category);
                const remaining = budget.amount - spent;
                const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                return { budget, spent, remaining, percentage: Math.min(percentage, 100), isOver: spent > budget.amount };
            });
        }

        function getUpcomingRecurring(): RecurringTransaction[] {
            const today = new Date().toISOString().slice(0, 10);
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            const nextWeekStr = nextWeek.toISOString().slice(0, 10);

            return state.recurringTransactions
                .filter((rt) => rt.isActive && rt.nextDueDate <= nextWeekStr)
                .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
        }

        return {
            ...state,

            addTransaction(input) {
                withRecompute((prev) => ({
                    ...prev,
                    transactions: [
                        { id: crypto.randomUUID?.() || `tx-${Date.now()}`, ...input },
                        ...prev.transactions,
                    ],
                }));
            },

            updateTransaction(id, input) {
                withRecompute((prev) => ({
                    ...prev,
                    transactions: prev.transactions.map((tx) => (tx.id === id ? { ...tx, ...input } : tx)),
                }));
            },

            deleteTransaction(id) {
                withRecompute((prev) => ({
                    ...prev,
                    transactions: prev.transactions.filter((tx) => tx.id !== id),
                }));
            },

            addAccount(input) {
                withRecompute((prev) => {
                    if (prev.accounts.some((a) => a.name.toLowerCase() === input.name.toLowerCase())) return prev;
                    return {
                        ...prev,
                        accounts: [...prev.accounts, {
                            id: crypto.randomUUID?.() || `acc-${Date.now()}`,
                            name: input.name,
                            type: input.type,
                            startingBalance: input.startingBalance,
                            balance: input.startingBalance,
                        }],
                    };
                });
            },

            updateAccount(id, updates) {
                withRecompute((prev) => ({
                    ...prev,
                    accounts: prev.accounts.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc)),
                }));
            },

            deleteAccount(id) {
                withRecompute((prev) => {
                    const target = prev.accounts.find((a) => a.id === id);
                    if (!target || prev.transactions.some((tx) => tx.account === target.name)) return prev;
                    return { ...prev, accounts: prev.accounts.filter((a) => a.id !== id) };
                });
            },

            addBudget(input) {
                setState((prev) => {
                    if (prev.budgets.some((b) => b.category.toLowerCase() === input.category.toLowerCase())) return prev;
                    return {
                        ...prev,
                        budgets: [...prev.budgets, {
                            id: crypto.randomUUID?.() || `budget-${Date.now()}`,
                            ...input,
                            color: input.color || BUDGET_COLORS[prev.budgets.length % BUDGET_COLORS.length],
                        }],
                    };
                });
            },

            updateBudget(id, input) {
                setState((prev) => ({
                    ...prev,
                    budgets: prev.budgets.map((b) => (b.id === id ? { ...b, ...input } : b)),
                }));
            },

            deleteBudget(id) {
                setState((prev) => ({ ...prev, budgets: prev.budgets.filter((b) => b.id !== id) }));
            },

            getCategorySpending,
            getBudgetProgress,

            // Recurring transaction methods
            addRecurringTransaction(input) {
                setState((prev) => ({
                    ...prev,
                    recurringTransactions: [...prev.recurringTransactions, {
                        id: crypto.randomUUID?.() || `recurring-${Date.now()}`,
                        ...input,
                    }],
                }));
            },

            updateRecurringTransaction(id, input) {
                setState((prev) => ({
                    ...prev,
                    recurringTransactions: prev.recurringTransactions.map((rt) =>
                        rt.id === id ? { ...rt, ...input } : rt
                    ),
                }));
            },

            deleteRecurringTransaction(id) {
                setState((prev) => ({
                    ...prev,
                    recurringTransactions: prev.recurringTransactions.filter((rt) => rt.id !== id),
                }));
            },

            toggleRecurringTransaction(id) {
                setState((prev) => ({
                    ...prev,
                    recurringTransactions: prev.recurringTransactions.map((rt) =>
                        rt.id === id ? { ...rt, isActive: !rt.isActive } : rt
                    ),
                }));
            },

            generateDueTransactions() {
                const today = new Date().toISOString().slice(0, 10);
                const generated: Transaction[] = [];

                setState((prev) => {
                    const newTransactions: Transaction[] = [];
                    const updatedRecurring = prev.recurringTransactions.map((rt) => {
                        if (!rt.isActive || rt.nextDueDate > today) return rt;

                        // Generate transaction
                        const newTx: Transaction = {
                            id: crypto.randomUUID?.() || `tx-${Date.now()}-${Math.random()}`,
                            date: rt.nextDueDate,
                            payee: rt.payee,
                            category: rt.category,
                            account: rt.account,
                            amount: rt.amount,
                            type: rt.type,
                            recurringId: rt.id,
                        };
                        newTransactions.push(newTx);
                        generated.push(newTx);

                        // Update recurring with next due date
                        return {
                            ...rt,
                            lastGeneratedDate: rt.nextDueDate,
                            nextDueDate: calculateNextDueDate(rt.nextDueDate, rt.frequency),
                        };
                    });

                    if (newTransactions.length === 0) return prev;

                    return recomputeBalances({
                        ...prev,
                        transactions: [...newTransactions, ...prev.transactions],
                        recurringTransactions: updatedRecurring,
                    });
                });

                return generated;
            },

            markAsPaid(recurringId) {
                const today = new Date().toISOString().slice(0, 10);

                setState((prev) => {
                    const rt = prev.recurringTransactions.find((r) => r.id === recurringId);
                    if (!rt) return prev;

                    // Create the transaction
                    const newTx: Transaction = {
                        id: crypto.randomUUID?.() || `tx-${Date.now()}`,
                        date: today,
                        payee: rt.payee,
                        category: rt.category,
                        account: rt.account,
                        amount: rt.amount,
                        type: rt.type,
                        recurringId: rt.id,
                    };

                    // Update next due date
                    const updatedRecurring = prev.recurringTransactions.map((r) =>
                        r.id === recurringId
                            ? { ...r, lastGeneratedDate: today, nextDueDate: calculateNextDueDate(rt.nextDueDate, rt.frequency) }
                            : r
                    );

                    return recomputeBalances({
                        ...prev,
                        transactions: [newTx, ...prev.transactions],
                        recurringTransactions: updatedRecurring,
                    });
                });
            },

            skipNextOccurrence(recurringId) {
                setState((prev) => ({
                    ...prev,
                    recurringTransactions: prev.recurringTransactions.map((rt) =>
                        rt.id === recurringId
                            ? { ...rt, nextDueDate: calculateNextDueDate(rt.nextDueDate, rt.frequency) }
                            : rt
                    ),
                }));
            },

            getUpcomingRecurring,

            resetAll() {
                setState(recomputeBalances(defaultState));
                if (typeof window !== "undefined") {
                    try {
                        window.localStorage.removeItem(STORAGE_KEY);
                        window.localStorage.removeItem("pf-finance-state-v2");
                        window.localStorage.removeItem("pf-finance-state-v1");
                    } catch {}
                }
            },
        };
    }, [state]);

    return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
    const ctx = useContext(FinanceContext);
    if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
    return ctx;
}