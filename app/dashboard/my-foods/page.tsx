'use client';

import React from 'react';
import { Heart } from 'lucide-react';

export default function MyFoodsPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Foods</h1>
                    <p className="text-slate-500 mt-1">Access your favorite ingredients and personalized laboratory data.</p>
                </div>
            </div>

            <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">
                <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 mb-6 group-hover:scale-110 transition-transform">
                    <Heart size={32} fill="currentColor" />
                </div>
                <h3 className="text-lg font-bold text-slate-400">Library Coming Soon</h3>
                <p className="text-sm text-slate-500 mt-1">Your favorited items will appear here for quick access.</p>
            </div>
        </div>
    );
}
