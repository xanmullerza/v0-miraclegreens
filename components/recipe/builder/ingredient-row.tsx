import React, { useState } from 'react';
import { Trash2, Database, Globe, Plus, Minus, ChevronDown } from 'lucide-react';
import { RecipeIngredient } from './types';
import { getSpiceMeasures } from '@/lib/utils/spice-conversion';

interface IngredientRowProps {
    ingredient: RecipeIngredient;
    index: number;
    editingNameIndex: number | null;
    setEditingNameIndex: (i: number | null) => void;
    handleUpdateName: (i: number, n: string) => void;
    handleUpdateQuantity: (i: number, q: number) => void;
    handleUpdateMeasure: (i: number, m: string) => void;
    handleRemoveIngredient: (i: number) => void;
}

export function IngredientRow({
    ingredient, index, editingNameIndex, setEditingNameIndex,
    handleUpdateName, handleUpdateQuantity, handleUpdateMeasure, 
    handleRemoveIngredient
}: IngredientRowProps) {
    const ing = ingredient;
    const measures = ing.available_measures || [];
    
    // Ensure "g" is always an option if not already there
    const hasGrams = measures.some(m => ['g', 'G', 'gram', 'grams', 'Grams'].includes(m.label));
    const allOptions = hasGrams ? measures : [{ label: 'g', weight_g: 1 }, ...measures];

    return (
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group">
            {/* Ingredient Name */}
            <div className="flex items-center gap-2 min-w-0">
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
            <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center h-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:border-emerald-500/30 transition-colors focus-within:ring-2 focus-within:ring-emerald-500">
                    <button
                        type="button"
                        onClick={() => handleUpdateQuantity(index, Math.max(0, Number((ing.quantity - 1).toFixed(0))))}
                        className="h-full w-8 flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                    >
                        <Minus size={14} />
                    </button>
                    <input
                        type="number"
                        value={ing.quantity}
                        onChange={(e) => handleUpdateQuantity(index, Number(e.target.value))}
                        className="h-full w-16 px-0.5 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none text-center border-l border-r border-slate-200 dark:border-slate-700 flex-shrink-0"
                        min="0"
                        step="1"
                    />
                    <button
                        type="button"
                        onClick={() => handleUpdateQuantity(index, Number((ing.quantity + 1).toFixed(0)))}
                        className="h-full w-8 flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                    >
                        <Plus size={14} />
                    </button>
                </div>
                <div className="relative">
                    {allOptions.length > 1 ? (
                        <>
                            <select
                                value={ing.measure_label}
                                onChange={(e) => handleUpdateMeasure(index, e.target.value)}
                                className="w-full h-10 pl-3 pr-10 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-500 border-none outline-none appearance-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                {allOptions.map((opt, oIdx) => (
                                    <option key={oIdx} value={opt.label}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        </>
                    ) : (
                        <div className="w-full h-10 flex items-center justify-between px-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-500">
                            <span>{ing.measure_label}</span>
                            <ChevronDown className="text-slate-500" size={16} />
                        </div>
                    )}
                </div>
            </div>

            {/* Source and Delete */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    {ing.source === 'usda' ? (
                        <Globe size={14} className="text-blue-500" />
                    ) : (
                        <Database size={14} className="text-green-500" />
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="shrink-0 w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all"
                    title="Delete Ingredient"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}
