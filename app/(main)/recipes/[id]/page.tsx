'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChatbotRecipeDetail } from '@/components/chatbot/chatbot-recipe-detail';
import { PageContainer } from '@/components/ui/page-container';
import { TabHeader } from '@/components/ui/tab-header';

export default function RecipeDetailsPage() {
    const router = useRouter();
    const { id } = useParams();

    if (!id) return null;

    return (
        <>
            <TabHeader
                title="Recipe Details"
                tabs={[]}
                onBack={() => router.back()}
                rightButtons={[
                    { label: 'Recipes', onClick: () => router.push('/recipes') },
                    { label: 'Foods', onClick: () => router.push('/recipes?tab=foods') },
                ]}
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