'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Save,
    ArrowLeft,
    Plus,
    Trash2,
    Sparkles,
    Scale,
    Beef,
    Zap,
    Utensils,
    Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { parseNutritionText } from '@/lib/utils/nutrition-parser';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const MICRONUTRIENT_UNITS: Record<string, string> = {
    'Potassium': 'mg',
    'Magnesium': 'mg',
    'Calcium': 'mg',
    'Phosphorus': 'mg',
    'Sodium': 'mg',
    'Iron': 'mg',
    'Zinc': 'mg',
    'Selenium': 'µg',
    'Copper': 'mg',
    'Manganese': 'mg',
    'Chromium': 'µg',
    'Fluoride': 'µg',
    'Iodine': 'µg',
    'Molybdenum': 'µg',
    'Vitamin A': 'µg',
    'Vitamin C': 'mg',
    'Vitamin D': 'µg',
    'Vitamin E': 'mg',
    'Vitamin K': 'µg',
    'B1 (Thiamine)': 'mg',
    'B2 (Riboflavin)': 'mg',
    'B3 (Niacin)': 'mg',
    'B5 (Pantothenic Acid)': 'mg',
    'B6 (Pyridoxine)': 'mg',
    'B9 (Folate)': 'µg',
    'B12 (Cobalamin)': 'µg',
    'Choline': 'mg',
    'Fiber': 'g'
};

const STANDARD_MICROS = [
    'Potassium', 'Magnesium', 'Calcium', 'Phosphorus', 'Sodium',
    'Iron', 'Zinc', 'Selenium', 'Copper', 'Manganese',
    'Chromium', 'Fluoride', 'Iodine', 'Molybdenum',
    'Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K',
    'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)',
    'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)',
    'B12 (Cobalamin)', 'Choline'
];

export default function DashboardFoodPage() {
    return (
        <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" /></div>}>
            <FoodItemCreatorContent />
        </Suspense>
    );
}

function FoodItemCreatorContent() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // State for the food item
    const [name, setName] = useState('');
    const [commonName, setCommonName] = useState('');
    const [energyKcal, setEnergyKcal] = useState<string>('');
    const [energyKj, setEnergyKj] = useState<string>('');
    const [protein, setProtein] = useState<string>('');
    const [carbs, setCarbs] = useState<string>('');
    const [fat, setFat] = useState<string>('');
    const [source, setSource] = useState<string>('manual');
    const [micronutrients, setMicronutrients] = useState<Record<string, string>>({});

    // State for measures
    const [measures, setMeasures] = useState<{ label: string; weight: string }[]>([
        { label: 'cup', weight: '' },
        { label: 'portion', weight: '' }
    ]);

    const [rawText, setRawText] = useState('');
    const [showParser, setShowParser] = useState(true);

    const handleParse = () => {
        if (!rawText.trim()) return;

        const parsed = parseNutritionText(rawText);

        if (parsed.energy_kcal) {
            setEnergyKcal(parsed.energy_kcal.toString());
            if (!parsed.energy_kj) {
                setEnergyKj(Math.round(parsed.energy_kcal * 4.184).toString());
            }
        }
        if (parsed.energy_kj) {
            setEnergyKj(parsed.energy_kj.toString());
            if (!parsed.energy_kcal) {
                setEnergyKcal((parsed.energy_kj / 4.184).toFixed(1));
            }
        }
        if (parsed.protein_g) setProtein(parsed.protein_g.toString());
        if (parsed.carbs_g) setCarbs(parsed.carbs_g.toString());
        if (parsed.fat_g) setFat(parsed.fat_g.toString());

        if (parsed.micronutrients) {
            const newMicros: Record<string, string> = {};
            Object.entries(parsed.micronutrients).forEach(([key, val]) => {
                newMicros[key] = val.toString();
            });
            setMicronutrients(prev => ({ ...prev, ...newMicros }));
        }

        setShowParser(false);
    };

    const handleSave = async () => {
        if (!name) {
            alert('Please enter a name for the food item');
            return;
        }

        setLoading(true);
        try {
            // 1. Prepare data
            const foodData = {
                name,
                common_name: commonName || null,
                source: source || 'manual',
                energy_kcal: parseFloat(energyKcal) || null,
                energy_kj: parseFloat(energyKj) || (parseFloat(energyKcal) ? Math.round(parseFloat(energyKcal) * 4.184) : null),
                protein_g: parseFloat(protein) || 0,
                carbs_g: parseFloat(carbs) || 0,
                fat_g: parseFloat(fat) || 0,
                micronutrients: Object.entries(micronutrients).reduce((acc, [key, val]) => {
                    if (val) acc[key] = parseFloat(val);
                    return acc;
                }, {} as Record<string, number>)
            };

            // 2. Upsert food item
            const { data: item, error: itemError } = await supabase
                .from('food_items')
                .upsert(foodData, { onConflict: 'name' })
                .select()
                .single();

            if (itemError) throw itemError;

            // 3. Save measures
            const validMeasures = measures
                .filter(m => m.label && m.weight && parseFloat(m.weight) > 0)
                .map(m => ({
                    food_item_id: item.id,
                    label: m.label.toLowerCase().trim(),
                    weight_g: parseFloat(m.weight)
                }));

            if (validMeasures.length > 0) {
                const { error: measError } = await supabase
                    .from('food_measures')
                    .upsert(validMeasures, { onConflict: 'food_item_id, label' });

                if (measError) throw measError;
            }

            alert('Food item saved successfully!');
        } catch (err: any) {
            console.error('Error saving food item:', err);
            alert(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const updateMicro = (name: string, value: string) => {
        setMicronutrients(prev => ({ ...prev, [name]: value }));
    };

    const addMeasure = () => setMeasures([...measures, { label: '', weight: '' }]);
    const removeMeasure = (index: number) => setMeasures(measures.filter((_, i) => i !== index));
    const updateMeasure = (index: number, field: 'label' | 'weight', value: string) => {
        const newMeasures = [...measures];
        newMeasures[index][field] = value;
        setMeasures(newMeasures);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Food Library Architect</h1>
                    <p className="text-slate-500 mt-1 text-sm">Add or update clinical-grade ingredients with precision.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowParser(!showParser)}
                        className="gap-2 border-slate-200 dark:border-slate-800"
                    >
                        <Sparkles size={16} className="text-amber-500" />
                        {showParser ? 'Hide Parser' : 'Show Parser'}
                    </Button>
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-700 min-w-[140px] text-white shadow-lg shadow-emerald-500/10 gap-2"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-r-white" /> : <Save size={16} />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {showParser && (
                <Card className="p-6 border-emerald-500/20 bg-emerald-500/[0.02] animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <Zap size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Magic Data Extraction</h3>
                            <p className="text-xs text-slate-500">Paste raw nutritional text to automatically map clinical data.</p>
                        </div>
                    </div>
                    <Textarea
                        placeholder="Paste nutritional data here..."
                        className="min-h-[160px] mb-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm"
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <Button onClick={handleParse} className="bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-bold uppercase tracking-widest px-6">
                            Run Extraction
                        </Button>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Basics & Macros */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                            <Beef size={18} className="text-emerald-500" />
                            <h3 className="font-bold text-sm uppercase tracking-wider">Identity</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Scientific Name</Label>
                                <Input
                                    placeholder="e.g. Peppers, sweet, green, raw"
                                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Common Name</Label>
                                <Input
                                    placeholder="e.g. Green Bell Pepper"
                                    className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm"
                                    value={commonName}
                                    onChange={(e) => setCommonName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Authority Source</Label>
                                <select
                                    className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                >
                                    <option value="manual">Manual Entry</option>
                                    <option value="usda">USDA FoodData Central</option>
                                    <option value="nccdb">NCCDB (Clinical)</option>
                                    <option value="nutritionfacts">NutritionFacts.org</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                            <Scale size={18} className="text-emerald-500" />
                            <h3 className="font-bold text-sm uppercase tracking-wider">Base Macros (100g)</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">kcal</Label>
                                <Input type="number" value={energyKcal} className="font-bold text-center" onChange={(e) => setEnergyKcal(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">kJ</Label>
                                <Input type="number" value={energyKj} className="font-bold text-center" onChange={(e) => setEnergyKj(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Protein (g)</Label>
                                <Input type="number" value={protein} className="text-center" onChange={(e) => setProtein(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Carbs (g)</Label>
                                <Input type="number" value={carbs} className="text-center" onChange={(e) => setCarbs(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Fat (g)</Label>
                                <Input type="number" value={fat} className="text-center" onChange={(e) => setFat(e.target.value)} />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 shadow-md border-amber-100/50 dark:border-amber-900/20 bg-amber-50/10 dark:bg-amber-950/5">
                        <h3 className="font-bold text-[10px] uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
                            <Sparkles size={14} /> Sugar Dynamics (g)
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {['Fructose', 'Glucose', 'Sucrose', 'Lactose', 'Sugar Alcohol'].map(s => (
                                <div key={s} className="space-y-1">
                                    <Label className="text-[9px] uppercase font-bold text-slate-400">{s}</Label>
                                    <Input
                                        type="number"
                                        className="h-7 text-xs bg-white dark:bg-slate-900"
                                        value={micronutrients[s] || ''}
                                        onChange={(e) => updateMicro(s, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Right Area: Large Sections */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <Zap size={18} className="text-emerald-500" />
                                    <h3 className="font-bold text-sm uppercase tracking-wider">Clinical Micros</h3>
                                </div>
                                <Badge variant="outline" className="text-[10px] opacity-50 font-normal">Essential</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                {STANDARD_MICROS.slice(0, 16).map(micro => (
                                    <div key={micro} className="space-y-1">
                                        <Label className="text-[10px] text-slate-500 truncate block">
                                            {micro} <span className="text-[8px] opacity-60">({MICRONUTRIENT_UNITS[micro] || 'mg'})</span>
                                        </Label>
                                        <Input
                                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950"
                                            value={micronutrients[micro] || ''}
                                            onChange={(e) => updateMicro(micro, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <div className="space-y-6">
                            <Card className="p-6">
                                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                                    <Utensils size={18} className="text-blue-500" />
                                    <h3 className="font-bold text-sm uppercase tracking-wider">Unit Scaling</h3>
                                </div>
                                <div className="space-y-4">
                                    {measures.map((m, i) => (
                                        <div key={i} className="flex gap-2 items-end">
                                            <div className="flex-1">
                                                <Label className="text-[9px] font-bold text-slate-400">Unit Label</Label>
                                                <Input
                                                    value={m.label}
                                                    className="h-8 text-xs bg-slate-50 dark:bg-slate-950"
                                                    onChange={(e) => updateMeasure(i, 'label', e.target.value)}
                                                />
                                            </div>
                                            <div className="w-20">
                                                <Label className="text-[9px] font-bold text-slate-400">grams</Label>
                                                <Input
                                                    type="number"
                                                    value={m.weight}
                                                    className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-bold text-center"
                                                    onChange={(e) => updateMeasure(i, 'weight', e.target.value)}
                                                />
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => removeMeasure(i)} className="h-8 w-8 text-slate-300 hover:text-rose-500 transition-colors">
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={addMeasure} className="w-full text-[10px] uppercase font-black tracking-widest h-8 border-dashed">
                                        <Plus size={12} className="mr-1" /> Add Reference Unit
                                    </Button>
                                </div>
                            </Card>

                            <Card className="p-6 border-rose-500/10 bg-rose-500/[0.01]">
                                <h3 className="font-bold text-[10px] uppercase tracking-widest text-rose-600 mb-4 flex items-center gap-2">
                                    <Activity size={14} /> Health Markers
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { key: 'Oxalate', unit: 'mg' },
                                        { key: 'Fiber', unit: 'g' },
                                        { key: 'Water', unit: 'g' },
                                        { key: 'Magnesium', unit: 'mg' }
                                    ].map(m => (
                                        <div key={m.key} className="space-y-1">
                                            <Label className="text-[10px] font-bold text-slate-500">{m.key} ({m.unit})</Label>
                                            <Input
                                                type="number"
                                                className="h-8 text-xs"
                                                value={micronutrients[m.key] || ''}
                                                onChange={(e) => updateMicro(m.key, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>

                    <Card className="p-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                            <Sparkles size={18} className="text-purple-500" />
                            <h3 className="font-bold text-sm uppercase tracking-wider">Deep Analytics Profile (Amino Acids & Lipids)</h3>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3">
                            {[
                                'Alanine', 'Arginine', 'Glycine', 'Leucine', 'Lysine',
                                'Saturated Fat', 'Omega-3', 'Omega-6', 'Cholesterol', 'Phytosterol'
                            ].map(amino => (
                                <div key={amino} className="space-y-1">
                                    <Label className="text-[9px] text-slate-500 truncate block font-bold">{amino}</Label>
                                    <Input
                                        type="number"
                                        className="h-7 text-[10px] bg-slate-50 dark:bg-slate-950"
                                        value={micronutrients[amino] || ''}
                                        onChange={(e) => updateMicro(amino, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
