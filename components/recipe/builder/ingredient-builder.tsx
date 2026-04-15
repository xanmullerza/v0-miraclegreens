import React, { forwardRef, useImperativeHandle } from 'react';
import { useIngredientBuilder } from './use-ingredient-builder';
import { IngredientRow } from './ingredient-row';
import { InlineFoodSearch } from './inline-food-search';
import { IngredientBuilderProps, IngredientBuilderHandle } from './types';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const IngredientBuilder = forwardRef<IngredientBuilderHandle, IngredientBuilderProps>((props, ref) => {
    const { ingredients, onNext, showPicker: externalShowPicker, onShowPickerChange } = props;
    const {
        showPicker, setShowPicker,
        editingNameIndex, setEditingNameIndex,
        isAdmin, handleAddIngredient,
        handleUpdateQuantity, handleRemoveIngredient,
        handleUpdateName, handleUpdateMeasure, totals, userRDAs, energyUnit
    } = useIngredientBuilder(props, externalShowPicker, onShowPickerChange);

    useImperativeHandle(ref, () => ({
        handleAddIngredient: (foodItem, initialValues) => handleAddIngredient(foodItem, initialValues)
    }));

    const hasIngredients = ingredients.length > 0;

    return (
        <div className="space-y-6">
            {/* Main Workspace */}
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="flex justify-center px-2">
                        {!hasIngredients && !showPicker ? (
                            <Button
                                onClick={() => setShowPicker(true)}
                                className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] uppercase font-black tracking-widest"
                            >
                                Add ingredient
                            </Button>
                        ) : null}

                        {!hasIngredients && showPicker ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPicker(false)}
                                className="h-8 text-[10px] uppercase font-black tracking-widest"
                            >
                                Cancel search
                            </Button>
                        ) : null}
                    </div>

                    {showPicker && (
                        <div className="pt-4">
                            <InlineFoodSearch
                                onSelect={(food: any) => {
                                    handleAddIngredient(food);
                                    setShowPicker(false);
                                }}
                                isAdmin={isAdmin}
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-center px-2">
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
                                />
                            ))}
                            <div className="pt-4 flex justify-center">
                                {!showPicker ? (
                                    <Button
                                        onClick={() => setShowPicker(true)}
                                        className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] uppercase font-black tracking-widest"
                                    >
                                        Add ingredient
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowPicker(false)}
                                        className="h-8 text-[10px] uppercase font-black tracking-widest"
                                    >
                                        Cancel search
                                    </Button>
                                )}
                            </div>
                            {hasIngredients && onNext && (
                                <div className="flex justify-center pt-8 border-t border-slate-100 dark:border-slate-800 pb-32">
                                    <Button 
                                        onClick={onNext}
                                        className="bg-violet-600 hover:bg-violet-700 text-white gap-2 min-w-[200px] font-black text-[10px] uppercase tracking-widest h-12 rounded-xl shadow-lg shadow-violet-500/20"
                                    >
                                        Next Phase: Instructions <ArrowRight size={14} />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/10 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Workspace is empty</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

IngredientBuilder.displayName = 'IngredientBuilder';

export default IngredientBuilder;
