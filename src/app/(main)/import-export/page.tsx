// src/app/import-export/page.tsx
"use client";

import React, { useState, useRef } from "react";
import { useSupabaseFinance, Transaction, TransactionInput } from "@/lib/supabase-finance-store";

function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/* ---------- Icons ---------- */

function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 3v10m0 0l-3-3m3 3l3-3M3 17h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function UploadIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 13V3m0 0L7 6m3-3l3 3M3 17h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function FileIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 4a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 2v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function AlertCircleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

/* ---------- CSV Helpers ---------- */

function escapeCSV(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                current += '"';
                i++;
            } else if (char === '"') {
                inQuotes = false;
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ",") {
                result.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
    }
    result.push(current.trim());
    return result;
}

function transactionsToCSV(transactions: Transaction[]): string {
    const headers = ["Date", "Payee", "Category", "Account", "Amount", "Type"];
    const rows = transactions.map((tx) => [
        tx.date,
        escapeCSV(tx.payee),
        escapeCSV(tx.category),
        escapeCSV(tx.account_id),
        tx.amount.toFixed(2),
        tx.type,
    ]);

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* ---------- Import Preview Modal ---------- */

type ImportPreviewModalProps = {
    open: boolean;
    preview: TransactionInput[];
    errors: string[];
    onClose: () => void;
    onConfirm: () => void;
};

function ImportPreviewModal({ open, preview, errors, onClose, onConfirm }: ImportPreviewModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div role="dialog" aria-modal="true" className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl max-h-[80vh] overflow-hidden flex flex-col">
                <h2 className="text-lg font-semibold text-slate-50">Import Preview</h2>
                <p className="mt-1 text-xs text-slate-400">Review the transactions before importing.</p>

                {errors.length > 0 && (
                    <div className="mt-4 rounded-lg border border-rose-500/50 bg-rose-500/10 p-3">
                        <p className="text-xs font-medium text-rose-400">Errors found:</p>
                        <ul className="mt-1 text-xs text-rose-300">
                            {errors.slice(0, 5).map((err, i) => (
                                <li key={i}>• {err}</li>
                            ))}
                            {errors.length > 5 && <li>• ...and {errors.length - 5} more</li>}
                        </ul>
                    </div>
                )}

                {preview.length > 0 && (
                    <div className="mt-4 flex-1 overflow-auto rounded-lg border border-slate-800">
                        <table className="min-w-full text-sm">
                            <thead className="sticky top-0 bg-slate-900">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Date</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Payee</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Category</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Account</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-slate-400">Amount</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">Type</th>
                            </tr>
                            </thead>
                            <tbody>
                            {preview.slice(0, 20).map((tx, i) => (
                                <tr key={i} className="border-t border-slate-800">
                                    <td className="px-3 py-2 text-slate-300">{tx.date}</td>
                                    <td className="px-3 py-2 text-slate-100">{tx.payee}</td>
                                    <td className="px-3 py-2 text-slate-300">{tx.category}</td>
                                    <td className="px-3 py-2 text-slate-300">{tx.account_id}</td>
                                    <td className={`px-3 py-2 text-right font-medium ${tx.type === "income" ? "text-emerald-300" : "text-rose-300"}`}>
                                        {formatCurrency(tx.amount)}
                                    </td>
                                    <td className="px-3 py-2 text-slate-300 capitalize">{tx.type}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {preview.length > 20 && (
                            <p className="p-3 text-center text-xs text-slate-500">...and {preview.length - 20} more transactions</p>
                        )}
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                        {preview.length} transaction{preview.length !== 1 ? "s" : ""} ready to import
                    </p>
                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800">Cancel</button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={preview.length === 0}
                            className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Import {preview.length} Transactions
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------- Import/Export Page ---------- */

export default function ImportExportPage() {
    const { transactions, accounts, budgets, recurringTransactions, addTransaction } = useSupabaseFinance();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [importPreview, setImportPreview] = useState<TransactionInput[]>([]);
    const [importErrors, setImportErrors] = useState<string[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    // Get account names for validation
    const accountNames = accounts.map((a) => a.name.toLowerCase());

    // Export transactions to CSV
    function handleExportTransactions() {
        if (transactions.length === 0) {
            alert("No transactions to export.");
            return;
        }
        const csv = transactionsToCSV(transactions);
        const date = new Date().toISOString().slice(0, 10);
        downloadFile(csv, `transactions-${date}.csv`, "text/csv");
        setSuccessMessage(`Exported ${transactions.length} transactions!`);
        setTimeout(() => setSuccessMessage(""), 3000);
    }

    // Export all data as JSON backup
    function handleExportBackup() {
        const backup = {
            exportDate: new Date().toISOString(),
            version: "1.0",
            data: {
                accounts,
                transactions,
                budgets,
                recurringTransactions,
            },
        };
        const json = JSON.stringify(backup, null, 2);
        const date = new Date().toISOString().slice(0, 10);
        downloadFile(json, `finance-backup-${date}.json`, "application/json");
        setSuccessMessage("Backup exported successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
    }

    // Download sample CSV template
    function handleDownloadTemplate() {
        const template = `Date,Payee,Category,Account,Amount,Type
2024-01-15,Grocery Store,Groceries,Checking,85.50,expense
2024-01-14,Employer,Salary,Checking,3500.00,income
2024-01-13,Electric Company,Utilities,Checking,120.00,expense
2024-01-12,Restaurant,Dining,Credit Card,45.00,expense`;
        downloadFile(template, "transaction-template.csv", "text/csv");
    }

    // Handle file selection
    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            parseCSVFile(content);
        };
        reader.readAsText(file);

        // Reset input so same file can be selected again
        e.target.value = "";
    }

    // Parse CSV file content
    function parseCSVFile(content: string) {
        const lines = content.split("\n").filter((line) => line.trim());
        if (lines.length < 2) {
            setImportErrors(["File is empty or has no data rows."]);
            setImportPreview([]);
            setShowPreview(true);
            return;
        }

        const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
        const preview: TransactionInput[] = [];
        const errors: string[] = [];

        // Find column indices
        const dateIdx = headers.findIndex((h) => h === "date");
        const payeeIdx = headers.findIndex((h) => h === "payee" || h === "description" || h === "merchant");
        const categoryIdx = headers.findIndex((h) => h === "category");
        const accountIdx = headers.findIndex((h) => h === "account");
        const amountIdx = headers.findIndex((h) => h === "amount");
        const typeIdx = headers.findIndex((h) => h === "type");

        if (dateIdx === -1) errors.push("Missing 'Date' column");
        if (payeeIdx === -1) errors.push("Missing 'Payee' column");
        if (amountIdx === -1) errors.push("Missing 'Amount' column");

        if (errors.length > 0) {
            setImportErrors(errors);
            setImportPreview([]);
            setShowPreview(true);
            return;
        }

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length < 3) continue;

            const date = values[dateIdx]?.trim();
            const payee = values[payeeIdx]?.trim();
            const category = categoryIdx !== -1 ? values[categoryIdx]?.trim() : "Uncategorized";
            const account = accountIdx !== -1 ? values[accountIdx]?.trim() : accounts[0]?.name || "Checking";
            const amountStr = values[amountIdx]?.trim().replace(/[$,]/g, "");
            const typeStr = typeIdx !== -1 ? values[typeIdx]?.trim().toLowerCase() : "";

            // Validate date
            const dateMatch = date?.match(/^\d{4}-\d{2}-\d{2}$/);
            if (!dateMatch) {
                errors.push(`Row ${i + 1}: Invalid date format '${date}' (use YYYY-MM-DD)`);
                continue;
            }

            // Validate amount
            const amount = Math.abs(parseFloat(amountStr));
            if (isNaN(amount) || amount <= 0) {
                errors.push(`Row ${i + 1}: Invalid amount '${amountStr}'`);
                continue;
            }

            // Validate payee
            if (!payee) {
                errors.push(`Row ${i + 1}: Missing payee`);
                continue;
            }

            // Determine type
            let type: "income" | "expense" = "expense";
            if (typeStr === "income") {
                type = "income";
            } else if (typeStr === "expense") {
                type = "expense";
            } else if (amountStr.startsWith("-") || parseFloat(amountStr) < 0) {
                type = "expense";
            } else if (category?.toLowerCase().includes("salary") || category?.toLowerCase().includes("income")) {
                type = "income";
            }

            // Validate account (warn if not found)
            if (accountIdx !== -1 && !accountNames.includes(account.toLowerCase())) {
                errors.push(`Row ${i + 1}: Account '${account}' not found, will use as-is`);
            }

            preview.push({
                date,
                payee,
                category: category || "Uncategorized",
                account: account || accounts[0]?.name || "Checking",
                amount,
                type,
            });
        }

        setImportPreview(preview);
        setImportErrors(errors.filter((e) => !e.includes("not found"))); // Don't show account warnings as errors
        setShowPreview(true);
    }

    // Confirm import
    function handleConfirmImport() {
        let imported = 0;
        for (const tx of importPreview) {
            addTransaction(tx);
            imported++;
        }
        setShowPreview(false);
        setImportPreview([]);
        setImportErrors([]);
        setSuccessMessage(`Successfully imported ${imported} transactions!`);
        setTimeout(() => setSuccessMessage(""), 3000);
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
            <div className="mx-auto max-w-4xl px-4 py-8">
                {/* Header */}
                <header className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Personal Finance</p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Import & Export</h1>
                    <p className="mt-1 text-sm text-slate-400">Export your data or import transactions from CSV files.</p>
                </header>

                {/* Success message */}
                {successMessage && (
                    <div className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4">
                        <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                        <p className="text-sm text-emerald-300">{successMessage}</p>
                    </div>
                )}

                {/* Export Section */}
                <section className="mb-8 rounded-xl border border-slate-800 bg-slate-900/70 p-6">
                    <h2 className="text-lg font-semibold text-slate-100">Export Data</h2>
                    <p className="mt-1 text-sm text-slate-400">Download your transactions or create a full backup.</p>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {/* Export Transactions */}
                        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                                    <FileIcon className="h-5 w-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-100">Transactions CSV</h3>
                                    <p className="text-xs text-slate-500">{transactions.length} transactions</p>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-slate-400">Export all transactions as a CSV file for use in spreadsheets.</p>
                            <button
                                type="button"
                                onClick={handleExportTransactions}
                                disabled={transactions.length === 0}
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <DownloadIcon className="h-4 w-4" />
                                Export CSV
                            </button>
                        </div>

                        {/* Export Backup */}
                        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                                    <FileIcon className="h-5 w-5 text-sky-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-100">Full Backup</h3>
                                    <p className="text-xs text-slate-500">All data as JSON</p>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-slate-400">Export accounts, transactions, budgets, and recurring transactions.</p>
                            <button
                                type="button"
                                onClick={handleExportBackup}
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-sky-500 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/20"
                            >
                                <DownloadIcon className="h-4 w-4" />
                                Download Backup
                            </button>
                        </div>
                    </div>
                </section>

                {/* Import Section */}
                <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
                    <h2 className="text-lg font-semibold text-slate-100">Import Transactions</h2>
                    <p className="mt-1 text-sm text-slate-400">Import transactions from a CSV file.</p>

                    <div className="mt-6">
                        {/* File Upload Area */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="cursor-pointer rounded-lg border-2 border-dashed border-slate-700 bg-slate-950/50 p-8 text-center hover:border-emerald-500/50 hover:bg-slate-950/70 transition-colors"
                        >
                            <UploadIcon className="mx-auto h-10 w-10 text-slate-500" />
                            <p className="mt-3 text-sm font-medium text-slate-300">Click to select a CSV file</p>
                            <p className="mt-1 text-xs text-slate-500">or drag and drop</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>

                        {/* CSV Format Info */}
                        <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                            <h3 className="text-sm font-semibold text-slate-200">CSV Format</h3>
                            <p className="mt-1 text-xs text-slate-400">Your CSV file should have these columns:</p>
                            <div className="mt-3 overflow-x-auto">
                                <table className="text-xs">
                                    <thead>
                                    <tr className="text-slate-400">
                                        <th className="pr-4 text-left">Column</th>
                                        <th className="pr-4 text-left">Required</th>
                                        <th className="text-left">Format</th>
                                    </tr>
                                    </thead>
                                    <tbody className="text-slate-300">
                                    <tr><td className="pr-4 py-1">Date</td><td className="pr-4">Yes</td><td>YYYY-MM-DD</td></tr>
                                    <tr><td className="pr-4 py-1">Payee</td><td className="pr-4">Yes</td><td>Text</td></tr>
                                    <tr><td className="pr-4 py-1">Amount</td><td className="pr-4">Yes</td><td>Number (e.g., 85.50)</td></tr>
                                    <tr><td className="pr-4 py-1">Category</td><td className="pr-4">No</td><td>Text (defaults to &quot;Uncategorized&quot;)</td></tr>
                                    <tr><td className="pr-4 py-1">Account</td><td className="pr-4">No</td><td>Text (defaults to first account)</td></tr>
                                    <tr><td className="pr-4 py-1">Type</td><td className="pr-4">No</td><td>&quot;income&quot; or &quot;expense&quot;</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <button
                                type="button"
                                onClick={handleDownloadTemplate}
                                className="mt-4 text-xs text-emerald-400 hover:text-emerald-300 underline"
                            >
                                Download sample template
                            </button>
                        </div>

                        {/* Tips */}
                        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                            <div className="flex gap-2">
                                <AlertCircleIcon className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-amber-300">Tips for importing bank statements:</p>
                                    <ul className="mt-1 text-xs text-amber-200/70 space-y-1">
                                        <li>• Most banks let you export transactions as CSV</li>
                                        <li>• You may need to rename columns to match our format</li>
                                        <li>• Negative amounts are treated as expenses</li>
                                        <li>• Review the preview before confirming import</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data Summary */}
                <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/70 p-6">
                    <h2 className="text-lg font-semibold text-slate-100">Your Data Summary</h2>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="rounded-lg bg-slate-950/50 p-3 text-center">
                            <p className="text-2xl font-semibold text-slate-100">{accounts.length}</p>
                            <p className="text-xs text-slate-500">Accounts</p>
                        </div>
                        <div className="rounded-lg bg-slate-950/50 p-3 text-center">
                            <p className="text-2xl font-semibold text-slate-100">{transactions.length}</p>
                            <p className="text-xs text-slate-500">Transactions</p>
                        </div>
                        <div className="rounded-lg bg-slate-950/50 p-3 text-center">
                            <p className="text-2xl font-semibold text-slate-100">{budgets.length}</p>
                            <p className="text-xs text-slate-500">Budgets</p>
                        </div>
                        <div className="rounded-lg bg-slate-950/50 p-3 text-center">
                            <p className="text-2xl font-semibold text-slate-100">{recurringTransactions.length}</p>
                            <p className="text-xs text-slate-500">Recurring</p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Import Preview Modal */}
            <ImportPreviewModal
                open={showPreview}
                preview={importPreview}
                errors={importErrors}
                onClose={() => { setShowPreview(false); setImportPreview([]); setImportErrors([]); }}
                onConfirm={handleConfirmImport}
            />
        </main>
    );
}