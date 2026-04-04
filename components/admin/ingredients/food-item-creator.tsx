'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
    Info,
    Camera,
    Upload,
    Loader2,
    Library,
    ChefHat,
    Database
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { parseNutritionText, parseMeasures } from '@/lib/utils/nutrition-parser';
import FoodItemPicker from '@/components/recipe/food-item-picker';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

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

export function FoodItemCreatorContent() {
    const { profile } = useUserPreferences();
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [commonName, setCommonName] = useState('');
    const [commonNameManuallyEdited, setCommonNameManuallyEdited] = useState(false);
    const [duplicateName, setDuplicateName] = useState(false);
    const [duplicateCommonName, setDuplicateCommonName] = useState(false);
    const [energyKcal, setEnergyKcal] = useState<string>('');
    const [energyKj, setEnergyKj] = useState<string>('');
    const [protein, setProtein] = useState<string>('');
    const [carbs, setCarbs] = useState<string>('');
    const [fat, setFat] = useState<string>('');
    const [source, setSource] = useState<string>('manual');
    const [micronutrients, setMicronutrients] = useState<Record<string, string>>({});
    const [image, setImage] = useState('');
    const [uploading, setUploading] = useState(false);
    const [servingText, setServingText] = useState('');
    const [nutrientText, setNutrientText] = useState('');
    const [combinedPaste, setCombinedPaste] = useState('');
    const [showParser, setShowParser] = useState(true);
    const [showImportPicker, setShowImportPicker] = useState(false);
    const [category, setCategory] = useState('General');

    const CATEGORIES = ["General", "Vegetables", "Grains", "Legumes", "Oils", "Proteins", "Fruit", "Nuts", "Flavour", "Supplements"];

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setCurrentUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!commonNameManuallyEdited) {
            setCommonName(autoCommonName(name));
        }
    }, [name, commonNameManuallyEdited]);

    useEffect(() => {
        async function checkDuplicates() {
            setDuplicateName(false);
            setDuplicateCommonName(false);
            if (!name && !commonName) return;
            let query = supabase.from('food_items').select('name,common_name');
            if (name) query = query.ilike('name', name);
            if (commonName) query = query.ilike('common_name', commonName);
            const { data, error } = await query;
            if (!error && data) {
                if (name && data.some((item: any) => item.name?.toLowerCase() === name.toLowerCase())) setDuplicateName(true);
                if (commonName && data.some((item: any) => item.common_name?.toLowerCase() === commonName.toLowerCase())) setDuplicateCommonName(true);
            }
        }
        checkDuplicates();
    }, [name, commonName]);

    function autoCommonName(officialName: string): string {
        if (!officialName) return '';
        let n = officialName.trim();
        n = n.replace(/,+\s*$/, '');
        if (/,(\s*)?(raw|fresh)/i.test(n)) {
            return n.split(/,\s*(raw|fresh)/i)[0].trim();
        }
        if (/,\s*([a-zA-Z]+)/.test(n)) {
            return n.split(',')[0].trim() + ' (cooked)';
        }
        return n;
    }

    function autoCategorize(foodName: string, text: string) {
        const lower = (foodName + ' ' + text).toLowerCase();
        const categories = [
            { cat: 'Proteins', kws: ['beef','pork','chicken','turkey','duck','lamb','goat','veal','bacon','ham','sausage','egg','eggs','fish','salmon','tuna','trout','cod','sardine','anchovy','mackerel','herring','shellfish','shrimp','prawn','crab','lobster','clam','oyster','mussel','scallop','animal','meat','liver','kidney','heart','gizzard','duck','goose','quail','rabbit','venison','cheese','milk','yogurt','butter','cream','whey','casein','curd','cottage cheese','dairy'] },
            { cat: 'Nuts', kws: ['nut','almond','cashew','walnut','pecan','pistachio','hazelnut','macadamia','brazil nut','pine nut','chestnut'] },
            { cat: 'Seeds', kws: ['seed','chia','flax','sunflower','pumpkin','sesame','hemp','poppy','watermelon seed'] },
            { cat: 'Fruit', kws: ['fruit','apple','banana','orange','mango','grape','berry','cherry','peach','pear','plum','apricot','melon','watermelon','pineapple','kiwi','papaya','fig','date','raisin','currant','lemon','lime','grapefruit','tangerine','avocado','coconut','pomegranate','guava','lychee','passionfruit','persimmon','starfruit','dragonfruit','jackfruit','rambutan','mangosteen','durian'] },
            { cat: 'Vegetables', kws: ['vegetable','carrot','potato','tomato','cucumber','lettuce','spinach','kale','broccoli','cauliflower','cabbage','onion','garlic','leek','shallot','radish','beet','turnip','parsnip','celery','pepper','chili','eggplant','zucchini','squash','pumpkin','okra','artichoke','asparagus','mushroom','pea','bean','lentil','chickpea','corn','yam','sweet potato','taro','cassava','jicama','sunchoke','rutabaga','fennel','endive','arugula','chard','collard','dandelion','purslane','sorrel','watercress','cress','bok choy','napa','daikon','kohlrabi','horseradish','ginger','turmeric','galangal','lotus','bamboo','seaweed','algae','nori','wakame','kombu','hijiki','spirulina','chlorella','agar','kelp','laver','samphire','salicornia','glasswort','pickleweed','sea bean','sea asparagus','sea pickle','sea fennel','sea grape','sea lettuce','sea moss','sea purslane','sea spinach','sea kale','sea beet'] },
            { cat: 'Grains', kws: ['grain','rice','wheat','oat','barley','millet','sorghum','quinoa','amaranth','spelt','teff','triticale','farro','bulgur','freekeh','buckwheat','rye','cornmeal','semolina','couscous','polenta','bran','germ','groat','muesli','granola','cereal','pasta','noodle','cracker','bread','tortilla','bagel','bun','roll','biscuit','pretzel','pita','naan','chapati','roti','matzo','lavash','injera','idli','dosa','upma','poha','sattu','paratha','bhakri','appam','puttu','sevai','sheermal','khakhra','thepla','handvo','dhokla','khaman','fafda','chakli','murukku','papad','papadam','vadam','vadi','kurkure','chevdo','chiwda','namkeen','sev','bhujia','gathiya'] },
            { cat: 'Legumes', kws: ['legume','bean','lentil','chickpea','pea','soy','soybean','mung','black-eyed','pigeon pea','split pea','navy bean','kidney bean','pinto bean','lima bean','fava bean','broad bean','adzuki','urad','dal','toor','moong','masoor','chana','rajma','lobia','haricot','canellini','flageolet','garbanzo','bambara','yardlong','winged bean','guar','carob','mesquite','lupin','peanut'] },
            { cat: 'Oils', kws: ['oil','olive','canola','sunflower oil','safflower','corn oil','soy oil','peanut oil','sesame oil','coconut oil','palm oil','avocado oil','grapeseed oil','hemp oil','flaxseed oil','walnut oil','almond oil','hazelnut oil','macadamia oil','pumpkin seed oil','rice bran oil','mustard oil','ghee','shortening','lard','margarine','spread'] },
            { cat: 'Flavour', kws: ['spice','herb','seasoning','flavour','flavor','vanilla','cinnamon','clove','nutmeg','mace','allspice','ginger','cardamom','coriander','cumin','fennel','fenugreek','mustard','oregano','parsley','rosemary','sage','thyme','basil','dill','tarragon','chive','bay','marjoram','savory','saffron','anise','caraway','celery seed','chervil','cress','curry','garlic','horseradish','juniper','lavender','lemon balm','lemongrass','lovage','mint','paprika','pepper','poppy','sesame','sumac','wasabi','zaatar','zest','ajwain','asafoetida','amchur','anardana','black salt','chili','chipotle','curry leaf','galangal','kaffir','kokum','methi','nigella','panch phoron','peri peri','sichuan','star anise','tamarind','tejpat','turmeric','urfa','white pepper','yellow mustard'] },
            { cat: 'Supplements', kws: ['supplement','vitamin','mineral','probiotic','enzyme','collagen','creatine','protein powder','whey protein','casein protein','pea protein','soy protein','hemp protein','multivitamin','omega-3','fish oil','cod liver oil','krill oil','dha','epa','b12','d3','c','zinc','magnesium','calcium','iron','potassium','electrolyte','amino acid','bcaa','glutamine','lysine','methionine','threonine','tryptophan','valine','leucine','isoleucine','histidine','phenylalanine','tyrosine','serine','proline','glycine','alanine','arginine','aspartic acid','cysteine','glutamic acid','ornithine','taurine','carnitine','beta-alanine','betaine','inositol','choline','coq10','astaxanthin','lutein','zeaxanthin','resveratrol','curcumin','quercetin','berberine','ashwagandha','rhodiola','ginseng','maca','spirulina','chlorella','greens powder','fiber supplement','psyllium','inulin','prebiotic','digestive enzyme','lactase','bromelain','papain','lipase','amylase','protease','cellulase','hemicellulase','pectinase','xylanase','glucoamylase','alpha-galactosidase','beta-galactosidase','alpha-amylase','beta-amylase','alpha-lipoic acid','beta-glucan','hyaluronic acid','msm','glucosamine','chondroitin','boswellia','cat\'s claw','devil\'s claw','elderberry','echinacea','garlic extract','ginger extract','ginkgo','ginseng extract','goldenseal','grape seed','green tea extract','hawthorn','holy basil','licorice root','milk thistle','olive leaf','pine bark','red yeast rice','saw palmetto','schisandra','st. john\'s wort','turmeric extract','valerian','yohimbe'] }
        ];
        for (const { cat, kws } of categories) {
            for (const kw of kws) {
                const pattern = new RegExp(`\\b${kw}s?\\b`, 'i');
                if (pattern.test(lower)) return cat;
            }
        }
        return 'General';
    }

    const handleCombinedPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setCombinedPaste(text);
        const lines = text.split(/\r?\n/);

        let foundFoodName = '';
        for (let i = 0; i < lines.length; i++) {
            if (/Food Name/i.test(lines[i])) {
                for (let j = i + 1; j < lines.length; j++) {
                    if (lines[j].trim().length > 0) {
                        foundFoodName = lines[j].trim();
                        break;
                    }
                }
                break;
            }
        }
        if (!foundFoodName) {
            foundFoodName = lines.find(l => /^[A-Za-z].{3,}/.test(l.trim())) || '';
        }
        setName(foundFoodName);
        const suggestedCat = autoCategorize(foundFoodName, text);
        if (suggestedCat) setCategory(suggestedCat);

        let servingsBlock = '';
        const servingStart = lines.findIndex(l => /Serving Sizes/i.test(l));
        if (servingStart !== -1) {
            let servingLines = [];
            for (let i = servingStart + 1; i < lines.length; i++) {
                if (/Notes|Advanced Info|Nutrition Label|Nutrition Facts/i.test(lines[i])) break;
                if (lines[i].trim().length > 0) servingLines.push(lines[i].trim());
            }
            for (let i = 0; i + 2 < servingLines.length; i += 3) {
                servingsBlock += `${servingLines[i]} ${servingLines[i+1]} = ${servingLines[i+2]}g\n`;
            }
        }
        setServingText(servingsBlock.trim());

        let nutrientsBlock = '';
        const nutritionStart = lines.findIndex(l => /Nutrition Facts|Nutrition Overview|Macronutrients|General|Carbohydrates|Lipids|Protein|Vitamins|Minerals/i.test(l));
        if (nutritionStart !== -1) {
            for (let i = nutritionStart; i < lines.length; i++) {
                if (/^\s*$/.test(lines[i]) || /Notes|Serving Sizes|Food Name|Add to Diary|Advanced Info/i.test(lines[i])) break;
                nutrientsBlock += lines[i].trim() + '\n';
            }
        }
        setNutrientText(nutrientsBlock.trim() || text);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `food-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const { data, error: uploadError } = await supabase.storage
                .from('food-items')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('food-images')
                .getPublicUrl(fileName);

            setImage(publicUrl);
            toast.success('Image uploaded successfully');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!name) {
            toast.error('Please enter a name for the food item');
            return;
        }
        setLoading(true);
        try {
            const combinedText = `${servingText}\n${nutrientText}`.trim();
            const parsed = combinedText ? parseNutritionText(combinedText) : { micronutrients: {} };
            const parsedPortions = servingText ? parseMeasures(servingText) : [];

            const finalEnergyKcal = parsed.energy_kcal || parseFloat(energyKcal) || null;
            const finalEnergyKj = parsed.energy_kj || parseFloat(energyKj) || (finalEnergyKcal ? Math.round(finalEnergyKcal * 4.184) : null);
            
            const finalMicros: Record<string, number> = {};
            if (parsed.micronutrients) {
                Object.entries(parsed.micronutrients).forEach(([k, v]) => finalMicros[k] = v);
            }
            Object.entries(micronutrients).forEach(([k, v]) => {
                if (v && !finalMicros[k]) finalMicros[k] = parseFloat(v);
            });

            const foodData = {
                name,
                common_name: commonName || null,
                source: source || 'manual',
                category,
                energy_kcal: finalEnergyKcal,
                energy_kj: finalEnergyKj,
                protein_g: parsed.protein_g || parseFloat(protein) || 0,
                carbs_g: parsed.carbs_g || parseFloat(carbs) || 0,
                fat_g: parsed.fat_g || parseFloat(fat) || 0,
                image: image || null,
                micronutrients: finalMicros,
                portions: parsedPortions,
                user_id: currentUser?.id || null,
                is_curated: profile.isAdmin // Only admins can create curated content
            };

            const { error } = await supabase.from('food_items').upsert(foodData, { onConflict: 'name' });
            if (error) {
                if (error.code === '42501') {
                    throw new Error('You do not have permission to save to the global registry. Only admins can create curated food items.');
                }
                throw error;
            }
            toast.success('Food item saved successfully!');
            router.push('/users/admin');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImportSelect = (item: any) => {
        setName(item.name);
        setCommonName(item.common_name || '');
        setEnergyKcal(item.energy_kcal?.toString() || '');
        setEnergyKj(item.energy_kj?.toString() || '');
        setProtein(item.protein_g?.toString() || '');
        setFat(item.fat_g?.toString() || '');
        setCarbs(item.carbs_g?.toString() || '');

        let nText = `Calories: ${item.energy_kcal || 0}\nProtein: ${item.protein_g || 0}g\nCarbs: ${item.carbs_g || 0}g\nFat: ${item.fat_g || 0}g\n`;
        if (item.micronutrients) {
            Object.entries(item.micronutrients).forEach(([k, v]) => nText += `${k}: ${v}\n`);
            const newMicros: Record<string, string> = {};
            Object.entries(item.micronutrients as Record<string, number>).forEach(([k, v]) => newMicros[k] = v.toString());
            setMicronutrients(newMicros);
        }
        setNutrientText(nText);

        let sText = '';
        if (item.portions && Array.isArray(item.portions)) {
            item.portions.forEach((p: any) => sText += `1 ${p.label} = ${p.weight_g}g\n`);
        }
        setServingText(sText);
        setShowImportPicker(false);
        toast.success("Imported data from USDA Database");
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500 text-slate-800 dark:text-slate-100">
            <div className="flex justify-start">
                <Button
                    onClick={() => setShowImportPicker(true)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all shadow-sm group"
                >
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-all">
                        <Database className="w-4 h-4" />
                    </div>
                    <span>Import from USDA Database</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {showParser && (
                    <div className="lg:col-span-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <Card className="p-8 border-sky-500/30 bg-sky-500/[0.03]">
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles size={20} className="text-sky-500" />
                                <h3 className="font-black text-sm uppercase tracking-widest">Nutrients & Servings</h3>
                            </div>

                            <div className="mb-6">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-sky-700 ml-1">Combined Paste (Name, Servings, Nutrients)</Label>
                                <Textarea
                                    placeholder="Paste all details here (name, servings, nutrients)..."
                                    className="min-h-[100px] bg-white dark:bg-slate-950 border-sky-500/10 text-xs focus:ring-sky-500/20 rounded-2xl font-mono p-4 mb-2"
                                    value={combinedPaste}
                                    onChange={handleCombinedPaste}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-sky-700 ml-1">Servings & Sizes</Label>
                                    <Textarea
                                        placeholder="Paste things like '1 cup = 240g' here..."
                                        className="min-h-[180px] bg-white dark:bg-slate-950 border-sky-500/10 text-xs focus:ring-sky-500/20 rounded-2xl font-mono p-4"
                                        value={servingText}
                                        onChange={(e) => setServingText(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-sky-700 ml-1">Nutrient List</Label>
                                    <Textarea
                                        placeholder="Paste calories, vitamins, etc here..."
                                        className="min-h-[180px] bg-white dark:bg-slate-950 border-sky-500/10 text-xs focus:ring-sky-500/20 rounded-2xl font-mono p-4"
                                        value={nutrientText}
                                        onChange={(e) => setNutrientText(e.target.value)}
                                    />
                                </div>
                            </div>
                        </Card>

                        <div className="flex items-center gap-4 p-2 bg-slate-100/50 dark:bg-slate-900/50 rounded-[24px] border border-slate-200 dark:border-slate-800">
                            <Button
                                variant="ghost"
                                onClick={() => window.location.reload()}
                                className="flex-1 h-14 rounded-[18px] text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 hover:bg-rose-500/5 gap-2"
                            >
                                <Trash2 size={16} />
                                Start Over
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading || !name.trim()}
                                className="flex-1 h-14 rounded-[18px] bg-sky-500 hover:bg-sky-600 text-white shadow-xl text-[10px] font-black uppercase tracking-widest gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
                                Save to Registry
                            </Button>
                        </div>
                    </div>
                )}

                <Card className={cn(showParser ? "lg:col-span-4" : "lg:col-span-12", "p-8 space-y-8")}>
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Beef size={20} className="text-sky-500" />
                            <h3 className="font-black text-sm uppercase tracking-widest">Identification</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Official Name</Label>
                                <Input
                                    className={cn("h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm rounded-xl font-bold", duplicateName && "border-rose-500")}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Common Name</Label>
                                <Input
                                    className="h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm rounded-xl"
                                    value={commonName}
                                    onChange={(e) => { setCommonName(e.target.value); setCommonNameManuallyEdited(true); }}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-black text-slate-400">Category</Label>
                                <div className="relative">
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm appearance-none font-bold"
                                    >
                                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-2">
                            <Camera size={20} className="text-sky-500" />
                            <h3 className="font-black text-sm uppercase tracking-widest">Reference Photo</h3>
                        </div>
                        <div className="relative aspect-video rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden group hover:border-sky-500/50 transition-all flex flex-col items-center justify-center">
                            {image ? (
                                <>
                                    <img src={image} alt="Food" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="secondary" size="sm" onClick={() => setImage('')}>Remove</Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-6">
                                    {uploading ? <Loader2 className="h-10 w-10 animate-spin text-sky-500 mx-auto" /> : <Upload size={24} className="text-slate-400 mx-auto mb-2" />}
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capture Reference</p>
                                    {!uploading && <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} />}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {showImportPicker && (
                <FoodItemPicker
                    onSelect={handleImportSelect}
                    onClose={() => setShowImportPicker(false)}
                    mode="usda-only"
                    isAdmin={true}
                />
            )}
        </div>
    );
}
