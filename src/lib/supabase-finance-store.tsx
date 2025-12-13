"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth-store";

export type AccountType = "checking" | "savings" | "credit_card" | "cash" | "investment";
export type TransactionType = "income" | "expense";
export type RecurrenceFrequency = "weekly" | "biweekly" | "monthly" | "yearly";

export type Account = {
    id: string;
    user_id: string;
    name: string;
    type: AccountType;
    starting_balance: number;
    balance: number;
    color: string;
    created_at: string;
};

export type Transaction = {
    id: string;
    user_id: string;
    account_id: string;
    payee: string;
    category: string;
    amount: number;
    type: TransactionType;
    date: string;
    notes: string | null;
    created_at: string;
};

export type Budget = {
    id: string;
    user_id: string;
    category: string;
    amount: number;
    color: string;
    created_at: string;
};

export type RecurringTransaction = {
    id: string;
    user_id: string;
    account_id: string;
    payee: string;
    category: string;
    amount: number;
    type: TransactionType;
    frequency: RecurrenceFrequency;
    start_date: string;
    next_due_date: string;
    last_generated_date: string | null;
    is_active: boolean;
    created_at: string;
};

export type AccountInput = {
    name: string;
    type: AccountType;
    starting_balance: number;
    color: string;
};

export type TransactionInput = {
    account_id: string;
    payee: string;
    category: string;
    amount: number;
    type: TransactionType;
    date: string;
    notes?: string;
};

export type BudgetInput = {
    category: string;
    amount: number;
    color: string;
};

export type RecurringInput = {
    account_id: string;
    payee: string;
    category: string;
    amount: number;
    type: TransactionType;
    frequency: RecurrenceFrequency;
    start_date: string;
    next_due_date: string;
    is_active: boolean;
};

type FinanceContextValue = {
    accounts: Account[];
    transactions: Transaction[];
    budgets: Budget[];
    recurringTransactions: RecurringTransaction[];
    loading: boolean;
    addAccount: (input: AccountInput) => Promise<void>;
    updateAccount: (id: string, input: Partial<AccountInput>) => Promise<void>;
    deleteAccount: (id: string) => Promise<void>;
    addTransaction: (input: TransactionInput) => Promise<void>;
    updateTransaction: (id: string, input: Partial<TransactionInput>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    addBudget: (input: BudgetInput) => Promise<void>;
    updateBudget: (id: string, input: Partial<BudgetInput>) => Promise<void>;
    deleteBudget: (id: string) => Promise<void>;
    getCategorySpending: (category: string) => number;
    getBudgetProgress: () => Array<{ budget: Budget; spent: number; remaining: number; percentage: number; isOver: boolean }>;
    addRecurringTransaction: (input: RecurringInput) => Promise<void>;
    updateRecurringTransaction: (id: string, input: Partial<RecurringInput>) => Promise<void>;
    deleteRecurringTransaction: (id: string) => Promise<void>;
    toggleRecurringTransaction: (id: string) => Promise<void>;
    markAsPaid: (recurringId: string) => Promise<void>;
    skipNextOccurrence: (recurringId: string) => Promise<void>;
    getUpcomingRecurring: () => RecurringTransaction[];
    refreshData: () => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function SupabaseFinanceProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshData = useCallback(async () => {
        if (!user) {
            setAccounts([]);
            setTransactions([]);
            setBudgets([]);
            setRecurringTransactions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [accountsRes, transactionsRes, budgetsRes, recurringRes] = await Promise.all([
                supabase.from("accounts").select("*").eq("user_id", user.id).order("created_at"),
                supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }),
                supabase.from("budgets").select("*").eq("user_id", user.id).order("created_at"),
                supabase.from("recurring_transactions").select("*").eq("user_id", user.id).order("next_due_date"),
            ]);

            if (accountsRes.data) setAccounts(accountsRes.data);
            if (transactionsRes.data) setTransactions(transactionsRes.data);
            if (budgetsRes.data) setBudgets(budgetsRes.data);
            if (recurringRes.data) setRecurringTransactions(recurringRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        refreshData();

        if (!user) return;

        // Set up real-time subscriptions
        const accountsChannel = supabase
            .channel('accounts-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${user.id}` }, () => {
                refreshData();
            })
            .subscribe();

        const transactionsChannel = supabase
            .channel('transactions-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, () => {
                refreshData();
            })
            .subscribe();

        const budgetsChannel = supabase
            .channel('budgets-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${user.id}` }, () => {
                refreshData();
            })
            .subscribe();

        const recurringChannel = supabase
            .channel('recurring-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'recurring_transactions', filter: `user_id=eq.${user.id}` }, () => {
                refreshData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(accountsChannel);
            supabase.removeChannel(transactionsChannel);
            supabase.removeChannel(budgetsChannel);
            supabase.removeChannel(recurringChannel);
        };
    }, [refreshData, user]);
    async function addAccount(input: AccountInput) {
        if (!user) return;
        console.log("Adding account input:", JSON.stringify(input));
        console.log("User ID:", user.id);

        const insertData = {
            name: input.name,
            type: input.type,
            starting_balance: input.starting_balance,
            balance: input.starting_balance,
            color: input.color,
            user_id: user.id,
        };
        console.log("Insert data:", JSON.stringify(insertData));

        const { data, error } = await supabase.from("accounts").insert(insertData);

        if (error) {
            console.error("Error adding account:", JSON.stringify(error));
            console.error("Error message:", error.message);
            console.error("Error details:", error.details);
            console.error("Error hint:", error.hint);
        } else {
            console.log("Account added:", data);
            refreshData();
        }
    }

    async function updateAccount(id: string, input: Partial<AccountInput>) {
        await supabase.from("accounts").update(input).eq("id", id);
        refreshData();
    }

    async function deleteAccount(id: string) {
        await supabase.from("accounts").delete().eq("id", id);
        refreshData();
    }

    async function addTransaction(input: TransactionInput) {
        if (!user) return;
        await supabase.from("transactions").insert({ ...input, user_id: user.id });
        refreshData();
    }

    async function updateTransaction(id: string, input: Partial<TransactionInput>) {
        await supabase.from("transactions").update(input).eq("id", id);
        refreshData();
    }

    async function deleteTransaction(id: string) {
        await supabase.from("transactions").delete().eq("id", id);
        refreshData();
    }

    async function addBudget(input: BudgetInput) {
        if (!user) return;
        await supabase.from("budgets").insert({ ...input, user_id: user.id });
        refreshData();
    }

    async function updateBudget(id: string, input: Partial<BudgetInput>) {
        await supabase.from("budgets").update(input).eq("id", id);
        refreshData();
    }

    async function deleteBudget(id: string) {
        await supabase.from("budgets").delete().eq("id", id);
        refreshData();
    }

    function getCategorySpending(category: string): number {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

        return transactions
            .filter(
                (tx) =>
                    tx.type === "expense" &&
                    tx.category.toLowerCase() === category.toLowerCase() &&
                    tx.date >= startOfMonth &&
                    tx.date <= endOfMonth
            )
            .reduce((sum, tx) => sum + tx.amount, 0);
    }

    function getBudgetProgress() {
        return budgets.map((budget) => {
            const spent = getCategorySpending(budget.category);
            const remaining = budget.amount - spent;
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            return { budget, spent, remaining, percentage, isOver: spent > budget.amount };
        });
    }

    async function addRecurringTransaction(input: RecurringInput) {
        if (!user) return;
        await supabase.from("recurring_transactions").insert({ ...input, user_id: user.id });
        refreshData();
    }

    async function updateRecurringTransaction(id: string, input: Partial<RecurringInput>) {
        await supabase.from("recurring_transactions").update(input).eq("id", id);
        refreshData();
    }

    async function deleteRecurringTransaction(id: string) {
        await supabase.from("recurring_transactions").delete().eq("id", id);
        refreshData();
    }

    async function toggleRecurringTransaction(id: string) {
        const recurring = recurringTransactions.find((r) => r.id === id);
        if (!recurring) return;
        await supabase.from("recurring_transactions").update({ is_active: !recurring.is_active }).eq("id", id);
        refreshData();
    }

    function calculateNextDueDate(currentDate: string, frequency: RecurrenceFrequency): string {
        const date = new Date(currentDate);
        switch (frequency) {
            case "weekly": date.setDate(date.getDate() + 7); break;
            case "biweekly": date.setDate(date.getDate() + 14); break;
            case "monthly": date.setMonth(date.getMonth() + 1); break;
            case "yearly": date.setFullYear(date.getFullYear() + 1); break;
        }
        return date.toISOString().slice(0, 10);
    }

    async function markAsPaid(recurringId: string) {
        if (!user) return;
        const recurring = recurringTransactions.find((r) => r.id === recurringId);
        if (!recurring) return;

        await supabase.from("transactions").insert({
            user_id: user.id,
            account_id: recurring.account_id,
            payee: recurring.payee,
            category: recurring.category,
            amount: recurring.amount,
            type: recurring.type,
            date: recurring.next_due_date,
            notes: `Auto-generated from recurring: ${recurring.payee}`,
        });

        const nextDue = calculateNextDueDate(recurring.next_due_date, recurring.frequency);
        await supabase.from("recurring_transactions").update({
            next_due_date: nextDue,
            last_generated_date: recurring.next_due_date,
        }).eq("id", recurringId);

        refreshData();
    }

    async function skipNextOccurrence(recurringId: string) {
        const recurring = recurringTransactions.find((r) => r.id === recurringId);
        if (!recurring) return;
        const nextDue = calculateNextDueDate(recurring.next_due_date, recurring.frequency);
        await supabase.from("recurring_transactions").update({ next_due_date: nextDue }).eq("id", recurringId);
        refreshData();
    }

    function getUpcomingRecurring(): RecurringTransaction[] {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().slice(0, 10);
        return recurringTransactions.filter((rt) => rt.is_active && rt.next_due_date <= nextWeekStr);
    }

    const value: FinanceContextValue = {
        accounts,
        transactions,
        budgets,
        recurringTransactions,
        loading,
        addAccount,
        updateAccount,
        deleteAccount,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addBudget,
        updateBudget,
        deleteBudget,
        getCategorySpending,
        getBudgetProgress,
        addRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
        toggleRecurringTransaction,
        markAsPaid,
        skipNextOccurrence,
        getUpcomingRecurring,
        refreshData,
    };

    return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useSupabaseFinance() {
    const ctx = useContext(FinanceContext);
    if (!ctx) throw new Error("useSupabaseFinance must be used within SupabaseFinanceProvider");
    return ctx;
}