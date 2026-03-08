'use client';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    ShieldCheck,
    Sparkles,
    Lock,
    ShoppingBasket,
    Package,
    Calendar,
    Library,
    ArrowRight,
    Search
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { Suspense } from 'react';

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}

function LoginContent() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('from') || '/dashboard/meal-o-matic/planner';

    const handleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
                },
            });

            if (error) throw error;
        } catch (error: any) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-emerald-500/30">
            {/* Ambient Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-500/5 blur-[120px] rounded-full animate-pulse delay-700" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
            </div>

            <Link
                href="/"
                className="absolute top-8 left-8 flex items-center gap-3 text-slate-400 hover:text-emerald-500 transition-all font-black uppercase tracking-[0.2em] text-[10px] z-50 group"
            >
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-white transition-all shadow-sm group-hover:shadow-lg group-hover:shadow-emerald-500/20">
                    <ArrowLeft size={16} />
                </div>
                <span>Back Home</span>
            </Link>

            <div className="w-full max-w-[480px] space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative z-10">
                {/* Brand Identity */}
                <div className="text-center space-y-4">
                    <div className="relative inline-block group">
                        <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center mx-auto mb-6 text-emerald-500 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                            <Sparkles size={32} className="text-emerald-500 animate-pulse" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-7 h-7 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-950">
                            <ShieldCheck size={14} className="text-white" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white italic uppercase leading-tight">
                            Personalize Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-sky-500">Kitchen.</span>
                        </h1>
                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.3em] max-w-[300px] mx-auto leading-relaxed">
                            Sign in to secure your custom data & plans
                        </p>
                    </div>
                </div>

                {/* Main Logic Card */}
                <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl p-8 md:p-10 rounded-[3rem] border border-white/50 dark:border-slate-800/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] space-y-10 relative overflow-hidden group/card shadow-2xl">

                    {/* Floating Glow */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full group-hover/card:bg-emerald-500/10 transition-colors duration-1000" />

                    {/* Explainer Sections */}
                    <div className="grid gap-5">
                        <div className="group/item flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover/item:text-emerald-500 group-hover/item:border-emerald-500/30 group-hover/item:bg-emerald-500/5 transition-all duration-300 shrink-0 shadow-sm">
                                <Calendar size={18} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Bespoke Meal Plans</h3>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                    Our planner adapts to <span className="text-emerald-500 dark:text-emerald-400 font-bold italic">your body</span>. Sign in to save your biometric data and health goals.
                                </p>
                            </div>
                        </div>

                        <div className="group/item flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 group-hover/item:text-sky-500 group-hover/item:border-sky-500/30 group-hover/item:bg-sky-500/5 transition-all duration-300 shrink-0 shadow-sm">
                                <Package size={18} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Pocket Pantry</h3>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                    Keep your inventory and shopping lists <span className="text-sky-500 dark:text-sky-400 font-bold italic">in sync</span> across all your devices, anywhere you go.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Login Action */}
                    <div className="space-y-6">
                        <Button
                            onClick={handleLogin}
                            disabled={loading}
                            className="w-full h-16 bg-slate-950 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 border-none shadow-2xl font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 group/btn relative overflow-hidden shadow-emerald-500/10"
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500" />
                                    <span>Establishing Secure Session...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-black/5 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                                    <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform relative z-10" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span className="relative z-10">Continue with Google</span>
                                </>
                            )}
                        </Button>

                        <div className="flex items-center justify-center gap-3">
                            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800/50" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Privacy First</span>
                            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800/50" />
                        </div>
                    </div>
                </div>

                {/* Nudge / Guest Section */}
                <div className="bg-slate-900/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-[2.5rem] p-8 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                    <div className="space-y-1 text-center mb-2">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 italic">Not ready for a profile?</h4>
                        <p className="text-[10px] text-slate-500 font-medium">You can still explore our public library as a guest.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            href="/dashboard/library/foods"
                            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/[0.02] transition-all group/nudge shadow-sm hover:shadow-lg hover:shadow-emerald-500/5"
                        >
                            <Library size={20} className="text-slate-400 group-hover/nudge:text-emerald-500 group-hover/nudge:scale-110 transition-all mb-2" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Library</span>
                        </Link>

                        <Link
                            href="/dashboard/widgets/compare"
                            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/[0.02] transition-all group/nudge shadow-sm hover:shadow-lg hover:shadow-sky-500/5"
                        >
                            <Search size={20} className="text-slate-400 group-hover/nudge:text-sky-500 group-hover/nudge:scale-110 transition-all mb-2" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Compare</span>
                        </Link>
                    </div>

                    <div className="text-center">
                        <Link href="/" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors group/link">
                            Browse Home
                            <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Footer Credits */}
                <div className="flex flex-col items-center gap-3">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] italic opacity-50">
                        Vitala Research Systems &copy; {new Date().getFullYear()}
                    </p>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                </div>
            </div>
        </div>
    );
}

