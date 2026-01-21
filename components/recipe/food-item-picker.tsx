import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, X } from 'lucide-react';


interface FoodItem {
    id: string;
    name: string;
    energy_kcal: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
}

interface FoodItemPickerProps {
    onSelect: (foodItem: FoodItem) => void;
    onClose: () => void;
}

export default function FoodItemPicker({ onSelect, onClose }: FoodItemPickerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<FoodItem[]>([]);
    const [loading, setLoading] = useState(false);
    // const supabase = createClient();

    useEffect(() => {
        const searchFoodItems = async () => {
            if (searchQuery.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, energy_kcal, protein_g, fat_g, carbs_g')
                .ilike('name', `%${searchQuery}%`)
                .limit(20);

            if (!error && data) {
                setResults(data);
            }
            setLoading(false);
        };

        const debounce = setTimeout(searchFoodItems, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, supabase]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Search Food Items</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search for ingredients (e.g., chicken breast, olive oil)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading && (
                        <div className="text-center py-8 text-gray-500">
                            Searching...
                        </div>
                    )}

                    {!loading && searchQuery.length < 2 && (
                        <div className="text-center py-8 text-gray-500">
                            Type at least 2 characters to search
                        </div>
                    )}

                    {!loading && searchQuery.length >= 2 && results.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No food items found. Try a different search term.
                        </div>
                    )}

                    {!loading && results.length > 0 && (
                        <div className="space-y-2">
                            {results.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onSelect(item);
                                        onClose();
                                    }}
                                    className="w-full text-left p-4 border rounded-lg hover:bg-green-50 hover:border-green-500 transition group"
                                >
                                    <div className="font-medium text-gray-900 group-hover:text-green-700">
                                        {item.name}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        Per 100g: {Math.round(item.energy_kcal)} kcal •
                                        P: {item.protein_g?.toFixed(1)}g •
                                        F: {item.fat_g?.toFixed(1)}g •
                                        C: {item.carbs_g?.toFixed(1)}g
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
