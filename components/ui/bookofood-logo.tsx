'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * BookoFood logo
 *
 * Three rows stacked inside the logo box:
 *   B  [O] [O]  K      ← row 1 "BOOK"
 *         [O]          ← row 2 centre O only
 *   F  [O] [O]  D      ← row 3 "FOOD"
 *
 * The five O positions map to the five dots on a dice face:
 *   top-left    = Emerald   (BOOK, 1st O)
 *   top-right   = Amber     (BOOK, 2nd O)
 *   centre      = Cyan      (standalone O)
 *   bottom-left = Indigo    (FOOD, 1st O)
 *   bottom-right= Violet    (FOOD, 2nd O)
 *
 * Consonants are white.
 * All O glyphs share the same font-size so they read as identical dots.
 * The centre-O row contains only "O" — no other characters — so it naturally
 * sits at the visual centre of the three rows.
 */

interface BookoFoodLogoProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

// A single unified font-size for every character including the centre O.
// letter-spacing and line-height are kept tight so the box stays compact.
const sizeConfig = {
    sm: { text: 'text-[10px]', gap: 'gap-[1px]'  },
    md: { text: 'text-[14px]', gap: 'gap-[2px]'  },
    lg: { text: 'text-[20px]', gap: 'gap-[3px]'  },
};

/** One character, coloured or white */
function Char({ children, colour }: { children: string; colour?: string }) {
    return (
        <span
            className={cn(
                'font-black leading-none inline-block',
                // Give every character a 1:1 aspect ratio so O's look circular
                'w-[1.1em] text-center',
                colour ?? 'text-white',
            )}
        >
            {children}
        </span>
    );
}

export function BookoFoodLogo({ size = 'md', className }: BookoFoodLogoProps) {
    const s = sizeConfig[size];

    return (
        <div
            className={cn(
                'flex flex-col items-center select-none',
                s.text,
                s.gap,
                className,
            )}
            aria-label="BookoFood"
        >
            {/* Row 1 – B O O K */}
            <div className="flex items-center tracking-[0.05em]">
                <Char>B</Char>
                <Char colour="text-emerald-400">O</Char>
                <Char colour="text-amber-400">O</Char>
                <Char>K</Char>
            </div>

            {/* Row 2 – centre O (dice centre dot) */}
            <div className="flex items-center">
                <Char colour="text-cyan-400">O</Char>
            </div>

            {/* Row 3 – F O O D */}
            <div className="flex items-center tracking-[0.05em]">
                <Char>F</Char>
                <Char colour="text-indigo-400">O</Char>
                <Char colour="text-violet-400">O</Char>
                <Char>D</Char>
            </div>
        </div>
    );
}
