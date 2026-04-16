import React, { useState } from 'react';
import { Plus, Minus, Trash2, Save, Loader2, Camera, Wand2, Beaker, X } from 'lucide-react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
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
    const [showSaveOptions, setShowSaveOptions] = useState(false);

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
                    <Card className="space-y-3 p-4 pb-32 bg-card rounded-[2.5rem] border border-border shadow-2xl">
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

                        <div className="flex gap-2 mt-4">
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
                    </Card>
                </>
            )}

            {recipeStep === 3 && (
                <>
                    <Card className="space-y-4 p-4 pb-32 bg-card rounded-[2.5rem] border border-border shadow-2xl">
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

                        <div className="grid grid-cols-2 gap-4">
                            {/* Meal Type */}
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

                            {/* Servings */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    Servings
                                </label>
                                <div className="flex items-center h-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:border-emerald-500/30 transition-colors focus-within:ring-2 focus-within:ring-emerald-500">
                                    <button
                                        onClick={() => setRecipeServings(Math.max(1, recipeServings - 1))}
                                        className="h-full px-4 flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <input
                                        type="number"
                                        value={recipeServings}
                                        onChange={(e) => setRecipeServings(Math.max(1, Number(e.target.value)))}
                                        className="h-full w-16 px-0.5 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none text-center border-l border-r border-slate-200 dark:border-slate-700 flex-shrink-0"
                                        min="1"
                                    />
                                    <button
                                        onClick={() => setRecipeServings(recipeServings + 1)}
                                        className="h-full px-4 flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Prep Time */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    Prep Time (min)
                                </label>
                                <div className="flex items-center h-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:border-emerald-500/30 transition-colors focus-within:ring-2 focus-within:ring-emerald-500">
                                    <button
                                        onClick={() => setRecipePrepTime(Math.max(0, recipePrepTime - 5))}
                                        className="h-full px-4 flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <input
                                        type="number"
                                        value={recipePrepTime}
                                        onChange={(e) => setRecipePrepTime(Math.max(0, Number(e.target.value)))}
                                        className="h-full w-16 px-0.5 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none text-center border-l border-r border-slate-200 dark:border-slate-700 flex-shrink-0"
                                        min="0"
                                    />
                                    <button
                                        onClick={() => setRecipePrepTime(recipePrepTime + 5)}
                                        className="h-full px-4 flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Cook Time */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    Cook Time (min)
                                </label>
                                <div className="flex items-center h-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:border-emerald-500/30 transition-colors focus-within:ring-2 focus-within:ring-emerald-500">
                                    <button
                                        onClick={() => setRecipeCookTime(Math.max(0, recipeCookTime - 5))}
                                        className="h-full px-4 flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <input
                                        type="number"
                                        value={recipeCookTime}
                                        onChange={(e) => setRecipeCookTime(Math.max(0, Number(e.target.value)))}
                                        className="h-full w-16 px-0.5 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none text-center border-l border-r border-slate-200 dark:border-slate-700 flex-shrink-0"
                                        min="0"
                                    />
                                    <button
                                        onClick={() => setRecipeCookTime(recipeCookTime + 5)}
                                        className="h-full px-4 flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setRecipeStep(2)}
                                className="flex-1 px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold uppercase tracking-widest text-[10px] transition-all"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={() => setShowSaveOptions(true)}
                                disabled={recipeSaving || !recipeTitle || recipeIngredients.length === 0 || !recipeInstructions.some(i => i.trim())}
                                className="flex-[2] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {recipeSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                <span>Save</span>
                            </button>
                        </div>

                        <div>
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

                        <div className="flex flex-col gap-3">
                            {/* Save Options Dialog */}
                            <Dialog open={showSaveOptions} onOpenChange={setShowSaveOptions}>
                                <DialogContent showCloseButton={false} className="sm:max-w-md border-0 rounded-3xl px-8 py-6 bg-transparent shadow-none">
                                    <DialogClose asChild>
                                        <button className="absolute right-4 top-4 h-10 w-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-sm hover:bg-rose-700 transition-colors">
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Close</span>
                                        </button>
                                    </DialogClose>
                                    <div className="flex flex-col gap-3 mt-2">
                                        {/* Save as Recipe */}
                                        <button
                                            onClick={() => {
                                                handleSaveRecipe(false, false);
                                                setShowSaveOptions(false);
                                            }}
                                            disabled={recipeSaving}
                                            className="w-full h-20 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.1em] transition-all active:scale-95 shadow-xl shadow-emerald-600/20 flex items-start justify-start gap-3 px-4 py-4 disabled:opacity-50"
                                        >
                                            {recipeSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            <div className="text-left">
                                                <div className="text-sm font-bold">Recipe</div>
                                                <div className="text-xs opacity-80">Save as a new recipe</div>
                                            </div>
                                        </button>

                                        {/* Save as Remix */}
                                        <button
                                            onClick={() => {
                                                handleSaveRecipe(false, true);
                                                setShowSaveOptions(false);
                                            }}
                                            disabled={recipeSaving}
                                            className="w-full h-20 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.1em] transition-all active:scale-95 shadow-lg shadow-indigo-600/20 flex items-start justify-start gap-3 px-4 py-4 disabled:opacity-50 border border-indigo-400/30"
                                        >
                                            <Wand2 size={16} />
                                            <div className="text-left">
                                                <div className="text-sm font-bold">Remix</div>
                                                <div className="text-xs opacity-80">Save as a remix variation</div>
                                            </div>
                                        </button>

                                        {/* Save as Mix */}
                                        <button
                                            onClick={() => {
                                                handleSaveRecipe(true, false);
                                                setShowSaveOptions(false);
                                            }}
                                            disabled={recipeSaving}
                                            className="w-full h-20 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-[0.1em] transition-all active:scale-95 shadow-lg shadow-amber-600/20 flex items-start justify-start gap-3 px-4 py-4 disabled:opacity-50 border border-amber-400/30"
                                        >
                                            <Beaker size={16} />
                                            <div className="text-left">
                                                <div className="text-sm font-bold">Mix</div>
                                                <div className="text-xs opacity-80">Save as a mix combination</div>
                                            </div>
                                        </button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </Card>
                </>
            )}


        </div>
    );
}
