'use client';

import React, { useState, useCallback, useEffect, ReactNode } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';

interface CarouselProps {
    children: ReactNode[];
    className?: string;
    containerClassName?: string;
    autoPlay?: boolean;
    showDots?: boolean;
}

export function Carousel({
    children,
    className,
    containerClassName,
    showDots = true
}: CarouselProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        align: 'start',
        containScroll: 'trimSnaps',
        loop: false,
    });

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

    const onDotButtonClick = useCallback(
        (index: number) => {
            if (!emblaApi) return;
            emblaApi.scrollTo(index);
        },
        [emblaApi]
    );

    const onSelect = useCallback((emblaApi: any) => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, []);

    useEffect(() => {
        if (!emblaApi) return;

        onSelect(emblaApi);
        setScrollSnaps(emblaApi.scrollSnapList());
        emblaApi.on('select', onSelect);
        emblaApi.on('reInit', onSelect);
    }, [emblaApi, onSelect]);

    return (
        <div className={cn("relative w-full", className)}>
            <div className="overflow-hidden" ref={emblaRef}>
                <div className={cn("flex", containerClassName)}>
                    {children.map((child, index) => (
                        <div
                            key={index}
                            className="flex-[0_0_100%] min-w-0 pr-4 transition-all duration-500 ease-in-out"
                            style={{
                                opacity: selectedIndex === index ? 1 : 0.4,
                                transform: selectedIndex === index ? 'scale(1)' : 'scale(0.95)',
                            }}
                        >
                            {child}
                        </div>
                    ))}
                </div>
            </div>

            {showDots && scrollSnaps.length > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    {scrollSnaps.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => onDotButtonClick(index)}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                selectedIndex === index
                                    ? "w-8 bg-emerald-500 shadow-lg shadow-emerald-500/30"
                                    : "w-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
                            )}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
