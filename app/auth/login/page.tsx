'use client';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    KeyRound,
    Cloud,
    Database,
    WifiOff,
    ShieldCheck,
    Sparkles,
    Lock
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;
        } catch (error: any) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
            </div>

            <Link
                href="/"
                className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-emerald-500 transition-all font-bold uppercase tracking-widest text-[10px] z-50 group"
            >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-white transition-all shadow-sm">
                    <ArrowLeft size={14} />
                </div>
                Return Home
            </Link>

            <div className="w-full max-w-[420px] space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
                <div className="text-center space-y-3">
                    <div className="relative inline-block">
                        <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto mb-6 text-emerald-500 shadow-2xl shadow-emerald-500/10 group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Lock size={32} className="relative z-10 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-950">
                            <ShieldCheck size={12} className="text-white" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white italic uppercase leading-none">
                        Cloud <span className="text-emerald-500">Sync.</span>
                    </h1>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">
                        Sign in to unlock your pantry
                    </p>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-2xl space-y-8 relative overflow-hidden group">
                    {/* Interior Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/5 blur-[60px] rounded-full group-hover:bg-emerald-500/10 transition-colors duration-700" />

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/50 group/item hover:border-emerald-500/30 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-emerald-500 group-hover/item:scale-110 transition-transform">
                                <Cloud size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Cloud Ecosystem</p>
                                <p className="text-[10px] text-slate-500 font-medium">Unlock Pantry & Smart Meal Syncing.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 group/item hover:border-amber-500/30 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-amber-500 group-hover/item:scale-110 transition-transform">
                                <WifiOff size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">Online Only Notice</p>
                                <p className="text-[10px] text-slate-500 font-medium italic">These advanced modules require active sync.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Button
                            onClick={handleLogin}
                            disabled={loading}
                            className="w-full h-16 bg-slate-950 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 border-none shadow-2xl shadow-emerald-500/10 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 group/btn overflow-hidden relative"
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500" />
                                    <span>Syncing...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
                                    <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform relative z-10" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    <span className="relative z-10">Authorize with Google</span>
                                </>
                            )}
                        </Button>

                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">
                                <ShieldCheck size={10} className="text-emerald-500" />
                                <span>Encrypted Transmission</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] italic">
                        Vitala Research Systems &copy; {new Date().getFullYear()}
                    </p>
                    <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                </div>
            </div>
        </div>
    );
}

