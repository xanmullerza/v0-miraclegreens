'use client';

import React from 'react';
import { Carousel } from '@/components/ui/carousel';
import { 
    BookOpen, 
    Share2, 
    Download, 
    Upload, 
    Bookmark,
    ChefHat
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureSlide {
    icon: React.ElementType;
    title: string;
    description: string;
    highlight: string;
    color: 'emerald' | 'amber' | 'blue' | 'purple' | 'rose' | 'orange';
}

const features: FeatureSlide[] = [
    {
        icon: ChefHat,
        title: "Your Personal Cookbook",
        description: "At its heart, Miracle Greens is a cookbook. Create, organize, and perfect your recipes with detailed nutritional insights.",
        highlight: "Create Recipes",
        color: 'emerald'
    },
    {
        icon: Bookmark,
        title: "Save What You Love",
        description: "Found a recipe you love? Save it to your collection with one tap. Build your personal library of favorites.",
        highlight: "Save Recipes",
        color: 'amber'
    },
    {
        icon: Download,
        title: "Import From Anywhere",
        description: "Bring in recipes from popular sites like AllRecipes, Tasty, and more. Your favorite recipes, all in one place.",
        highlight: "Import Recipes",
        color: 'blue'
    },
    {
        icon: Upload,
        title: "Migrate Your Collection",
        description: "Moving from another app? Import your entire recipe database. We make switching painless.",
        highlight: "Bulk Import",
        color: 'purple'
    },
    {
        icon: Share2,
        title: "Share With Friends",
        description: "Share your culinary creations with family and friends. Spread the joy of good food and good health.",
        highlight: "Share Recipes",
        color: 'rose'
    },
    {
        icon: BookOpen,
        title: "Export Anytime",
        description: "Your recipes are yours. Export your entire database whenever you want. No lock-in, no strings attached.",
        highlight: "Export Data",
        color: 'orange'
    }
];

const colorClasses = {
    emerald: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        icon: 'text-emerald-500',
        highlight: 'bg-emerald-500 text-white'
    },
    amber: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-600 dark:text-amber-400',
        icon: 'text-amber-500',
        highlight: 'bg-amber-500 text-white'
    },
    blue: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-600 dark:text-blue-400',
        icon: 'text-blue-500',
        highlight: 'bg-blue-500 text-white'
    },
    purple: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        text: 'text-purple-600 dark:text-purple-400',
        icon: 'text-purple-500',
        highlight: 'bg-purple-500 text-white'
    },
    rose: {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/20',
        text: 'text-rose-600 dark:text-rose-400',
        icon: 'text-rose-500',
        highlight: 'bg-rose-500 text-white'
    },
    orange: {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        text: 'text-orange-600 dark:text-orange-400',
        icon: 'text-orange-500',
        highlight: 'bg-orange-500 text-white'
    }
};

export function FeatureCarousel() {
    const indicators = features.map((f) => {
        const Icon = f.icon;
        return <Icon size={18} key={f.title} />;
    });

    const activeIndicatorClassNames = features.map(f => 
        `${colorClasses[f.color].bg} ${colorClasses[f.color].icon}`
    );

    return (
        <div className="w-full">
            <div className="flex items-center justify-center gap-2 mb-4 px-1">
                <BookOpen size={14} className="text-emerald-500" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">
                    It&apos;s All About Your Recipes
                </h3>
            </div>
            
            <Carousel 
                showDots={true}
                indicators={indicators}
                activeIndicatorClassNames={activeIndicatorClassNames}
                className="px-0"
                containerClassName="gap-0"
            >
                {features.map((feature) => {
                    const Icon = feature.icon;
                    const colors = colorClasses[feature.color];
                    
                    return (
                        <div
                            key={feature.title}
                            className={cn(
                                "relative p-6 rounded-2xl border min-h-[200px] flex flex-col",
                                "bg-white dark:bg-slate-800/60",
                                colors.border
                            )}
                        >
                            <div className="absolute top-4 right-4">
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full",
                                    colors.highlight
                                )}>
                                    {feature.highlight}
                                </span>
                            </div>
                            
                            <div className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center mb-4",
                                colors.bg
                            )}>
                                <Icon size={24} className={colors.icon} />
                            </div>
                            
                            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                                {feature.title}
                            </h4>
                            
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex-1">
                                {feature.description}
                            </p>
                        </div>
                    );
                })}
            </Carousel>
        </div>
    );
}
