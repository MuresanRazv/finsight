'use client'

import React from 'react'

export function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="border-t border-border/40 mt-auto pt-8 pb-6 text-muted-foreground w-full">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-medium tracking-wide">
                <div className="flex items-center gap-2">
                    <span>&copy; {currentYear} FinSight. All rights reserved.</span>
                    <span className="text-border/30 hidden sm:inline">•</span>
                    <span className="text-slate-400/80 hidden sm:inline">AI-Powered Financial Intelligence</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <a href="#privacy" className="hover:text-foreground transition-colors">
                        Privacy Policy
                    </a>
                    <a href="#terms" className="hover:text-foreground transition-colors">
                        Terms of Service
                    </a>
                    <a href="#cookies" className="hover:text-foreground transition-colors">
                        Cookie Preference
                    </a>
                    <span className="text-border/30">•</span>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-slate-400">All systems operational</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
