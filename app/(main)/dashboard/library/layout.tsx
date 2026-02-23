'use client';

import React from 'react';
import { SearchProvider } from '@/lib/context/search-context';

function LibraryLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

export default function LibraryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SearchProvider>
            <LibraryLayoutContent>{children}</LibraryLayoutContent>
        </SearchProvider>
    );
}

