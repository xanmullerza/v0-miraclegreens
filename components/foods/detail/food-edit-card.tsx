import React from 'react';
import { X, Camera, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { FoodDetailContextType } from './types';
import { CATEGORIES } from '@/components/foods/food-filters-panel';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900 shadow-xl rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden", className)}>
        {children}
    </div>
);

export function FoodEditCard({ ctx }: { ctx: FoodDetailContextType }) {
    const { 
        isEditing, setIsEditing, editName, setEditName, editCommonName, setEditCommonName,
        editCategory, setEditCategory, editImage, setEditImage, editNutrientText, setEditNutrientText,
        editServingText, setEditServingText, uploading, saveLoading, handleImageUpload, handleEditSave
    } = ctx;

    if (!isEditing) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md">
                <Card className="bg-white dark:bg-slate-900 p-8 space-y-6 shadow-2xl border-emerald-500/20">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic">Edit Ingredient Details</h3>
                        <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Ingredient Name (Scientific)</Label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold h-12 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Common Name</Label>
                            <Input
                                value={editCommonName}
                                onChange={(e) => setEditCommonName(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-12 rounded-xl"
                                placeholder="e.g. Garden Pea"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Biological Category</Label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setEditCategory(category)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                                            editCategory === category
                                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        )}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Display Image</Label>
                            <div className="relative aspect-video rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden group/upload flex items-center justify-center">
                                {editImage ? (
                                    <>
                                        <img src={editImage} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="secondary" size="sm" className="gap-2" onClick={() => setEditImage('')}>
                                                <X size={14} /> Remove
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        {uploading ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
                                        ) : (
                                            <>
                                                <Camera size={24} className="text-slate-400 mx-auto mb-2" />
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Upload Profile Image</p>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={handleImageUpload}
                                                />
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Nutrients per 100g</Label>
                            <textarea
                                value={editNutrientText}
                                onChange={(e) => setEditNutrientText(e.target.value)}
                                className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                placeholder="Paste nutrition data here..."
                            />
                            <p className="text-[9px] text-slate-400">Format: "Protein: 10g" or paste from USDA</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Serving Sizes</Label>
                            <textarea
                                value={editServingText}
                                onChange={(e) => setEditServingText(e.target.value)}
                                className="w-full h-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                                placeholder="1 cup = 240g&#10;1 large = 150g"
                            />
                            <p className="text-[9px] text-slate-400">Format: "1 cup = 240g"</p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Button variant="outline" className="flex-1 rounded-2xl h-12 font-black uppercase tracking-widest text-[10px]" onClick={() => setIsEditing(false)}>
                            Discard
                        </Button>
                        <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 gap-2"
                            onClick={handleEditSave}
                            disabled={saveLoading}
                        >
                            {saveLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Save Profile
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
