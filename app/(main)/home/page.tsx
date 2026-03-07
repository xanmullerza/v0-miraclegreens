'use client';

import React from 'react';
import { PageContainer } from '@/components/ui/page-container';

export default function HomePage() {
    return (
        <PageContainer maxWidth="max-w-7xl">
            <div className="space-y-12 animate-in fade-in duration-500">
                {/* Hero Section */}
                <div className="text-center space-y-6 py-12">
                    <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                        Welcome to Vitala
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
                        Your personal nutrition intelligence platform
                    </p>
                </div>

                {/* Content Area - Add your content here */}
                <div className="min-h-[400px] animate-in slide-in-from-bottom-4 duration-700">
                    <div className="p-12 rounded-3xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-slate-500 dark:text-slate-400">
                            Content coming soon...
                        </p>
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
