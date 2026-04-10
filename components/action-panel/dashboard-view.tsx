import { Salad, ChevronRight, Calendar, Lock, Package, MessageCircle, Users, TrendingUp, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { ActionPanelView, useActionPanel } from '@/lib/context/action-panel-context';

interface DashboardViewProps {
    setActiveView: (view: ActionPanelView) => void;
    setShowOnlyMyRecipes: (show: boolean) => void;
    isAdmin: boolean;
}

export function DashboardView({
    setActiveView,
    setShowOnlyMyRecipes,
    isAdmin
}: DashboardViewProps) {
    const router = useRouter();
    const { setIsActionPanelOpen } = useActionPanel();
    
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
            {/* Cookbook Section */}
            <div className="bg-emerald-500/10 dark:bg-emerald-500/20 rounded-3xl p-6 border border-emerald-500/20 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                    <Salad size={120} className="text-emerald-500 -rotate-12" />
                </div>
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Cookbook</h3>
                </div>
                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => setActiveView('cookbook')}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all group shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <Salad size={24} className="text-emerald-600 dark:text-emerald-400 group-hover:text-white" />
                            </div>
                            <div className="text-left">
                                <h4 className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white">View Recipes</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">Access your full library</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </button>
                </div>
            </div>

            {/* Tracker Section */}
            <div className="bg-green-500/10 dark:bg-green-500/20 rounded-3xl p-6 border border-green-500/20 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                    <TrendingUp size={120} className="text-green-500 -rotate-12" />
                </div>
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tracker</h3>
                </div>
                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => {
                            setIsActionPanelOpen(false);
                            router.push('/tracker');
                        }}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-green-500/20 hover:border-green-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all group shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all">
                                <TrendingUp size={24} className="text-green-600 dark:text-green-400 group-hover:text-white" />
                            </div>
                            <div className="text-left">
                                <h4 className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white">Open Tracker</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">Monitor your nutritional intake</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                    </button>
                </div>
            </div>

            {/* Settings Section */}
            <div className="bg-slate-500/10 dark:bg-slate-500/20 rounded-3xl p-6 border border-slate-500/20 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                    <Settings size={120} className="text-slate-500 -rotate-12" />
                </div>
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Settings</h3>
                </div>
                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => setActiveView('profile')}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-500/20 hover:border-slate-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all group shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-500/10 flex items-center justify-center group-hover:bg-slate-500 group-hover:text-white transition-all">
                                <Settings size={24} className="text-slate-600 dark:text-slate-400 group-hover:text-white" />
                            </div>
                            <div className="text-left">
                                <h4 className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white">View Settings</h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">Customize your preferences</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                    </button>
                </div>
            </div>

            {/* Coach Section */}
            {isAdmin && (
                <div className="bg-cyan-500/10 dark:bg-cyan-500/20 rounded-3xl p-6 border border-cyan-500/20 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                        <Users size={120} className="text-cyan-500 -rotate-12" />
                    </div>
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Coach</h3>
                    </div>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => setActiveView('messages')}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all group shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-all">
                                    <MessageCircle size={24} className="text-cyan-600 dark:text-cyan-400 group-hover:text-white" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-black text-xs uppercase tracking-tight text-slate-900 dark:text-white">Ask Coach</h4>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">Get personalized guidance</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>
                </div>
            )}

            {/* Planner Section */}
            <div className="bg-blue-500/10 dark:bg-blue-500/20 rounded-3xl p-6 border border-blue-500/20 shadow-sm relative overflow-hidden group cursor-pointer transition-all hover:border-blue-500/40" onClick={() => toast('🚀 Meal planning features coming soon! We\'re polishing the details to make it perfect for you.')}>
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                    <Calendar size={120} className="text-blue-500 -rotate-12" />
                </div>
                {/* Lock Icon */}
                {!isAdmin && (
                    <div className="absolute top-3 right-3 z-10 bg-blue-500 rounded-full p-1.5 shadow-lg">
                        <Lock size={14} className="text-white" />
                    </div>
                )}
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Planner</h3>
                </div>
                <div className={cn("grid grid-cols-2 gap-6", !isAdmin && "opacity-50 pointer-events-none")}>
                    <button
                        onClick={() => setActiveView('planner')}
                        className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                    >
                        <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] transition-all">🗂️</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">Meal Planner</span>
                    </button>
                    <button
                        onClick={() => setActiveView('pantry')}
                        className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                    >
                        <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(34,197,94,0.3)] transition-all">🧺</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-green-500 transition-colors">Pantry</span>
                    </button>
                    <button
                        onClick={() => setActiveView('shopping')}
                        className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                    >
                        <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.3)] transition-all">🛒</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">Shopping</span>
                    </button>
                    <button
                        onClick={() => setActiveView('help-planner')}
                        className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                    >
                        <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] transition-all">❓</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">Help Guide</span>
                    </button>
                </div>
            </div>

            {/* Widgets Section */}
            <div className="bg-purple-500/10 dark:bg-purple-500/20 rounded-3xl p-6 border border-purple-500/20 shadow-sm relative overflow-hidden group cursor-pointer transition-all hover:border-purple-500/40" onClick={() => toast('✨ Advanced widgets coming soon! We\'re polishing the details to make it perfect for you.')}>
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                    <Package size={120} className="text-purple-500 -rotate-12" />
                </div>
                {/* Lock Icon */}
                {!isAdmin && (
                    <div className="absolute top-3 right-3 z-10 bg-purple-500 rounded-full p-1.5 shadow-lg">
                        <Lock size={14} className="text-white" />
                    </div>
                )}
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Widgets</h3>
                </div>
                <div className={cn("grid grid-cols-2 gap-6", !isAdmin && "opacity-50 pointer-events-none")}>
                    <button
                        onClick={() => setActiveView('nutridex')}
                        className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                    >
                        <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(217,70,239,0.3)] transition-all">🧪</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-fuchsia-500 transition-colors">Nutrients Guide</span>
                    </button>
                    <button
                        onClick={() => setActiveView('comparator')}
                        className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                    >
                        <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(79,70,229,0.3)] transition-all">⚖️</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">Comparator</span>
                    </button>
                    <button
                        onClick={() => setActiveView('lifeguard')}
                        className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                    >
                        <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(20,184,166,0.3)] transition-all">🛡️</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-teal-500 transition-colors">Lifeguard</span>
                    </button>
                    <button
                        onClick={() => setActiveView('help-widgets')}
                        className="flex flex-col items-center justify-center gap-2 text-center transform transition duration-200 hover:scale-[1.05] active:scale-95 group"
                    >
                        <span className="text-3xl group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all">❓</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">Help Guide</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
