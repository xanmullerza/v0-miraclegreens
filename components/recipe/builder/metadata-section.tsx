import React from 'react';
import { ClipboardList, Clock, Users, Camera, Upload, Trash2, Loader2, Save } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MetadataSectionProps {
    title: string; setTitle: (t: string) => void;
    prepTime: number; setPrepTime: (p: number) => void;
    servings: number; setServings: (s: number) => void;
    type: string; setType: (t: any) => void;
    diet: string[]; setDiet: (d: string[]) => void;
    image: string; setImage: (i: string) => void;
    uploading: boolean; handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    saving: boolean; handleSave: () => void;
}

export function MetadataSection({
    title, setTitle, prepTime, setPrepTime, servings, setServings,
    type, setType, diet, setDiet, image, setImage, uploading,
    handleImageUpload, saving, handleSave
}: MetadataSectionProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <ClipboardList size={20} className="text-violet-500" />
                <h3 className="font-bold uppercase tracking-wider text-sm text-slate-800 dark:text-slate-100">Protocol Metadata</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recipe Title</Label>
                        <Input
                            className="font-bold text-lg h-12 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                            placeholder="The Golden Bowl..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Clock size={12} /> Prep (min)
                            </Label>
                            <Input
                                type="number"
                                className="h-10 bg-slate-50 dark:bg-slate-950 font-bold"
                                value={prepTime}
                                onChange={(e) => setPrepTime(Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Users size={12} /> Servings
                            </Label>
                            <Input
                                type="number"
                                className="h-10 bg-slate-50 dark:bg-slate-950 font-bold"
                                value={servings}
                                onChange={(e) => setServings(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meal Type</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {['breakfast', 'lunch', 'dinner', 'snack', 'mix', 'meal'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setType(m)}
                                    className={cn(
                                        "h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                        type === m
                                            ? "bg-violet-500 text-white border-violet-600 shadow-md shadow-violet-500/20"
                                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-violet-500/50"
                                    )}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dietary Profile</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Balanced (Omnivore)', 'Pescetarian', 'Vegetarian', 'Vegan', 'Keto', 'Paleo'].map(d => (
                                <button
                                    key={d}
                                    onClick={() => {
                                        if (diet.includes(d)) setDiet(diet.filter(item => item !== d));
                                        else setDiet([...diet, d]);
                                    }}
                                    className={cn(
                                        "h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border px-2",
                                        diet.includes(d)
                                            ? "bg-blue-500 text-white border-blue-600 shadow-md shadow-blue-500/20"
                                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-500/50"
                                    )}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-end pt-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-8 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Camera size={12} /> Protocol Documentation (Photo)
                        </Label>
                        <div className="relative aspect-video rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden group hover:border-violet-500/50 transition-all flex flex-col items-center justify-center">
                            {image ? (
                                <>
                                    <img src={image} alt="Recipe" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="secondary" size="sm" className="gap-2" onClick={() => setImage('')}>
                                            <Trash2 size={14} /> Remove
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-center p-4 pointer-events-none">
                                        {uploading ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-violet-500 mx-auto" />
                                        ) : (
                                            <>
                                                <Upload size={20} className="text-slate-400 mx-auto mb-2" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Photo</p>
                                            </>
                                        )}
                                    </div>
                                    {!uploading && (
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-14 px-12 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center gap-4 hover:scale-[1.02] transition-all shadow-xl disabled:bg-slate-500"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Archive Complete Protocol</span>
                </Button>
            </div>
        </div>
    );
}
