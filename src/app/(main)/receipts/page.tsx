"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-store";
import Tesseract from "tesseract.js";

type Receipt = {
    id: string;
    image_url: string;
    store_name: string | null;
    receipt_date: string | null;
    total_amount: number | null;
    tax_amount: number | null;
    category: string | null;
    items: string[] | null;
    raw_text: string | null;
    notes: string | null;
    is_tax_deductible: boolean;
    created_at: string;
};

const categories = [
    "Business Expense",
    "Office Supplies",
    "Travel",
    "Meals & Entertainment",
    "Medical",
    "Charitable Donation",
    "Home Office",
    "Equipment",
    "Software/Subscriptions",
    "Other",
];

export default function ReceiptsPage() {
    const { user } = useAuth();
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
    const [filterTaxDeductible, setFilterTaxDeductible] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [storeName, setStoreName] = useState("");
    const [receiptDate, setReceiptDate] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [taxAmount, setTaxAmount] = useState("");
    const [category, setCategory] = useState("");
    const [notes, setNotes] = useState("");
    const [isTaxDeductible, setIsTaxDeductible] = useState(false);
    const [rawText, setRawText] = useState("");

    useEffect(() => {
        if (user) loadReceipts();
    }, [user]);

    async function loadReceipts() {
        const { data } = await supabase
            .from("receipts")
            .select("*")
            .eq("user_id", user?.id)
            .order("receipt_date", { ascending: false });
        setReceipts(data || []);
        setLoading(false);
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    }

    async function handleScanReceipt() {
        if (!imagePreview) return;

        setScanning(true);
        setScanProgress(0);

        try {
            const result = await Tesseract.recognize(imagePreview, "eng", {
                logger: (m) => {
                    if (m.status === "recognizing text") {
                        setScanProgress(Math.round(m.progress * 100));
                    }
                },
            });

            const text = result.data.text;
            setRawText(text);

            // Extract data from text
            const extracted = extractReceiptData(text);
            if (extracted.storeName) setStoreName(extracted.storeName);
            if (extracted.date) setReceiptDate(extracted.date);
            if (extracted.total) setTotalAmount(extracted.total);
            if (extracted.tax) setTaxAmount(extracted.tax);
        } catch (error) {
            console.error("OCR Error:", error);
        } finally {
            setScanning(false);
        }
    }

    function extractReceiptData(text: string) {
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

        // Try to get store name (usually first non-empty line)
        const storeName = lines[0] || "";

        // Find date patterns
        const datePatterns = [
            /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
            /(\d{1,2}-\d{1,2}-\d{2,4})/,
            /(\w{3}\s+\d{1,2},?\s+\d{4})/,
        ];
        let date = "";
        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                date = formatDate(match[1]);
                break;
            }
        }

        // Find total amount
        const totalPatterns = [
            /total[:\s]*\$?(\d+\.?\d*)/i,
            /grand total[:\s]*\$?(\d+\.?\d*)/i,
            /amount[:\s]*\$?(\d+\.?\d*)/i,
        ];
        let total = "";
        for (const pattern of totalPatterns) {
            const match = text.match(pattern);
            if (match) {
                total = match[1];
                break;
            }
        }

        // Find tax amount
        const taxPatterns = [
            /tax[:\s]*\$?(\d+\.?\d*)/i,
            /sales tax[:\s]*\$?(\d+\.?\d*)/i,
        ];
        let tax = "";
        for (const pattern of taxPatterns) {
            const match = text.match(pattern);
            if (match) {
                tax = match[1];
                break;
            }
        }

        return { storeName, date, total, tax };
    }

    function formatDate(dateStr: string): string {
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split("T")[0];
            }
        } catch {}
        return "";
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!imageFile || !user) return;

        setUploading(true);

        try {
            // Upload image to Supabase Storage
            const fileName = `${user.id}/${Date.now()}-${imageFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from("receipts")
                .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from("receipts")
                .getPublicUrl(fileName);

            // Save receipt to database
            const { error: dbError } = await supabase.from("receipts").insert({
                user_id: user.id,
                image_url: urlData.publicUrl,
                store_name: storeName || null,
                receipt_date: receiptDate || null,
                total_amount: totalAmount ? parseFloat(totalAmount) : null,
                tax_amount: taxAmount ? parseFloat(taxAmount) : null,
                category: category || null,
                notes: notes || null,
                is_tax_deductible: isTaxDeductible,
                raw_text: rawText || null,
            });

            if (dbError) throw dbError;

            // Reset form and reload
            resetForm();
            loadReceipts();
        } catch (error) {
            console.error("Error saving receipt:", error);
            alert("Failed to save receipt");
        } finally {
            setUploading(false);
        }
    }

    function resetForm() {
        setShowForm(false);
        setImageFile(null);
        setImagePreview(null);
        setStoreName("");
        setReceiptDate("");
        setTotalAmount("");
        setTaxAmount("");
        setCategory("");
        setNotes("");
        setIsTaxDeductible(false);
        setRawText("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this receipt?")) return;
        await supabase.from("receipts").delete().eq("id", id);
        loadReceipts();
    }

    const filteredReceipts = filterTaxDeductible
        ? receipts.filter((r) => r.is_tax_deductible)
        : receipts;

    const totalTaxDeductible = receipts
        .filter((r) => r.is_tax_deductible)
        .reduce((sum, r) => sum + (r.total_amount || 0), 0);

    if (loading) {
        return (
            <div className="p-6 text-center text-slate-400">Loading receipts...</div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-50">Receipts</h1>
                    <p className="text-sm text-slate-400">Scan and track receipts for tax purposes</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
                >
                    + Add Receipt
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-xs text-slate-400">Total Receipts</p>
                    <p className="text-2xl font-bold text-slate-50">{receipts.length}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-xs text-slate-400">Tax Deductible</p>
                    <p className="text-2xl font-bold text-emerald-400">{receipts.filter((r) => r.is_tax_deductible).length}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-xs text-slate-400">Total Deductible Amount</p>
                    <p className="text-2xl font-bold text-emerald-400">${totalTaxDeductible.toFixed(2)}</p>
                </div>
            </div>

            {/* Filter */}
            <div className="mb-4">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                        type="checkbox"
                        checked={filterTaxDeductible}
                        onChange={(e) => setFilterTaxDeductible(e.target.checked)}
                        className="rounded border-slate-600 bg-slate-800"
                    />
                    Show only tax deductible
                </label>
            </div>

            {/* Receipt List */}
            {filteredReceipts.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
                    <p className="text-slate-400">No receipts yet. Add your first receipt!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredReceipts.map((receipt) => (
                        <div
                            key={receipt.id}
                            className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden cursor-pointer hover:border-slate-700 transition-colors"
                            onClick={() => setSelectedReceipt(receipt)}
                        >
                            <div className="h-40 bg-slate-800">
                                <img
                                    src={receipt.image_url}
                                    alt="Receipt"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-slate-100">{receipt.store_name || "Unknown Store"}</p>
                                        <p className="text-xs text-slate-400">{receipt.receipt_date || "No date"}</p>
                                    </div>
                                    {receipt.is_tax_deductible && (
                                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">Tax</span>
                                    )}
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-lg font-bold text-slate-50">
                                        ${receipt.total_amount?.toFixed(2) || "0.00"}
                                    </span>
                                    {receipt.category && (
                                        <span className="text-xs text-slate-400">{receipt.category}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Receipt Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-6">
                        <h2 className="text-lg font-semibold text-slate-100 mb-4">Add Receipt</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Receipt Image</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleFileSelect}
                                    className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700"
                                />
                            </div>

                            {/* Image Preview & Scan */}
                            {imagePreview && (
                                <div className="space-y-2">
                                    <img src={imagePreview} alt="Preview" className="w-full max-h-60 object-contain rounded-lg bg-slate-800" />
                                    <button
                                        type="button"
                                        onClick={handleScanReceipt}
                                        disabled={scanning}
                                        className="w-full rounded-lg border border-purple-500/50 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400 hover:bg-purple-500/20 disabled:opacity-50"
                                    >
                                        {scanning ? `Scanning... ${scanProgress}%` : "🔍 Scan Receipt (OCR)"}
                                    </button>
                                </div>
                            )}

                            {/* Form Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Store Name</label>
                                    <input
                                        type="text"
                                        value={storeName}
                                        onChange={(e) => setStoreName(e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={receiptDate}
                                        onChange={(e) => setReceiptDate(e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Total Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={totalAmount}
                                        onChange={(e) => setTotalAmount(e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Tax Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={taxAmount}
                                        onChange={(e) => setTaxAmount(e.target.value)}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                >
                                    <option value="">Select category</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                                />
                            </div>

                            <label className="flex items-center gap-2 text-sm text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={isTaxDeductible}
                                    onChange={(e) => setIsTaxDeductible(e.target.checked)}
                                    className="rounded border-slate-600 bg-slate-800"
                                />
                                Mark as tax deductible
                            </label>

                            {/* Raw OCR Text (collapsible) */}
                            {rawText && (
                                <details className="text-xs text-slate-500">
                                    <summary className="cursor-pointer">View scanned text</summary>
                                    <pre className="mt-2 p-2 bg-slate-950 rounded overflow-auto max-h-32">{rawText}</pre>
                                </details>
                            )}

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!imageFile || uploading}
                                    className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
                                >
                                    {uploading ? "Saving..." : "Save Receipt"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Receipt Modal */}
            {selectedReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedReceipt(null)}>
                    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-lg font-semibold text-slate-100">{selectedReceipt.store_name || "Receipt"}</h2>
                            <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-slate-200">✕</button>
                        </div>
                        <img src={selectedReceipt.image_url} alt="Receipt" className="w-full rounded-lg mb-4" />
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Date</span>
                                <span className="text-slate-100">{selectedReceipt.receipt_date || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Total</span>
                                <span className="text-slate-100 font-bold">${selectedReceipt.total_amount?.toFixed(2) || "0.00"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Tax</span>
                                <span className="text-slate-100">${selectedReceipt.tax_amount?.toFixed(2) || "0.00"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Category</span>
                                <span className="text-slate-100">{selectedReceipt.category || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Tax Deductible</span>
                                <span className={selectedReceipt.is_tax_deductible ? "text-emerald-400" : "text-slate-500"}>
                                    {selectedReceipt.is_tax_deductible ? "Yes" : "No"}
                                </span>
                            </div>
                            {selectedReceipt.notes && (
                                <div>
                                    <span className="text-slate-400">Notes</span>
                                    <p className="text-slate-100 mt-1">{selectedReceipt.notes}</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => handleDelete(selectedReceipt.id)}
                            className="mt-4 w-full rounded-lg border border-rose-500/50 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/20"
                        >
                            Delete Receipt
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}