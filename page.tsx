'use client';

import { useState, useEffect } from 'react';
import { CooklangParser, type Recipe } from '@/lib/cooklang-parser';

const SAMPLE_COOKLANG = `---
title: Gut-friendly beans & seabass
description: Achieve four of your five-a-day in this seabass dish served on a bed of cabbage, butter beans, leeks, spinach, capers and cashews, with dill yogurt on the side
image: https://images.immediate.co.uk/production/volatile/sites/30/2025/01/Gut-friendly-beans-and-seabass-5258904.jpg?resize=768,713
course: Dinner
nutrition:
  calories: 480 calories
  fat: 21 grams fat
  saturated fat: 4 grams saturated fat
  carbohydrates: 23 grams carbohydrates
  sugar: 9 grams sugar
  protein: 43 grams protein
  fiber: 13 grams fiber
  sodium: 1.21 milligram of sodium
cook time: 30 minutes
tags: Butter beans, Capers, Cashew nuts, goodhealth, gut health, Leeks, Savoy cabbage, Seabass, Spinach
prep time: 15 minutes
source: https://www.bbcgoodfood.com/recipes/gut-friendly-beans-seabass
servings: '4'
time required: 45 minutes
diet: GlutenFree
author: Dr Chintal Patel
---

Soak @cashew nuts{50g} in 200ml boiling water and set aside.

== Dill Yogurt ==

Mix @fat-free live Greek yogurt{4%tbsp}, @lemon juice{2%tbsp}, and @dill{small handful}(finely chopped) in a bowl and set aside until ready to serve.

== Vegetables ==

Heat @extra virgin olive oil{1%tbsp} in a #frying pan{} and fry @capers{50g} until crispy, then remove and set aside, leaving behind the oil. Add @leeks{320g}(thinly sliced), @Savoy cabbage{320g}(core removed and sliced), @garlic{4%cloves}(finely chopped), and @salt{pinch}, then cover and cook over a medium heat until soft and almost fully cooked, about ~{5%minutes}.

Tip in @baby spinach leaves{320g} and @butter beans{570g jar}. Season with a little @salt{=1%tsp} and @ground black pepper{} and stir well.

Blitz the soaked cashews and water into a smooth cream using a hand blender, then pour it over the vegetables in the pan. Cover and cook on a low heat for a few minutes until the spinach has wilted. Add a splash of water if needed.

Heat a dry frying pan over a medium-high heat. Slice a few slits into the skin of @sea bass fillets{4 x 140g} to prevent them from curling as they cook. Fry in the hot pan for a few minutes on each side until cooked through. Serve the vegetables topped with a sea bass fillet, a sprinkle of crispy capers with the dill yogurt on the side.`;

export default function CooklangStandalone() {
  const [input, setInput] = useState(SAMPLE_COOKLANG);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions' | 'nutrition'>('ingredients');
  const [showJson, setShowJson] = useState(false);
  const [editCuisine, setEditCuisine] = useState(false);
  const [cuisineValue, setCuisineValue] = useState('');
  const [editMealtype, setEditMealtype] = useState(false);
  const [mealtypeValue, setMealtypeValue] = useState('');

  const mealTypes = [
    { label: 'Breakfast', icon: '🌅', value: 'breakfast' },
    { label: 'Brunch', icon: '🥂', value: 'brunch' },
    { label: 'Lunch', icon: '☀️', value: 'lunch' },
    { label: 'Dinner', icon: '🌙', value: 'dinner' },
    { label: 'Snack', icon: '🍎', value: 'snack' },
    { label: 'Appetizer', icon: '🍴', value: 'appetizer' },
    { label: 'Dessert', icon: '🍰', value: 'dessert' },
  ];

  const getMealTypeIcon = (mealtype: string | undefined) => {
    if (!mealtype) return '🍽️';
    const meal = mealTypes.find(m => m.value === mealtype.toLowerCase());
    return meal?.icon || '🍽️';
  };

  // Auto-parse on mount
  useEffect(() => {
    handleParse();
  }, []);

  const handleParse = () => {
    try {
      const parser = new CooklangParser();
      const parsed = parser.parse(input);
      setRecipe(parsed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse recipe');
      setRecipe(null);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      setInput(text);
      const parser = new CooklangParser();
      const parsed = parser.parse(text);
      setRecipe(parsed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Cooklang Recipe Parser</h1>
          <p className="text-lg text-slate-600">Paste or upload Cooklang formatted recipes to parse them into structured data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Cooklang Recipe</h2>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste Cooklang recipe here..."
                className="w-full h-48 p-3 border border-slate-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="space-y-2">
                <label className="block">
                  <span className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg cursor-pointer font-medium transition-colors inline-block">
                    Upload File
                  </span>
                  <input
                    type="file"
                    accept=".cook,.txt"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={handleParse}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Parse Recipe
              </button>
            </div>
          </div>

          {/* Output Panel */}
          <div className="lg:col-span-2 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <p className="font-semibold text-red-900 mb-1">Parse Error</p>
                <p className="text-sm text-red-700}>{error}</p>
              </div>
            )}

            {recipe && (
              <div className="space-y-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-slate-200 rounded-t-xl p-6 space-y-4">
                  {recipe.image && (
                    <div className="mb-4">
                      <img 
                        src={recipe.image} 
                        alt={recipe.title}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{recipe.title || 'Untitled Recipe'}</h2>
                    {(recipe.description || recipe.author) && (
                      <p className="text-slate-700 italic mt-3 text-lg">
                        "{recipe.description || ''}" 
                        {recipe.author && <span> — {recipe.author}</span>}
                      </p>
                    )}
                  </div>

                  {/* Quick Stats Grid - 3x3 Icon Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Top Row: Times */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                      <div className="text-2xl mb-2">🔪</div>
                      <p className="text-slate-900 font-semibold text-lg">{recipe.prepTime?.split(' ')[0] || '—'}</p>
                      <p className="text-slate-500 text-xs">Prep Time</p>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                      <div className="text-2xl mb-2">🍳</div>
                      <p className="text-slate-900 font-semibold text-lg">{recipe.cookTime?.split(' ')[0] || '—'}</p>
                      <p className="text-slate-500 text-xs">Cook Time</p>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                      <div className="text-2xl mb-2">🍽️</div>
                      <p className="text-slate-900 font-semibold text-lg">{recipe.time?.split(' ')[0] || '—'}</p>
                      <p className="text-slate-500 text-xs">Total Time</p>
                    </div>

                    {/* Bottom Row: Recipe Details */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                      <div className="text-2xl mb-2">👥</div>
                      <p className="text-slate-900 font-semibold text-lg">{recipe.servings?.replace(/['"]/g, '') || '—'}</p>
                      <p className="text-slate-500 text-xs">Servings</p>
                    </div>

                    <div 
                      onClick={() => setEditMealtype(!editMealtype)}
                      className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer"
                    >
                      {editMealtype ? (
                        <select 
                          value={mealtypeValue}
                          onChange={(e) => setMealtypeValue(e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                          autoFocus
                        >
                          <option value="">Select Meal Type</option>
                          {mealTypes.map(meal => (
                            <option key={meal.value} value={meal.value}>
                              {meal.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <>
                          <div className="text-2xl mb-2">{getMealTypeIcon(mealtypeValue || recipe.course)}</div>
                          <p className="text-slate-900 font-semibold text-lg">{mealtypeValue || recipe.course || '+'}</p>
                          <p className="text-slate-500 text-xs">Meal</p>
                        </>
                      )}
                    </div>

                    <div 
                      onClick={() => setEditCuisine(!editCuisine)}
                      className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer"
                    >
                      {editCuisine ? (
                        <input 
                          type="text"
                          value={cuisineValue}
                          onChange={(e) => setCuisineValue(e.target.value)}
                          placeholder="Enter cuisine"
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                          autoFocus
                        />
                      ) : (
                        <>
                          <div className="text-2xl mb-2">🌍</div>
                          <p className="text-slate-900 font-semibold text-lg">{cuisineValue || recipe.cuisine || '+'}</p>
                          <p className="text-slate-500 text-xs">Cuisine</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="bg-white border-b border-slate-200 flex items-center justify-between rounded-b-xl border-t-0">
                  <div className="flex gap-0">
                    {['ingredients', 'instructions', 'nutrition'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                          activeTab === tab
                            ? 'text-orange-600 border-orange-600'
                            : 'text-slate-600 border-transparent hover:text-slate-900'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowJson(!showJson)}
                    className={`px-4 py-2 mx-6 text-sm font-medium rounded-lg transition-colors ${
                      showJson
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {showJson ? 'Recipe View' : 'View JSON'}
                  </button>
                </div>

                {/* Tab Content */}
                <div className={`bg-white border border-t-0 border-slate-200 p-6 ${!recipe.tags?.length && !recipe.source ? 'rounded-b-xl' : ''}`}> 
                  {showJson ? (
                    <div className="bg-slate-900 text-slate-100 p-6 rounded-lg overflow-auto max-h-[600px] font-mono text-xs border border-slate-800">
                      <pre>{JSON.stringify(recipe, null, 2)}</pre>
                    </div>
                  ) : (
                    <> 
                      {/* Ingredients Tab */}
                      {activeTab === 'ingredients' && (
                        <div>
                          {recipe.ingredients.length > 0 ? (
                            <div className="space-y-2">
                              {recipe.ingredients.map((ing, i) => (
                                <div key={i} className="flex items-start gap-3 pb-2 border-b border-slate-100 last:border-b-0">
                                  <div className="w-4 h-4 rounded-full bg-orange-200 mt-1 flex-shrink-0"></div>
                                  <p className="text-slate-900 flex-1">
                                    {ing.quantity !== undefined && ing.quantity !== null && (
                                      <span className="font-semibold">{ing.quantity}</span>
                                    )}
                                    {ing.unit && <span className="text-slate-600"> {ing.unit}</span>}
                                    {(ing.quantity !== undefined && ing.quantity !== null || ing.unit) && (
                                      <span className="text-slate-400"> &mdash; </span>
                                    )}
                                    <span>{ing.name}</span>
                                    {ing.preparation && (
                                      <span className="text-slate-500 italic">, {ing.preparation}</span>
                                    )}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-500">No ingredients found</p>
                          )}
                        </div>
                      )} 
                      {/* Instructions Tab */}
                      {activeTab === 'instructions' && (
                    <div className="space-y-6">
                      {/* Equipment Section */}
                      {recipe.cookware.length > 0 && (
                        <div>
                          <p className="text-slate-900 font-semibold mb-3">Equipment Needed</p>
                          <div className="flex flex-wrap gap-2">
                            {recipe.cookware.map((item, i) => (
                              <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                                {item.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Instructions */}
                      <div>
                        <p className="text-slate-900 font-semibold mb-3">Instructions</p>
                        {recipe.steps.length > 0 ? (
                          <div className="space-y-6">
                            {(() => {
                              let stepNumber = 0;
                              let currentSection: string | undefined = undefined;
                               
                              return recipe.steps.map((step, i) => {
                                stepNumber++;
                                const showSectionHeader = step.section && step.section !== currentSection;
                                if (step.section) currentSection = step.section;
                                 
                                return (
                                  <div key={i}>
                                    {showSectionHeader && (
                                      <div className="mb-4 pb-2 border-b border-slate-200">
                                        <h3 className="text-lg font-semibold text-slate-800">{step.section}</h3>
                                      </div>
                                    )}
                                    <div className="flex gap-4">
                                      <div className="flex-shrink-0">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-bold">
                                          {stepNumber}
                                        </span>
                                      </div>
                                      <div className="flex-1 pt-1">
                                        <p className="text-slate-700 leading-relaxed">{step.text}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        ) : (
                          <p className="text-slate-500">No instructions found</p>
                        )}
                      </div>
                      )}

                      {/* Nutrition Tab */}
                      {activeTab === 'nutrition' && (
                    <div>
                      {recipe.nutrition && Object.keys(recipe.nutrition).length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          {recipe.nutrition.energy && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                              <p className="text-sm font-medium text-slate-600 mb-1">Calories</p>
                              <p className="text-xl font-bold text-slate-900">{recipe.nutrition.energy}</p>
                            </div>
                          )}
                          {recipe.nutrition.protein && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                              <p className="text-sm font-medium text-slate-600 mb-1">Protein</p>
                              <p className="text-xl font-bold text-slate-900">{recipe.nutrition.protein}</p>
                            </div>
                          )}
                          {recipe.nutrition.carbs && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                              <p className="text-sm font-medium text-slate-600 mb-1">Carbohydrates</p>
                              <p className="text-xl font-bold text-slate-900">{recipe.nutrition.carbs}</p>
                            </div>
                          )}
                          {recipe.nutrition.fat && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                              <p className="text-sm font-medium text-slate-600 mb-1">Fat</p>
                              <p className="text-xl font-bold text-slate-900">{recipe.nutrition.fat}</p>
                            </div>
                          )}
                          {recipe.nutrition.saturatedFat && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                              <p className="text-sm font-medium text-slate-600 mb-1">Saturated Fat</p>
                              <p className="text-xl font-bold text-slate-900">{recipe.nutrition.saturatedFat}</p>
                            </div>
                          )}
                          {recipe.nutrition.sugar && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                              <p className="text-sm font-medium text-slate-600 mb-1">Sugar</p>
                              <p className="text-xl font-bold text-slate-900">{recipe.nutrition.sugar}</p>
                            </div>
                          )}
                          {recipe.nutrition.fiber && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                              <p className="text-sm font-medium text-slate-600 mb-1">Fiber</p>
                              <p className="text-xl font-bold text-slate-900">{recipe.nutrition.fiber}</p>
                            </div>
                          )}
                          {recipe.nutrition.sodium && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                              <p className="text-sm font-medium text-slate-600 mb-1">Sodium</p>
                              <p className="text-xl font-bold text-slate-900">{recipe.nutrition.sodium}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-center py-8">No nutrition information available</p>
                      )}
                    </div>
                  )}
                    </>
                  )}
                </div>

                {/* Tags */}
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className={`bg-slate-50 border border-t-0 border-slate-200 p-6 ${!recipe.source ? 'rounded-b-xl' : ''}`}> 
                    <p className="text-sm font-semibold text-slate-700 mb-3">Tags</p>
                    <div className="flex flex-wrap gap-2"> 
                      {recipe.tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center bg-white text-slate-700 px-3 py-1 rounded-full text-sm border border-slate-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source Attribution */}
                {recipe.source && (
                  <div className="bg-slate-50 border border-t-0 border-slate-200 rounded-b-xl p-6">
                    <a
                      href={recipe.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 underline"
                    >
                      View original recipe →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}