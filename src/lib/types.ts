// src/lib/types.ts

export type AccountType = "checking" | "savings" | "credit-card";

export type Account = {
    id: string;          // "checking", "savings", etc.
    name: string;        // "Checking - Main"
    type: AccountType;
    balance: number;
};

export type TransactionType = "income" | "expense";

export type Transaction = {
    id: string;
    date: string;        // ISO string, e.g. "2025-11-01"
    payee: string;
    category: string;
    account: string;     // "Checking", "Savings", "Credit Card"
    amount: number;      // always positive
    type: TransactionType;
};

export type NewTransactionInput = Omit<Transaction, "id">;
