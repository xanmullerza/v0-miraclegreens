'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChatbotRecipeDetail } from '@/components/chatbot-recipe-detail';
import { PageContainer } from '@/components/ui/page-container';

export default function RecipeDetailsPage() {
    const router = useRouter();
    const { id } = useParams();

    const handleBack = () => {
        router.back();
    };

    if (!id) return null;

    return (
        <PageContainer maxWidth="max-w-4xl">
            <ChatbotRecipeDetail 
                recipeId={String(id)}
                onBack={handleBack}
                isStandalone={true}
            />
        </PageContainer>
    );
}