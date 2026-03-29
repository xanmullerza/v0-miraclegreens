'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingSearch } from '@/components/tracker/shopping/shopping-search';
import { ShoppingQuickAdd } from '@/components/tracker/shopping/shopping-quick-add';
import { ShoppingItemList } from '@/components/tracker/shopping/shopping-item-list';
import { SHOPPING_STORAGE_KEY } from '@/components/tracker/shopping/shopping-types';

interface ChatbotShoppingProps {
    onBack?: () => void;
}

export function ChatbotShopping({ onBack }: ChatbotShoppingProps) {
    const [selectedFood, setSelectedFood] = useState<any>(null);

    // Cleanup old "Replenish: " format items on mount
    useEffect(() => {
        try {
            const list = JSON.parse(localStorage.getItem(SHOPPING_STORAGE_KEY) || '[]');
            const needsCleanup = list.some((item: any) =>
                item.name?.startsWith('Replenish: ') || item.source === 'auto-replenish'
            );
            if (needsCleanup) {
                const cleaned = list.filter((item: any) =>
                    !item.name?.startsWith('Replenish: ') && item.source !== 'auto-replenish'
                );
                localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(cleaned));
                window.dispatchEvent(new Event('storage'));
            }
        } catch { /* ignore */ }
    }, []);

    return (
        <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-3 space-y-3">
                {/* Food Search */}
                <ShoppingSearch onSelect={(food) => setSelectedFood(food)} />

                {/* Quick Add Panel */}
                {selectedFood && (
                    <ShoppingQuickAdd
                        food={selectedFood}
                        onClose={() => setSelectedFood(null)}
                        onAdded={() => setSelectedFood(null)}
                    />
                )}

                {/* Shopping List */}
                <ShoppingItemList />
            </div>
        </div>
    );
}
