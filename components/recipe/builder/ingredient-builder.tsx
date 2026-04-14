import React, { forwardRef, useImperativeHandle } from 'react';
import { useIngredientBuilder } from './use-ingredient-builder';
import { MagicPasteSection } from './magic-paste-section';
import { IngredientRow } from './ingredient-row';
import { InlineFoodSearch } from './inline-food-search';
import { IngredientBuilderProps, IngredientBuilderHandle } from './types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wand2, Plus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const IngredientBuilder = forwardRef<IngredientBuilderHandle, IngredientBuilderProps>((props, ref) => {
    const { ingredients, onNext } = props;
    const {
        showPicker, setShowPicker,
        showMagicPaste, setShowMagicPaste,
        magicText, setMagicText,
        isParsing, pendingIngredients, setPendingIngredients,
        editingNameIndex, setEditingNameIndex,
        isAdmin, handleAddIngredient, handleMagicParse,
        confirmPendingIngredient, confirmAllIngredients,
        handleUSDASearchForPending, rejectPendingIngredient,
        handleUpdateQuantity, handleRemoveIngredient,
        handleUpdateName, handleUpdateMeasure, totals, userRDAs, energyUnit
    } = useIngredientBuilder(props);

    useImperativeHandle(ref, () => ({
        handleAddIngredient: (foodItem, initialValues) => handleAddIngredient(foodItem, initialValues)
    }));

    const hasIngredients = ingredients.length > 0;

    return (
        <div className="space-y-6">
            {/* Main Workspace */}
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Add Ingredients</h4>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setShowMagicPaste(!showMagicPaste)} className="h-7 text-[9px] uppercase font-black tracking-widest gap-2">
                                <Wand2 size={12} /> {showMagicPaste ? 'Hide Paste' : 'Add via Paste'}
                            </Button>
                        </div>
                    </div>

                    <InlineFoodSearch 
                        onSelect={(food: any) => handleAddIngredient(food)} 
                        isAdmin={isAdmin}
                    />

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
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Workspace / {ingredients.length} Items</h4>
                    </div>

                    {ingredients.length > 0 ? (
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
                                    handleUpdateMeasure={handleUpdateMeasure}
                                    handleRemoveIngredient={handleRemoveIngredient}
                                    setShowPicker={setShowPicker}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/10 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Workspace is empty</p>
                        </div>
                    )}

                    {hasIngredients && (
                        <>
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});

IngredientBuilder.displayName = 'IngredientBuilder';

export default IngredientBuilder;
