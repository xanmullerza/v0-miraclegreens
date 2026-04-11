'use client';

import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { MainAppContent } from '@/components/layout/main-app-content';

import { useActionPanel } from '@/lib/context/action-panel-context';

function HomePageContent() {
    const { setIsActionPanelOpen, setActiveView } = useActionPanel();
    
    React.useEffect(() => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            setIsActionPanelOpen(true);
            setActiveView('home');
        }
    }, [setIsActionPanelOpen, setActiveView]);

    return <MainAppContent />;
}

export default function HomePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Initializing BookoFood...</p>
            </div>
        }>
            <HomePageContent />
        </Suspense>
    );
}
