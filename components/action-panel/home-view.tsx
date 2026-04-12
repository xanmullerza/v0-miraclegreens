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
    Target,
    Cookie
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { ActionPanelView, useActionPanel } from '@/lib/context/action-panel-context';

import { HomeTabShell } from './home-tab-shell';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { FeatureCarousel } from '@/components/ux/feature-carousel';

const commitmentColorClasses = {
    orange: {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
    },
    emerald: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
    },
    purple: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
    },
    rose: {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
    },
    blue: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
    },
    amber: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
    }
};

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
                    <div className="flex items-center justify-center gap-3 pt-1">
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
                    {/* Feature Carousel - What Miracle Greens is about */}
                    <FeatureCarousel />

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
                                title: "Let Me Cook", 
                                desc: "We stay out of the way so you can just focus on your food. No bells and whistles, no mess, no fuss.",
                                color: "orange"
                            },
                            { 
                                icon: Globe, 
                                title: "Beyond the Label", 
                                desc: "We look deeper than just calories. We track the tiny nutrients that actually make a difference.",
                                color: "emerald"
                            },
                            { 
                                icon: Target, 
                                title: "No Guesswork", 
                                desc: "We do the messy math for you behind the scenes. What you track is exactly what you get.",
                                color: "rose"
                            },
                            { 
                                icon: Shield, 
                                title: "Your Data, Your Rules", 
                                desc: "Your health info stays on your device. We think your data belongs to you, not a big corp.",
                                color: "blue"
                            }
                        ]).map((item, i) => {
                            const colors = commitmentColorClasses[item.color as keyof typeof commitmentColorClasses];
                            return (
                            <div key={i} className={cn(
                                "p-4 rounded-2xl border",
                                colors.bg,
                                "dark:bg-gradient-to-br dark:from-slate-800/80 dark:to-slate-900/60",
                                colors.border
                            )}>
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
                                        <h5 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">{item.title}</h5>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* App Etiquette Section */}
                    <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative p-8 rounded-3xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 shadow-xl overflow-hidden">
                                <div className="absolute top-0 right-0 -translate-x-4 translate-y-4 opacity-[0.03] dark:opacity-[0.05]">
                                    <Cookie size={120} className="rotate-12" />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-6 flex items-center gap-2">
                                    <Zap size={14} />
                                    App Etiquette
                                </h3>
                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed italic">
                                    "No pesky popups, annoying ads, or even emails. The only cookies around here are found in our recipes."
                                </p>
                                <div className="mt-6 flex items-center gap-2">
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                                    <span className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-300">theo</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
    </div>
    );
}
