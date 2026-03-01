'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardOverview() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/library/foods');
    }, [router]);

    return null;
}
