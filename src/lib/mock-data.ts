// src/lib/mock-data.ts
import type { Account, Transaction } from "./types";

export const initialAccounts: Account[] = [
    {
        id: "checking",
        name: "Checking - Main",
        type: "checking",
        balance: 2450.32,
    },
    {
        id: "savings",
        name: "Savings",
        type: "savings",
        balance: 5300.0,
    },
    {
        id: "credit-card",
        name: "Credit Card",
        type: "credit-card",
        balance: -320.5,
    },
];

export const initialTransactions: Transaction[] = [
    {
        id: "1",
        date: "2025-11-01",
        payee: "Kroger",
        category: "Groceries",
        account: "Checking",
        amount: 82.35,
        type: "expense",
    },
    {
        id: "2",
        date: "2025-11-02",
        payee: "United Airlines Payroll",
        category: "Salary",
        account: "Checking",
        amount: 1850,
        type: "income",
    },
    {
        id: "3",
        date: "2025-11-03",
        payee: "Starbucks",
        category: "Eating Out",
        account: "Credit Card",
        amount: 6.75,
        type: "expense",
    },
    {
        id: "4",
        date: "2025-11-04",
        payee: "Rent",
        category: "Housing",
        account: "Checking",
        amount: 1200,
        type: "expense",
    },
    {
        id: "5",
        date: "2025-11-05",
        payee: "Amazon",
        category: "Shopping",
        account: "Credit Card",
        amount: 54.99,
        type: "expense",
    },
];
