'use client';

import React from 'react';
import { ChatbotProvider } from '@/lib/context/chatbot-context';
import { SearchProvider } from '@/lib/context/search-context';
import { HeaderActionsProvider } from '@/lib/context/header-actions-context';
import { SplitViewProvider } from '@/lib/context/split-view-context';
import { RecipeFilterProvider } from '@/lib/context/recipe-filter-context';

export default function UsersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SplitViewProvider>
      <ChatbotProvider>
        <SearchProvider>
          <HeaderActionsProvider>
            <RecipeFilterProvider>
              {children}
            </RecipeFilterProvider>
          </HeaderActionsProvider>
        </SearchProvider>
      </ChatbotProvider>
    </SplitViewProvider>
  );
}
