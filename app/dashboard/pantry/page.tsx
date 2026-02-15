'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PantryRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/library/foods?tab=staples');
    }, [router]);

    return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-emerald-500" size={40} />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Moving to Staples Hub...</p>
        </div>
    );
}

