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

// 👇 Add a "type" field so your dashboard's {acc.type} works
export type Account = {
    id: string;
    name: string;      // "Checking", "Savings", "Credit Card"
    type: "bank" | "card";
    balance: number;
};

type FinanceState = {
    accounts: Account[];
    transactions: Transaction[];
};

type FinanceContextValue = FinanceState & {
    addTransaction: (input: TransactionInput) => void;
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

    // 1) Load from localStorage on client AFTER hydration
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
            // ignore and keep defaultState
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // 2) Persist to localStorage once we are loaded
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

    const resetAll = () => {
        setState(defaultState);
    };

    // 3) Avoid hydration mismatch: don't render children until we know the client state
    if (!isLoaded) {
        return null; // optional: put a small loading spinner here
    }

    return (
        <FinanceContext.Provider
            value={{
                ...state,
                addTransaction,
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
