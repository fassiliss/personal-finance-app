"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/transactions", label: "Transactions" },
];

export default function MainHeader() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                {/* Left: logo + app name */}
                <Link
                    href="/"
                    className="flex items-center gap-2"
                    onClick={() => setOpen(false)}
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-sm font-bold text-emerald-300">
                        PF
                    </div>
                    <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">
              Personal Finance
            </span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Track money with clarity
            </span>
                    </div>
                </Link>

                {/* Desktop nav */}
                <div className="hidden items-center gap-6 sm:flex">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`text-sm font-medium transition ${
                                isActive(item.href)
                                    ? "text-emerald-300"
                                    : "text-slate-300 hover:text-emerald-200"
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* Mobile menu button */}
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900/80 p-1.5 text-slate-200 hover:border-emerald-500 hover:text-emerald-300 sm:hidden"
                    onClick={() => setOpen((prev) => !prev)}
                    aria-label="Toggle navigation"
                >
                    <span className="sr-only">Open main menu</span>
                    {/* Simple hamburger / close icon */}
                    <div className="space-y-1">
                        <span className="block h-0.5 w-5 bg-current"></span>
                        <span className="block h-0.5 w-5 bg-current"></span>
                        <span className="block h-0.5 w-5 bg-current"></span>
                    </div>
                </button>
            </nav>

            {/* Mobile nav panel */}
            {open && (
                <div className="border-t border-slate-800 bg-slate-950/95 px-4 py-3 sm:hidden">
                    <div className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`rounded-md px-2 py-1.5 text-sm font-medium ${
                                    isActive(item.href)
                                        ? "bg-emerald-500/10 text-emerald-300"
                                        : "text-slate-200 hover:bg-slate-800/80"
                                }`}
                                onClick={() => setOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}
