'use client';

import React from 'react';
import { DashboardTabs } from '@/components/dashboard-tabs';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col w-full">
            <div className="px-3 py-2">
                <DashboardTabs />
            </div>
            {children}
        </div>
    );
}
