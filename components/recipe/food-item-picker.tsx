import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, X, Database, Loader2, Sparkles } from 'lucide-react';
import { searchUSDAFood, getUSDAFoodDetails, syncToLocal, FoodItemMatch } from '@/lib/services/nutrition';

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
}

interface FoodItemPickerProps {
    onSelect: (foodItem: FoodItem) => void;

    onClose: () => void;
    mode?: 'all' | 'usda-only';
}

export default function FoodItemPicker({ onSelect, onClose, mode = 'all' }: FoodItemPickerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<FoodItem[]>([]);
    const [usdaResults, setUsdaResults] = useState<FoodItemMatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchingUSDA, setSearchingUSDA] = useState(false);
    const [view, setView] = useState<'local' | 'usda'>('local');

    // Initialize view based on mode
    useEffect(() => {
        if (mode === 'usda-only') {
            setView('usda');
        }
    }, [mode]);

    useEffect(() => {
        const searchFoodItems = async () => {
            if (searchQuery.length < 2) {
                setResults([]);
                setUsdaResults([]);
                return;
            }

            if (view === 'local') {
                setLoading(true);
                const { data, error } = await supabase
                    .from('food_items')
                    .select('id, name, common_name, energy_kcal, protein_g, fat_g, carbs_g, energy_kj, micronutrients, portions, image')
                    .or(`name.ilike.%${searchQuery}%,common_name.ilike.%${searchQuery}%`)
                    .limit(20);

                if (!error && data) {
                    setResults(data);
                }
                setLoading(false);
            } else if (view === 'usda') {
                // Trigger USDA search automatically if in usda view (and usda-only mode)
                handleUSDASearch();
            }
        };

        const debounce = setTimeout(searchFoodItems, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, view]); // Added view dependency

    const handleUSDASearch = async () => {
        if (searchQuery.length < 2) return;
        setSearchingUSDA(true);
        setView('usda');
        try {
            const matches = await searchUSDAFood(searchQuery);
            setUsdaResults(matches);
        } catch (err) {
            console.error('USDA Search Error:', err);
        } finally {
            setSearchingUSDA(false);
        }
    };

    const handleSelectUSDA = async (item: FoodItemMatch) => {
        setLoading(true);
        try {
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
            const localId = await syncToLocal(detailedItem, portions);

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
                    portions: uniquePortions
                });
                onClose();
            }
        } catch (err) {
            console.error('Error syncing USDA item:', err);
            alert('Failed to import item from USDA database.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-[9999] p-4 pt-[10vh]">
            <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-8 duration-300">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-violet-500" />
                        <h2 className="text-xl font-black uppercase tracking-tighter text-foreground italic">
                            {view === 'local' ? 'Clinical Registry' : 'USDA Global Database'}
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
                <div className="p-4 border-b border-border space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search (e.g., chicken breast, olive oil)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && view === 'usda' && handleUSDASearch()}
                            className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 dark:border-slate-800 bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-muted-foreground transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2">
                        {mode === 'all' && (
                            <button
                                onClick={() => setView('local')}
                                className={`flex-1 h-11 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${view === 'local'
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                Local Registry
                            </button>
                        )}
                        <button
                            onClick={handleUSDASearch}
                            className={`flex-1 h-11 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${view === 'usda'
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-violet-600'
                                }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            {mode === 'all' ? 'USDA Intelligence' : 'Search USDA Database'}
                        </button>
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-900/10">
                    {(loading || searchingUSDA) && (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Querying Database...</span>
                        </div>
                    )}

                    {!loading && !searchingUSDA && view === 'local' && (
                        <>
                            {searchQuery.length < 2 ? (
                                <div className="text-center py-12 text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-40">
                                    Type at least 2 characters to search local items
                                </div>
                            ) : results.length === 0 ? (
                                <div className="text-center py-12 space-y-4">
                                    <div className="text-muted-foreground italic text-sm">No local results for "{searchQuery}"</div>
                                    <button
                                        onClick={handleUSDASearch}
                                        className="text-violet-600 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-2 mx-auto"
                                    >
                                        <Database className="w-4 h-4" /> Switch to USDA Intelligence?
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {results.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                onSelect(item);
                                                onClose();
                                            }}
                                            className="w-full text-left p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-500 transition-all group shadow-sm"
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
                                                    <div className="font-bold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 capitalize truncate">
                                                        {item.common_name || item.name}
                                                    </div>
                                                    {item.common_name && (
                                                        <div className="text-[10px] text-muted-foreground opacity-60 truncate">
                                                            Original: {item.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                                                <span>{Math.round(item.energy_kcal)} kcal</span>
                                                <span>•</span>
                                                <span>P: {item.protein_g?.toFixed(1)}g</span>
                                                <span>F: {item.fat_g?.toFixed(1)}g</span>
                                                <span>C: {item.carbs_g?.toFixed(1)}g</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {!loading && !searchingUSDA && view === 'usda' && (
                        <>
                            {usdaResults.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    {searchQuery ? `No global results found for "${searchQuery}"` : 'Enter a search term above'}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-2 px-1 opacity-50 italic">Global Results (Click to Import)</div>
                                    {usdaResults.map((item, idx) => {
                                        // Determine badge color based on data type
                                        const dataType = (item as any).dataType || 'Unknown';
                                        const getTypeStyle = () => {
                                            if (dataType.includes('SR Legacy') || dataType.includes('Foundation')) {
                                                return 'border-green-300 text-green-600 bg-green-50 dark:bg-green-900/20';
                                            }
                                            if (dataType.includes('Survey')) {
                                                return 'border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-900/20';
                                            }
                                            if (dataType.includes('Branded')) {
                                                return 'border-gray-300 text-gray-500 bg-gray-50 dark:bg-gray-800/20';
                                            }
                                            return 'border-blue-200 text-blue-600';
                                        };
                                        const getTypeLabel = () => {
                                            if (dataType.includes('SR Legacy')) return 'Raw';
                                            if (dataType.includes('Foundation')) return 'Foundation';
                                            if (dataType.includes('Survey')) return 'Survey';
                                            if (dataType.includes('Branded')) return 'Branded';
                                            return 'USDA';
                                        };

                                        return (
                                            <button
                                                key={item.fdcId || idx}
                                                onClick={() => handleSelectUSDA(item)}
                                                className="w-full text-left p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover:bg-violet-50 dark:hover:bg-violet-950/20 hover:border-violet-500 transition-all group shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="font-bold text-foreground group-hover:text-violet-700 dark:group-hover:text-violet-400 flex-1">
                                                        {item.name}
                                                    </div>
                                                    <Badge variant="outline" className={`text-[8px] py-0 h-4 uppercase shrink-0 ${getTypeStyle()}`}>
                                                        {getTypeLabel()}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1 flex gap-2">
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
                        Selecting a global item will automatically save it to your local library for future use.
                    </p>
                </div>
            </div>
        </div>
    );
}

const Badge = ({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: 'outline' }) => (
    <span className={`px-2 py-0.5 rounded-full font-bold ${variant === 'outline' ? 'border' : ''} ${className}`}>
        {children}
    </span>
);
