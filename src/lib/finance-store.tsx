// src/lib/finance-store.tsx
"use client";

import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { initialAccounts, initialTransactions } from "./mock-data";
import type { Account, NewTransactionInput, Transaction } from "./types";

type FinanceContextValue = {
    accounts: Account[];
    transactions: Transaction[];
    addTransaction: (input: NewTransactionInput) => void;
};

const FinanceContext = createContext<FinanceContextValue | undefined>(
    undefined,
);

export function FinanceProvider({ children }: { children: ReactNode }) {
    const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
    const [transactions, setTransactions] =
        useState<Transaction[]>(initialTransactions);

    const addTransaction = (input: NewTransactionInput) => {
        const id =
            typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : Math.random().toString(36).slice(2);

        const tx: Transaction = { id, ...input };

        // add to top of list
        setTransactions((prev) => [tx, ...prev]);

        // update account balances
        setAccounts((prev) =>
            prev.map((acc) => {
                if (
                    (input.account === "Checking" && acc.id !== "checking") ||
                    (input.account === "Savings" && acc.id !== "savings") ||
                    (input.account === "Credit Card" && acc.id !== "credit-card")
                ) {
                    return acc;
                }

                const delta =
                    input.type === "income" ? input.amount : -input.amount;

                return { ...acc, balance: acc.balance + delta };
            }),
        );
    };

    const value = useMemo(
        () => ({ accounts, transactions, addTransaction }),
        [accounts, transactions],
    );

    return (
        <FinanceContext.Provider value={value}>
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
