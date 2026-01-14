'use client';

import { useEffect, useState } from 'react';
import { Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PodcastList() {
    const [highlightedId, setHighlightedId] = useState<string>('');

    useEffect(() => {
        const handleHash = () => {
            // Wait a small tick to ensure DOM is ready if navigating via link
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

        // Initial check
        handleHash();

        // Listener
        window.addEventListener('hashchange', handleHash);
        return () => window.removeEventListener('hashchange', handleHash);
    }, []);

    return (
        <div className="grid gap-6">
            <div
                id="moringa-south-africa"
                className={cn(
                    "group relative bg-card p-6 rounded-2xl border border-border transition-all duration-500",
                    highlightedId === 'moringa-south-africa'
                        ? 'ring-4 ring-primary shadow-2xl scale-[1.01] bg-primary/5'
                        : 'hover:shadow-lg'
                )}
            >
                <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="h-24 w-24 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                        <Headphones className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 w-full">
                        <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            Moringa: The Miracle Tree in South Africa
                        </h3>
                        <p className="text-muted-foreground mb-4 leading-relaxed">
                            A deep dive into how Moringa Oleifera is transforming health and agriculture across South Africa. Learn about its origins, benefits, and the community impact.
                        </p>
                        <div className={cn(
                            "w-full bg-muted/50 rounded-full p-2 transition-colors",
                            highlightedId === 'moringa-south-africa' ? 'bg-primary/20' : ''
                        )}>
                            <audio controls className="w-full h-8">
                                <source src="/Moringa_The_Miracle_Tree_in_South_Africa.m4a" type="audio/x-m4a" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    </div>
                </div>
            </div>

            <div
                id="malnutrition-south-africa"
                className={cn(
                    "group relative bg-card p-6 rounded-2xl border border-border transition-all duration-500",
                    highlightedId === 'malnutrition-south-africa'
                        ? 'ring-4 ring-primary shadow-2xl scale-[1.01] bg-primary/5'
                        : 'hover:shadow-lg'
                )}
            >
                <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="h-24 w-24 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                        <Headphones className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 w-full">
                        <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            Moringa Powder Combats South African Malnutrition
                        </h3>
                        <p className="text-muted-foreground mb-4 leading-relaxed">
                            Focusing on the specific impact of Moringa leaf powder in fighting malnutrition among South African children.
                        </p>
                        <div className={cn(
                            "w-full bg-muted/50 rounded-full p-2 transition-colors",
                            highlightedId === 'malnutrition-south-africa' ? 'bg-primary/20' : ''
                        )}>
                            <audio controls className="w-full h-8">
                                <source src="/Moringa_Powder_Combats_South_African_Malnutrition.m4a" type="audio/x-m4a" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    </div>
                </div>
            </div>

            {/* Future placeholder */}
            <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-muted/30 flex flex-col items-center justify-center">
                <p className="text-muted-foreground">More episodes coming soon...</p>
            </div>
        </div>
    );
}
