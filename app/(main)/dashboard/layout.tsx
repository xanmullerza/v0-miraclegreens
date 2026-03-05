'use client';

import React from 'react';
import { DashboardNav } from '@/components/dashboard-nav';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col w-full">
            <DashboardNav />
            {children}
        </div>
    );
}
