
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
    Zap,
    Utensils
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="dark:text-slate-400 dark:hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Food Item Creator</h1>
                            <p className="text-slate-500 dark:text-slate-400">Add new ingredients to the global database with full nutritional data.</p>
                        </div>
                    </div>

                    {showParser && (
                        <Card className="p-6 mb-8 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/20">
                            <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-400">
                                <Sparkles className="w-5 h-5" />
                                <h3 className="font-semibold text-lg">Magic Parser</h3>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                Paste nutritional data (e.g. from USDA or NutritionFacts) and we'll automatically extract the macros and micros per 100g.
                            </p>
                            <Textarea
                                placeholder="Paste nutritional data here..."
                                className="min-h-[200px] mb-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-emerald-500"
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            />
                            <Button onClick={handleParse} className="bg-emerald-600 hover:bg-emerald-700 w-full lg:w-auto text-white shadow-lg shadow-emerald-200/20">
                                <Zap className="w-4 h-4 mr-2" />
                                Extract Data
                            </Button>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Basic Info & Macros */}
                        <div className="space-y-6">
                            <Card className="p-6">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Beef className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    Basic Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="dark:text-slate-300">Scientific/Full Name</Label>
                                        <Input
                                            placeholder="e.g. Peppers, sweet, green, raw"
                                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-emerald-500"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label className="dark:text-slate-300">Common Name (Short)</Label>
                                        <Input
                                            placeholder="e.g. Green Bell Pepper"
                                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-emerald-500"
                                            value={commonName}
                                            onChange={(e) => setCommonName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label className="dark:text-slate-300">Data Source</Label>
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
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    Core Macros (per 100g)
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="dark:text-slate-300">Calories (kcal)</Label>
                                        <Input
                                            type="number"
                                            value={energyKcal}
                                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-emerald-500 font-bold"
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setEnergyKcal(val);
                                                if (val) {
                                                    setEnergyKj(Math.round(parseFloat(val) * 4.184).toString());
                                                } else {
                                                    setEnergyKj('');
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <Label className="dark:text-slate-300">Energy (kJ)</Label>
                                        <Input
                                            type="number"
                                            value={energyKj}
                                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-emerald-500 font-bold"
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setEnergyKj(val);
                                                if (val) {
                                                    setEnergyKcal((parseFloat(val) / 4.184).toFixed(1));
                                                } else {
                                                    setEnergyKcal('');
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <Label className="dark:text-slate-300">Protein (g)</Label>
                                        <Input type="number" value={protein} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-emerald-500 font-bold" onChange={(e) => setProtein(e.target.value)} />
                                    </div>
                                    <div>
                                        <Label className="dark:text-slate-300">Carbs (g)</Label>
                                        <Input type="number" value={carbs} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-emerald-500 font-bold" onChange={(e) => setCarbs(e.target.value)} />
                                    </div>
                                    <div>
                                        <Label className="dark:text-slate-300">Fat (g)</Label>
                                        <Input type="number" value={fat} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-emerald-500 font-bold" onChange={(e) => setFat(e.target.value)} />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Utensils className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    Carbohydrate Breakdown
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="dark:text-slate-300 text-xs text-slate-500">Fiber (g)</Label>
                                        <Input type="number" value={micronutrients['Fiber'] || ''} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-emerald-500" onChange={(e) => updateMicro('Fiber', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label className="dark:text-slate-300 text-xs text-slate-500">Sugars (g)</Label>
                                        <Input type="number" value={micronutrients['Sugars'] || ''} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-emerald-500" onChange={(e) => updateMicro('Sugars', e.target.value)} />
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="dark:text-slate-300 text-xs text-slate-500">Starch (g)</Label>
                                        <Input type="number" value={micronutrients['Starch'] || ''} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-emerald-500" onChange={(e) => updateMicro('Starch', e.target.value)} />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 shadow-md border-amber-100/50 dark:border-amber-900/20 bg-amber-50/10 dark:bg-amber-950/5">
                                <h3 className="font-semibold text-base mb-4 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                    <Sparkles className="w-4 h-4" />
                                    Sugar Profile (g)
                                </h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    {['Fructose', 'Glucose', 'Sucrose', 'Lactose', 'Galactose', 'Maltose', 'Allulose', 'Sugar Alcohol'].map(s => (
                                        <div key={s}>
                                            <Label className="dark:text-slate-400 text-[10px] uppercase font-bold tracking-tight">{s}</Label>
                                            <Input
                                                type="number"
                                                className="h-7 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                value={micronutrients[s] !== undefined ? micronutrients[s] : ''}
                                                onChange={(e) => updateMicro(s, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Beef className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    Lipid Breakdown (g)
                                </h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                    <div>
                                        <Label className="dark:text-slate-400 text-xs">Saturated</Label>
                                        <Input type="number" className="h-8" value={micronutrients['Saturated Fat'] || ''} onChange={(e) => updateMicro('Saturated Fat', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label className="dark:text-slate-400 text-xs">Trans-Fat</Label>
                                        <Input type="number" className="h-8" value={micronutrients['Trans Fat'] || ''} onChange={(e) => updateMicro('Trans Fat', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label className="dark:text-slate-400 text-xs">Monounsaturated</Label>
                                        <Input type="number" className="h-8" value={micronutrients['Monounsaturated Fat'] || ''} onChange={(e) => updateMicro('Monounsaturated Fat', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label className="dark:text-slate-400 text-xs">Polyunsaturated</Label>
                                        <Input type="number" className="h-8" value={micronutrients['Polyunsaturated Fat'] || ''} onChange={(e) => updateMicro('Polyunsaturated Fat', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label className="dark:text-slate-400 text-xs">Omega-3</Label>
                                        <Input type="number" className="h-8" value={micronutrients['Omega-3'] || ''} onChange={(e) => updateMicro('Omega-3', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label className="dark:text-slate-400 text-xs">Omega-6</Label>
                                        <Input type="number" className="h-8" value={micronutrients['Omega-6'] || ''} onChange={(e) => updateMicro('Omega-6', e.target.value)} />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    Amino Acid Breakdown (g)
                                </h3>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                                    {[
                                        'Alanine', 'Arginine', 'Aspartic acid', 'Glutamic acid', 'Glycine',
                                        'Histidine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine',
                                        'Phenylalanine', 'Proline', 'Serine', 'Threonine', 'Tryptophan',
                                        'Tyrosine', 'Valine'
                                    ].map(amino => (
                                        <div key={amino}>
                                            <Label className="dark:text-slate-400 text-[10px] uppercase font-bold tracking-tight">{amino}</Label>
                                            <Input
                                                type="number"
                                                className="h-7 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                                                value={micronutrients[amino] || ''}
                                                onChange={(e) => updateMicro(amino, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                                        <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                        Common Measures
                                    </h3>
                                    <Button variant="outline" size="sm" onClick={addMeasure} className="dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300">
                                        <Plus className="w-4 h-4 mr-1" /> Add
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {measures.map((m, i) => (
                                        <div key={i} className="flex gap-2 items-end">
                                            <div className="flex-grow">
                                                <Label className="text-xs dark:text-slate-400">Label (e.g. cup, large)</Label>
                                                <Input
                                                    value={m.label}
                                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-emerald-500"
                                                    onChange={(e) => updateMeasure(i, 'label', e.target.value)}
                                                    placeholder="Unit name"
                                                />
                                            </div>
                                            <div className="w-24">
                                                <Label className="text-xs dark:text-slate-400">Weight (g)</Label>
                                                <Input
                                                    type="number"
                                                    value={m.weight}
                                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-emerald-500 text-center"
                                                    onChange={(e) => updateMeasure(i, 'weight', e.target.value)}
                                                    placeholder="Grams"
                                                />
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => removeMeasure(i)} className="text-slate-400 hover:text-red-500 dark:hover:bg-red-500/10">
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
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    Micronutrients (per 100g)
                                </h3>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    {STANDARD_MICROS.filter(m => m !== 'Fiber').map(micro => (
                                        <div key={micro}>
                                            <Label className="text-xs whitespace-nowrap overflow-hidden text-ellipsis block dark:text-slate-400">
                                                {micro}
                                            </Label>
                                            <Input
                                                className="h-8 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-emerald-500"
                                                value={micronutrients[micro] !== undefined ? micronutrients[micro] : ''}
                                                onChange={(e) => updateMicro(micro, e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card className="p-6 border-blue-100 dark:border-blue-900/30 bg-blue-50/10 dark:bg-blue-950/5">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                    <Sparkles className="w-5 h-5" />
                                    Vitamin A Breakdown (µg)
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { key: 'Retinol', unit: 'µg' },
                                        { key: 'Alpha-carotene', unit: 'µg' },
                                        { key: 'Beta-carotene', unit: 'µg' },
                                        { key: 'Beta-cryptoxanthin', unit: 'µg' },
                                        { key: 'Lutein + Zeaxanthin', unit: 'µg' },
                                        { key: 'Lycopene', unit: 'µg' }
                                    ].map(v => (
                                        <div key={v.key}>
                                            <Label className="dark:text-slate-400 text-[10px] uppercase font-bold">{v.key}</Label>
                                            <Input
                                                type="number"
                                                className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                value={micronutrients[v.key] !== undefined ? micronutrients[v.key] : ''}
                                                onChange={(e) => updateMicro(v.key, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            <Card className="p-6 border-purple-100 dark:border-purple-900/30 bg-purple-50/10 dark:bg-purple-950/5">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-purple-700 dark:text-purple-400">
                                    <Sparkles className="w-5 h-5" />
                                    Vitamin E Breakdown (mg)
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {['Alpha-tocopherol', 'Beta-tocopherol', 'Gamma-tocopherol', 'Delta-tocopherol'].map(v => (
                                        <div key={v}>
                                            <Label className="dark:text-slate-400 text-[10px] uppercase font-bold">{v.split('-')[0]}</Label>
                                            <Input
                                                type="number"
                                                className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                value={micronutrients[v] !== undefined ? micronutrients[v] : ''}
                                                onChange={(e) => updateMicro(v, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="mt-12 flex justify-end gap-4">
                        <Button variant="outline" onClick={() => router.back()} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 min-w-[150px] text-white shadow-lg shadow-emerald-200/20"
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
