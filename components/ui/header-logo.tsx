'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderLogoProps {
    showSubtext?: boolean;
}

export function HeaderLogo({ showSubtext = true }: HeaderLogoProps) {
    return (
        <div className={cn(
            "sticky top-0 z-50 flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-b-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl w-full md:max-w-[900px] mx-auto xl:mx-0 transition-all duration-500"
        )}>
            {/* Logo Area */}
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30">
                    <Leaf size={24} className="text-emerald-500" />
                </div>
                <div className="flex flex-col">
                    <div className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white">
                        Miracle Greens
                    </div>
                    {showSubtext && (
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            Nutritional Intelligence
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );
}
