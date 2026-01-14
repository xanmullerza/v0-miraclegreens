'use client';

import { useEffect, useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VideoList() {
    const [highlightedId, setHighlightedId] = useState<string>('');

    useEffect(() => {
        const handleHash = () => {
            setTimeout(() => {
                const hash = window.location.hash.replace('#', '');
                if (hash) {
                    setHighlightedId(hash);
                    const element = document.getElementById(hash);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 100);
        };

        handleHash();
        window.addEventListener('hashchange', handleHash);
        return () => window.removeEventListener('hashchange', handleHash);
    }, []);

    return (
        <div className="grid gap-6">
            <div
                id="malnutrition-south-africa"
                className={cn(
                    "group relative bg-card p-6 rounded-2xl border border-border transition-all duration-500",
                    highlightedId === 'malnutrition-south-africa'
                        ? 'ring-4 ring-primary shadow-2xl scale-[1.01] bg-primary/5'
                        : 'hover:shadow-lg'
                )}
            >
                <div className="flex flex-col gap-4">
                    <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            Complementary Feeding Practices and Childhood Malnutrition in South Africa
                        </h3>
                        <p className="text-muted-foreground mb-4 leading-relaxed">
                            See the impact firsthand. This short film explores how we are using the "Miracle Tree" to combat malnutrition and build sustainable food systems in South Africa.
                        </p>
                    </div>
                    <div className="w-full aspect-video bg-muted rounded-xl overflow-hidden relative">
                        <video controls className="w-full h-full object-cover">
                            <source src="/The_Moringa_Solution.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            </div>

            {/* Future placeholder */}
            <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-muted/30 flex flex-col items-center justify-center">
                <p className="text-muted-foreground">More videos coming soon...</p>
            </div>
        </div>
    );
}
