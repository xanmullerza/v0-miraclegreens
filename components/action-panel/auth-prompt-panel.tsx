'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PanelWrapper } from './panel-wrapper';
import { useActionPanel } from '@/lib/context/action-panel-context';

export function AuthPromptPanel() {
    const { goBack } = useActionPanel();

    return (
        <PanelWrapper title="Welcome" onClose={goBack}>
            <div className="flex flex-col items-center text-center p-6 space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2 rotate-3 hover:rotate-0 transition-transform duration-300">
                    <Sparkles size={40} />
                </div>
                
                <div className="space-y-4">
                    <h2 className="text-3xl font-black uppercase tracking-tight text-white leading-none">
                        Start Your Protocol
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed font-medium px-4">
                        To build a meal plan that matches your body and goals, we need you to sign in.
                    </p>
                </div>

                <div className="w-full pt-8 px-2">
                    <Button 
                        className="h-16 w-full rounded-3xl bg-white text-slate-900 hover:bg-slate-100 font-black flex items-center justify-center gap-4 group transition-all shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
                    >
                        <svg className="w-8 h-8" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="uppercase tracking-[0.2em] text-xs font-black">Continue with Google</span>
                        <ArrowRight size={20} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                </div>
                
                <div className="flex items-center gap-6 pt-12 grayscale opacity-50">
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure</div>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cloud Synced</div>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custom</div>
                    </div>
                </div>
            </div>
        </PanelWrapper>
    );
}
