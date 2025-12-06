// src/lib/mock-data.ts
import type { Account, Transaction } from "./types";

export const accounts: Account[] = [
    {
        id: "acc-checking",
        name: "Checking - Main",
        type: "checking",
        currency: "USD",
        balance: 2450.32,
    },
    {
        id: "acc-savings",
        name: "Savings",
        type: "savings",
        currency: "USD",
        balance: 5300.0,
    },
    {
        id: "acc-amex",
        name: "Credit Card",
        type: "credit-card",
        currency: "USD",
        balance: -320.5, // negative = you owe
    },
];

export const transactions: Transaction[] = [
    {
        id: "tx-1",
        date: "2025-12-01",
        accountId: "acc-checking",
        description: "Kroger groceries",
        category: "Groceries",
        amount: -86.45,
    },
    {
        id: "tx-2",
        date: "2025-11-30",
        accountId: "acc-checking",
        description: "Uber to airport",
        category: "Transportation",
        amount: -24.99,
    },
    {
        id: "tx-3",
        date: "2025-11-28",
        accountId: "acc-amex",
        description: "Restaurant dinner",
        category: "Eating Out",
        amount: -54.0,
    },
    {
        id: "tx-4",
        date: "2025-11-27",
        accountId: "acc-checking",
        description: "Paycheck",
        category: "Income",
        amount: 2100.0,
    },
];
