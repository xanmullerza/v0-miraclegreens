'use client';

import { useState, Suspense, useMemo } from 'react';
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
    Activity,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { parseNutritionText, parseMeasures } from '@/lib/utils/nutrition-parser';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const ALL_CLINICAL_MARKERS = [
    'Ash', 'Water', 'Fiber', 'Alcohol', 'Protein', 'Fat', 'Saturated Fat', 'Monounsaturated Fat',
    'Polyunsaturated Fat', 'Trans Fat', 'Cholesterol', 'Starch', 'Sugars', 'Glucose', 'Fructose',
    'Sucrose', 'Lactose', 'Maltose', 'Allulose', 'Galactose', 'Sugar Alcohol', 'Vitamin A',
    'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'B1 (Thiamine)', 'B2 (Riboflavin)',
    'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)', 'B12 (Cobalamin)',
    'Choline', 'Retinol', 'Beta-carotene', 'Alpha-carotene', 'Beta-cryptoxanthin', 'Alpha-tocopherol',
    'Beta-tocopherol', 'Delta-tocopherol', 'Gamma-tocopherol', 'Calcium', 'Iron', 'Magnesium',
    'Phosphorus', 'Potassium', 'Sodium', 'Zinc', 'Copper', 'Manganese', 'Selenium', 'Iodine',
    'Chromium', 'Fluoride', 'Molybdenum', 'Alanine', 'Arginine', 'Aspartic acid', 'Glutamic acid',
    'Glycine', 'Histidine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine', 'Phenylalanine',
    'Proline', 'Serine', 'Threonine', 'Tryptophan', 'Tyrosine', 'Valine', 'Oxalate', 'Omega-3',
    'Omega-6', 'Caffeine', 'Lycopene', 'Phytosterol', 'Beta-Hydroxybutyrate', 'Lutein + Zeaxanthin'
];

const CATEGORIZED_MARKERS: Record<string, string[]> = {
    'Proximate': ['Ash', 'Water', 'Fiber', 'Alcohol', 'Protein', 'Fat', 'Carbohydrates'],
    'Carbohydrates': ['Starch', 'Sugars', 'Glucose', 'Fructose', 'Sucrose', 'Lactose', 'Maltose', 'Allulose', 'Galactose', 'Sugar Alcohol'],
    'Vitamins': ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin E', 'Vitamin K', 'B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)', 'B5 (Pantothenic Acid)', 'B6 (Pyridoxine)', 'B9 (Folate)', 'B12 (Cobalamin)', 'Choline', 'Retinol', 'Beta-carotene', 'Alpha-carotene', 'Beta-cryptoxanthin'],
    'Vitamin E Derivatives': ['Alpha-tocopherol', 'Beta-tocopherol', 'Delta-tocopherol', 'Gamma-tocopherol'],
    'Minerals': ['Calcium', 'Iron', 'Magnesium', 'Phosphorus', 'Potassium', 'Sodium', 'Zinc', 'Copper', 'Manganese', 'Selenium', 'Iodine', 'Chromium', 'Fluoride', 'Molybdenum'],
    'Amino Acids': ['Alanine', 'Arginine', 'Aspartic acid', 'Glutamic acid', 'Glycine', 'Histidine', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine', 'Phenylalanine', 'Proline', 'Serine', 'Threonine', 'Tryptophan', 'Tyrosine', 'Valine'],
    'Lipids & Others': ['Saturated Fat', 'Monounsaturated Fat', 'Polyunsaturated Fat', 'Trans Fat', 'Cholesterol', 'Omega-3', 'Omega-6', 'Phytosterol', 'Oxalate', 'Caffeine', 'Lycopene', 'Beta-Hydroxybutyrate', 'Lutein + Zeaxanthin']
};

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
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showMissing, setShowMissing] = useState(false);

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

    const [servingText, setServingText] = useState('');
    const [nutrientText, setNutrientText] = useState('');
    const [showParser, setShowParser] = useState(true);

    const integrity = useMemo(() => {
        const present = ALL_CLINICAL_MARKERS.filter((m: string) => {
            // Check top-level macros first
            if (m === 'Protein') return protein !== '';
            if (m === 'Fat') return fat !== '';
            if (m === 'Carbohydrates' || m === 'Carbs') return carbs !== '';

            // Check for any defined value including '0'
            const val = micronutrients[m];
            return val !== undefined && val !== '';
        });
        const missing = ALL_CLINICAL_MARKERS.filter((m: string) => !present.includes(m));
        return {
            score: present.length,
            total: ALL_CLINICAL_MARKERS.length,
            missing,
            percent: Math.round((present.length / ALL_CLINICAL_MARKERS.length) * 100)
        };
    }, [micronutrients, protein, fat, carbs]);

    const handleParse = () => {
        const combinedText = `${servingText}\n${nutrientText}`.trim();
        if (!combinedText) return;

        const parsed = parseNutritionText(combinedText);

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

        // Logic for Measures (Unit Scaling) - Look specifically in serving text if nutrient text exists
        const parsedMeasures = parseMeasures(servingText || combinedText);
        if (parsedMeasures.length > 0) {
            setMeasures(parsedMeasures.map(m => ({
                label: m.label,
                weight: m.weight_g.toString()
            })));
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

            const { data: item, error: itemError } = await supabase
                .from('food_items')
                .upsert(foodData, { onConflict: 'name' })
                .select()
                .single();

            if (itemError) throw itemError;

            const tempMeasures = measures
                .filter(m => m.label && m.weight && parseFloat(m.weight) > 0)
                .map(m => ({
                    food_item_id: item.id,
                    label: m.label.toLowerCase().trim(),
                    weight_g: parseFloat(m.weight)
                }));

            // Deduplicate by label to prevent Postgres Error
            const validMeasures = tempMeasures.filter((m, index, self) =>
                index === self.findIndex((t) => t.label === m.label)
            );

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
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                        <Beef className="text-emerald-500" />
                        Food Library Architect
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">Add clinical-grade ingredients to the global synthesis engine.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowParser(!showParser)}
                        className="gap-2 border-slate-200 dark:border-slate-800 rounded-xl"
                    >
                        <Zap size={16} className="text-amber-500 fill-current" />
                        {showParser ? 'Close Extraction' : 'Magic Extraction'}
                    </Button>
                    <Button
                        className="bg-slate-950 hover:bg-slate-900 border-none min-w-[140px] text-white shadow-xl shadow-slate-950/20 gap-2 rounded-xl h-11"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-r-white" /> : <Save size={18} />}
                        Sync Library
                    </Button>
                </div>
            </div>

            {/* Top Row: Neural Mapping & Core Identity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Extraction Matrix */}
                {showParser && (
                    <Card className="lg:col-span-8 p-8 border-emerald-500/30 bg-emerald-500/[0.03] animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-widest text-sm text-emerald-700">Dual-Stream Extraction</h3>
                                <p className="text-xs text-emerald-600/80 font-medium">Split your source data below. We'll synchronize servings and nutrients in one pass.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-700 ml-1">Stream 01: Serving Data</Label>
                                <Textarea
                                    placeholder="Paste cup weights, portion sizes here..."
                                    className="min-h-[180px] bg-white dark:bg-slate-950 border-emerald-500/10 text-xs focus:ring-emerald-500/20 rounded-2xl font-mono p-4"
                                    value={servingText}
                                    onChange={(e) => setServingText(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-700 ml-1">Stream 02: Nutrient Matrix</Label>
                                <Textarea
                                    placeholder="Paste the long list of vitamins/minerals here..."
                                    className="min-h-[180px] bg-white dark:bg-slate-950 border-emerald-500/10 text-xs focus:ring-emerald-500/20 rounded-2xl font-mono p-4"
                                    value={nutrientText}
                                    onChange={(e) => setNutrientText(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleParse} className="h-12 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-black uppercase tracking-widest px-10 shadow-lg shadow-emerald-600/20 rounded-xl">
                                Run Dual Neural Synthesis
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Identity & Core Macros */}
                <Card className={cn(showParser ? "lg:col-span-4" : "lg:col-span-12", "p-8 space-y-8")}>
                    {/* Identity Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Beef size={20} className="text-emerald-500" />
                            <h3 className="font-black text-sm uppercase tracking-widest">Base Identity</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Scientific Designation</Label>
                                <Input
                                    placeholder="e.g. Potatoes, raw, white"
                                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm rounded-xl font-bold"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Common Name</Label>
                                <Input
                                    placeholder="e.g. White Potato"
                                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm rounded-xl"
                                    value={commonName}
                                    onChange={(e) => setCommonName(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Energy Vectors */}
                    <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                            <Scale size={20} className="text-emerald-500" />
                            <h3 className="font-black text-sm uppercase tracking-widest">Energy Vectors (per 100g)</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-[10px] uppercase font-black text-slate-400">kcal</Label>
                                <Input type="number" value={energyKcal} className="h-11 font-black text-center rounded-xl bg-emerald-500/5 border-emerald-500/20" onChange={(e) => setEnergyKcal(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Protein</Label>
                                <Input type="number" value={protein} className="h-11 text-center rounded-xl bg-slate-50 dark:bg-slate-950 font-bold" onChange={(e) => setProtein(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Fat</Label>
                                <Input type="number" value={fat} className="h-11 text-center rounded-xl bg-slate-50 dark:bg-slate-950 font-bold" onChange={(e) => setFat(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Carbs</Label>
                                <Input type="number" value={carbs} className="h-11 text-center rounded-xl bg-slate-50 dark:bg-slate-950 font-bold" onChange={(e) => setCarbs(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">kJ</Label>
                                <Input type="number" value={energyKj} className="h-11 text-center rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-500" onChange={(e) => setEnergyKj(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Column: Data Integrity Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                        <div className="flex items-center gap-3 mb-6">
                            <Activity size={18} className="text-blue-500" />
                            <h3 className="font-black uppercase tracking-widest text-xs">Data Integrity</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="relative h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-1000 ease-out",
                                        integrity.percent > 90 ? "bg-emerald-500" : integrity.percent > 50 ? "bg-amber-500" : "bg-rose-500"
                                    )}
                                    style={{ width: `${integrity.percent}%` }}
                                />
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] uppercase font-black text-slate-400">Markers Mapped</p>
                                    <p className="text-3xl font-black">{integrity.score} <span className="text-sm font-medium text-slate-400">/ {integrity.total}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-emerald-500">{integrity.percent}%</p>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">Complete</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowMissing(!showMissing)}
                                className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                <Info size={14} />
                                {showMissing ? 'Hide Missing Markers' : 'View Missing Markers'}
                            </button>

                            {showMissing && (
                                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 max-h-[400px] overflow-y-auto animate-in slide-in-from-top-2">
                                    <p className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-2 mb-3">
                                        <AlertCircle size={10} /> {integrity.missing.length} Markers Remaining
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {integrity.missing.map((m: string) => (
                                            <span key={m} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[9px] font-medium text-slate-500">{m}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                            <Utensils size={18} className="text-blue-500" />
                            <h3 className="font-bold text-xs uppercase tracking-wider">Unit Scaling</h3>
                        </div>
                        <div className="space-y-4">
                            {measures.map((m, i) => (
                                <div key={i} className="flex gap-2 items-end group">
                                    <div className="flex-1">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Unit</Label>
                                        <Input
                                            value={m.label}
                                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950 rounded-lg"
                                            onChange={(e) => updateMeasure(i, 'label', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-16">
                                        <Label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Grams</Label>
                                        <Input
                                            type="number"
                                            value={m.weight}
                                            className="h-8 text-xs bg-slate-50 dark:bg-slate-950 font-bold text-center rounded-lg"
                                            onChange={(e) => updateMeasure(i, 'weight', e.target.value)}
                                        />
                                    </div>
                                    <button onClick={() => removeMeasure(i)} className="h-8 w-8 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addMeasure} className="w-full text-[9px] uppercase font-black tracking-widest h-8 border-dashed rounded-lg">
                                <Plus size={12} className="mr-1" /> Add Marker
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Advanced Markers Controller */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-3">
                                <Activity className="text-blue-500" />
                                Clinical Marker Matrix
                                <span className="text-[10px] text-slate-400 font-medium normal-case tracking-normal">(Manually edit specific markers)</span>
                            </h3>
                            <Button
                                variant="ghost"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="text-[10px] font-black uppercase tracking-widest gap-2"
                            >
                                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                {showAdvanced ? 'Collapse Matrix' : 'Expand Matrix'}
                            </Button>
                        </div>

                        {showAdvanced && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {Object.entries(CATEGORIZED_MARKERS).map(([category, markers]) => (
                                    <Card key={category} className="p-6">
                                        <div className="mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{category}</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                            {markers.map(m => (
                                                <div key={m} className="space-y-1">
                                                    <div className="flex justify-between items-center px-1">
                                                        <Label className="text-[10px] text-slate-500 truncate block font-medium uppercase tracking-tighter">
                                                            {m}
                                                        </Label>
                                                        {(m === 'Protein' ? protein : m === 'Fat' ? fat : m === 'Carbs' ? carbs : micronutrients[m]) ? (
                                                            <CheckCircle2 size={10} className="text-emerald-500" />
                                                        ) : null}
                                                    </div>
                                                    <Input
                                                        type="number"
                                                        className={cn(
                                                            "h-8 text-xs bg-slate-50 dark:bg-slate-950 rounded-lg",
                                                            (m === 'Protein' ? protein : m === 'Fat' ? fat : m === 'Carbs' ? carbs : micronutrients[m]) ? "border-emerald-500/20 bg-emerald-500/[0.02]" : ""
                                                        )}
                                                        value={m === 'Protein' ? protein : m === 'Fat' ? fat : m === 'Carbs' ? carbs : micronutrients[m] || ''}
                                                        onChange={(e) => {
                                                            if (m === 'Protein') setProtein(e.target.value);
                                                            else if (m === 'Fat') setFat(e.target.value);
                                                            else if (m === 'Carbs') setCarbs(e.target.value);
                                                            else updateMicro(m, e.target.value);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {!showAdvanced && (
                            <button
                                onClick={() => setShowAdvanced(true)}
                                className="w-full h-32 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center group hover:border-blue-500/50 hover:bg-blue-500/[0.02] transition-all"
                            >
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-all mb-3">
                                    <ChevronDown size={20} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-500 transition-colors">Expand Manual Marker Overrides</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
