import React, { useState } from 'react';
import { Camera, Loader2, Save, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ParsedRecipe } from '@/types/recipe';
import { ActionPanelView } from '@/lib/context/action-panel-context';
import { RecipeBuilderPanel } from './recipe-builder-panel';
import { RecipeIngredient, IngredientBuilderHandle } from '@/components/recipe/builder/types';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface ImportViewProps {
    setActiveView: (view: ActionPanelView) => void;
    isLoading: boolean;
    recipeLoading?: boolean;
    recipeSaving?: boolean;
    successRecipe: ParsedRecipe | null;
    setSuccessRecipe: (recipe: ParsedRecipe | null) => void;
    pastedRecipeURL: string;
    setpastedRecipeURL: (url: string) => void;
    pastedRecipeContent?: string;
    setPastedRecipeContent?: (content: string) => void;
    handlePasteRecipeContent?: () => void;
    handlePasteRecipeURL: () => void;
    handleSaveAndViewRecipe: (recipe: ParsedRecipe) => void;
    handleManualRecipeCreation: () => void;
    isDragging: boolean;
    setIsDragging: (isDragging: boolean) => void;
    processRecipeImage: (file: File) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    isRecording?: boolean;
    recordingTime?: number;
    startAudioRecording?: () => void;
    stopAudioRecording?: () => void;
    videoURL?: string;
    setVideoURL?: (url: string) => void;
    toast?: (msg: string) => void;
    recipeContentRef?: React.RefObject<HTMLTextAreaElement | null>;
    // Recipe builder props
    recipeStep?: number;
    setRecipeStep?: (step: number) => void;
    recipeTitle?: string;
    setRecipeTitle?: (title: string) => void;
    recipeServings?: number;
    setRecipeServings?: (servings: number) => void;
    recipeType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'supplement';
    setRecipeType?: (type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'supplement') => void;
    recipePrepTime?: number;
    setRecipePrepTime?: (time: number) => void;
    recipeCookTime?: number;
    setRecipeCookTime?: (time: number) => void;
    recipeIngredients?: RecipeIngredient[];
    setRecipeIngredients?: (ingredients: RecipeIngredient[]) => void;
    recipeInstructions?: string[];
    setRecipeInstructions?: (instructions: string[]) => void;
    recipeImage?: string;
    setRecipeImage?: (image: string) => void;
    handleAddInstruction?: () => void;
    handleUpdateInstruction?: (index: number, value: string) => void;
    handleRemoveInstruction?: (index: number) => void;
    builderRef: React.RefObject<IngredientBuilderHandle | null>;
    recipeUploading?: boolean;
    handleRecipeImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSaveRecipe?: (isMix: boolean, isRemix: boolean) => void;
}

export function ImportView({
    setActiveView,
    isLoading,
    recipeLoading,
    recipeSaving,
    successRecipe,
    setSuccessRecipe,
    pastedRecipeURL,
    setpastedRecipeURL,
    handlePasteRecipeURL,
    handleSaveAndViewRecipe,
    handleManualRecipeCreation,
    isDragging,
    setIsDragging,
    processRecipeImage,
    fileInputRef,
    // Recipe builder props
    recipeStep = 1,
    setRecipeStep = () => {},
    recipeTitle = '',
    setRecipeTitle = () => {},
    recipeServings = 4,
    setRecipeServings = () => {},
    recipeType = 'dinner',
    setRecipeType = () => {},
    recipePrepTime = 30,
    setRecipePrepTime = () => {},
    recipeCookTime = 0,
    setRecipeCookTime = () => {},
    recipeIngredients = [],
    setRecipeIngredients = () => {},
    recipeInstructions = [''],
    setRecipeInstructions = () => {},
    recipeImage = '',
    setRecipeImage = () => {},
    handleAddInstruction = () => {},
    handleUpdateInstruction = () => {},
    handleRemoveInstruction = () => {},
    builderRef,
    recipeUploading = false,
    handleRecipeImageUpload = () => {},
    handleSaveRecipe = () => {},
}: ImportViewProps) {
    const [showMakerInline, setShowMakerInline] = useState(false);

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col animate-in fade-in duration-200">
            {/* Vertical Stack Layout */}
            <div className="flex flex-col gap-4 flex-1">
                {/* Photo Upload Card */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col bg-teal-500/20 dark:bg-teal-500/10">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">Upload a Photo</h4>
                    {isLoading ? (
                        <div className="bg-rose-500/10 dark:bg-rose-500/5 rounded-2xl p-4 border border-rose-500/20 flex flex-col flex-1 items-center justify-center">
                            <Loader2 size={24} className="text-rose-500 animate-spin mb-2" />
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Extracting recipe...</p>
                        </div>
                    ) : !successRecipe ? (
                        <>
                            <input
                                id="photo-upload-chatbot"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        processRecipeImage(file);
                                    }
                                }}
                                className="hidden"
                            />
                            <label 
                                htmlFor="photo-upload-chatbot"
                                className={cn(
                                    "bg-rose-500/10 dark:bg-rose-500/5 rounded-2xl p-4 border-2 border-dashed flex flex-col flex-1 relative overflow-hidden group transition-all duration-300 cursor-pointer block",
                                    isDragging ? "border-rose-500 bg-rose-500/20" : "border-rose-500/20 hover:border-rose-500/40"
                                )}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    const file = e.dataTransfer.files?.[0];
                                    if (file) {
                                        processRecipeImage(file);
                                    }
                                }}
                            >
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Camera size={24} className="text-rose-500 mx-auto mb-2" />
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Drag & drop or click</p>
                                    </div>
                                </div>
                            </label>
                        </>
                    ) : (
                        <div className="flex flex-col flex-1">
                            <div className="bg-rose-500/10 dark:bg-rose-500/20 rounded-xl p-3 border border-rose-500/20 mb-3 flex-1">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">{successRecipe.title}</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Recipe extracted successfully!</p>
                            </div>
                            <button
                                onClick={() => handleSaveAndViewRecipe(successRecipe)}
                                disabled={recipeSaving}
                                className="w-full px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-2"
                            >
                                {recipeSaving ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={12} />
                                        Save
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setSuccessRecipe(null);
                                }}
                                className="w-full px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors hover:bg-slate-300 dark:hover:bg-slate-700"
                            >
                                Try Another
                            </button>
                        </div>
                    )}
                </div>

                {/* URL Input Card */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col bg-blue-500/20 dark:bg-blue-500/10">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">Paste a Link</h4>
                    {!successRecipe ? (
                        <>
                            <input
                                type="url"
                                value={pastedRecipeURL}
                                onChange={(e) => setpastedRecipeURL(e.target.value)}
                                placeholder="https://example.com..."
                                className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
                            />
                            <button
                                onClick={handlePasteRecipeURL}
                                disabled={!pastedRecipeURL.trim() || recipeLoading}
                                className="w-full px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0"
                            >
                                {recipeLoading ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Parsing...
                                    </>
                                ) : (
                                    'Import'
                                )}
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col flex-1">
                            <div className="bg-purple-500/10 dark:bg-purple-500/20 rounded-xl p-3 border border-purple-500/20 mb-3 flex-1">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">{successRecipe.title}</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Recipe parsed successfully!</p>
                            </div>
                            <button
                                onClick={() => handleSaveAndViewRecipe(successRecipe)}
                                disabled={recipeSaving}
                                className="w-full px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-2"
                            >
                                {recipeSaving ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={12} />
                                        Save
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setSuccessRecipe(null);
                                    setpastedRecipeURL('');
                                }}
                                className="w-full px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors hover:bg-slate-300 dark:hover:bg-slate-700"
                            >
                                Try Another
                            </button>
                        </div>
                    )}
                </div>

                {/* Recipe Maker Card */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col bg-cyan-500/20 dark:bg-cyan-500/10">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-widest">Make a Recipe</h4>
                    <div className="flex flex-col flex-1 gap-3">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Build your recipe from scratch using our guided recipe maker.
                        </p>
                        <button
                            onClick={() => setShowMakerInline(true)}
                            className="w-full px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-black uppercase tracking-widest text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0 mt-auto"
                        >
                            <Wand2 size={14} />
                            Open Maker
                        </button>
                    </div>
                </div>

            </div>

            {/* Maker Slide-out */}
            <Sheet open={showMakerInline} onOpenChange={(open) => {
                if (!open) {
                    setShowMakerInline(false);
                    setRecipeStep(1);
                    setRecipeTitle('');
                    setRecipeServings(4);
                    setRecipeType('dinner');
                    setRecipePrepTime(30);
                    setRecipeCookTime(0);
                    setRecipeIngredients([]);
                    setRecipeInstructions(['']);
                    setRecipeImage('');
                }
            }}>
                <SheetContent side="right" hideOverlay>
                    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="text-lg font-black uppercase tracking-widest text-slate-400">Recipe Maker</h3>
                    </div>
                    <div className="px-6 pb-6 overflow-y-auto">
                        <RecipeBuilderPanel
                            recipeStep={recipeStep}
                            setRecipeStep={setRecipeStep}
                            recipeTitle={recipeTitle}
                            setRecipeTitle={setRecipeTitle}
                            recipeServings={recipeServings}
                            setRecipeServings={setRecipeServings}
                            recipeType={recipeType}
                            setRecipeType={setRecipeType}
                            recipePrepTime={recipePrepTime}
                            setRecipePrepTime={setRecipePrepTime}
                            recipeCookTime={recipeCookTime}
                            setRecipeCookTime={setRecipeCookTime}
                            recipeIngredients={recipeIngredients}
                            setRecipeIngredients={setRecipeIngredients}
                            recipeInstructions={recipeInstructions}
                            setRecipeInstructions={setRecipeInstructions}
                            recipeImage={recipeImage}
                            setRecipeImage={setRecipeImage}
                            recipeSaving={recipeSaving || false}
                            handleAddInstruction={handleAddInstruction}
                            handleUpdateInstruction={handleUpdateInstruction}
                            handleRemoveInstruction={handleRemoveInstruction}
                            builderRef={builderRef}
                            recipeUploading={recipeUploading}
                            handleRecipeImageUpload={handleRecipeImageUpload}
                            handleSaveRecipe={handleSaveRecipe}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
