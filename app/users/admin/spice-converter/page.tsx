'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LabView } from '@/components/admin/ingredients/lab-view';
import { Loader2 } from 'lucide-react';

export default function AdminSpiceConverter() {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';
                    const userEmail = (user.email || '').toLowerCase();
                    const isUserAdmin = userEmail === adminEmail.toLowerCase() && adminEmail !== '';

                    if (!isUserAdmin) {
                        router.push('/');
                    }
                    setIsAdmin(isUserAdmin);
                } else {
                    router.push('/');
                }
            } catch (err) {
                console.error(err);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };
        checkAdmin();
    }, [router]);

    if (loading || !isAdmin) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-indigo-500" size={40} />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Verifying access...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <LabView />
        </div>
    );
}
