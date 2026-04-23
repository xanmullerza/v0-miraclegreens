'use client';

import { useState, useEffect } from 'react';
import { CooklangParser, type Recipe } from '@/lib/cooklang-parser';

const SAMPLE_COOKLANG = `>> title: Chicken, Sausage, Peppers, and Potatoes
>> servings: 6
>> time: 1 hour 45 minutes
>> author: AllRecipes
>> source: https://www.allrecipes.com/recipe/255936/chicken-sausage-peppers-and-potatoes/

Preheat the oven to 450 degrees F (230 degrees C).

Heat @olive oil{1%tbsp} in a #skillet{} over medium heat. Add @hot Italian sausage{4%large links} and cook until browned and fat begins to render, about ~{3%minutes} per side.

Cut cooled sausages into 2-inch slices; return to the #skillet along with any accumulated juices from the cutting board.

Cut two slashes down to the bone on the skin side of each @chicken thigh{6%bone-in, skin on}.

Halve or quarter any large @sweet peppers{0.5%pound}.

Place chicken and peppers into a large mixing bowl with @red onion{1%small}(sliced), @yellow onion{0.5%medium}(sliced), sausage, and juices, @dried Italian herbs{2%tsp}, @kosher salt{2%tsp}, and freshly ground @black pepper{} to taste. Drizzle with remaining @olive oil{1%tbsp} and mix with your hands until all ingredients are coated in oil, ~{3-4%minutes}.

Transfer mixture to a large, heavy-duty #roasting pan{}. Evenly space chicken thighs with the skin facing up and position @Yukon Gold potatoes{4%large}(quartered) near the top.

Roast in the preheated oven until chicken is cooked through and everything is caramelized, about ~{60%minutes}. An instant-read thermometer inserted near the bone should read 165 degrees F (74 degrees C). Sprinkle with @Italian parsley{1%tbsp}(chopped).`;

export default function CooklangStandalone() {
  const [input, setInput] = useState(SAMPLE_COOKLANG);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');

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
                <p className="text-sm text-red-700">{error}</p>
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

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {recipe.servings && (
                      <div>
                        <p className="text-slate-600 font-semibold">Servings</p>
                        <p className="text-slate-900">{recipe.servings}</p>
                      </div>
                    )}
                    {recipe.time && (
                      <div>
                        <p className="text-slate-600 font-semibold">Total Time</p>
                        <p className="text-slate-900">{recipe.time}</p>
                      </div>
                    )}
                    {recipe.cuisine && (
                      <div>
                        <p className="text-slate-600 font-semibold">Cuisine</p>
                        <p className="text-slate-900">{recipe.cuisine}</p>
                      </div>
                    )}
                    {recipe.course && (
                      <div>
                        <p className="text-slate-600 font-semibold">Course</p>
                        <p className="text-slate-900">{recipe.course}</p>
                      </div>
                    )}
                    {recipe.prepTime && (
                      <div>
                        <p className="text-slate-600 font-semibold">Prep Time</p>
                        <p className="text-slate-900">{recipe.prepTime}</p>
                      </div>
                    )}
                    {recipe.cookTime && (
                      <div>
                        <p className="text-slate-600 font-semibold">Cook Time</p>
                        <p className="text-slate-900">{recipe.cookTime}</p>
                      </div>
                    )}
                    {recipe.yields && (
                      <div>
                        <p className="text-slate-600 font-semibold">Yields</p>
                        <p className="text-slate-900">{recipe.yields}</p>
                      </div>
                    )}
                  </div>

                  {/* Equipment */}
                  {recipe.cookware.length > 0 && (
                    <div>
                      <p className="text-slate-600 font-semibold mb-2">Equipment</p>
                      <div className="flex flex-wrap gap-2">
                        {recipe.cookware.map((item, i) => (
                          <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                            {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="bg-white border-b border-slate-200 flex gap-0 rounded-b-xl border-t-0">
                  {['ingredients', 'instructions'].map((tab) => (
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

                {/* Tab Content */}
                <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6">
                  {/* Ingredients Tab */}
                  {activeTab === 'ingredients' && (
                    <div className="space-y-4">
                      {recipe.ingredients.length > 0 ? (
                        <div className="space-y-2">
                          {recipe.ingredients.map((ing, i) => (
                            <div key={i} className="flex items-start gap-3 pb-2 border-b border-slate-100">
                              <div className="w-4 h-4 rounded-full bg-orange-200 mt-1 flex-shrink-0"></div>
                              <div className="flex-1">
                                <p className="text-slate-900">
                                  {ing.quantity && (
                                    <>
                                      <span className="font-semibold">{ing.quantity}</span>
                                      {ing.unit && <span className="text-slate-600"> {ing.unit}</span>}
                                      <span className="text-slate-600"> - </span>
                                    </>
                                  )}
                                  <span className="font-medium">{ing.name}</span>
                                </p>
                              </div>
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
                    <div className="space-y-4">
                      {recipe.steps.length > 0 ? (
                        <ol className="space-y-4">
                          {recipe.steps.map((step, i) => (
                            <li key={i} className="flex gap-4">
                              <div className="flex-shrink-0">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white text-sm font-bold">
                                  {i + 1}
                                </span>
                              </div>
                              <div className="flex-1 pt-1">
                                <p className="text-slate-700 leading-relaxed">
                                  {step.text.split(/(\[.*?\]|\{.*?\}|⏱\d+[A-Z])/).map((part, idx) => {
                                    if (!part) return null;
                                    // Ingredient: [name: qty unit]
                                    if (part.startsWith('[') && part.endsWith(']')) {
                                      return (
                                        <span key={idx} className="bg-orange-100 text-orange-900 px-2 py-1 rounded text-sm font-medium inline-block mx-1">
                                          {part}
                                        </span>
                                      );
                                    }
                                    // Cookware: {name}
                                    if (part.startsWith('{') && part.endsWith('}')) {
                                      return (
                                        <span key={idx} className="bg-blue-100 text-blue-900 px-2 py-1 rounded text-sm font-medium inline-block mx-1">
                                          {part}
                                        </span>
                                      );
                                    }
                                    // Timer: ⏱4M
                                    if (part.match(/^⏱\d+[A-Z]/)) {
                                      return (
                                        <span key={idx} className="bg-amber-100 text-amber-900 px-2 py-1 rounded text-sm font-medium inline-block mx-1">
                                          {part}
                                        </span>
                                      );
                                    }
                                    return <span key={idx}>{part}</span>;
                                  })}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-slate-500">No instructions found</p>
                      )}
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
