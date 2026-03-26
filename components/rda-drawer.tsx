'use client';

import React, { useEffect, useState } from 'react';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { RDAContent } from '@/components/rda-content';

export function RDADrawer() {
    const {
        showRDADrawer,
        setShowRDADrawer
    } = useUserPreferences();

    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    if (!showRDADrawer) return null;

    return (
        <Sheet open={showRDADrawer} onOpenChange={setShowRDADrawer} modal={!isDesktop}>
            <SheetContent
                side="left"
                className="max-w-md w-full bg-slate-950 border-l-0 border-r border-slate-800 p-0 flex flex-col focus:outline-none"
                hideOverlay={isDesktop}
                onInteractOutside={(e) => {
                    if (isDesktop) e.preventDefault();
                }}
            >
                <RDAContent />
            </SheetContent>
        </Sheet>
    );
}
