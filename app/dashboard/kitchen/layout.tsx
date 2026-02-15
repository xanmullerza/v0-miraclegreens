'use client';

import React from 'react';
import { SearchProvider } from '@/lib/context/search-context';

function KitchenLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

export default function KitchenLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SearchProvider>
            <KitchenLayoutContent>{children}</KitchenLayoutContent>
        </SearchProvider>
    );
}
