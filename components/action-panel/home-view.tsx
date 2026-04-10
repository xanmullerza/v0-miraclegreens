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
    Globe,
    Scale,
    Flame,
    Dna,
    Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { ActionPanelView, useActionPanel } from '@/lib/context/action-panel-context';

import { HomeTabShell } from './home-tab-shell';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

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
    const { profile } = useUserPreferences();
    const isLoggedIn = !!profile.nickname || !!profile.name;
    const [activeTab, setActiveTab] = React.useState<'browse' | 'chat' | 'settings' | 'login'>('browse');
    const [isHeaderVisible, setIsHeaderVisible] = React.useState(true);
    const brandRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsHeaderVisible(entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        if (brandRef.current) {
            observer.observe(brandRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const handleTabChange = (tab: 'browse' | 'chat' | 'settings' | 'login') => {
        setActiveTab(tab);
        if (tab === 'chat') setActiveView('messages');
        else if (tab === 'settings') setActiveView('profile');
        else if (tab === 'login') setActiveView('profile');
        else if (tab === 'browse') setActiveView('home');
    };
    
    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
            <div className={cn(
                "absolute top-0 left-0 right-0 z-30 transition-all duration-500 ease-in-out",
                isHeaderVisible ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
            )}>
                <HomeTabShell 
                    isAdmin={isAdmin}
                    isLoggedIn={isLoggedIn}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Brand Section */}
                <div 
                    ref={brandRef}
                    className="flex flex-col items-center justify-center py-10 text-center space-y-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800"
                >
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
                </div>

                <div className="p-4 space-y-6 max-w-sm mx-auto">
                    {/* Quick Info Links moved here */}
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

                {/* 3. Mission / Info Section (From Home Page) */}
                <div className="pt-8 pb-32 space-y-4">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <Globe size={14} className="text-emerald-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Our Commitment</h3>
                    </div>

                    <div className="space-y-3">
                        {([
                            { 
                                icon: Flame, 
                                title: "Let me cook :--)", 
                                desc: "Minimal friction. No nag screens. We stay out of the way so you can just use the app.",
                                color: "orange"
                            },
                            { 
                                icon: Globe, 
                                title: "Molecular Focus", 
                                desc: "Precision nutritional intelligence at the molecular level, tracking beyond just the basics.",
                                color: "emerald"
                            },
                            { 
                                icon: Dna, 
                                title: "Ancestral Alignment", 
                                desc: "Bridging modern biological science with your evolutionary dietary blueprint.",
                                color: "purple"
                            },
                            { 
                                icon: Target, 
                                title: "Precision Calibration", 
                                desc: "Mass-conserving math ensures what you track in the lab matches what enters your body.",
                                color: "rose"
                            },
                            { 
                                icon: Shield, 
                                title: "Data Privacy", 
                                desc: "Your health data is local, encrypted, and yours alone. We don't sell your DNA.",
                                color: "blue"
                            },
                            { 
                                icon: Scale, 
                                title: "Scientific Accuracy", 
                                desc: "Strictly verified nutrient databases and evidence-based metabolic equations.",
                                color: "amber"
                            }
                        ]).map((item, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-start gap-3">
                                    <div className={cn("mt-1 flex-shrink-0", {
                                        "text-orange-500": item.color === 'orange',
                                        "text-emerald-500": item.color === 'emerald',
                                        "text-purple-500": item.color === 'purple',
                                        "text-rose-500": item.color === 'rose',
                                        "text-blue-500": item.color === 'blue',
                                        "text-amber-500": item.color === 'amber'
                                    })}>
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
    </div>
    );
}
