'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Search } from 'lucide-react';

export function DraggableFab() {
    const pathname = usePathname();
    const router = useRouter();
    
    // Only show on recipes and foods pages (or add more if desired)
    const isVisible = pathname === '/recipes' || pathname === '/foods' || pathname === '/meals' || pathname.startsWith('/foods/');
    
    const [position, setPosition] = useState({ y: 0 }); // Offset from initial position
    const [isDragging, setIsDragging] = useState(false);
    
    const dragStartY = useRef(0);
    const initialY = useRef(0);
    const fabRef = useRef<HTMLButtonElement>(null);
    const hasDragged = useRef(false);

    // Provide default initial position vertically (e.g. bottom 10%)
    useEffect(() => {
        // Initialize position if needed based on viewport
        // Actually, CSS bottom-8 or something handles initial positioning
        // We just track delta offsets here.
    }, []);

    const handlePointerDown = (e: React.PointerEvent) => {
        // Only trigger for primary click
        if (e.button !== 0) return;
        
        // e.preventDefault(); // Sometimes prevents click entirely on mobile, use CSS touchAction instead
        setIsDragging(true);
        hasDragged.current = false;
        dragStartY.current = e.clientY;
        initialY.current = position.y;
        
        // Use non-passive listener for pointer events 
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
        // Reset hasDragged after a tiny delay so onClick can read it
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
        
        if (pathname === '/recipes') {
            router.push('/foods');
        } else {
            router.push('/recipes');
        }
    };

    if (!isVisible) return null;

    const isRecipes = pathname === '/recipes';

    return (
        <button
            ref={fabRef}
            onPointerDown={handlePointerDown}
            onClick={handleClick}
            style={{ 
                transform: `translateY(${position.y}px)`,
                touchAction: 'none' // Prevent browser touch actions like scrolling
            }}
            className="absolute bottom-16 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-black/20 bg-slate-900 dark:bg-slate-800 border-2 border-emerald-500/30 text-emerald-500 hover:scale-105 hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 transition-all duration-200 ease-out cursor-grab active:cursor-grabbing group select-none"
            title={isRecipes ? "Go to Foods" : "Go to Recipes"}
        >
            {isRecipes ? (
                <Search size={24} className="group-hover:text-emerald-400 transition-colors" />
            ) : (
                <BookOpen size={24} className="group-hover:text-emerald-400 transition-colors" />
            )}
        </button>
    );
}
