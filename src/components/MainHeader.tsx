"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabaseFinance } from "@/lib/supabase-finance-store";
import { useTheme } from "@/lib/theme-store";
import { useAuth } from "@/lib/auth-store";

const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/transactions", label: "Transactions" },
    { href: "/budgets", label: "Budgets" },
    { href: "/recurring", label: "Recurring" },
    { href: "/import-export", label: "Import/Export" },
];

function formatCurrency(amount: number) {
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function MainHeader() {
    const pathname = usePathname();
    const { accounts, getBudgetProgress, getUpcomingRecurring } = useSupabaseFinance();
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const budgetProgress = getBudgetProgress();
    const overBudgetCount = budgetProgress.filter((bp) => bp.isOver).length;
    const upcomingRecurring = getUpcomingRecurring();
    const dueCount = upcomingRecurring.filter((rt) => {
        const today = new Date().toISOString().slice(0, 10);
        return rt.next_due_date <= today;
    }).length;

    return (
        <header className="sticky top-0 z-40 border-b border-theme bg-theme-secondary/80 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-theme-tertiary text-sm font-semibold" style={{ color: "var(--color-emerald)" }}>$</div>
                    <div className="leading-tight hidden sm:block">
                        <p className="text-sm font-semibold text-theme-primary">Personal Finance</p>
                        <p className="text-[11px] text-theme-muted">{user ? user.user_metadata?.name || user.email?.split('@')[0] : "Guest"}</p>
                    </div>
                </Link>

                <nav className="hidden gap-1 rounded-full border border-theme bg-theme-primary/80 p-1 text-xs lg:flex">
                    {navItems.map((item) => {
                        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                        const showBudgetBadge = item.href === "/budgets" && overBudgetCount > 0;
                        const showRecurringBadge = item.href === "/recurring" && dueCount > 0;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`relative rounded-full px-3 py-1 transition-colors whitespace-nowrap ${active ? "bg-theme-tertiary text-theme-primary" : "text-theme-muted hover:text-theme-primary"}`}
                            >
                                {item.label}
                                {showBudgetBadge && (
                                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: "var(--color-rose)" }}>{overBudgetCount}</span>
                                )}
                                {showRecurringBadge && (
                                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: "var(--color-amber)" }}>{dueCount}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <nav className="flex gap-1 lg:hidden overflow-x-auto">
                    {navItems.slice(0, 4).map((item) => {
                        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                        return (
                            <Link key={item.href} href={item.href} className={`rounded-full px-2 py-1 text-[10px] whitespace-nowrap ${active ? "bg-theme-tertiary text-theme-primary" : "text-theme-muted"}`}>{item.label}</Link>
                        );
                    })}
                    <Link href="/import-export" className={`rounded-full px-2 py-1 text-[10px] whitespace-nowrap ${pathname.startsWith("/import-export") ? "bg-theme-tertiary text-theme-primary" : "text-theme-muted"}`}>⬇️</Link>
                </nav>

                <div className="flex items-center gap-2">
                    <button type="button" onClick={toggleTheme} className="rounded-lg border border-theme-light p-1.5 text-theme-muted hover:bg-theme-tertiary hover:text-theme-primary transition-colors" title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                        {theme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                    </button>

                    <div className="hidden flex-col items-end sm:flex">
                        <span className="text-[10px] uppercase tracking-wide text-theme-muted">Balance</span>
                        <span className="text-xs font-semibold text-theme-primary">{formatCurrency(totalBalance)}</span>
                    </div>

                    {user ? (
                        <div className="flex items-center gap-2">
                            <Link href="/profile" className="rounded-lg border border-theme-light p-1.5 text-theme-muted hover:bg-theme-tertiary hover:text-theme-primary transition-colors" title="Profile settings">
                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            </Link>
                            <button type="button" onClick={() => signOut()} className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/20 active:bg-rose-500/30 min-h-[44px] min-w-[44px]">Logout</button>
                        </div>
                    ) : (
                        <Link href="/login" className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400">Sign in</Link>
                    )}
                </div>
            </div>
        </header>
    );
}