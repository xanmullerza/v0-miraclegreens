'use client';

import React from 'react';

type HelpType = 'help-cookbook' | 'help-planner' | 'help-widgets';

interface ChatbotHelpSectionProps {
    type: HelpType;
}

/* ─── Cookbook Help ────────────────────────────────────────── */
function CookbookHelp() {
    return (
        <>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Cookbook Help</h1>

            <section className="mb-4">
                <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                    <span>👀</span> View Recipes
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    Browse through all available recipes or just your personal collection.
                </p>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 space-y-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">How to use:</p>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                        <li>• Use the toggle at the top to switch between &quot;All Recipes&quot; and &quot;My Recipes&quot;</li>
                        <li>• Click the filter icon to refine your search by cuisine, meal type, dietary preferences</li>
                        <li>• Click any recipe to view full details, ingredients, and instructions</li>
                        <li>• Star recipes to save them to your favorites</li>
                    </ul>
                </div>
            </section>

            <section className="mb-4">
                <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
                    <span>✍️</span> Add Recipes
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    Bring your own recipes into Miracle Greens in multiple ways.
                </p>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 space-y-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Import options:</p>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                        <li>• <strong>From URL:</strong> Paste a recipe link to auto-parse ingredients and instructions</li>
                        <li>• <strong>From Photo:</strong> Take a photo of a recipe card or page and we&apos;ll extract the details</li>
                        <li>• <strong>Voice Recipe:</strong> Dictate your recipe and our AI will transcribe it</li>
                        <li>• <strong>Manual Entry:</strong> Create a recipe step-by-step using our recipe builder</li>
                    </ul>
                </div>
            </section>

            <section className="mb-4">
                <h2 className="text-lg font-bold text-cyan-600 dark:text-cyan-400 mb-2 flex items-center gap-2">
                    <span>🤝</span> Share Recipes
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    Share your favorite recipes with friends and family.
                </p>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        🚀 This feature is coming soon! You&apos;ll be able to export recipes and share them with others in multiple formats.
                    </p>
                </div>
            </section>

            <section className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2 text-sm">💡 Tips &amp; Tricks</h3>
                <ul className="text-xs text-emerald-700 dark:text-emerald-300 space-y-1 ml-4">
                    <li>• Use the All Recipes/My Recipes toggle to organize your collection</li>
                    <li>• Filters can be combined for precise recipe searches</li>
                    <li>• Save recipes to your favorites for quick access</li>
                    <li>• Imported recipes are automatically added to &quot;My Recipes&quot;</li>
                </ul>
            </section>
        </>
    );
}

/* ─── Planner Help ────────────────────────────────────────── */
function PlannerHelp() {
    return (
        <>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Planner Help</h1>

            <section className="mb-4">
                <h2 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                    <span>🗂️</span> Meal Planner
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    Plan your meals for the week and organize your eating schedule.
                </p>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 space-y-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">How to use:</p>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                        <li>• Select a day and meal type (breakfast, lunch, dinner, snack)</li>
                        <li>• Search and add recipes to your plan</li>
                        <li>• View nutritional information for planned meals</li>
                        <li>• Adjust portion sizes as needed</li>
                        <li>• See nutrition totals for each day</li>
                    </ul>
                </div>
            </section>

            <section className="mb-4">
                <h2 className="text-lg font-bold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                    <span>🧺</span> Pantry
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    Track the ingredients you have on hand at home.
                </p>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 space-y-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">How to use:</p>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                        <li>• Add items to your pantry with quantities</li>
                        <li>• Mark items as you use them</li>
                        <li>• Search for recipes you can make with items in your pantry</li>
                        <li>• Update quantities when you restock</li>
                        <li>• Get notifications when items are running low</li>
                    </ul>
                </div>
            </section>

            <section className="mb-4">
                <h2 className="text-lg font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                    <span>🛒</span> Shopping List
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    Generate and manage shopping lists based on your meal plan.
                </p>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 space-y-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">How to use:</p>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                        <li>• Auto-generate lists from your meal plan</li>
                        <li>• Organizes items by store section</li>
                        <li>• Check off items as you shop</li>
                        <li>• Edit quantities and add custom items</li>
                        <li>• Access your list on mobile while shopping</li>
                    </ul>
                </div>
            </section>

            <section className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 text-sm">💡 Workflow Tips</h3>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 ml-4">
                    <li>• Start by planning your meals for the week</li>
                    <li>• Then generate your shopping list automatically</li>
                    <li>• Keep your pantry updated for smart recipe suggestions</li>
                    <li>• Compare nutritional totals across different meal plans</li>
                </ul>
            </section>
        </>
    );
}

/* ─── Widgets Help ────────────────────────────────────────── */
function WidgetsHelp() {
    return (
        <>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Widgets Help</h1>

            <section className="mb-4">
                <h2 className="text-lg font-bold text-fuchsia-600 dark:text-fuchsia-400 mb-2 flex items-center gap-2">
                    <span>🧪</span> Nutridex
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    Deep dive into the nutritional profiles of foods and understand what you&apos;re eating.
                </p>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 space-y-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Features:</p>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                        <li>• View complete nutrient breakdowns for any food</li>
                        <li>• Compare nutritional values side-by-side</li>
                        <li>• See RDA percentages and daily value targets</li>
                        <li>• Understand micronutrients and macronutrients</li>
                        <li>• Filter by dietary goals and preferences</li>
                    </ul>
                </div>
            </section>

            <section className="mb-4">
                <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
                    <span>⚖️</span> Comparator
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    Put recipes side-by-side to make informed decisions about your meals.
                </p>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 space-y-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Features:</p>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                        <li>• Compare up to 4 recipes at once</li>
                        <li>• View nutritional similarities and differences</li>
                        <li>• Check preparation time and difficulty level</li>
                        <li>• See ingredient lists side-by-side</li>
                        <li>• Make better meal choices with visual comparisons</li>
                    </ul>
                </div>
            </section>

            <section className="mb-4">
                <h2 className="text-lg font-bold text-teal-600 dark:text-teal-400 mb-2 flex items-center gap-2">
                    <span>🛡️</span> Lifeguard
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    Identify potential allergens and dietary conflicts before consuming.
                </p>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 space-y-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Features:</p>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                        <li>• Scan for common allergens (nuts, dairy, gluten, etc.)</li>
                        <li>• Check against your dietary restrictions</li>
                        <li>• Get alerts for potential cross-contamination</li>
                        <li>• View ingredient sourcing information</li>
                        <li>• Build your personal allergen profile</li>
                    </ul>
                </div>
            </section>

            <section className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2 text-sm">💡 Power User Tips</h3>
                <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1 ml-4">
                    <li>• Use Nutridex to understand your health goals</li>
                    <li>• Use Comparator to make weekly meal decisions</li>
                    <li>• Use Lifeguard to maintain safety and dietary adherence</li>
                    <li>• Combine all three for comprehensive meal planning</li>
                </ul>
            </section>
        </>
    );
}

/* ─── Main Component ──────────────────────────────────────── */
export function ChatbotHelpSection({ type }: ChatbotHelpSectionProps) {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
            {type === 'help-cookbook' && <CookbookHelp />}
            {type === 'help-planner' && <PlannerHelp />}
            {type === 'help-widgets' && <WidgetsHelp />}
        </div>
    );
}
