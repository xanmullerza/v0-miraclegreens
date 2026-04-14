import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, X, Database, Loader2, Sparkles, Plus, SkipForward, Trash2 } from 'lucide-react';
import { searchFoodItem, getUSDAFoodDetails, syncToLocal, FoodItemMatch } from '@/lib/services/nutrition';
import { useUserPreferences } from '@/lib/context/user-preferences-context';

interface FoodItem {
    id: string;
    name: string;
    common_name?: string;
    energy_kcal: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    energy_kj?: number;
    micronutrients?: Record<string, number>;
    portions?: any[];
    image?: string;
    source?: string;
}

interface FoodItemPickerProps {
    onSelect: (foodItem: FoodItem) => void;
    onClose: () => void;
    onSkip?: () => void;
    onDelete?: () => void;
    mode?: 'all' | 'usda-only';
    isAdmin?: boolean;
    inline?: boolean;
    initialSearchQuery?: string;
    initialResults?: any[];
}

export default function FoodItemPicker({ onSelect, onClose, onSkip, onDelete, mode = 'all', isAdmin = false, inline = false, initialSearchQuery = '', initialResults }: FoodItemPickerProps) {
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    const [results, setResults] = useState<FoodItemMatch[]>(initialResults || []);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [sourceFilter, setSourceFilter] = useState<'all' | 'usda' | 'local'>('all');
    const isSmartMatch = !!onSkip;
    const [hasInitialResults] = useState(!!initialResults && initialResults.length > 0);
    
    // User preferences
    const { energyUnit } = useUserPreferences();
    
    // Manual entry state
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [energyInputUnit, setEnergyInputUnit] = useState<'kcal' | 'kJ'>(energyUnit);
    const [manualNutrition, setManualNutrition] = useState<Record<string, number>>({
        energy_kcal: 0,
        protein_g: 0,
        fat_g: 0,
        carbs_g: 0
    });

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Update results when Smart Match advances to next ingredient
    useEffect(() => {
        if (hasInitialResults && initialResults && initialResults.length > 0) {
            setResults(initialResults);
        }
    }, [initialResults, hasInitialResults]);

    // Auto-update search query when Smart Match advances to next ingredient
    useEffect(() => {
        if (hasInitialResults && initialSearchQuery) {
            setSearchQuery(initialSearchQuery);
        }
    }, [initialSearchQuery, hasInitialResults]);

    useEffect(() => {
        const searchFoodItems = async () => {
            if (searchQuery.length < 2) {
                // In Smart Match mode, revert to initial results if query is cleared
                if (hasInitialResults && initialResults) {
                    setResults(initialResults);
                } else {
                    setResults([]);
                }
                return;
            }

            setLoading(true);
            try {
                // Use unified search that returns both USDA and local results
                // Local DB results are prioritized first, USDA is fallback for no matches
                const matches = await searchFoodItem(searchQuery);
                setResults(matches);
            } catch (err) {
                console.error('Unified Search Error:', err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(searchFoodItems, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, hasInitialResults, initialResults]);

    const handleSelectItem = async (item: FoodItemMatch) => {
        setLoading(true);
        try {
            // If it's a local item (already in DB), use it directly
            if (item.source === 'local' && item.id) {
                onSelect({
                    id: item.id,
                    name: item.name,
                    energy_kcal: item.energy_kcal,
                    energy_kj: item.energy_kj,
                    protein_g: item.protein_g,
                    fat_g: item.fat_g,
                    carbs_g: item.carbs_g,
                    micronutrients: item.micronutrients || {},
                    portions: item.portions || [],
                    source: item.source
                });
                // Only close if NOT in Smart Match mode
                if (!hasInitialResults) {
                    onClose();
                }
                return;
            }

            // If it's a USDA item, get full details and sync to local
            // Get full details (measures + comprehensive micros) from USDA details endpoint
            const { portions, micronutrients } = item.fdcId ? await getUSDAFoodDetails(item.fdcId) : { portions: [], micronutrients: {} };

            // Merge the better micros into the item object
            const detailedItem = {
                ...item,
                micronutrients: {
                    ...item.micronutrients, // keep original search results just in case
                    ...micronutrients       // overwrite with detailed data
                }
            };

            // Sync to local
            const localId = await syncToLocal(detailedItem, portions, user?.id, isAdmin);

            if (localId) {
                // Prepare portions for immediate UI use without re-fetch
                const standardMeasures = portions.map(m => ({
                    label: m.label.toLowerCase().replace(/\s*\(.*?\)/g, '').trim(),
                    weight_g: m.weight_g
                })).filter(m => m.weight_g > 0);

                const uniquePortions = Array.from(new Map(standardMeasures.map(m => [m.label, m])).values());

                onSelect({
                    id: localId,
                    name: detailedItem.name,
                    energy_kcal: detailedItem.energy_kcal,
                    energy_kj: detailedItem.energy_kj,
                    protein_g: detailedItem.protein_g,
                    fat_g: detailedItem.fat_g,
                    carbs_g: detailedItem.carbs_g,
                    micronutrients: detailedItem.micronutrients,
                    portions: uniquePortions,
                    source: detailedItem.source || 'usda'
                });
                // Only close if NOT in Smart Match mode
                if (!hasInitialResults) {
                    onClose();
                }
            }
        } catch (err) {
            console.error('Error selecting item:', err);
            alert('Failed to select item from database.');
        } finally {
            setLoading(false);
        }
    };

    const handleManualEntrySubmit = async () => {
        if (!initialSearchQuery) return;
        
        setLoading(true);
        try {
            const user_session = await supabase.auth.getSession();
            const userId = user_session.data.session?.user?.id;

            // Convert energy to kcal for storage if user entered kJ
            const energyKcal = energyInputUnit === 'kJ' 
                ? (manualNutrition.energy_kcal || 0) / 4.184
                : (manualNutrition.energy_kcal || 0);

            // Create manual food item
            const manualItem = {
                name: initialSearchQuery,
                common_name: null,
                source: 'manual',
                category: 'Manual Entry',
                energy_kcal: energyKcal,
                energy_kj: energyKcal * 4.184,
                protein_g: manualNutrition.protein_g || 0,
                carbs_g: manualNutrition.carbs_g || 0,
                fat_g: manualNutrition.fat_g || 0,
                micronutrients: {},
                portions: [{ label: '100g', weight_g: 100 }],
                user_id: userId,
                is_curated: false
            };

            // Insert into database
            const { data: insertedFood, error } = await supabase
                .from('food_items')
                .insert(manualItem)
                .select()
                .single();

            if (error) throw error;

            onSelect({
                id: insertedFood.id,
                name: manualItem.name,
                energy_kcal: manualItem.energy_kcal,
                energy_kj: manualItem.energy_kj,
                protein_g: manualItem.protein_g,
                fat_g: manualItem.fat_g,
                carbs_g: manualItem.carbs_g,
                micronutrients: manualItem.micronutrients,
                portions: manualItem.portions,
                source: 'local'
            });

            setShowManualEntry(false);
            setManualNutrition({ energy_kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 });
            setEnergyInputUnit(energyUnit);
        } catch (err) {
            console.error('Error creating manual entry:', err);
            alert('Failed to create manual entry.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        if (onSkip) {
            onSkip();
        }
        setManualNutrition({ energy_kcal: 0, protein_g: 0, fat_g: 0, carbs_g: 0 });
        setShowManualEntry(false);
    };

    return (
        <>
            {inline ? (
                // Inline mode - renders as part of parent container
                <div className="bg-background border border-border rounded-2xl shadow-xl max-w-full w-full max-h-[600px] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                        <div className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-violet-500" />
                            <h2 className="text-lg font-black uppercase tracking-tighter text-foreground italic">
                                {isSmartMatch ? `Matching: ${initialSearchQuery}` : 'Food Database (USDA + Local)'}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted text-muted-foreground rounded-full transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="p-4 border-b border-border space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search (e.g., chicken breast, olive oil)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 dark:border-slate-800 bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-muted-foreground transition-all"
                                autoFocus
                            />
                        </div>

                        {/* Source Toggle Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSourceFilter('all')}
                                className={`flex-1 h-10 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                    sourceFilter === 'all'
                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                All Sources
                            </button>
                            <button
                                onClick={() => setSourceFilter('usda')}
                                className={`flex-1 h-10 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                    sourceFilter === 'usda'
                                        ? 'bg-green-600 text-white shadow-lg shadow-green-500/20'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                USDA
                            </button>
                            <button
                                onClick={() => setSourceFilter('local')}
                                className={`flex-1 h-10 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                    sourceFilter === 'local'
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                Local DB
                            </button>
                        </div>

                        {/* Action Buttons (Smart Match Mode) */}
                        {isSmartMatch && (
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setShowManualEntry(true)}
                                    className="flex-1 h-9 text-[9px] font-black uppercase tracking-widest rounded-lg bg-orange-500/10 text-orange-600 border border-orange-300 hover:bg-orange-500/20 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Plus size={12} />
                                    Manual Entry
                                </button>
                                <button
                                    onClick={handleSkip}
                                    className="flex-1 h-9 text-[9px] font-black uppercase tracking-widest rounded-lg bg-slate-500/10 text-slate-600 border border-slate-300 hover:bg-slate-500/20 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <SkipForward size={12} />
                                    Skip
                                </button>
                                {onDelete && (
                                    <button
                                        onClick={onDelete}
                                        className="w-9 h-9 text-rose-600 rounded-lg bg-rose-500/10 border border-rose-300 hover:bg-rose-500/20 transition-all flex items-center justify-center"
                                        title="Delete Ingredient"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-900/10">
                        {loading && (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Searching Databases...</span>
                            </div>
                        )}

                        {!loading && (
                            <>
                                {searchQuery.length < 2 ? (
                                    <div className="text-center py-12 text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-40">
                                        Type at least 2 characters to search
                                    </div>
                                ) : results.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        {`No results found for "${searchQuery}"`}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {results
                                            .filter(item => {
                                                if (sourceFilter === 'all') return true;
                                                if (sourceFilter === 'usda') return item.source === 'usda';
                                                if (sourceFilter === 'local') return item.source === 'local';
                                                return true;
                                            })
                                            .map((item, idx) => {
                                            // Determine badge styling based on source
                                            const isUSDA = item.source === 'usda';
                                            const dataType = isUSDA ? (item as any).dataType || 'USDA' : 'Local';
                                            
                                            const getSourceStyle = () => {
                                                if (isUSDA) {
                                                    if (dataType.includes('SR Legacy') || dataType.includes('Foundation')) {
                                                        return 'border-green-300 text-green-600 bg-green-50 dark:bg-green-900/20';
                                                    }
                                                    if (dataType.includes('Survey')) {
                                                        return 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-900/20';
                                                    }
                                                    if (dataType.includes('Branded')) {
                                                        return 'border-gray-300 text-gray-500 bg-gray-50 dark:bg-gray-800/20';
                                                    }
                                                    return 'border-violet-300 text-violet-600 bg-violet-50 dark:bg-violet-900/20';
                                                }
                                                return 'border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
                                            };

                                            const getSourceLabel = () => {
                                                if (!isUSDA) return 'Local';
                                                if (dataType.includes('SR Legacy')) return 'USDA Raw';
                                                if (dataType.includes('Foundation')) return 'USDA Found';
                                                if (dataType.includes('Survey')) return 'USDA Survey';
                                                if (dataType.includes('Branded')) return 'Branded';
                                                return 'USDA';
                                            };

                                            return (
                                                <button
                                                    key={`${item.source}-${item.id || item.fdcId || idx}`}
                                                    onClick={() => handleSelectItem(item)}
                                                    className="w-full text-left p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover:bg-violet-50 dark:hover:bg-violet-950/20 hover:border-violet-500 transition-all group shadow-sm"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                                                            {item.image ? (
                                                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Database size={16} className="text-muted-foreground opacity-40" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-bold text-foreground group-hover:text-violet-700 dark:group-hover:text-violet-400 flex-1 truncate">
                                                                    {item.name}
                                                                </div>
                                                                <span className={`text-[8px] py-1 px-2 rounded-full font-black uppercase shrink-0 border ${getSourceStyle()}`}>
                                                                    {getSourceLabel()}
                                                                </span>
                                                            </div>
                                                            {item.common_name && (
                                                                <div className="text-[10px] text-muted-foreground opacity-60 truncate">
                                                                    {item.common_name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-2 flex gap-2">
                                                        <span>{Math.round(item.energy_kcal)} kcal</span>
                                                        <span>•</span>
                                                        <span>P: {item.protein_g?.toFixed(1)}g</span>
                                                        <span>F: {item.fat_g?.toFixed(1)}g</span>
                                                        <span>C: {item.carbs_g?.toFixed(1)}g</span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer Tip */}
                    <div className="p-3 bg-muted/20 border-t border-border text-center">
                        <p className="text-[10px] text-muted-foreground italic">
                            Selecting a USDA item will automatically save it to your local library for future use.
                        </p>
                    </div>
                </div>
            ) : (
                // Modal mode - renders as fixed modal with backdrop
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-[9999] p-4 pt-[10vh]">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-8 duration-300">
                        {/* Header */}
                        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                            <div className="flex items-center gap-2">
                                <Database className="w-5 h-5 text-violet-500" />
                                <h2 className="text-xl font-black uppercase tracking-tighter text-foreground italic">
                                    {isSmartMatch ? `Matching: ${initialSearchQuery}` : 'Food Database (USDA + Local)'}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-muted text-muted-foreground rounded-full transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="p-4 border-b border-border space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search (e.g., chicken breast, olive oil)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 dark:border-slate-800 bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-muted-foreground transition-all"
                                    autoFocus
                                />
                            </div>

                            {/* Source Toggle Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSourceFilter('all')}
                                    className={`flex-1 h-10 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                        sourceFilter === 'all'
                                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    All Sources
                                </button>
                                <button
                                    onClick={() => setSourceFilter('usda')}
                                    className={`flex-1 h-10 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                        sourceFilter === 'usda'
                                            ? 'bg-green-600 text-white shadow-lg shadow-green-500/20'
                                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    USDA
                                </button>
                                <button
                                    onClick={() => setSourceFilter('local')}
                                    className={`flex-1 h-10 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                        sourceFilter === 'local'
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    Local DB
                                </button>
                            </div>

                            {/* Action Buttons (Smart Match Mode) */}
                            {isSmartMatch && (
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => setShowManualEntry(true)}
                                        className="flex-1 h-9 text-[9px] font-black uppercase tracking-widest rounded-lg bg-orange-500/10 text-orange-600 border border-orange-300 hover:bg-orange-500/20 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Plus size={12} />
                                        Manual Entry
                                    </button>
                                    <button
                                        onClick={handleSkip}
                                        className="flex-1 h-9 text-[9px] font-black uppercase tracking-widest rounded-lg bg-slate-500/10 text-slate-600 border border-slate-300 hover:bg-slate-500/20 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <SkipForward size={12} />
                                        Skip
                                    </button>
                                    {onDelete && (
                                        <button
                                            onClick={onDelete}
                                            className="w-9 h-9 text-rose-600 rounded-lg bg-rose-500/10 border border-rose-300 hover:bg-rose-500/20 transition-all flex items-center justify-center"
                                            title="Delete Ingredient"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Results */}
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-900/10">
                            {loading && (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Searching Databases...</span>
                                </div>
                            )}

                            {!loading && (
                                <>
                                    {searchQuery.length < 2 ? (
                                        <div className="text-center py-12 text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-40">
                                            Type at least 2 characters to search
                                        </div>
                                    ) : results.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            {`No results found for "${searchQuery}"`}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {results
                                                .filter(item => {
                                                    if (sourceFilter === 'all') return true;
                                                    if (sourceFilter === 'usda') return item.source === 'usda';
                                                    if (sourceFilter === 'local') return item.source === 'local';
                                                    return true;
                                                })
                                                .map((item, idx) => {
                                                // Determine badge styling based on source
                                                const isUSDA = item.source === 'usda';
                                                const dataType = isUSDA ? (item as any).dataType || 'USDA' : 'Local';
                                                
                                                const getSourceStyle = () => {
                                                    if (isUSDA) {
                                                        if (dataType.includes('SR Legacy') || dataType.includes('Foundation')) {
                                                            return 'border-green-300 text-green-600 bg-green-50 dark:bg-green-900/20';
                                                        }
                                                        if (dataType.includes('Survey')) {
                                                            return 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-900/20';
                                                        }
                                                        if (dataType.includes('Branded')) {
                                                            return 'border-gray-300 text-gray-500 bg-gray-50 dark:bg-gray-800/20';
                                                        }
                                                        return 'border-violet-300 text-violet-600 bg-violet-50 dark:bg-violet-900/20';
                                                    }
                                                    return 'border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
                                                };

                                                const getSourceLabel = () => {
                                                    if (!isUSDA) return 'Local';
                                                    if (dataType.includes('SR Legacy')) return 'USDA Raw';
                                                    if (dataType.includes('Foundation')) return 'USDA Found';
                                                    if (dataType.includes('Survey')) return 'USDA Survey';
                                                    if (dataType.includes('Branded')) return 'Branded';
                                                    return 'USDA';
                                                };

                                                return (
                                                    <button
                                                        key={`${item.source}-${item.id || item.fdcId || idx}`}
                                                        onClick={() => handleSelectItem(item)}
                                                        className="w-full text-left p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover:bg-violet-50 dark:hover:bg-violet-950/20 hover:border-violet-500 transition-all group shadow-sm"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                                                                {item.image ? (
                                                                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Database size={16} className="text-muted-foreground opacity-40" />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="font-bold text-foreground group-hover:text-violet-700 dark:group-hover:text-violet-400 flex-1 truncate">
                                                                        {item.name}
                                                                    </div>
                                                                    <span className={`text-[8px] py-1 px-2 rounded-full font-black uppercase shrink-0 border ${getSourceStyle()}`}>
                                                                        {getSourceLabel()}
                                                                    </span>
                                                                </div>
                                                                {item.common_name && (
                                                                    <div className="text-[10px] text-muted-foreground opacity-60 truncate">
                                                                        {item.common_name}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-2 flex gap-2">
                                                            <span>{Math.round(item.energy_kcal)} kcal</span>
                                                            <span>•</span>
                                                            <span>P: {item.protein_g?.toFixed(1)}g</span>
                                                            <span>F: {item.fat_g?.toFixed(1)}g</span>
                                                            <span>C: {item.carbs_g?.toFixed(1)}g</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer Tip */}
                        <div className="p-3 bg-muted/20 border-t border-border text-center">
                            <p className="text-[10px] text-muted-foreground italic">
                                Selecting a USDA item will automatically save it to your local library for future use.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Entry Modal */}
            {showManualEntry && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-md w-full flex flex-col animate-in fade-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                            <h3 className="text-lg font-black uppercase tracking-tighter text-foreground italic">
                                Manual Entry: {initialSearchQuery}
                            </h3>
                            <button
                                onClick={() => setShowManualEntry(false)}
                                className="p-2 hover:bg-muted text-muted-foreground rounded-full transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Energy ({energyInputUnit})</label>
                                    <button
                                        onClick={() => setEnergyInputUnit(energyInputUnit === 'kcal' ? 'kJ' : 'kcal')}
                                        className="text-[10px] font-bold uppercase tracking-widest rounded px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                                    >
                                        Switch to {energyInputUnit === 'kcal' ? 'kJ' : 'kcal'}
                                    </button>
                                </div>
                                <input
                                    type="number"
                                    value={manualNutrition.energy_kcal === 0 ? '' : manualNutrition.energy_kcal}
                                    onChange={(e) => setManualNutrition({...manualNutrition, energy_kcal: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0})}
                                    placeholder={`Enter ${energyInputUnit}`}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                />
                                {energyInputUnit === 'kcal' && manualNutrition.energy_kcal > 0 && (
                                    <p className="text-[10px] text-muted-foreground mt-1">≈ {(manualNutrition.energy_kcal * 4.184).toFixed(0)} kJ</p>
                                )}
                                {energyInputUnit === 'kJ' && manualNutrition.energy_kcal > 0 && (
                                    <p className="text-[10px] text-muted-foreground mt-1">≈ {(manualNutrition.energy_kcal / 4.184).toFixed(0)} kcal</p>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Protein (g)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={manualNutrition.protein_g === 0 ? '' : manualNutrition.protein_g}
                                        onChange={(e) => setManualNutrition({...manualNutrition, protein_g: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0})}
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Fat (g)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={manualNutrition.fat_g === 0 ? '' : manualNutrition.fat_g}
                                        onChange={(e) => setManualNutrition({...manualNutrition, fat_g: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0})}
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Carbs (g)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={manualNutrition.carbs_g === 0 ? '' : manualNutrition.carbs_g}
                                        onChange={(e) => setManualNutrition({...manualNutrition, carbs_g: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0})}
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                    />
                                </div>
                            </div>

                            <p className="text-[10px] text-muted-foreground italic">
                                Enter values per 100g. Energy in {energyInputUnit} (will convert automatically). Click "Switch to {energyInputUnit === 'kcal' ? 'kJ' : 'kcal'}" to change units.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-border flex gap-2">
                            <button
                                onClick={() => setShowManualEntry(false)}
                                className="flex-1 px-4 py-2 text-sm font-bold uppercase tracking-widest rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleManualEntrySubmit}
                                disabled={loading}
                                className="flex-1 px-4 py-2 text-sm font-bold uppercase tracking-widest rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                Save Entry
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

const Badge = ({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: 'outline' }) => (
    <span className={`px-2 py-0.5 rounded-full font-bold ${variant === 'outline' ? 'border' : ''} ${className}`}>
        {children}
    </span>
);
