'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RawKaleBoostPage() {
    const router = useRouter();

    const recipe = {
        id: 'raw-kale-boost',
        title: 'Raw Kale Boost',
        image: null,
        type: 'smoothie',
        calories: 33,
        energy_kj: 140,
        protein: 3.3,
        fat: 0.9,
        carbs: 6.7,
        prep_time: 5,
        cook_time: 0,
        servings: 1,
        diet: ['vegetarian', 'vegan', 'raw'],
        is_favorite: false,
        source: 'User Created',
    };

    const ingredients = [
        {
            id: '1',
            item: 'Raw Kale',
            amount: '100',
            base_ingredient: 'kale',
            weight_g: 100,
        },
    ];

    const instructions = [
        {
            step_order: 1,
            step_text: 'Wash it',
        },
        {
            step_order: 2,
            step_text: 'Chop it',
        },
        {
            step_order: 3,
            step_text: 'Cook it',
        },
        {
            step_order: 4,
            step_text: 'Eat it',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic">
                        {recipe.title}
                    </h1>
                </div>

                <div className="space-y-6">
                    {/* Recipe Card */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Prep Time
                                </p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">
                                    {recipe.prep_time}m
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Cook Time
                                </p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">
                                    {recipe.cook_time}m
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Servings
                                </p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">
                                    {recipe.servings}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Calories
                                </p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">
                                    {recipe.calories}
                                </p>
                            </div>
                        </div>

                        {/* Macros */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3 border border-blue-200 dark:border-blue-800">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Protein
                                </p>
                                <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                                    {recipe.protein.toFixed(1)}g
                                </p>
                            </div>
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 border border-amber-200 dark:border-amber-800">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Fat
                                </p>
                                <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                                    {recipe.fat.toFixed(1)}g
                                </p>
                            </div>
                            <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 p-3 border border-rose-200 dark:border-rose-800">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    Carbs
                                </p>
                                <p className="text-lg font-black text-rose-600 dark:text-rose-400">
                                    {recipe.carbs.toFixed(1)}g
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-6">
                        <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white mb-4">
                            Ingredients
                        </h2>
                        <div className="space-y-2">
                            {ingredients.map((ingredient, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                >
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        {ingredient.item}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {ingredient.weight_g}g
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-6">
                        <h2 className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white mb-4">
                            Directions
                        </h2>
                        <div className="space-y-3">
                            {instructions.map((instruction) => (
                                <div
                                    key={instruction.step_order}
                                    className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white font-bold text-sm flex-shrink-0">
                                        {instruction.step_order}
                                    </div>
                                    <p className="flex items-center text-slate-700 dark:text-slate-300 font-semibold">
                                        {instruction.step_text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
