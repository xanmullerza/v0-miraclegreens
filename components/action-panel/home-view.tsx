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
                {/* 1. Primary Action */}
                <div className="space-y-4">
                    {isAdmin && (
                        <button
                            onClick={() => setActiveView('messages')}
                            className="w-full flex items-center p-6 rounded-[2rem] bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 hover:border-cyan-500/50 shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 transition-all group"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mr-5 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                                <MessageCircle size={32} className="text-cyan-600 dark:text-cyan-400 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex-1 text-left">
                                <h4 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">Ask Coach</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Start AI Chat</p>
                            </div>
                            <ChevronRight size={20} className="text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                        </button>
                    )}

                    <button
                        onClick={() => setActiveView('profile')}
                        className="w-full flex items-center p-6 rounded-[2rem] bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700/50 hover:border-slate-500/50 shadow-sm hover:shadow-xl transition-all group"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-slate-500/10 flex items-center justify-center mr-5 group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 transition-all">
                            <Settings size={30} className="text-slate-400 group-hover:text-white dark:group-hover:text-slate-900 transition-colors" />
                        </div>
                        <div className="flex-1 text-left">
                            <h4 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">Account</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Manage Settings</p>
                        </div>
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-600 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>
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
