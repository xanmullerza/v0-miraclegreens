import React, { useState } from 'react';
import { Trash2, Database, Globe } from 'lucide-react';
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
            <div className="flex items-center gap-2 flex-wrap">
                <input
                    type="number"
                    value={ing.quantity}
                    onChange={(e) => handleUpdateQuantity(index, Number(e.target.value))}
                    className="w-20 h-9 px-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-black focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    min="0"
                    step="0.125"
                />
                {allOptions.length > 1 ? (
                    <select
                        value={ing.measure_label}
                        onChange={(e) => handleUpdateMeasure(index, e.target.value)}
                        className="min-w-[120px] h-9 pl-2 pr-8 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-500 border-none outline-none appearance-none cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='C19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '0.75rem'
                        }}
                    >
                        {allOptions.map((opt, oIdx) => (
                            <option key={oIdx} value={opt.label}>{opt.label}</option>
                        ))}
                    </select>
                ) : (
                    <div className="px-3 h-9 flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase text-slate-500">
                        {ing.measure_label}
                    </div>
                )}
            </div>

            {/* Source and Delete */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                    {ing.source === 'usda' ? (
                        <>
                            <Globe size={14} className="text-blue-500" />
                            USDA API
                        </>
                    ) : (
                        <>
                            <Database size={14} className="text-green-500" />
                            Local DB
                        </>
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
