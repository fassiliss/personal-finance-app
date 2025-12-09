// src/components/MainHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useFinance } from "@/lib/finance-store";

function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
}

export default function MainHeader() {
    const pathname = usePathname();
    const { accounts } = useFinance();

    const totalBalance = useMemo(
        () => accounts.reduce((sum, acc) => sum + acc.balance, 0),
        [accounts],
    );

    const navItems = [
        { href: "/", label: "Dashboard" },
        { href: "/transactions", label: "Transactions" },
    ];

    return (
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                {/* Left: logo + app name */}
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-semibold text-emerald-300">
                        $
                    </div>
                    <div className="leading-tight">
                        <p className="text-sm font-semibold text-slate-50">
                            Personal Finance
                        </p>
                        <p className="text-[11px] text-slate-500">
                            Local demo — no bank connections
                        </p>
                    </div>
                </div>

                {/* Center: nav */}
                <nav className="hidden gap-1 rounded-full border border-slate-800 bg-slate-950/80 p-1 text-xs sm:flex">
                    {navItems.map((item) => {
                        const active =
                            item.href === "/"
                                ? pathname === "/"
                                : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={[
                                    "rounded-full px-3 py-1 transition-colors",
                                    active
                                        ? "bg-slate-800 text-slate-50"
                                        : "text-slate-400 hover:text-slate-100",
                                ].join(" ")}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right: total balance */}
                <div className="flex items-center gap-2">
                    <div className="hidden flex-col items-end sm:flex">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              Total balance
            </span>
                        <span className="text-xs font-semibold text-slate-100">
              {formatCurrency(totalBalance)}
            </span>
                    </div>

                    {/* Mobile nav pills (icons only, optional) */}
                    <nav className="flex gap-1 sm:hidden">
                        {navItems.map((item) => {
                            const active =
                                item.href === "/"
                                    ? pathname === "/"
                                    : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={[
                                        "rounded-full px-2 py-1 text-[11px]",
                                        active
                                            ? "bg-slate-800 text-slate-50"
                                            : "text-slate-400 hover:text-slate-100",
                                    ].join(" ")}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </header>
    );
}
