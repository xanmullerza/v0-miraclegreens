'use client';

import { Home, BookOpen, BarChart3, Wand2, X, Library as LibraryIcon, Plus, Upload, Download, Leaf, Activity, Scale, LifeBuoy, ShoppingBasket, Shapes, Calendar, ChevronLeft, Salad, Menu } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

import { useActionPanel, ActionPanelView } from '@/lib/context/action-panel-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { HeaderLogo } from '@/components/ui/header-logo';

interface ActionPanelBottomNavProps {
    activeView: ActionPanelView;
    onClose: () => void;
    isInline?: boolean;
    orientation?: 'bottom' | 'left' | 'right';
}

export function ActionPanelBottomNav({
    activeView,
    onClose,
    isInline = false,
    orientation = 'bottom'
}: ActionPanelBottomNavProps) {
    const { navigateTo, setIsActionPanelOpen, expandedButton, setExpandedButton, isActionPanelOpen, activeMainTab, setActiveMainTab } = useActionPanel();
    const { profile } = useUserPreferences();
    const isVertical = orientation === 'left' || orientation === 'right';
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [showTopNavbar, setShowTopNavbar] = useState(false);

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
    const secondaryMenus = {
        cookbook: [
            { id: 'view', label: 'Recipes', icon: Salad, color: 'emerald', onClick: () => { navigateTo('cookbook'); } },
            { id: 'create', label: 'Maker', icon: Plus, color: 'cyan', onClick: () => { navigateTo('recipe-builder'); } },
            { id: 'import', label: 'Importer', icon: Upload, color: 'violet', onClick: () => { navigateTo('import'); } },
            { id: 'back', label: 'Back', icon: ChevronLeft, color: 'slate', onClick: () => { router.back(); } },
        ],
        library: [
            { id: 'foods', label: 'Foods', icon: Leaf, color: 'cyan', onClick: () => { setIsActionPanelOpen(false); setActiveMainTab('foods'); router.push('/'); } },
            { id: 'nutridex', label: 'Nutridex', icon: Activity, color: 'fuchsia', onClick: () => { navigateTo('nutridex'); } },
            { id: 'comparator', label: 'Comparator', icon: Scale, color: 'amber', onClick: () => { navigateTo('comparator'); } },
        ],
        tracker: [
            { id: 'planner', label: 'Planner', icon: Calendar, color: 'blue', onClick: () => { setActiveMainTab('planner'); setIsActionPanelOpen(false); router.push('/'); } },
            { id: 'shopping', label: 'Shopping', icon: ShoppingBasket, color: 'amber', onClick: () => { navigateTo('shopping'); } },
            { id: 'pantry', label: 'Pantry', icon: Shapes, color: 'emerald', onClick: () => { navigateTo('pantry'); } },
        ]
    };

    // Check if we should show expanded menu
    const showExpandedMenu = activeCategory && secondaryMenus[activeCategory as keyof typeof secondaryMenus];

    return (
        <div className="relative">
            {/* Top Navbar Slideout */}
            <div className={cn(
                "absolute bottom-full left-0 right-0 z-50 transition-all duration-300 ease-in-out",
                showTopNavbar ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
            )}>
                <div className="relative">
                    <HeaderLogo />
                    <button
                        onClick={() => {
                            setIsActionPanelOpen(true);
                            navigateTo('import');
                        }}
                        className="absolute top-3 right-3 h-10 w-10 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center transition hover:bg-emerald-400 focus:outline-none"
                        title="Import Recipe"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Bottom Navbar */}
            <div className={cn(
                isInline ? "sticky bottom-0 w-full" : isVertical ? `fixed top-0 bottom-0 ${orientation === 'left' ? 'left-0' : 'right-0'} w-20` : "fixed bottom-0 left-0 right-0",
                "z-[100] flex justify-center pointer-events-none transition-all duration-500",
                !isActionPanelOpen && !isVertical && "animate-in slide-in-from-bottom-8"
            )}>
            {showExpandedMenu ? (
                // Expanded secondary menu
                <div className={cn(
                    "pointer-events-auto bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-none",
                    isVertical
                        ? "h-full w-20 grid grid-rows-5 gap-2 px-2 py-3 border-slate-200/50 dark:border-slate-800/50 shadow-[-4px_0_30px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_30px_rgba(0,0,0,0.5)]"
                        : "w-full px-2 py-3 grid grid-cols-5 border-t border-slate-200/50 dark:border-slate-800/50 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-3"
                )}>
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

                        // Color classes for muted and neon states
                        const colorStyles = {
                            emerald: {
                                muted: 'text-emerald-400/50 border-emerald-500/30',
                                active: 'text-emerald-400 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6),0_0_24px_rgba(52,211,153,0.3)]'
                            },
                            cyan: {
                                muted: 'text-cyan-400/50 border-cyan-500/30',
                                active: 'text-cyan-400 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6),0_0_24px_rgba(34,211,238,0.3)]'
                            },
                            violet: {
                                muted: 'text-violet-400/50 border-violet-500/30',
                                active: 'text-violet-400 border-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.6),0_0_24px_rgba(167,139,250,0.3)]'
                            },
                            amber: {
                                muted: 'text-amber-400/50 border-amber-500/30',
                                active: 'text-amber-400 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6),0_0_24px_rgba(251,191,36,0.3)]'
                            },
                            // Fallback colors for library/tracker submenus
                            fuchsia: {
                                muted: 'text-fuchsia-400/50 border-fuchsia-500/30',
                                active: 'text-fuchsia-400 border-fuchsia-400 shadow-[0_0_12px_rgba(232,121,249,0.6),0_0_24px_rgba(232,121,249,0.3)]'
                            },
                            blue: {
                                muted: 'text-blue-400/50 border-blue-500/30',
                                active: 'text-blue-400 border-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.6),0_0_24px_rgba(96,165,250,0.3)]'
                            }
                        };

                        if (item.id === 'back') {
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        item.onClick();
                                    }}
                                    className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-90 group shrink-0 min-w-[60px] text-slate-400 hover:text-emerald-500"
                                    title={item.label}
                                >
                                    <Icon size={20} className="transition-transform group-hover:scale-110" />
                                    <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        }

                        const itemColor = item.color as keyof typeof colorStyles;
                        const colorStyle = colorStyles[itemColor] || colorStyles.emerald;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    item.onClick();
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-90 group shrink-0 min-w-[60px]"
                                )}
                                title={item.label}
                            >
                                <div className={cn(
                                    "p-2 rounded-xl border-2 transition-all duration-300",
                                    isActive ? colorStyle.active : colorStyle.muted,
                                    !isActive && "hover:border-opacity-60 hover:text-opacity-80"
                                )}>
                                    <Icon size={18} className="transition-transform group-hover:scale-110" />
                                </div>
                                <span className={cn(
                                    "text-[8px] font-black uppercase tracking-widest mt-1.5 transition-opacity",
                                    isActive ? "opacity-100" : "opacity-50"
                                )}>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            ) : (
                // Main menu
                <div className={cn(
                    "pointer-events-auto bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-none",
                    isVertical
                        ? `h-full w-20 grid gap-2 px-2 py-3 border-slate-200/50 dark:border-slate-800/50 shadow-[-4px_0_30px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_30px_rgba(0,0,0,0.5)] ${profile?.isAdmin ? 'grid-rows-5' : 'grid-rows-3'}`
                        : `w-full px-2 py-3 border-t border-slate-200/50 dark:border-slate-800/50 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_30px_rgba(0,0,0,0.5)] ${profile?.isAdmin ? 'grid grid-cols-5' : 'grid grid-cols-3'}`
                )}>
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

                    <button
                        onClick={() => {
                            setIsActionPanelOpen(false);
                            setActiveMainTab('recipes');
                            router.push('/');
                        }}
                        className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-90 group flex-1",
                            (!isActionPanelOpen && activeMainTab === 'recipes') ? "text-emerald-500 bg-emerald-500/5 font-black uppercase tracking-widest" : "text-slate-400 hover:text-emerald-500"
                        )}
                        title="Recipes"
                    >
                        <Salad size={20} className="transition-transform group-hover:scale-110" />
                        <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Recipes</span>
                    </button>

                    <button
                        onClick={() => {
                            setIsActionPanelOpen(false);
                            setActiveMainTab('foods');
                            router.push('/');
                        }}
                        className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-90 group flex-1",
                            (!isActionPanelOpen && activeMainTab === 'foods') ? "text-cyan-500 bg-cyan-500/5 font-black uppercase tracking-widest" : "text-slate-400 hover:text-cyan-500"
                        )}
                        title="Food"
                    >
                        <Leaf size={20} className="transition-transform group-hover:scale-110" />
                        <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Food</span>
                    </button>

                    <button
                        onClick={() => {
                            if (activeCategory === 'tracker') {
                                setExpandedButton('none');
                            } else {
                                setExpandedButton('tracker');
                            }
                        }}
                        className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-90 group flex-1",
                            (expandedButton === 'tracker' || activeView === 'planner' || activeView === 'shopping' || activeView === 'pantry') || (!isActionPanelOpen && activeMainTab === 'planner') ? "text-violet-500 bg-violet-500/5 font-black uppercase tracking-widest" : "text-slate-400 hover:text-violet-500"
                        )}
                        title="Tracker"
                    >
                        <BarChart3 size={20} className="transition-transform group-hover:scale-110" />
                        <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Tracker</span>
                    </button>

                    <button
                        onClick={() => {
                            setShowTopNavbar(!showTopNavbar);
                        }}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all active:scale-90 group",
                            showTopNavbar ? "text-emerald-500 bg-emerald-500/5 font-black uppercase tracking-widest" : "text-slate-400 hover:text-slate-500"
                        )}
                        title="Menu"
                    >
                        <Menu size={20} className="transition-transform group-hover:scale-110" />
                        <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Menu</span>
                    </button>
                </div>
            )}
            </div>
        </div>
    );
}

