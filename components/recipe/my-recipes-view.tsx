'use client';

import React, { useState } from 'react';
import { RecipesView } from './recipes-view';
import { RecipeTabShell } from './recipe-tab-shell';

interface MyRecipesViewProps {
    onRecipeClick?: (recipeId: string) => void;
    isPremium?: boolean;
}

export function MyRecipesView({ onRecipeClick, isPremium }: MyRecipesViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('title');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    return (
        <RecipeTabShell
            title="My Recipes"
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortField={sortField}
            setSortField={setSortField}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
        >
            <RecipesView 
                onRecipeClick={onRecipeClick}
                onlyMyRecipes={true}
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
