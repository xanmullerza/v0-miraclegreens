'use client';

import React, { useState } from 'react';
import { PantrySearch } from '@/components/pantry/pantry-search';
import { PantryQuickAdd } from '@/components/pantry/pantry-quick-add';
import { PantryItemList } from '@/components/pantry/pantry-item-list';

interface ChatbotPantryProps {
    onBack?: () => void;
}

export function ChatbotPantry({ onBack }: ChatbotPantryProps) {
    const [selectedFood, setSelectedFood] = useState<any>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    return (
        <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-3 space-y-3">
                {/* Food Search */}
                <PantrySearch onSelect={(food) => setSelectedFood(food)} />

                {/* Quick Add Panel */}
                {selectedFood && (
                    <PantryQuickAdd
                        food={selectedFood}
                        onClose={() => setSelectedFood(null)}
                        onAdded={() => {
                            setSelectedFood(null);
                            setRefreshKey(prev => prev + 1);
                        }}
                    />
                )}

                {/* Pantry List */}
                <PantryItemList refreshKey={refreshKey} />
            </div>
        </div>
    );
}
