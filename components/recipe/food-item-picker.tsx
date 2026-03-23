import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, X, Database, Loader2, Sparkles } from 'lucide-react';
import { searchFoodItem, getUSDAFoodDetails, syncToLocal, FoodItemMatch } from '@/lib/services/nutrition';

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
    isAdmin?: boolean;
    inline?: boolean;
    initialSearchQuery?: string;
    initialResults?: any[];
}

export default function FoodItemPicker({ onSelect, onClose, mode = 'all', isAdmin = false, inline = false, initialSearchQuery = '', initialResults }: FoodItemPickerProps) {
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    const [results, setResults] = useState<FoodItemMatch[]>(initialResults || []);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [sourceFilter, setSourceFilter] = useState<'all' | 'usda' | 'local'>('all');
    const [hasInitialResults] = useState(!!initialResults && initialResults.length > 0);

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

    useEffect(() => {
        // Skip auto-search if we have pre-loaded results (Smart Match mode)
        if (hasInitialResults) return;

        const searchFoodItems = async () => {
            if (searchQuery.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                // Use unified search that returns both USDA and local results
                // USDA results come first due to sorting in searchFoodItem
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
    }, [searchQuery, hasInitialResults]);

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
                    portions: item.portions || []
                });
                onClose();
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
                    portions: uniquePortions
                });
                onClose();
            }
        } catch (err) {
            console.error('Error selecting item:', err);
            alert('Failed to select item from database.');
        } finally {
            setLoading(false);
        }
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
                                {hasInitialResults ? `Matching: ${initialSearchQuery}` : 'Food Database (USDA + Local)'}
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
                                    {hasInitialResults ? `Matching: ${initialSearchQuery}` : 'Food Database (USDA + Local)'}
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
        </>
    );
}

const Badge = ({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: 'outline' }) => (
    <span className={`px-2 py-0.5 rounded-full font-bold ${variant === 'outline' ? 'border' : ''} ${className}`}>
        {children}
    </span>
);
