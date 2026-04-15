'use client';

import React, { useState } from 'react';
import { RecipesView } from './recipes-view';
import { RecipeTabShell } from './recipe-tab-shell';
import { Lock, Globe, Sparkles, Zap, ChevronDown, Plus, Upload, Share2, Download, BookOpen } from 'lucide-react';
import { useActionPanel } from '@/lib/context/action-panel-context';

import { cn } from '@/lib/utils';

import { getSharedNavOptions, getCookbookNavOptions } from '@/lib/constants/nav-options';

type RecipeFilter = 'all' | 'remixes' | 'my-recipes' | 'mixes';

interface RecipesCombinedViewProps {
    onRecipeClick?: (recipeId: string) => void;
    isPremium?: boolean;
    fullHeight?: boolean;
}

export function RecipesCombinedView({ onRecipeClick, isPremium, fullHeight }: RecipesCombinedViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('title');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const { navigateTo } = useActionPanel();

    const dropdownOptions = [
        {
            id: 'create-recipe',
            label: 'Create Recipe',
            icon: <Plus size={16} />,
            onClick: () => navigateTo('import')
        }
    ];

    return (
        <RecipeTabShell
            title="Cookbook"
            fullHeight={fullHeight}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortField={sortField}
            setSortField={setSortField}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            dropdownOptions={dropdownOptions}
        >
            <RecipesView 
                onRecipeClick={onRecipeClick}
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
