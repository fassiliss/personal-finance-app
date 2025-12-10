// src/components/Footer.tsx
"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme-store";

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
        </svg>
    );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
    );
}

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
            <circle cx="10" cy="10" r="7" strokeWidth="1.5" />
            <path d="M2 10h16M10 3c-2 2.5-2 4.5-2 7s0 4.5 2 7c2-2.5 2-4.5 2-7s0-4.5-2-7" strokeWidth="1.5" />
        </svg>
    );
}

function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    );
}

export default function Footer() {
    const { theme } = useTheme();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto border-t border-theme bg-theme-secondary/50">
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-sm font-semibold text-emerald-500">$</div>
                            <span className="text-sm font-semibold text-theme-primary">Personal Finance</span>
                        </div>
                        <p className="mt-3 text-xs text-theme-muted leading-relaxed">
                            A simple, beautiful way to track your income, expenses, and financial goals. Built with Next.js and React.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Quick Links</h3>
                        <ul className="mt-3 space-y-2">
                            <li><Link href="/" className="text-sm text-theme-secondary hover:text-emerald-500 transition-colors">Dashboard</Link></li>
                            <li><Link href="/transactions" className="text-sm text-theme-secondary hover:text-emerald-500 transition-colors">Transactions</Link></li>
                            <li><Link href="/budgets" className="text-sm text-theme-secondary hover:text-emerald-500 transition-colors">Budgets</Link></li>
                            <li><Link href="/recurring" className="text-sm text-theme-secondary hover:text-emerald-500 transition-colors">Recurring</Link></li>
                        </ul>
                    </div>

                    {/* Features */}
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Features</h3>
                        <ul className="mt-3 space-y-2">
                            <li className="text-sm text-theme-secondary">📊 Track spending</li>
                            <li className="text-sm text-theme-secondary">💰 Set budgets</li>
                            <li className="text-sm text-theme-secondary">🔄 Recurring bills</li>
                            <li className="text-sm text-theme-secondary">📁 Import/Export CSV</li>
                            <li className="text-sm text-theme-secondary">🌙 Dark/Light mode</li>
                        </ul>
                    </div>

                    {/* Developer */}
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Developer</h3>
                        <div className="mt-3">
                            <p className="text-sm font-medium text-theme-primary">Fassil Tsegaye</p>
                            <p className="text-xs text-theme-muted mt-1">Full Stack Developer</p>
                            <div className="mt-3 flex items-center gap-3">
                                <a href="https://fassiltsegaye.com" target="_blank" rel="noopener noreferrer" className="text-theme-muted hover:text-emerald-500 transition-colors" title="Portfolio">
                                    <GlobeIcon className="h-5 w-5" />
                                </a>
                                <a href="https://github.com/fassiliss" target="_blank" rel="noopener noreferrer" className="text-theme-muted hover:text-emerald-500 transition-colors" title="GitHub">
                                    <GithubIcon className="h-5 w-5" />
                                </a>
                                <a href="https://linkedin.com/in/fassiltsegaye" target="_blank" rel="noopener noreferrer" className="text-theme-muted hover:text-emerald-500 transition-colors" title="LinkedIn">
                                    <LinkedInIcon className="h-5 w-5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-theme pt-6 sm:flex-row">
                    <p className="text-xs text-theme-muted">© {currentYear} Personal Finance App. All rights reserved.</p>
                    <p className="flex items-center gap-1 text-xs text-theme-muted">
                        Made with <HeartIcon className="h-3.5 w-3.5 text-rose-500" /> by{" "}
                        <a href="https://fassiltsegaye.com" target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-500 hover:underline">Fassil Tsegaye</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}