// src/components/MainHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
    { label: "Dashboard", href: "/" },
    { label: "Transactions", href: "/transactions" },
    // later you can add: { label: "Budgets", href: "/budgets" }, etc.
];

export default function MainHeader() {
    const pathname = usePathname();

    return (
        <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 gap-4">
                {/* Left: Logo + App name */}
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-sm font-semibold text-emerald-300">
                        PF
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-50">
                            Personal Finance
                        </p>
                        <p className="text-xs text-slate-400">
                            Track money with clarity
                        </p>
                    </div>
                </div>

                {/* Right: Nav links */}
                <nav className="flex items-center gap-2 text-sm">
                    {navItems.map((item) => {
                        const isActive =
                            item.href === "/"
                                ? pathname === "/"
                                : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={[
                                    "rounded-lg px-3 py-1.5 transition border",
                                    isActive
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                                        : "border-transparent text-slate-300 hover:text-emerald-200 hover:border-slate-700 hover:bg-slate-900",
                                ].join(" ")}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
