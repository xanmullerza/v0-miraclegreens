import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Simple wrapper that enforces the app's horizontal gating rules.
 *
 * - mobile: 2rem (px-2) padding on each side
 * - sm+: 1rem (px-4) padding
 * - accepts an optional `maxWidth` Tailwind width class, defaulting to
 *   `md:max-w-[800px]` (same as the breadcrumb/header width).
 *
 * Usage: wrap high‑level page content (typically the top `<div>` inside a
 *   `return`) so every screen automatically inherits consistent gutters.
 */
interface PageContainerProps {
    children: React.ReactNode;
    /** tailwind width class like `max-w-7xl` or `md:max-w-[800px]` */
    maxWidth?: string;
    className?: string;
}

export function PageContainer({
    children,
    maxWidth = 'md:max-w-[800px]',
    className,
}: PageContainerProps) {
    return (
        <div className={cn('w-full px-2 sm:px-4 mx-auto', maxWidth, className)}>
            {children}
        </div>
    );
}
