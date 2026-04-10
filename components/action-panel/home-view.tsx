import React from 'react';
import { 
    Salad, 
    ChevronRight, 
    Calendar, 
    Lock, 
    Package, 
    MessageCircle, 
    Users, 
    TrendingUp, 
    Settings, 
    Leaf, 
    MessageSquarePlus, 
    Sparkles, 
    Zap, 
    Shield, 
    HelpCircle, 
    BookOpen, 
    Upload,
    Globe,
    Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { ActionPanelView, useActionPanel } from '@/lib/context/action-panel-context';

interface HomeViewProps {
    setActiveView: (view: ActionPanelView) => void;
    setShowOnlyMyRecipes: (show: boolean) => void;
    isAdmin: boolean;
}

export function HomeView({
    setActiveView,
    setShowOnlyMyRecipes,
    isAdmin
}: HomeViewProps) {
    const router = useRouter();
    const { setIsActionPanelOpen } = useActionPanel();
    
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
            {/* Header Section */}
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 border border-emerald-400/30 shadow-lg shadow-emerald-500/20">
                    <Leaf size={32} className="text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-black uppercase tracking-[0.25em] text-slate-900 dark:text-white leading-tight">
                        Miracle Greens
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500/80 mt-1.5 px-4 py-0.5 border border-emerald-500/20 rounded-full inline-block">
                        Nutritional Intelligence
                    </p>
                </div>
                
                {/* Quick Info Links */}
                <div className="flex items-center justify-center gap-3 pt-2">
                    {([
                        { label: 'Privacy', view: 'privacy' as const, icon: Shield },
                        { label: 'Support', view: 'support' as const, icon: HelpCircle },
                        { label: 'Terms', view: 'terms' as const, icon: BookOpen },
                    ]).map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.view}
                                onClick={() => setActiveView(item.view)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-emerald-500/10"
                            >
                                <Icon size={12} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="p-4 space-y-6 max-w-sm mx-auto">
                {/* 1. Primary Actions (Featured) */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Zap size={14} className="text-amber-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Quick Start</h3>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={() => setActiveView('messages')}
                            className="w-full flex items-center p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mr-4 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                                <MessageCircle size={24} className="text-cyan-600 dark:text-cyan-400 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex-1 text-left">
                                <h4 className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white">Ask Coach</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest mt-0.5">Start AI Chat</p>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                        </button>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setActiveView('recipe-builder')}
                            className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 hover:shadow-md transition-all group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400 group-hover:text-white" />
                            </div>
                            <h4 className="font-black text-[10px] uppercase tracking-tight text-slate-900 dark:text-white">Maker</h4>
                        </button>

                        <button
                            onClick={() => setActiveView('import')}
                            className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:shadow-md transition-all group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <Upload size={20} className="text-emerald-600 dark:text-emerald-400 group-hover:text-white" />
                            </div>
                            <h4 className="font-black text-[10px] uppercase tracking-tight text-slate-900 dark:text-white">Import</h4>
                        </button>
                    </div>
                </div>

                {/* 2. Main Navigation Sections */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4 px-1 pt-4">
                        <Package size={14} className="text-slate-400" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Navigation</h3>
                    </div>

                    {/* Cookbook Section */}
                    <div className="bg-emerald-500/5 dark:bg-emerald-500/10 rounded-3xl p-5 border border-emerald-500/10 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                            <Salad size={80} className="text-emerald-500 -rotate-12" />
                        </div>
                        <button
                            onClick={() => setActiveView('cookbook')}
                            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all group/card shadow-xs"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover/card:bg-emerald-500 group-hover/card:text-white transition-all">
                                    <BookOpen size={20} className="text-emerald-600 dark:text-emerald-400 group-hover/card:text-white" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white">Cookbook</h4>
                                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">Recipes, Menus & Meals</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover/card:text-emerald-500 group-hover/card:translate-x-1 transition-all" />
                        </button>
                    </div>

                    {/* Tracker Section */}
                    <div className="bg-blue-500/5 dark:bg-blue-500/10 rounded-3xl p-5 border border-blue-500/10 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                            <TrendingUp size={80} className="text-blue-500 -rotate-12" />
                        </div>
                        <button
                            onClick={() => {
                                setIsActionPanelOpen(false);
                                router.push('/tracker');
                            }}
                            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-blue-500/20 hover:border-blue-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all group/card shadow-xs"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover/card:bg-blue-500 group-hover/card:text-white transition-all">
                                    <TrendingUp size={20} className="text-blue-600 dark:text-blue-400 group-hover/card:text-white" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white">Tracker</h4>
                                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">Nutrition Goals</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover/card:text-blue-500 group-hover/card:translate-x-1 transition-all" />
                        </button>
                    </div>

                    {/* Planner, Pantry, Widgets Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setActiveView('planner')}
                            className={cn(
                                "flex flex-col items-center justify-center p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500/50 hover:shadow-md transition-all group relative",
                                !isAdmin && "opacity-50 grayscale"
                            )}
                        >
                            {!isAdmin && <Lock size={12} className="absolute top-3 right-3 text-slate-400" />}
                            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🗂️</span>
                            <h4 className="font-black text-[9px] uppercase tracking-tight text-slate-900 dark:text-white text-center">Planner</h4>
                        </button>

                        <button
                            onClick={() => setActiveView('pantry')}
                            className={cn(
                                "flex flex-col items-center justify-center p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-green-500/50 hover:shadow-md transition-all group relative"
                            )}
                        >
                            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🧺</span>
                            <h4 className="font-black text-[9px] uppercase tracking-tight text-slate-900 dark:text-white text-center">Pantry</h4>
                        </button>

                        <button
                            onClick={() => setActiveView('nutridex')}
                            className={cn(
                                "flex flex-col items-center justify-center p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500/50 hover:shadow-md transition-all group relative",
                                !isAdmin && "opacity-50 grayscale"
                            )}
                        >
                            {!isAdmin && <Lock size={12} className="absolute top-3 right-3 text-slate-400" />}
                            <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🧪</span>
                            <h4 className="font-black text-[9px] uppercase tracking-tight text-slate-900 dark:text-white text-center">Nutridex</h4>
                        </button>

                        <button
                            onClick={() => setActiveView('profile')}
                            className="flex flex-col items-center justify-center p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-500/50 hover:shadow-md transition-all group"
                        >
                            <Settings size={28} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors mb-2" />
                            <h4 className="font-black text-[9px] uppercase tracking-tight text-slate-900 dark:text-white text-center">Account</h4>
                        </button>
                    </div>
                </div>

                {/* 3. Mission / Info Section (From Home Page) */}
                <div className="pt-8 pb-32 space-y-4">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Globe size={14} className="text-emerald-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Our Commitment</h3>
                    </div>

                    <div className="space-y-3">
                        {([
                            { 
                                icon: Globe, 
                                title: "Molecular Focus", 
                                desc: "Precision nutritional intelligence at the molecular level.",
                                color: "emerald"
                            },
                            { 
                                icon: Shield, 
                                title: "Data Privacy", 
                                desc: "Your health data is encrypted and yours alone.",
                                color: "blue"
                            },
                            { 
                                icon: Scale, 
                                title: "Scientific Accuracy", 
                                desc: "Verified nutrient databases and scientific verification.",
                                color: "amber"
                            }
                        ]).map((item, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-start gap-3">
                                    <div className={cn("mt-1", `text-${item.color}-500 flex-shrink-0`)}>
                                        <item.icon size={16} />
                                    </div>
                                    <div>
                                        <h5 className="font-black text-[10px] uppercase tracking-tighter text-slate-900 dark:text-white">{item.title}</h5>
                                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{item.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-8 text-center">
                        <p className="text-[10px] text-slate-400 font-medium italic">
                            Quick toggle: <kbd className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[9px] text-slate-500">⌘/</kbd>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
