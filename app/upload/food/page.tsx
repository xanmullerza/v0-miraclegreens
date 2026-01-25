
'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
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
    Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { parseNutritionText } from '@/lib/utils/nutrition-parser';
const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const STANDARD_MICROS = [
    'Potassium', 'Magnesium', 'Calcium', 'Phosphorus', 'Sodium',
    'Iron', 'Zinc', 'Selenium', 'Copper', 'Manganese', 'Vitamin A', 'Vitamin C',
    'Vitamin D', 'Vitamin E', 'Vitamin K', 'B1 (Thiamine)', 'B2 (Riboflavin)',
    'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)',
    'B12 (Cobalamin)', 'Choline', 'Fiber'
];

export default function FoodItemCreatorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
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

        if (parsed.energy_kcal) setEnergyKcal(parsed.energy_kcal.toString());
        if (parsed.energy_kj) setEnergyKj(parsed.energy_kj.toString());
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
            router.push('/upload');
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
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Food Item Creator</h1>
                            <p className="text-slate-500">Add new ingredients to the global database with full nutritional data.</p>
                        </div>
                    </div>

                    {showParser && (
                        <Card className="p-6 mb-8 border-emerald-100 bg-emerald-50/30">
                            <div className="flex items-center gap-2 mb-4 text-emerald-700">
                                <Sparkles className="w-5 h-5" />
                                <h3 className="font-semibold text-lg">Magic Parser</h3>
                            </div>
                            <p className="text-sm text-slate-600 mb-4">
                                Paste nutritional data (e.g. from USDA or NutritionFacts) and we'll automatically extract the macros and micros per 100g.
                            </p>
                            <Textarea
                                placeholder="Paste nutritional data here..."
                                className="min-h-[200px] mb-4 bg-white"
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            />
                            <Button onClick={handleParse} className="bg-emerald-600 hover:bg-emerald-700 w-full lg:w-auto">
                                <Zap className="w-4 h-4 mr-2" />
                                Extract Data
                            </Button>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Basic Info & Macros */}
                        <div className="space-y-6">
                            <Card className="p-6">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <Beef className="w-5 h-5 text-emerald-600" />
                                    Basic Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Scientific/Full Name</Label>
                                        <Input
                                            placeholder="e.g. Peppers, sweet, green, raw"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Common Name (Short)</Label>
                                        <Input
                                            placeholder="e.g. Green Bell Pepper"
                                            value={commonName}
                                            onChange={(e) => setCommonName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>Data Source</Label>
                                        <select
                                            className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all cursor-pointer shadow-sm"
                                            value={source}
                                            onChange={(e) => setSource(e.target.value)}
                                        >
                                            <option value="manual" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Manual Entry</option>
                                            <option value="usda" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">USDA FoodData Central</option>
                                            <option value="nccdb" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">NCCDB (Clinical Grade)</option>
                                            <option value="nutritionfacts" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">NutritionFacts.org</option>
                                            <option value="cronometer" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Cronometer</option>
                                            <option value="other" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <Scale className="w-5 h-5 text-emerald-600" />
                                    Macros (per 100g)
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Calories (kcal)</Label>
                                        <Input type="number" value={energyKcal} onChange={(e) => setEnergyKcal(e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Energy (kJ)</Label>
                                        <Input type="number" value={energyKj} onChange={(e) => setEnergyKj(e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Protein (g)</Label>
                                        <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Carbs (g)</Label>
                                        <Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Fat (g)</Label>
                                        <Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Fiber (g)</Label>
                                        <Input type="number" value={micronutrients['Fiber'] || ''} onChange={(e) => updateMicro('Fiber', e.target.value)} />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <Scale className="w-5 h-5 text-emerald-600" />
                                        Common Measures
                                    </h3>
                                    <Button variant="outline" size="sm" onClick={addMeasure}>
                                        <Plus className="w-4 h-4 mr-1" /> Add
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {measures.map((m, i) => (
                                        <div key={i} className="flex gap-2 items-end">
                                            <div className="flex-grow">
                                                <Label className="text-xs">Label (e.g. cup, large)</Label>
                                                <Input
                                                    value={m.label}
                                                    onChange={(e) => updateMeasure(i, 'label', e.target.value)}
                                                    placeholder="Unit name"
                                                />
                                            </div>
                                            <div className="w-24">
                                                <Label className="text-xs">Weight (g)</Label>
                                                <Input
                                                    type="number"
                                                    value={m.weight}
                                                    onChange={(e) => updateMeasure(i, 'weight', e.target.value)}
                                                    placeholder="Grams"
                                                />
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => removeMeasure(i)} className="text-slate-400 hover:text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* Micronutrients */}
                        <div className="space-y-6">
                            <Card className="p-6">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-emerald-600" />
                                    Micronutrients (per 100g)
                                </h3>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    {STANDARD_MICROS.filter(m => m !== 'Fiber').map(micro => (
                                        <div key={micro}>
                                            <Label className="text-xs whitespace-nowrap overflow-hidden text-ellipsis block">
                                                {micro}
                                            </Label>
                                            <Input
                                                className="h-8 text-sm"
                                                value={micronutrients[micro] || ''}
                                                onChange={(e) => updateMicro(micro, e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-12 flex justify-end gap-4">
                        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 min-w-[150px]"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Food Item
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
