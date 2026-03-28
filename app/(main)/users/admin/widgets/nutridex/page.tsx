'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NutridexRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/nutrients');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest animate-pulse">Redirecting to Nutridex...</p>
        </div>
    );
}
