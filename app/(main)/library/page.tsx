'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronDown, Leaf, Activity, Scale, LifeBuoy } from 'lucide-react';
import { PageContainer } from '@/components/ui/page-container';
import { TabHeader } from '@/components/ui/tab-header';
import { FoodsView } from '@/components/foods/food-library-view';
import { useSearch } from '@/lib/context/search-context';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { cn } from '@/lib/utils';

type LibraryView = 'foods' | 'nutridex' | 'comparator' | 'lifeguard';

function LibraryContent() {
    const router = useRouter();
    const { searchQuery, setSearchQuery } = useSearch();
    const { setIsActionPanelOpen, setActiveView } = useActionPanel();

    const [libraryView, setLibraryView] = useState<LibraryView>('foods');
    const [showMenu, setShowMenu] = useState(false);

    // Clear search on unmount
    useEffect(() => () => setSearchQuery(''), [setSearchQuery]);

    const tabs = [
        { id: 'recipes', label: 'Cookbook' },
        { id: 'foods', label: 'Library' },
        { id: 'planner', label: 'Tracker' },
    ];

    const handleTabChange = (id: string) => {
        if (id === 'recipes') router.push('/cookbook');
        else if (id === 'planner') router.push('/tracker');
        else router.push('/library');
    };

    const handleViewChange = (view: LibraryView) => {
        setShowMenu(false);
        if (view === 'nutridex') { setActiveView('nutridex'); setIsActionPanelOpen(true); return; }
        if (view === 'comparator') { setActiveView('comparator'); setIsActionPanelOpen(true); return; }
        if (view === 'lifeguard') { setActiveView('lifeguard'); setIsActionPanelOpen(true); return; }
        setLibraryView(view);
    };

    const menuOptions: { view: LibraryView; label: string; icon: React.ReactNode; activeClass: string }[] = [
        { view: 'foods',      label: 'Foods',      icon: <Leaf size={12} />,     activeClass: 'bg-cyan-600 text-white border-cyan-600 shadow-cyan-500/20'    },
        { view: 'nutridex',   label: 'Nutridex',   icon: <Activity size={12} />, activeClass: 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-fuchsia-500/20' },
        { view: 'comparator', label: 'Comparator', icon: <Scale size={12} />,    activeClass: 'bg-amber-500 text-white border-amber-500 shadow-amber-500/20'  },
        { view: 'lifeguard',  label: 'Lifeguard',  icon: <LifeBuoy size={12} />, activeClass: 'bg-red-500 text-white border-red-500 shadow-red-500/20'        },
    ];

    const current = menuOptions.find(o => o.view === libraryView) || menuOptions[0];

    const inventorySwitcher = (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={cn(
                    "h-10 px-4 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border shrink-0",
                    current.activeClass
                )}
            >
                {current.icon}
                <span>{current.label}</span>
                <ChevronDown size={10} className={cn("transition-transform", showMenu && "rotate-180")} />
            </button>

            {showMenu && (
                <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xl z-50 p-1 min-w-[150px]">
                    {menuOptions.map(({ view, label, icon }) => (
                        <button
                            key={view}
                            onClick={() => handleViewChange(view)}
                            className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                libraryView === view
                                    ? "bg-cyan-600 text-white"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                            )}
                        >
                            {icon}
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500">
            <TabHeader
                tabs={tabs}
                activeTab="foods"
                onTabChange={handleTabChange}
            />
            <PageContainer maxWidth="max-w-7xl">
                <div className="py-6 animate-in slide-in-from-bottom-4 duration-700">
                    <FoodsView
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        dropdownContent={inventorySwitcher}
                    />
                </div>
            </PageContainer>
        </div>
    );
}

export default function LibraryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="animate-spin text-cyan-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading Library...</p>
            </div>
        }>
            <LibraryContent />
        </Suspense>
    );
}
