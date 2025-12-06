// src/lib/types.ts

export type AccountType = "cash" | "checking" | "savings" | "credit-card";

export type Account = {
    id: string;
    name: string;
    type: AccountType;
    currency: string;      // e.g. "USD"
    balance: number;       // current balance in cents or dollars
};

export type Category =
    | "Housing"
    | "Groceries"
    | "Transportation"
    | "Eating Out"
    | "Income"
    | "Utilities"
    | "Giving"
    | "Other";

export type Transaction = {
    id: string;
    date: string;          // ISO string e.g. "2025-12-01"
    accountId: string;     // links to Account.id
    description: string;
    category: Category;
    amount: number;        // positive = income, negative = expense
};
