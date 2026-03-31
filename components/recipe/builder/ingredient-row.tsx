import React, { useState } from 'react';
import { Trash2, Plus, isSpice } from 'lucide-react';
import { RecipeIngredient } from './types';
import { getSpiceMeasures } from '@/lib/utils/spice-conversion';

interface IngredientRowProps {
    ingredient: RecipeIngredient;
    index: number;
    editingNameIndex: number | null;
    setEditingNameIndex: (i: number | null) => void;
    handleUpdateName: (i: number, n: string) => void;
    handleUpdateQuantity: (i: number, q: number) => void;
    handleRemoveIngredient: (i: number) => void;
    setShowPicker: (s: boolean) => void;
}

export function IngredientRow({
    ingredient, index, editingNameIndex, setEditingNameIndex,
    handleUpdateName, handleUpdateQuantity, handleRemoveIngredient, setShowPicker
}: IngredientRowProps) {
    const ing = ingredient;

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group">
            {/* Delete Button */}
            <button
                type="button"
                onClick={() => handleRemoveIngredient(index)}
                className="shrink-0 w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all"
                title="Delete Ingredient"
            >
                <Trash2 size={14} />
            </button>

            {/* Ingredient Name */}
            <div className="flex-1 min-w-0">
                {editingNameIndex === index ? (
                    <input
                        type="text"
                        value={ing.food_item_name}
                        onChange={(e) => handleUpdateName(index, e.target.value)}
                        onBlur={() => setEditingNameIndex(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingNameIndex(null)}
                        autoFocus
                        className="bg-transparent border-b-2 border-emerald-500 font-black text-slate-900 dark:text-white px-0 py-1 text-sm w-full outline-none"
                    />
                ) : (
                    <div 
                        onClick={() => setEditingNameIndex(index)}
                        className="font-bold text-slate-900 dark:text-white truncate text-sm cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                        {ing.food_item_name}
                    </div>
                )}
            </div>

            {/* Quantity and Measure */}
            <div className="flex items-center gap-2 shrink-0">
                <input
                    type="number"
                    value={ing.quantity}
                    onChange={(e) => handleUpdateQuantity(index, Number(e.target.value))}
                    className="w-14 h-8 px-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-black focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    min="0"
                    step="0.125"
                />
                <div className="px-2 h-8 flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-500">
                    {ing.measure_label}
                </div>
            </div>

            {/* Add Button */}
            <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all"
                title="Add Ingredient"
            >
                <Plus size={14} />
            </button>
        </div>
    );
}
