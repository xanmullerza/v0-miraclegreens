'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WidgetsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/users/admin/widgets/comparator');
    }, [router]);

    return null;
}
