import React, { forwardRef, useImperativeHandle } from 'react';
import { useIngredientBuilder } from './use-ingredient-builder';
import { MagicPasteSection } from './magic-paste-section';
import { IngredientRow } from './ingredient-row';
import { NutrientReport } from './nutrient-report';
import { BuilderEmptyState } from './builder-empty-state';
import { IngredientBuilderProps, IngredientBuilderHandle } from './types';
import FoodItemPicker from '../food-item-picker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scale, Database, Wand2, Plus, ArrowRight, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export const IngredientBuilder = forwardRef<IngredientBuilderHandle, IngredientBuilderProps>((props, ref) => {
    const { ingredients, onNext } = props;
    const {
        showPicker, setShowPicker,
        showMagicPaste, setShowMagicPaste,
        magicText, setMagicText,
        isParsing, pendingIngredients, setPendingIngredients,
        editingNameIndex, setEditingNameIndex,
        showDetailedNutrients, setShowDetailedNutrients,
        isAdmin, handleAddIngredient, handleMagicParse,
        confirmPendingIngredient, confirmAllIngredients,
        handleUSDASearchForPending, rejectPendingIngredient,
        handleUpdateQuantity, handleRemoveIngredient,
        handleUpdateName, totals, userRDAs, energyUnit
    } = useIngredientBuilder(props);

    useImperativeHandle(ref, () => ({
        handleAddIngredient: (foodItem, initialValues) => handleAddIngredient(foodItem, initialValues)
    }));

    const hasIngredients = ingredients.length > 0;

    return (
        <div className="space-y-6">
            {/* Header / Summary Card */}
            {hasIngredients && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Calories', val: Math.round(totals.calories), unit: energyUnit === 'kJ' ? 'kJ' : 'kcal', color: 'text-orange-500' },
                        { label: 'Protein', val: totals.protein.toFixed(1), unit: 'g', color: 'text-emerald-500' },
                        { label: 'Carbs', val: totals.carbs.toFixed(1), unit: 'g', color: 'text-blue-500' },
                        { label: 'Fat', val: totals.fat.toFixed(1), unit: 'g', color: 'text-amber-500' },
                    ].map((macro, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{macro.label}</p>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className={cn("text-xl font-black", macro.color)}>{macro.val}</span>
                                <span className="text-[10px] font-bold text-slate-500">{macro.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Main Workspace */}
            <div className="space-y-4">
                {!hasIngredients && !showMagicPaste && (
                    <BuilderEmptyState 
                        setShowMagicPaste={setShowMagicPaste} 
                        setShowPicker={setShowPicker} 
                    />
                )}

                {showMagicPaste && (
                    <MagicPasteSection
                        magicText={magicText}
                        setMagicText={setMagicText}
                        isParsing={isParsing}
                        handleMagicParse={handleMagicParse}
                        pendingIngredients={pendingIngredients}
                        setPendingIngredients={setPendingIngredients}
                        setShowMagicPaste={setShowMagicPaste}
                        confirmPendingIngredient={confirmPendingIngredient}
                        confirmAllIngredients={confirmAllIngredients}
                        handleUSDASearchForPending={handleUSDASearchForPending}
                        rejectPendingIngredient={rejectPendingIngredient}
                        setShowPicker={setShowPicker}
                        isAdmin={isAdmin}
                    />
                )}

                {hasIngredients && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Workspace / {ingredients.length} Items</h4>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setShowMagicPaste(true)} className="h-7 text-[9px] uppercase font-black tracking-widest gap-2">
                                    <Wand2 size={12} /> Add via Paste
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setShowPicker(true)} className="h-7 text-[9px] uppercase font-black tracking-widest gap-2 text-emerald-600">
                                    <Plus size={12} /> Search Database
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {ingredients.map((ing, idx) => (
                                <IngredientRow
                                    key={`${ing.food_item_id}-${idx}`}
                                    ingredient={ing}
                                    index={idx}
                                    editingNameIndex={editingNameIndex}
                                    setEditingNameIndex={setEditingNameIndex}
                                    handleUpdateName={handleUpdateName}
                                    handleUpdateQuantity={handleUpdateQuantity}
                                    handleRemoveIngredient={handleRemoveIngredient}
                                    setShowPicker={setShowPicker}
                                />
                            ))}
                        </div>

                        {/* Analysis Toggle */}
                        <div className="pt-4">
                            <button
                                onClick={() => setShowDetailedNutrients(!showDetailedNutrients)}
                                className="w-full py-4 flex items-center justify-between px-6 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                        <Scale size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-black uppercase tracking-widest">Protocol Analysis</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Molecular Nutrient Breakdown</p>
                                    </div>
                                </div>
                                {showDetailedNutrients ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {showDetailedNutrients && (
                                <div className="mt-6 animate-in slide-in-from-top-4 duration-500">
                                    <NutrientReport 
                                        totals={totals}
                                        userRDAs={userRDAs || {}}
                                        ingredients={ingredients}
                                        energyUnit={energyUnit}
                                        profile={{}} // Profile can be passed from context inside NutrientReport
                                    />
                                </div>
                            )}
                        </div>

                        {onNext && (
                            <div className="flex justify-center pt-8 border-t border-slate-100 dark:border-slate-800">
                                <Button 
                                    onClick={onNext}
                                    className="bg-violet-600 hover:bg-violet-700 text-white gap-2 min-w-[200px] font-black text-[10px] uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-violet-500/20"
                                >
                                    Next Phase: Instructions <ArrowRight size={14} />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Food Item Picker Modal */}
            {showPicker && (
                <FoodItemPicker
                    onClose={() => setShowPicker(false)}
                    onSelect={(food: any) => {
                        handleAddIngredient(food);
                        setShowPicker(false);
                    }}
                />
            )}
        </div>
    );
});

IngredientBuilder.displayName = 'IngredientBuilder';

export default IngredientBuilder;
