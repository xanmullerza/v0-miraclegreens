import { Suspense } from 'react';
import { AdminTabShell } from '@/components/admin/admin-tab-shell';

export default function AdminPage() {
    return (
        <Suspense fallback={null}>
            <AdminTabShell />
        </Suspense>
    );
}
