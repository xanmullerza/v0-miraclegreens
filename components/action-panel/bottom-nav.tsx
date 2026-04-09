'use client';

import { Home, BookOpen, BarChart3, Wand2, X, Library as LibraryIcon, Plus, Upload, Download, Leaf, Activity, Scale, LifeBuoy, ShoppingBasket, Shapes, Calendar } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

import { useActionPanel, ActionPanelView } from '@/lib/context/action-panel-context';

interface ActionPanelBottomNavProps {
    activeView: ActionPanelView;
    onClose: () => void;
    isInline?: boolean;
}

export function ActionPanelBottomNav({
    activeView,
    onClose,
    isInline = false
}: ActionPanelBottomNavProps) {
    const { navigateTo, setIsActionPanelOpen, expandedButton, setExpandedButton, isActionPanelOpen } = useActionPanel();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Reset expanded state when pathname changes to allow auto-expansion on new pages
    useEffect(() => {
        setExpandedButton(null);
    }, [pathname]);

    // Determine the default category base on current path - only if tab is explicitly active
    const pathCategory = (pathname === '/' && searchParams.get('tab') === 'recipes') 
        ? 'cookbook' 
        : (pathname === '/' && searchParams.get('tab') === 'foods') 
            ? 'library' 
            : (pathname === '/' && searchParams.get('tab') === 'planner') 
                ? 'tracker' 
                : null;
    
    // The active secondary menu to show
    const activeCategory = expandedButton === 'none' ? null : (expandedButton || (activeView === 'home' || activeView === 'guide' ? null : pathCategory));


    // Secondary menu options for each button
    const secondaryMenus = {
        cookbook: [
            { id: 'view', label: 'View', icon: BookOpen, color: 'text-emerald-500', onClick: () => { navigateTo('cookbook'); } },
            { id: 'create', label: 'Create', icon: Plus, color: 'text-emerald-600', onClick: () => { navigateTo('recipe-builder'); } },
            { id: 'import', label: 'Import', icon: Upload, color: 'text-blue-500', onClick: () => { navigateTo('import'); } },
        ],
        library: [
            { id: 'foods', label: 'Foods', icon: Leaf, color: 'text-cyan-500', onClick: () => { setIsActionPanelOpen(false); router.push('/?tab=foods'); } },
            { id: 'nutridex', label: 'Nutridex', icon: Activity, color: 'text-fuchsia-500', onClick: () => { navigateTo('nutridex'); } },
            { id: 'comparator', label: 'Comparator', icon: Scale, color: 'text-amber-500', onClick: () => { navigateTo('comparator'); } },
        ],
        tracker: [
            { id: 'planner', label: 'Planner', icon: Calendar, color: 'text-blue-500', onClick: () => { router.push('/?tab=planner'); setIsActionPanelOpen(false); } },
            { id: 'shopping', label: 'Shopping', icon: ShoppingBasket, color: 'text-amber-500', onClick: () => { navigateTo('shopping'); } },
            { id: 'pantry', label: 'Pantry', icon: Shapes, color: 'text-emerald-500', onClick: () => { navigateTo('pantry'); } },
        ]
    };

    // Check if we should show expanded menu
    const showExpandedMenu = activeCategory && secondaryMenus[activeCategory as keyof typeof secondaryMenus];

    return (
        <div className={cn(
            isInline ? "sticky bottom-0 w-full" : "fixed bottom-0 left-0 right-0",
            "z-[100] flex justify-center pointer-events-none transition-all duration-500",
            !isActionPanelOpen && "animate-in slide-in-from-bottom-8"
        )}>
            {showExpandedMenu ? (
                // Expanded secondary menu
                <div className="pointer-events-auto w-full bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-3xl px-2 py-3 grid grid-cols-4 rounded-none border-t border-slate-200/50 dark:border-slate-800/50 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-3">
                    {/* Permanent Home Button */}
                    <button
                        onClick={() => {
                            setExpandedButton(null);
                            navigateTo('home');
                        }}
                        className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-90 group shrink-0 min-w-[60px] text-slate-400 hover:text-emerald-500"
                        title="Home"
                    >
                        <Home size={20} className="transition-transform group-hover:scale-110" />
                        <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Home</span>
                    </button>

                    {secondaryMenus[activeCategory as keyof typeof secondaryMenus]?.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    item.onClick();
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-90 group shrink-0 min-w-[60px]",
                                    item.color
                                )}
                                title={item.label}
                            >
                                <Icon size={20} className="transition-transform group-hover:scale-110" />
                                <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            ) : (
                // Main menu
                <div className="pointer-events-auto w-full bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-3xl px-2 py-3 grid grid-cols-4 rounded-none border-t border-slate-200/50 dark:border-slate-800/50 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
                    {/* Home Button - Left (Toggle behavior) */}
                    <button
                        onClick={() => {
                            if (activeView === 'home') {
                                onClose();
                            } else {
                                navigateTo('home');
                            }
                        }}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-90 group",
                            activeView === 'home' ? "text-emerald-500 bg-emerald-500/5 font-black uppercase tracking-widest" : "text-slate-400 hover:text-emerald-500"
                        )}
                        title="Home"
                    >
                        <Home size={20} className="transition-transform group-hover:scale-110" />
                        <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">
                            Home
                        </span>
                    </button>

                    {/* Cookbook Button - with dropdown */}
                    <button
                        onClick={() => {
                            if (activeCategory === 'cookbook') {
                                setExpandedButton('none');
                            } else {
                                setExpandedButton('cookbook');
                            }
                        }}
                        className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-90 group flex-1",
                            (expandedButton === 'cookbook' || activeView === 'cookbook' || activeView === 'recipe-builder' || activeView === 'import' || activeView === 'recipe-detail') || (!isActionPanelOpen && pathname === '/' && (!searchParams.get('tab') || searchParams.get('tab') === 'recipes')) ? "text-emerald-500 bg-emerald-500/5 font-black uppercase tracking-widest" : "text-slate-400 hover:text-emerald-500"
                        )}
                        title="Cookbook"
                    >
                        <BookOpen size={20} className={cn("transition-transform group-hover:scale-110", pathname === '/cookbook' && "animate-pulse")} />
                        <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Cookbook</span>
                    </button>

                    {/* Library Button */}
                    <button
                        onClick={() => {
                            if (activeCategory === 'library') {
                                setExpandedButton('none');
                            } else {
                                setExpandedButton('library');
                            }
                        }}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-90 group",
                            (expandedButton === 'library' || activeView === 'nutridex' || activeView === 'comparator') || (!isActionPanelOpen && pathname === '/' && searchParams.get('tab') === 'foods') ? "text-cyan-500 bg-cyan-500/5 font-black uppercase tracking-widest" : "text-slate-400 hover:text-cyan-500"
                        )}
                        title="Library"
                    >
                        <LibraryIcon size={20} className={cn("transition-transform group-hover:scale-110", pathname.startsWith('/library') && "animate-pulse")} />
                        <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Library</span>
                    </button>

                    {/* Tracker Button */}
                    <button
                        onClick={() => {
                            if (activeCategory === 'tracker') {
                                setExpandedButton('none');
                            } else {
                                setExpandedButton('tracker');
                            }
                        }}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-90 group",
                            (expandedButton === 'tracker' || activeView === 'planner' || activeView === 'shopping' || activeView === 'pantry') || (!isActionPanelOpen && (pathname === '/tracker' || (pathname === '/' && searchParams.get('tab') === 'planner'))) ? "text-blue-500 bg-blue-500/5 font-black uppercase tracking-widest" : "text-slate-400 hover:text-blue-500"
                        )}
                        title="Tracker"
                    >
                        <BarChart3 size={20} className={cn("transition-transform group-hover:scale-110", pathname === '/tracker' && "animate-pulse")} />
                        <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Tracker</span>
                    </button>
                </div>
            )}
        </div>
    );
}

