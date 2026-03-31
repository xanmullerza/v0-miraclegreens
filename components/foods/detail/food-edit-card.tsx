import React, { useEffect, useState } from 'react';
import { X, Camera, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { FoodDetailContextType } from './types';
import { CATEGORIES } from '@/components/foods/food-filters-panel';
import { useSplitView } from '@/lib/context/split-view-context';

import { createPortal } from 'react-dom';

export function FoodEditCard({ ctx }: { ctx: FoodDetailContextType }) {
    const { 
        isEditing, setIsEditing, editName, setEditName, editCommonName, setEditCommonName,
        editCategory, setEditCategory, editImage, setEditImage, editNutrientText, setEditNutrientText,
        editServingText, setEditServingText, uploading, saveLoading, handleImageUpload, handleEditSave
    } = ctx;
    const { resizeMode } = useSplitView();
    const [isDesktop, setIsDesktop] = useState(true);

    useEffect(() => {
        const check = () => setIsDesktop(window.innerWidth >= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    if (!isEditing) return null;

    const getChatWidth = () => {
        if (!isDesktop) return 'w-full';
        switch (resizeMode) {
            case 'equal': return 'w-1/2';
            case 'content-focus': return 'w-1/3';
            case 'dashboard-only': return 'w-full';
            default: return 'w-1/2';
        }
    };

    return createPortal(
        <div className={cn(
            "fixed inset-0 md:inset-auto md:top-0 md:bottom-0 md:right-0 z-[1000] transition-all duration-300 animate-in slide-in-from-right-8 fade-in flex flex-col bg-slate-950/80 backdrop-blur-3xl md:border-l md:border-slate-800 shadow-2xl pt-safe md:pt-[3.5rem]",
            getChatWidth()
        )}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800/50 shrink-0 bg-slate-950/50">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white flex items-center gap-2">
                    Edit Ingredient Details
                </h3>
                <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-900/50 hover:bg-slate-800 rounded-full p-2">
                    <X size={20} />
                </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* Fields */}
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Ingredient Name (Scientific)</Label>
                    <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-slate-900/50 border-slate-800 text-white font-bold h-12 rounded-xl focus-visible:ring-emerald-500/50"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Common Name</Label>
                    <Input
                        value={editCommonName}
                        onChange={(e) => setEditCommonName(e.target.value)}
                        className="bg-slate-900/50 border-slate-800 text-white h-12 rounded-xl focus-visible:ring-emerald-500/50"
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
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                    editCategory === category
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                        : "bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300 border border-slate-800"
                                )}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Display Image</Label>
                    <div className="relative aspect-video rounded-2xl bg-slate-900/50 border-2 border-dashed border-slate-800 overflow-hidden group/upload flex items-center justify-center">
                        {editImage ? (
                            <>
                                <img src={editImage} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button variant="secondary" size="sm" className="gap-2 bg-white/10 text-white hover:bg-white/20 border-white/10" onClick={() => setEditImage('')}>
                                        <X size={14} /> Remove
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-6">
                                {uploading ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                                            <Camera size={20} className="text-slate-400" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-300">Upload Profile Image</p>
                                        <p className="text-[9px] font-medium text-slate-500 mt-1 uppercase tracking-widest">Recommended size: 800x800px</p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleImageUpload}
                                        />
                                    </div>
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
                        className="w-full h-32 bg-slate-900/50 text-white border border-slate-800 rounded-xl p-4 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-600 custom-scrollbar"
                        placeholder="Paste nutrition data here..."
                    />
                    <p className="text-[9px] text-slate-500 font-medium">Format: "Protein: 10g" or paste directly from USDA</p>
                </div>

                <div className="space-y-2 pb-6">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Serving Sizes</Label>
                    <textarea
                        value={editServingText}
                        onChange={(e) => setEditServingText(e.target.value)}
                        className="w-full h-24 bg-slate-900/50 text-white border border-slate-800 rounded-xl p-4 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-600 custom-scrollbar"
                        placeholder="1 cup = 240g&#10;1 large = 150g"
                    />
                    <p className="text-[9px] text-slate-500 font-medium">Format: "1 cup = 240g"</p>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-800/50 bg-slate-950/80 shrink-0">
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors" onClick={() => setIsEditing(false)}>
                        Discard
                    </Button>
                    <Button
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-500/20 gap-2 transition-all"
                        onClick={handleEditSave}
                        disabled={saveLoading}
                    >
                        {saveLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Profile
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
