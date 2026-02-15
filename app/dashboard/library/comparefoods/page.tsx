'use client';

import { Scale } from 'lucide-react';
import { CompareView } from '../foods/views/compare-view';

export default function CompareFoodsPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-32">
            {/* Header */}
            <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 rounded-[1.5rem] shadow-xl shadow-slate-200 dark:shadow-slate-900/20 text-white bg-blue-600 shadow-blue-500/20">
                        <Scale size={28} />
                    </div>
                    <div>
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-[0.85]">
                            <span className="text-blue-500">Compare Foods.</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Analyze and compare nutritional profiles side-by-side</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                <CompareView />
            </div>
        </div>
    );
}

