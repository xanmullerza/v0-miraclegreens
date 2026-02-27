'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WorkshopPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/workshop/comparator');
    }, [router]);

    return null;
}
