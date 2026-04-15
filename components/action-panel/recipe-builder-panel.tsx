import React from 'react';
import { Plus, Trash2, Save, Loader2, Camera, Wand2, Beaker } from 'lucide-react';
import IngredientBuilder, { RecipeIngredient, IngredientBuilderHandle } from '@/components/recipe/ingredient-builder';

interface RecipeBuilderPanelProps {
    recipeStep: number;
    setRecipeStep: (step: number) => void;
    recipeTitle: string;
    setRecipeTitle: (title: string) => void;
    recipeServings: number;
    setRecipeServings: (servings: number) => void;
    recipeType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'supplement';
    setRecipeType: (type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'supplement') => void;
    recipePrepTime: number;
    setRecipePrepTime: (time: number) => void;
    recipeCookTime: number;
    setRecipeCookTime: (time: number) => void;
    recipeIngredients: RecipeIngredient[];
    setRecipeIngredients: (ingredients: RecipeIngredient[]) => void;
    recipeInstructions: string[];
    setRecipeInstructions: (instructions: string[]) => void;
    recipeImage: string;
    setRecipeImage: (image: string) => void;
    recipeSaving: boolean;
    handleAddInstruction: () => void;
    handleUpdateInstruction: (index: number, value: string) => void;
    handleRemoveInstruction: (index: number) => void;
    builderRef: React.RefObject<IngredientBuilderHandle | null>;
    recipeUploading: boolean;
    handleRecipeImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSaveRecipe: (isMix: boolean, isRemix: boolean) => void;
}

export function RecipeBuilderPanel({
    recipeStep,
    setRecipeStep,
    recipeTitle,
    setRecipeTitle,
    recipeServings,
    setRecipeServings,
    recipeType,
    setRecipeType,
    recipePrepTime,
    setRecipePrepTime,
    recipeCookTime,
    setRecipeCookTime,
    recipeIngredients,
    setRecipeIngredients,
    recipeInstructions,
    recipeImage,
    setRecipeImage,
    recipeSaving,
    handleAddInstruction,
    handleUpdateInstruction,
    handleRemoveInstruction,
    builderRef,
    recipeUploading,
    handleRecipeImageUpload,
    handleSaveRecipe
}: RecipeBuilderPanelProps) {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 p-4">
            {/* Step Title */}
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                    {recipeStep === 1 ? 'Step 1: Add Ingredients' : recipeStep === 2 ? 'Step 2: Instructions' : 'Step 3: Finalize Recipe'}
                </h3>
            </div>

            {recipeStep === 1 && (
                <>
                    <IngredientBuilder
                        ref={builderRef}
                        ingredients={recipeIngredients}
                        onChange={setRecipeIngredients}
                        initialShowPicker={recipeIngredients.length === 0}
                        onNext={() => setRecipeStep(2)}
                    />
                </>
            )}

            {recipeStep === 2 && (
                <>
                    <div className="flex flex-col px-2 gap-3">
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Add Directions</h4>
                        </div>
                    </div>
                    <div className="space-y-2 pt-4">
                        {recipeInstructions.map((step, idx) => (
                            <div key={idx} className="flex gap-2 group">
                                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center font-black text-[10px] text-muted-foreground shrink-0 border border-border">
                                    {idx + 1}
                                </div>
                                <textarea
                                    value={step}
                                    onChange={(e) => handleUpdateInstruction(idx, e.target.value)}
                                    placeholder={`Direction ${idx + 1}...`}
                                    className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[50px] resize-none"
                                />
                                {recipeInstructions.length > 1 && (
                                    <button
                                        onClick={() => handleRemoveInstruction(idx)}
                                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors shrink-0 mt-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4">
                        <button
                            onClick={handleAddInstruction}
                            className="w-full h-8 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] uppercase font-black tracking-widest rounded-lg px-4"
                        >
                            {recipeInstructions.length === 0 ? 'Add your first direction' : 'Add direction'}
                        </button>
                    </div>

                    <div className="flex gap-2 mt-4 pb-32">
                        <button
                            onClick={() => setRecipeStep(1)}
                            className="flex-1 px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-widest text-[10px] transition-all hover:bg-slate-300 dark:hover:bg-slate-700"
                        >
                            ← Back
                        </button>
                        <button
                            onClick={() => setRecipeStep(3)}
                            disabled={recipeInstructions.filter(i => i.trim()).length === 0}
                            className="flex-[2] px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                            Next: Finalize →
                        </button>
                    </div>
                </>
            )}

            {recipeStep === 3 && (
                <>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                            Recipe Title *
                        </label>
                        <input
                            type="text"
                            value={recipeTitle}
                            onChange={(e) => setRecipeTitle(e.target.value)}
                            placeholder="e.g., Chicken Stir Fry"
                            className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                Meal Type
                            </label>
                            <select
                                value={recipeType}
                                onChange={(e) => setRecipeType(e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'supplement')}
                                className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                                <option value="snack">Snack</option>
                                <option value="supplement">Supplement</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                Servings
                            </label>
                            <input
                                type="number"
                                value={recipeServings}
                                onChange={(e) => setRecipeServings(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                Prep Time (min)
                            </label>
                            <input
                                type="number"
                                value={recipePrepTime}
                                onChange={(e) => setRecipePrepTime(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                Cook Time (min)
                            </label>
                            <input
                                type="number"
                                value={recipeCookTime}
                                onChange={(e) => setRecipeCookTime(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => setRecipeStep(2)}
                            className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium text-sm transition-colors"
                        >
                            ← Back
                        </button>
                    </div>

                    <div className="mt-6">
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                            Recipe Photo (Optional)
                        </label>
                        <div className="relative aspect-video rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden group hover:border-emerald-500/50 transition-all">
                            {recipeImage ? (
                                <div className="w-full h-full relative">
                                    <img src={recipeImage} alt="Recipe" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            className="gap-2 px-3 py-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center"
                                            onClick={() => setRecipeImage('')}
                                        >
                                            <Trash2 size={12} /> Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-3">
                                    <div className="text-center">
                                        {recipeUploading ? (
                                            <Loader2 className="h-5 w-5 animate-spin text-emerald-500 mx-auto" />
                                        ) : (
                                            <>
                                                <Camera size={18} className="text-slate-400 mx-auto mb-2" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Photo</p>
                                            </>
                                        )}
                                    </div>
                                    {!recipeUploading && (
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleRecipeImageUpload}
                                        />
                                    )}
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-8">
                        {/* Primary Save Button */}
                        <button
                            onClick={() => handleSaveRecipe(false, false)}
                            disabled={recipeSaving || !recipeTitle || recipeIngredients.length === 0 || !recipeInstructions.some(i => i.trim())}
                            className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.1em] transition-all active:scale-95 shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {recipeSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            <span className="text-[10px]">Save as Recipe</span>
                        </button>

                        {/* Secondary Action Buttons */}
                        <div className="flex gap-3">
                            {/* Remix Button */}
                            <button
                                onClick={() => handleSaveRecipe(false, true)}
                                disabled={recipeSaving || !recipeTitle || recipeIngredients.length === 0}
                                className="flex-1 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.1em] transition-all active:scale-95 shadow-lg shadow-indigo-600/20 flex flex-col items-center justify-center gap-1 disabled:opacity-50 border border-indigo-400/30"
                            >
                                <Wand2 size={14} className="mb-0.5" />
                                <span className="text-[9px]">Save as Remix</span>
                            </button>

                            {/* Mix Button */}
                            <button
                                onClick={() => handleSaveRecipe(true, false)}
                                disabled={recipeSaving || !recipeTitle || recipeIngredients.length === 0}
                                className="flex-1 h-16 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-[0.1em] transition-all active:scale-95 shadow-lg shadow-amber-600/20 flex flex-col items-center justify-center gap-1 disabled:opacity-50 border border-amber-400/30"
                            >
                                <Beaker size={14} className="mb-0.5" />
                                <span className="text-[9px]">Save as Mix</span>
                            </button>
                        </div>
                    </div>
                </>
            )}


        </div>
    );
}
