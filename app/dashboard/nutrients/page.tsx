'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NutrientsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/foods?tab=nutrients');
    }, [router]);

    return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Moving to Nutrients Hub...</p>
        </div>
    );
}
