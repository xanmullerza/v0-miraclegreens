'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Redirect to planner page - Maker functionality has been integrated into the meal planner
 */
export default function MakerPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/meal-o-matic/planner');
    }, [router]);

    return null;
}
