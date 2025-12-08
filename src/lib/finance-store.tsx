// src/lib/finance-store.ts
"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type TransactionType = "income" | "expense";

export type TransactionInput = {
    date: string;
    payee: string;
    category: string;
    account: string; // "Checking" | "Savings" | "Credit Card"
    amount: number;
    type: TransactionType;
};

export type Transaction = TransactionInput & {
    id: string;
};

export type Account = {
    id: string;
    name: string; // "Checking", "Savings", "Credit Card"
    type: "bank" | "card";
    balance: number;
};

type FinanceState = {
    accounts: Account[];
    transactions: Transaction[];
};

type FinanceContextValue = FinanceState & {
    addTransaction: (input: TransactionInput) => void;
    updateTransaction: (id: string, input: TransactionInput) => void;
    deleteTransaction: (id: string) => void;
    resetAll: () => void;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

const STORAGE_KEY = "personal-finance-app:v1";

const defaultState: FinanceState = {
    accounts: [
        { id: "checking", name: "Checking", type: "bank", balance: 0 },
        { id: "savings", name: "Savings", type: "bank", balance: 0 },
        { id: "credit-card", name: "Credit Card", type: "card", balance: 0 },
    ],
    transactions: [],
};

export function FinanceProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<FinanceState>(defaultState);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on client after hydration
    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === "object") {
                    const accounts = Array.isArray(parsed.accounts)
                        ? parsed.accounts
                        : defaultState.accounts;
                    const transactions = Array.isArray(parsed.transactions)
                        ? parsed.transactions
                        : [];
                    setState({ accounts, transactions });
                }
            }
        } catch {
            // ignore, keep default
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Persist to localStorage once loaded
    useEffect(() => {
        if (!isLoaded) return;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
            // ignore
        }
    }, [state, isLoaded]);

    const addTransaction = (input: TransactionInput) => {
        setState((prev) => {
            const id =
                typeof crypto !== "undefined" && crypto.randomUUID
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

            const tx: Transaction = { id, ...input };

            const updatedAccounts = prev.accounts.map((acc) => {
                if (acc.name !== input.account) return acc;

                const delta =
                    input.type === "income" ? input.amount : -input.amount;

                return { ...acc, balance: acc.balance + delta };
            });

            return {
                accounts: updatedAccounts,
                transactions: [tx, ...prev.transactions],
            };
        });
    };

    const updateTransaction = (id: string, input: TransactionInput) => {
        setState((prev) => {
            const existing = prev.transactions.find((t) => t.id === id);
            if (!existing) return prev;

            const updatedAccounts = prev.accounts.map((acc) => {
                let balance = acc.balance;

                // revert old effect
                if (acc.name === existing.account) {
                    const oldDelta =
                        existing.type === "income"
                            ? existing.amount
                            : -existing.amount;
                    balance -= oldDelta;
                }

                // apply new effect
                if (acc.name === input.account) {
                    const newDelta =
                        input.type === "income" ? input.amount : -input.amount;
                    balance += newDelta;
                }

                return { ...acc, balance };
            });

            const updatedTransactions = prev.transactions.map((t) =>
                t.id === id ? { ...t, ...input } : t,
            );

            return {
                accounts: updatedAccounts,
                transactions: updatedTransactions,
            };
        });
    };

    const deleteTransaction = (id: string) => {
        setState((prev) => {
            const existing = prev.transactions.find((t) => t.id === id);
            if (!existing) return prev;

            const updatedAccounts = prev.accounts.map((acc) => {
                if (acc.name !== existing.account) return acc;

                const delta =
                    existing.type === "income"
                        ? existing.amount
                        : -existing.amount;

                // undo the original delta
                return { ...acc, balance: acc.balance - delta };
            });

            const remaining = prev.transactions.filter((t) => t.id !== id);

            return {
                accounts: updatedAccounts,
                transactions: remaining,
            };
        });
    };

    const resetAll = () => {
        setState(defaultState);
    };

    if (!isLoaded) {
        return null;
    }

    return (
        <FinanceContext.Provider
            value={{
                ...state,
                addTransaction,
                updateTransaction,
                deleteTransaction,
                resetAll,
            }}
        >
            {children}
        </FinanceContext.Provider>
    );
}

export function useFinance() {
    const ctx = useContext(FinanceContext);
    if (!ctx) {
        throw new Error("useFinance must be used within a FinanceProvider");
    }
    return ctx;
}
