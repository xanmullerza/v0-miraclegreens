'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Monitor as Computer, TabletSmartphone, Smartphone } from 'lucide-react';
import { useSplitView } from '@/lib/context/split-view-context';
import { cn } from '@/lib/utils';

export function DraggableFab() {
    const pathname = usePathname();
    const { resizeMode, toggleResize } = useSplitView();
    
    // Show only on desktop and designated pages (or just everywhere on desktop except dashboard)
    const [isDesktop, setIsDesktop] = useState(false);
    
    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    const isVisible = isDesktop && pathname !== '/dashboard' && pathname !== '/auth/login';
    
    const [position, setPosition] = useState({ y: 0 }); // Offset from initial position
    const [isDragging, setIsDragging] = useState(false);
    
    const dragStartY = useRef(0);
    const initialY = useRef(0);
    const fabRef = useRef<HTMLButtonElement>(null);
    const hasDragged = useRef(false);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        
        setIsDragging(true);
        hasDragged.current = false;
        dragStartY.current = e.clientY;
        initialY.current = position.y;
        
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
    };

    const handlePointerMove = (e: PointerEvent) => {
        const deltaY = e.clientY - dragStartY.current;
        if (Math.abs(deltaY) > 5) {
            hasDragged.current = true;
            setPosition({ y: initialY.current + deltaY });
        }
    };

    const handlePointerUp = (e: PointerEvent) => {
        setIsDragging(false);
        setTimeout(() => {
            hasDragged.current = false;
        }, 100);
        
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
    };

    const handleClick = (e: React.MouseEvent) => {
        if (hasDragged.current) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        toggleResize();
    };

    const getResizeIcon = () => {
        if (resizeMode === 'equal') return <Computer size={24} />;
        if (resizeMode === 'content-focus') return <TabletSmartphone size={24} />;
        if (resizeMode === 'dashboard-only') return <Smartphone size={24} />;
        return <Computer size={24} />;
    };

    const getResizeTooltip = () => {
        if (resizeMode === 'content-focus') return 'Equal Split (50/50)';
        if (resizeMode === 'equal') return 'Full Dashboard View';
        if (resizeMode === 'dashboard-only') return 'Focus Content (70/30)';
        return 'Toggle View Mode';
    };

    if (!isVisible) return null;

    return (
        <button
            ref={fabRef}
            onPointerDown={handlePointerDown}
            onClick={handleClick}
            style={{ 
                transform: `translateY(${position.y}px)`,
                touchAction: 'none'
            }}
            className={cn(
                "fixed bottom-24 right-10 z-[100] flex items-center justify-center w-16 h-16 rounded-3xl shadow-2xl transition-all duration-300 ease-out cursor-grab active:cursor-grabbing group select-none overflow-hidden",
                isDragging ? "scale-110 rotate-3" : "hover:scale-110 hover:-rotate-3 active:scale-95",
                "bg-slate-900 dark:bg-slate-800 border-2 border-emerald-500/40 text-emerald-500 hover:border-emerald-500"
            )}
            title={getResizeTooltip()}
        >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors" />
            
            <div className="relative z-10 flex flex-col items-center">
                {getResizeIcon()}
                <span className="text-[7px] font-black uppercase tracking-tighter mt-1 opacity-60">Resize</span>
            </div>

            {/* Draggable indicator */}
            <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-20">
                <div className="w-0.5 h-0.5 rounded-full bg-white" />
                <div className="w-0.5 h-0.5 rounded-full bg-white" />
                <div className="w-0.5 h-0.5 rounded-full bg-white" />
            </div>
        </button>
    );
}
