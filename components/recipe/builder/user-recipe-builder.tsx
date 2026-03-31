import React, { useRef } from 'react';
import { useRecipeWizard } from './use-recipe-wizard';
import { InstructionsSection } from './instructions-section';
import { MetadataSection } from './metadata-section';
import { ImportDialog } from './import-dialog';
import IngredientBuilder from './ingredient-builder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserRecipeBuilderProps {
    defaultType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'mix' | 'meal';
    onSaveSuccess?: (recipeId: string) => void;
}

export function UserRecipeBuilder({ defaultType = 'dinner', onSaveSuccess }: UserRecipeBuilderProps) {
    const {
        title, setTitle, prepTime, setPrepTime, servings, setServings,
        type, setType, diet, setDiet, ingredients, setIngredients,
        instructions, setInstructions, image, setImage, saving, uploading,
        showMagicInstructions, setShowMagicInstructions, magicInstructionsText, setMagicInstructionsText,
        showAutoImport, setShowAutoImport, autoImportText, setAutoImportText, isImporting,
        step, setStep, startMode, setStartMode, instructionsMode, setInstructionsMode,
        handleNextStep, handleToDetails, handleImageUpload, handleAutoImport, handleSave
    } = useRecipeWizard(defaultType, onSaveSuccess);

    const instructionsRef = useRef<HTMLDivElement>(null);
    const detailsRef = useRef<HTMLDivElement>(null);

    const onNextStep = () => {
        handleNextStep();
        setTimeout(() => instructionsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const onToDetails = () => {
        handleToDetails();
        setTimeout(() => detailsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 text-slate-800 dark:text-slate-100 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">Protocol Builder</h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Clinical Nuance & Precision Analysis</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setShowAutoImport(true)}
                        className="bg-violet-600 hover:bg-violet-700 text-white h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all shadow-lg shadow-violet-500/20 group"
                    >
                        <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-all">
                            <Database className="w-3 h-3" />
                        </div>
                        <span>Smart Protocol Import</span>
                    </Button>
                </div>
            </div>

            <div className="space-y-8">
                {/* Step 1: Core Ingredients */}
                <Card className="p-8 space-y-6 shadow-sm border border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/40">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-3">
                            <Plus className="w-5 h-5 text-violet-500" />
                            Ingredients
                        </h3>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                            {ingredients.length} items added
                        </Badge>
                    </div>
                    <IngredientBuilder
                        ingredients={ingredients}
                        onChange={setIngredients}
                        initialShowPicker={startMode === 'manual'}
                        initialShowMagicPaste={startMode === 'magic'}
                        onNext={onNextStep}
                    />
                </Card>

                {/* Step 2: Instructions */}
                {step >= 2 && (
                    <Card className="p-8 space-y-6 shadow-sm border border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/40 scroll-mt-20" ref={instructionsRef}>
                        <InstructionsSection
                            instructions={instructions}
                            setInstructions={setInstructions}
                            instructionsMode={instructionsMode}
                            setInstructionsMode={setInstructionsMode}
                            showMagicInstructions={showMagicInstructions}
                            setShowMagicInstructions={setShowMagicInstructions}
                            magicInstructionsText={magicInstructionsText}
                            setMagicInstructionsText={setMagicInstructionsText}
                            handleToDetails={onToDetails}
                        />
                    </Card>
                )}

                {/* Step 3: Metadata Section */}
                {step >= 3 && (
                    <Card className="p-8 space-y-8 shadow-sm border border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/40 scroll-mt-20" ref={detailsRef}>
                        <MetadataSection
                            title={title} setTitle={setTitle}
                            prepTime={prepTime} setPrepTime={setPrepTime}
                            servings={servings} setServings={setServings}
                            type={type} setType={setType}
                            diet={diet} setDiet={setDiet}
                            image={image} setImage={setImage}
                            uploading={uploading} handleImageUpload={handleImageUpload}
                            saving={saving} handleSave={handleSave}
                        />
                    </Card>
                )}
            </div>

            {/* Smart Import Dialog */}
            <ImportDialog
                open={showAutoImport}
                onOpenChange={setShowAutoImport}
                autoImportText={autoImportText}
                setAutoImportText={setAutoImportText}
                isImporting={isImporting}
                handleAutoImport={handleAutoImport}
            />
        </div>
    );
}

export default UserRecipeBuilder;
