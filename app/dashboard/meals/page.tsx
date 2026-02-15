'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MealsRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/library/recipes?tab=browse');
    }, [router]);

    return (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Redirecting...</p>
        </div>
    );
}
