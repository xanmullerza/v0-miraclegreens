'use client';

import React, { useState } from 'react';
import { RecipesView } from './recipes-view';
import { RecipeTabShell } from './recipe-tab-shell';

interface MixesViewProps {
    onRecipeClick?: (recipeId: string) => void;
    isPremium?: boolean;
}

export function MixesView({ onRecipeClick, isPremium }: MixesViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('title');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    return (
        <RecipeTabShell
            title="Mixes"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortField={sortField}
            setSortField={setSortField}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
        >
            <RecipesView 
                onRecipeClick={onRecipeClick}
                isMix={true}
                hideControls={true}
                noContainer={true}
                searchQuery={searchQuery}
                sortField={sortField}
                sortDirection={sortDirection}
                isPremium={isPremium}
            />
        </RecipeTabShell>
    );
}
