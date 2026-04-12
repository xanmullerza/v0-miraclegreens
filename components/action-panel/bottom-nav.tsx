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
    const { navigateTo, setIsActionPanelOpen, expandedButton, setExpandedButton, isActionPanelOpen, activeMainTab, setActiveMainTab } = useActionPanel();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Reset expanded state when pathname or search modifiers change to allow auto-expansion on new pages
    useEffect(() => {
        setExpandedButton(null);
    }, [pathname, searchParams]);

    // The active secondary menu to show
    // Robust Logic: Submenus should only appear if explicitly requested (expandedButton)
    // or if the action panel is open to a specific module view.
    // We NO LONGER auto-expand based on the background page URL (?tab=...) to prevent "jumping" menus.
    const activeCategory = (() => {
        if (expandedButton === 'none') return null;
        if (expandedButton) return expandedButton;
        
        // If panel is closed, we always show the primary navigation
        if (!isActionPanelOpen) return null;
        
        // Auto-expand based on active panel view for context
        if (activeView === 'cookbook' || activeView === 'recipe-detail' || activeView === 'recipe-builder' || activeView === 'import') return 'cookbook';
        if (activeView === 'nutridex' || activeView === 'comparator') return 'library';
        if (activeView === 'planner' || activeView === 'shopping' || activeView === 'pantry') return 'tracker';
        
        return null;
    })();


    // Secondary menu options for each button
    // Colors: Blue (home), Emerald (cookbook), Cyan (library), Amber/Violet (tracker)
    const secondaryMenus = {
        cookbook: [
            { id: 'view', label: 'Recipes', icon: BookOpen, color: 'emerald', onClick: () => { navigateTo('cookbook'); } },
            { id: 'create', label: 'Maker', icon: Plus, color: 'emerald', onClick: () => { navigateTo('recipe-builder'); } },
            { id: 'import', label: 'Importer', icon: Upload, color: 'emerald', onClick: () => { navigateTo('import'); } },
        ],
        library: [
            { id: 'foods', label: 'Foods', icon: Leaf, color: 'cyan', onClick: () => { setIsActionPanelOpen(false); setActiveMainTab('foods'); router.push('/'); } },
            { id: 'nutridex', label: 'Nutridex', icon: Activity, color: 'violet', onClick: () => { navigateTo('nutridex'); } },
            { id: 'comparator', label: 'Comparator', icon: Scale, color: 'cyan', onClick: () => { navigateTo('comparator'); } },
        ],
        tracker: [
            { id: 'planner', label: 'Planner', icon: Calendar, color: 'amber', onClick: () => { setActiveMainTab('planner'); setIsActionPanelOpen(false); router.push('/'); } },
            { id: 'shopping', label: 'Shopping', icon: ShoppingBasket, color: 'violet', onClick: () => { navigateTo('shopping'); } },
            { id: 'pantry', label: 'Pantry', icon: Shapes, color: 'amber', onClick: () => { navigateTo('pantry'); } },
        ]
    };

    // Color config for neon glow effects
    const colorConfig: Record<string, { text: string; border: string; bg: string; glow: string; hoverBorder: string }> = {
        blue: {
            text: 'text-blue-500',
            border: 'border-blue-500/30',
            bg: 'bg-blue-500/10',
            glow: 'shadow-[0_0_12px_rgba(59,130,246,0.6)]',
            hoverBorder: 'hover:border-blue-500/50',
        },
        emerald: {
            text: 'text-emerald-500',
            border: 'border-emerald-500/30',
            bg: 'bg-emerald-500/10',
            glow: 'shadow-[0_0_12px_rgba(16,185,129,0.6)]',
            hoverBorder: 'hover:border-emerald-500/50',
        },
        cyan: {
            text: 'text-cyan-500',
            border: 'border-cyan-500/30',
            bg: 'bg-cyan-500/10',
            glow: 'shadow-[0_0_12px_rgba(6,182,212,0.6)]',
            hoverBorder: 'hover:border-cyan-500/50',
        },
        amber: {
            text: 'text-amber-500',
            border: 'border-amber-500/30',
            bg: 'bg-amber-500/10',
            glow: 'shadow-[0_0_12px_rgba(245,158,11,0.6)]',
            hoverBorder: 'hover:border-amber-500/50',
        },
        violet: {
            text: 'text-violet-500',
            border: 'border-violet-500/30',
            bg: 'bg-violet-500/10',
            glow: 'shadow-[0_0_12px_rgba(139,92,246,0.6)]',
            hoverBorder: 'hover:border-violet-500/50',
        },
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
                    {/* Permanent Home Button - Blue */}
                    <button
                        onClick={() => {
                            setExpandedButton(null);
                            navigateTo('home');
                        }}
                        className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 active:scale-90 group shrink-0 min-w-[60px] border-2",
                            "text-slate-400 border-slate-300/30 dark:border-slate-700/50 hover:border-blue-500/50 hover:text-blue-500"
                        )}
                        title="Home"
                    >
                        <Home size={20} className="transition-all group-hover:scale-110" />
                        <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Home</span>
                    </button>

                    {secondaryMenus[activeCategory as keyof typeof secondaryMenus]?.map((item) => {
                        const Icon = item.icon;
                        const colors = colorConfig[item.color] || colorConfig.emerald;
                        
                        // Check if this item matches activeView - handle specific mappings
                        const viewMap: Record<string, string> = {
                            'view': 'cookbook',
                            'create': 'recipe-builder'
                        };
                        const targetView = viewMap[item.id] || item.id;
                        
                        let isActive = false;
                        if (item.id === 'foods' || item.id === 'planner') {
                            isActive = !isActionPanelOpen && activeMainTab === item.id;
                        } else if (item.id === 'view') {
                            isActive = (isActionPanelOpen && activeView === 'cookbook') || (!isActionPanelOpen && activeMainTab === 'recipes');
                        } else {
                            isActive = isActionPanelOpen && activeView === targetView;
                        }

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    item.onClick();
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 active:scale-90 group shrink-0 min-w-[60px] border-2",
                                    isActive 
                                        ? cn(colors.text, colors.border, colors.bg, colors.glow)
                                        : cn("text-slate-400 border-slate-300/30 dark:border-slate-700/50", colors.hoverBorder, `hover:${colors.text}`)
                                )}
                                title={item.label}
                            >
                                <Icon size={20} className={cn(
                                    "transition-all group-hover:scale-110",
                                    isActive && colors.text
                                )} />
                                <span className={cn(
                                    "text-[8px] font-black uppercase tracking-widest mt-1",
                                    isActive ? "opacity-100" : "opacity-60"
                                )}>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            ) : (
                // Main menu
                <div className="pointer-events-auto w-full bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-3xl px-2 py-3 grid grid-cols-4 rounded-none border-t border-slate-200/50 dark:border-slate-800/50 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
                    {/* Home Button - Left (Toggle behavior) - Blue */}
                    <button
                        onClick={() => {
                            if (activeView === 'home') {
                                onClose();
                            } else {
                                navigateTo('home');
                            }
                        }}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 active:scale-90 group border-2",
                            activeView === 'home' 
                                ? cn(colorConfig.blue.text, colorConfig.blue.border, colorConfig.blue.bg, colorConfig.blue.glow)
                                : "text-slate-400 border-slate-300/30 dark:border-slate-700/50 hover:border-blue-500/50 hover:text-blue-500"
                        )}
                        title="Home"
                    >
                        <Home size={20} className={cn("transition-all group-hover:scale-110", activeView === 'home' && colorConfig.blue.text)} />
                        <span className={cn("text-[8px] font-black uppercase tracking-widest mt-1", activeView === 'home' ? "opacity-100" : "opacity-60")}>
                            Home
                        </span>
                    </button>

                    {/* Cookbook Button - with dropdown - Emerald */}
                    {(() => {
                        const isCookbookActive = (expandedButton === 'cookbook' || activeView === 'cookbook' || activeView === 'recipe-builder' || activeView === 'import' || activeView === 'recipe-detail') || (!isActionPanelOpen && pathname === '/' && activeMainTab === 'recipes');
                        return (
                            <button
                                onClick={() => {
                                    if (activeCategory === 'cookbook') {
                                        setExpandedButton('none');
                                    } else {
                                        setExpandedButton('cookbook');
                                    }
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 active:scale-90 group flex-1 border-2",
                                    isCookbookActive 
                                        ? cn(colorConfig.emerald.text, colorConfig.emerald.border, colorConfig.emerald.bg, colorConfig.emerald.glow)
                                        : "text-slate-400 border-slate-300/30 dark:border-slate-700/50 hover:border-emerald-500/50 hover:text-emerald-500"
                                )}
                                title="Cookbook"
                            >
                                <BookOpen size={20} className={cn("transition-all group-hover:scale-110", isCookbookActive && colorConfig.emerald.text)} />
                                <span className={cn("text-[8px] font-black uppercase tracking-widest mt-1", isCookbookActive ? "opacity-100" : "opacity-60")}>Cookbook</span>
                            </button>
                        );
                    })()}

                    {/* Library Button - Cyan */}
                    {(() => {
                        const isLibraryActive = (expandedButton === 'library' || activeView === 'nutridex' || activeView === 'comparator') || (!isActionPanelOpen && pathname === '/' && activeMainTab === 'foods');
                        return (
                            <button
                                onClick={() => {
                                    if (activeCategory === 'library') {
                                        setExpandedButton('none');
                                    } else {
                                        setExpandedButton('library');
                                    }
                                }}
                                className={cn(
                                    "flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 active:scale-90 group border-2",
                                    isLibraryActive 
                                        ? cn(colorConfig.cyan.text, colorConfig.cyan.border, colorConfig.cyan.bg, colorConfig.cyan.glow)
                                        : "text-slate-400 border-slate-300/30 dark:border-slate-700/50 hover:border-cyan-500/50 hover:text-cyan-500"
                                )}
                                title="Library"
                            >
                                <LibraryIcon size={20} className={cn("transition-all group-hover:scale-110", isLibraryActive && colorConfig.cyan.text)} />
                                <span className={cn("text-[8px] font-black uppercase tracking-widest mt-1", isLibraryActive ? "opacity-100" : "opacity-60")}>Library</span>
                            </button>
                        );
                    })()}

                    {/* Tracker Button - Amber */}
                    {(() => {
                        const isTrackerActive = (expandedButton === 'tracker' || activeView === 'planner' || activeView === 'shopping' || activeView === 'pantry') || (!isActionPanelOpen && (pathname === '/tracker' || (pathname === '/' && activeMainTab === 'planner')));
                        return (
                            <button
                                onClick={() => {
                                    if (activeCategory === 'tracker') {
                                        setExpandedButton('none');
                                    } else {
                                        setExpandedButton('tracker');
                                    }
                                }}
                                className={cn(
                                    "flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 active:scale-90 group border-2",
                                    isTrackerActive 
                                        ? cn(colorConfig.amber.text, colorConfig.amber.border, colorConfig.amber.bg, colorConfig.amber.glow)
                                        : "text-slate-400 border-slate-300/30 dark:border-slate-700/50 hover:border-amber-500/50 hover:text-amber-500"
                                )}
                                title="Tracker"
                            >
                                <BarChart3 size={20} className={cn("transition-all group-hover:scale-110", isTrackerActive && colorConfig.amber.text)} />
                                <span className={cn("text-[8px] font-black uppercase tracking-widest mt-1", isTrackerActive ? "opacity-100" : "opacity-60")}>Tracker</span>
                            </button>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}

