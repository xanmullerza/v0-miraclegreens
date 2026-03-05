'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, Leaf, ChefHat, Calendar, Activity, Zap, Shield } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { HeroSearch } from '@/components/ui/hero-search';
import { useSearch } from '@/lib/context/search-context';

const noop = () => {};

interface Widget {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    path: string;
}

const WIDGETS: Widget[] = [
    {
        id: 'nutridex',
        title: 'Nutridex',
        description: 'Biological reference guide & profile targets for all nutrients',
        icon: Activity,
        color: 'emerald',
        path: '/dashboard/widgets/nutridex'
    },
    {
        id: 'comparator',
        title: 'Comparator',
        description: 'Compare nutritional profiles of different foods side by side',
        icon: Zap,
        color: 'orange',
        path: '/dashboard/widgets/comparator'
    },
    {
        id: 'lifeguard',
        title: 'Lifeguard',
        description: 'Monitor and optimize your health markers and RDA targets',
        icon: Shield,
        color: 'rose',
        path: '/dashboard/widgets/lifeguard'
    }
];

export default function WidgetsPage() {
    const router = useRouter();
    const { searchQuery, setSearchQuery } = useSearch();
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [filteredWidgets, setFilteredWidgets] = useState<Widget[]>(WIDGETS);

    // Clear the shared search query when leaving this page
    useEffect(() => () => setSearchQuery(''), [setSearchQuery]);

    // Filter widgets based on search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredWidgets(WIDGETS);
        } else {
            const q = searchQuery.toLowerCase();
            setFilteredWidgets(WIDGETS.filter(w => 
                w.title.toLowerCase().includes(q) || 
                w.description.toLowerCase().includes(q)
            ));
        }
    }, [searchQuery]);

    const colorClasses = {
        emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
        orange: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
        rose: 'bg-rose-500/10 border-rose-500/30 text-rose-500',
    };

    const hoverClasses = {
        emerald: 'hover:text-emerald-500 hover:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
        orange: 'hover:text-orange-500 hover:border-orange-500/40 hover:bg-orange-50 dark:hover:bg-orange-950/30',
        rose: 'hover:text-rose-500 hover:border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-950/30',
    };

    return (
        <PageContainer maxWidth="max-w-7xl">
            <div className="space-y-12 animate-in fade-in duration-500">
                <HeroSearch
                    searchQuery={searchQuery}
                    onQueryChange={setSearchQuery}
                    results={[]}
                    isLoading={false}
                    isActive={isSearchActive}
                    setIsActive={setIsSearchActive}
                    onSelect={noop}
                    hideResults
                    theme="emerald"
                    placeholder="SEARCH WIDGETS..."
                    idleTitle="Widgets"

                />

                <div className="min-h-[600px] animate-in slide-in-from-bottom-4 duration-700">
                    {filteredWidgets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-16">
                            <LayoutGrid size={48} className="text-slate-300 dark:text-slate-600" />
                            <p className="text-sm font-black uppercase tracking-widest text-slate-400">
                                {searchQuery ? 'No widgets found' : 'Loading widgets...'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredWidgets.map((widget) => {
                                const IconComponent = widget.icon;
                                const colorClass = (colorClasses as any)[widget.color];
                                const hoverClass = (hoverClasses as any)[widget.color];
                                
                                return (
                                    <button
                                        key={widget.id}
                                        onClick={() => router.push(widget.path)}
                                        className={`flex flex-col items-start p-6 rounded-2xl border-2 transition-all active:scale-95 backdrop-blur-sm bg-white/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:shadow-lg ${hoverClass}`}
                                    >
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 border-2 ${colorClass}`}>
                                            <IconComponent size={24} />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                                            {widget.title}
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed text-left">
                                            {widget.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
}
