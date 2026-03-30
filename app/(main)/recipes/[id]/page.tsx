'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChatbotRecipeDetail } from '@/components/chatbot/chatbot-recipe-detail';
import { PageContainer } from '@/components/ui/page-container';
import { TabHeader } from '@/components/ui/tab-header';

export default function RecipeDetailsPage() {
    const router = useRouter();
    const { id } = useParams();

    const handleTabChange = (tabId: string) => {
        if (tabId === 'recipes') {
            router.push('/recipes');
        } else {
            router.push(`/recipes?tab=${tabId}`);
        }
    };

    if (!id) return null;

    return (
        <>
            <TabHeader
                tabs={[
                    { id: 'recipes', label: 'Recipes' },
                    { id: 'remixes', label: 'Remixes' },
                    { id: 'mixes', label: 'Mixes' },
                    { id: 'foods', label: 'Foods' },
                    { id: 'nutrients', label: 'Nutrients' },
                ]}
                activeTab="recipes"
                onTabChange={handleTabChange}
            />

            <PageContainer maxWidth="max-w-4xl">
                <ChatbotRecipeDetail 
                    recipeId={String(id)}
                    onBack={() => router.back()}
                    isStandalone={true}
                />
            </PageContainer>
        </>
    );
}