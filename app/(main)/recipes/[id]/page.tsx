'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChatbotRecipeDetail } from '@/components/chatbot/chatbot-recipe-detail';
import { PageContainer } from '@/components/ui/page-container';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RecipeDetailsPage() {
    const router = useRouter();
    const { id } = useParams();

    const handleBack = () => {
        router.back();
    };

    const handleNavigate = (path: string) => {
        router.push(path);
    };

    if (!id) return null;

    return (
        <>
            {/* Navigation Bar */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl py-6 px-4 border-b border-border/50">
                <div className="flex items-center justify-between max-w-5xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-300">Recipe Details</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleNavigate('/recipes')}
                            className={cn(
                                "px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all duration-300",
                                "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}
                        >
                            Recipes
                        </button>
                        <button
                            onClick={() => handleNavigate('/recipes?tab=foods')}
                            className={cn(
                                "px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all duration-300",
                                "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}
                        >
                            Foods
                        </button>
                    </div>
                </div>
            </div>

            <PageContainer maxWidth="max-w-4xl">
                <ChatbotRecipeDetail 
                    recipeId={String(id)}
                    onBack={handleBack}
                    isStandalone={true}
                />
            </PageContainer>
        </>
    );
}