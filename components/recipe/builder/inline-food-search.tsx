import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Loader2, Database, Plus } from 'lucide-react';
import { searchFoodItem, getUSDAFoodDetails, syncToLocal, FoodItemMatch } from '@/lib/services/nutrition';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { Card } from '@/components/ui/card';

interface InlineFoodSearchProps {
    onSelect: (foodItem: any) => void;
    isAdmin?: boolean;
}

export function InlineFoodSearch({ onSelect, isAdmin = false }: InlineFoodSearchProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<FoodItemMatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const { energyUnit } = useUserPreferences();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
    }, []);

    useEffect(() => {
        const searchItems = async () => {
            if (searchQuery.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const matches = await searchFoodItem(searchQuery);
                setResults(matches);
            } catch (err) {
                console.error('Inline Search Error:', err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(searchItems, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    const handleSelectItem = async (item: FoodItemMatch) => {
        setLoading(true);
        try {
            if (item.source === 'local' && item.id) {
                onSelect({
                    id: item.id,
                    name: item.name,
                    common_name: item.common_name,
                    energy_kcal: item.energy_kcal,
                    energy_kj: item.energy_kj,
                    protein_g: item.protein_g,
                    fat_g: item.fat_g,
                    carbs_g: item.carbs_g,
                    micronutrients: item.micronutrients || {},
                    portions: item.portions || [],
                    source: item.source
                });
                setSearchQuery('');
                return;
            }

            const { portions, micronutrients } = item.fdcId ? await getUSDAFoodDetails(item.fdcId) : { portions: [], micronutrients: {} };

            const detailedItem = {
                ...item,
                micronutrients: {
                    ...item.micronutrients,
                    ...micronutrients
                }
            };

            const localId = await syncToLocal(detailedItem, portions, user?.id, isAdmin);

            if (localId) {
                const standardMeasures = portions.map(m => ({
                    label: m.label.toLowerCase().replace(/\s*\(.*?\)/g, '').trim(),
                    weight_g: m.weight_g
                })).filter(m => m.weight_g > 0);

                const uniquePortions = Array.from(new Map(standardMeasures.map(m => [m.label, m])).values());

                onSelect({
                    id: localId,
                    name: detailedItem.name,
                    common_name: detailedItem.common_name,
                    energy_kcal: detailedItem.energy_kcal,
                    energy_kj: detailedItem.energy_kj,
                    protein_g: detailedItem.protein_g,
                    fat_g: detailedItem.fat_g,
                    carbs_g: detailedItem.carbs_g,
                    micronutrients: detailedItem.micronutrients,
                    portions: uniquePortions,
                    source: detailedItem.source || 'usda'
                });
                setSearchQuery('');
            }
        } catch (err) {
            console.error('Error selecting item:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="space-y-3 p-4 shadow-xl">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search database..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-transparent border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
                {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-violet-500" />}
            </div>

            {results.length > 0 && (
                <div className="max-h-[12rem] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {results.map((item, idx) => {
                        const displayName = item.source === 'local' && item.common_name ? item.common_name : item.name;
                        return (
                            <button
                                key={`${item.source}-${item.id || item.fdcId || idx}`}
                                onClick={() => handleSelectItem(item)}
                                className="w-full text-left p-2 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-transparent hover:border-violet-200 dark:hover:border-violet-800 transition-all flex flex-col gap-2 group"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400">
                                            {displayName}
                                        </div>
                                        <div className="text-[9px] text-slate-500 font-medium">
                                            {Math.round(item.energy_kcal)} kcal • P: {item.protein_g?.toFixed(1)}g
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${item.source === 'local' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-sky-50 text-sky-700 border border-sky-100'}`}>
                                        {item.source === 'local' ? 'Local DB' : 'USDA API'}
                                    </span>
                                </div>
                                <div className="self-end shrink-0 w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus size={12} className="text-violet-500" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}
