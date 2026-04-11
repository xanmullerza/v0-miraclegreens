'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * BookoFood logo
 *
 * Layout:
 *   BOOK   ← consonants white, O coloured
 *    O     ← centre O coloured (Cyan)
 *   FOOD   ← consonants white, O coloured
 *
 * The five coloured O positions form a "5 on a dice" pattern:
 *   top-left (BOok)   = Emerald
 *   top-right (bOOk)  = Amber      ← two O's in BOOK but we treat them as one cluster
 *
 * Re-reading: BOOK has two O's, FOOD has two O's, plus the centre O = 5 total.
 * Dice-5 pattern (think of a 3×3 grid, corners + centre):
 *   top-left     → BOOK first O  → Emerald
 *   top-right    → BOOK second O → Amber
 *   centre       → standalone O  → Cyan
 *   bottom-left  → FOOD first O  → Indigo
 *   bottom-right → FOOD second O → Violet
 */

interface BookoFoodLogoProps {
    /** Overall size multiplier – 'sm' | 'md' | 'lg' */
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    /** Show the tagline beneath the wordmark */
    showTagline?: boolean;
}

const sizeConfig = {
    sm: { word: 'text-[11px]', centre: 'text-[14px]', gap: 'gap-0', tagline: 'text-[7px]' },
    md: { word: 'text-[15px]', centre: 'text-[20px]', gap: 'gap-0.5', tagline: 'text-[9px]' },
    lg: { word: 'text-[22px]', centre: 'text-[28px]', gap: 'gap-1', tagline: 'text-[11px]' },
};

/**
 * Renders a single word where each character is individually styled.
 * Vowels that are 'O' receive a coloured class; all other characters are white.
 */
function LogoWord({
    word,
    oColors,
    className,
}: {
    word: string;
    /** Ordered list of colours for each 'O' found in the word */
    oColors: string[];
    className?: string;
}) {
    let oIndex = 0;
    return (
        <span className={cn('font-black tracking-[0.15em] leading-none', className)}>
            {word.split('').map((char, i) => {
                if (char.toUpperCase() === 'O') {
                    const colour = oColors[oIndex] ?? 'text-white';
                    oIndex++;
                    return (
                        <span key={i} className={colour}>
                            {char}
                        </span>
                    );
                }
                return (
                    <span key={i} className="text-white">
                        {char}
                    </span>
                );
            })}
        </span>
    );
}

export function BookoFoodLogo({ size = 'md', className, showTagline = false }: BookoFoodLogoProps) {
    const s = sizeConfig[size];

    return (
        <div className={cn('flex flex-col items-center select-none', s.gap, className)}>
            {/* Row 1 – BOOK */}
            <LogoWord
                word="BOOK"
                oColors={['text-emerald-400', 'text-amber-400']}
                className={s.word}
            />

            {/* Row 2 – standalone O (centre of the dice) */}
            <span
                className={cn(
                    'font-black leading-none tracking-[0.15em] text-cyan-400',
                    s.centre,
                )}
            >
                O
            </span>

            {/* Row 3 – FOOD */}
            <LogoWord
                word="FOOD"
                oColors={['text-indigo-400', 'text-violet-400']}
                className={s.word}
            />

            {showTagline && (
                <span
                    className={cn(
                        'mt-1 font-bold uppercase tracking-[0.25em] text-white/50',
                        s.tagline,
                    )}
                >
                    Your Recipe Book
                </span>
            )}
        </div>
    );
}
