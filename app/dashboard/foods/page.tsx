'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    Search,
    X,
    Plus,
    Activity,
    Beef,
    Zap,
    Droplet,
    Gem,
    Battery,
    Heart,
    Info,
    ArrowRight,
    Star,
    Share2,
    Calendar,
    ChevronRight,
    Library,
    Edit2,
    Camera,
    Upload,
    Save,
    Loader2,
    Wheat,
    Filter,
    Check,
    ChevronDown,
    Scale,
    ChefHat,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getNutrientLevelStyles } from '@/lib/utils/nutrient-styles';
import { useRDA } from '@/hooks/use-rda';
import { useSearch, SearchResult } from '@/lib/context/search-context';

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

interface FoodItem {
    id: string;
    name: string;
    common_name: string;
    energy_kcal: number;
    energy_kj: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    image: string | null;
    micronutrients: Record<string, number>;
    is_favorite?: boolean;
    category?: string;
}

const CATEGORIES = ["Vegetables", "Grains", "Legumes", "Oils", "Proteins", "Fruit", "Nuts", "Flavour", "Supplements"];

function FoodsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setResults, setIsLoading: setGlobalLoading, registerResultClickHandler } = useSearch();

    const PAGE_SIZE = 20;
    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const { searchQuery, setSearchQuery } = useSearch();
    const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES);
    const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortField, setSortField] = useState<string>('common_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editCommonName, setEditCommonName] = useState('');
    const [editCategory, setEditCategory] = useState('General');
    const [editImage, setEditImage] = useState('');
    const [uploading, setUploading] = useState(false);

    // Comparison State
    const [compareItems, setCompareItems] = useState<FoodItem[]>([]);
    const [isCompareOpen, setIsCompareOpen] = useState(false);

    // Default RDA for comparison context
    const userRDAs = useRDA(30, 'female', 2000);

    // Initial load and filter/search changes
    useEffect(() => {
        fetchFoods(0, true);
    }, [searchQuery, selectedCategories, showFavoritesOnly, sortField, sortDirection]);

    const fetchFoods = async (pageNum: number, isNewSearch = false) => {
        if (pageNum === 0) setLoading(true);
        else setLoadingMore(true);

        try {
            let query = supabase
                .from('food_items')
                .select('*', { count: 'exact' })
                .order(sortField, { ascending: sortDirection === 'asc' });

            if (searchQuery.trim()) {
                query = query.or(`name.ilike.%${searchQuery}%,common_name.ilike.%${searchQuery}%`);
            }

            if (selectedCategories.length < CATEGORIES.length) {
                query = query.in('category', selectedCategories);
            }

            if (showFavoritesOnly) {
                query = query.eq('is_favorite', true);
            }

            const from = pageNum * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;
            if (error) throw error;

            if (count !== null) setTotalCount(count);

            const newItems = data || [];
            if (isNewSearch) {
                setFoods(newItems);
                setPage(0);
            } else {
                setFoods(prev => [...prev, ...newItems]);
                setPage(pageNum);
            }

            setHasMore(count ? (isNewSearch ? newItems.length : foods.length + newItems.length) < count : false);
        } catch (error) {
            console.error('Error fetching foods:', error);
            toast.error('Failed to load food library');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchFoods(page + 1);
        }
    };

    // Register click handler for global search bar
    useEffect(() => {
        registerResultClickHandler((result: SearchResult) => {
            const item = result.data as FoodItem;
            if (item) {
                router.push(`/dashboard/food/${item.id}`);
            }
        });
    }, [registerResultClickHandler, router]);

    // Update global search context when searching
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setGlobalLoading(true);
        const filtered = foods.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.common_name && item.common_name.toLowerCase().includes(searchQuery.toLowerCase()))
        ).slice(0, 15);

        setResults(filtered.map(item => ({
            id: item.id,
            title: item.common_name || item.name,
            subtitle: item.common_name ? item.name : undefined,
            badges: [
                ...(item.protein_g > 10 ? ['High Protein'] : []),
                ...(item.energy_kcal < 50 ? ['Low Calorie'] : [])
            ],
            data: item
        })));
        setGlobalLoading(false);
    }, [searchQuery, foods, setResults, setGlobalLoading]);

    const toggleFavorite = async (item: FoodItem, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            const newStatus = !item.is_favorite;
            const { error } = await supabase
                .from('food_items')
                .update({ is_favorite: newStatus } as any)
                .eq('id', item.id);

            if (error) throw error;

            setFoods(prev => prev.map(f => f.id === item.id ? { ...f, is_favorite: newStatus } : f));
            setSelectedItem(prev => prev?.id === item.id ? { ...prev, is_favorite: newStatus } : prev);

            if (newStatus) {
                toast.success(`${item.common_name || item.name} added to My Foods`);
            } else {
                toast.info(`${item.common_name || item.name} removed from My Foods`);
            }
        } catch (error: any) {
            console.error('Error toggling favorite:', error);
            toast.error(`Failed to update favorite: ${error.message}`);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('food-items')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('food-items')
                .getPublicUrl(fileName);

            setEditImage(publicUrl);
            toast.success('Image uploaded successfully');
        } catch (err: any) {
            console.error("Upload error:", err);
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditImage(reader.result as string);
            };
            reader.readAsDataURL(file);
            toast.error('Storage upload failed, using local preview');
        } finally {
            setUploading(false);
        }
    };

    const handleEditSave = async () => {
        if (!editingItem) return;

        try {
            const { error } = await supabase
                .from('food_items')
                .update({
                    name: editName,
                    common_name: editCommonName,
                    category: editCategory,
                    image: editImage
                } as any)
                .eq('id', editingItem.id);

            if (error) throw error;

            setFoods(prev => prev.map(f => f.id === editingItem.id ? { ...f, name: editName, common_name: editCommonName, category: editCategory, image: editImage } : f));
            setSelectedItem(prev => prev?.id === editingItem.id ? { ...prev, name: editName, common_name: editCommonName, category: editCategory, image: editImage } : prev);

            setEditingItem(null);
            toast.success('Food item updated successfully');
        } catch (error) {
            console.error('Error updating food item:', error);
            toast.error('Failed to update food item');
        }
    };

    const addToCompare = (item: FoodItem) => {
        if (compareItems.some(i => i.id === item.id)) {
            setCompareItems(prev => prev.filter(i => i.id !== item.id));
        } else if (compareItems.length < 3) {
            setCompareItems(prev => [...prev, item]);
            setIsCompareOpen(true);
        } else {
            toast.error("Maximum 3 foods for comparison.");
        }
    };

    const getVal = (item: FoodItem, key: string) => {
        if (key === 'energy_kcal') return item.energy_kcal;
        if (key === 'protein_g') return item.protein_g;
        if (key === 'carbohydrates_g' || key === 'carbs_g') return item.carbs_g;
        if (key === 'fat_g') return item.fat_g;
        return item.micronutrients?.[key] || 0;
    };

    const getRankingColor = (val: number, allVals: number[]) => {
        const sorted = [...new Set(allVals)].sort((a, b) => b - a);
        const rank = sorted.indexOf(val);
        if (rank === 0) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'; // Winner
        if (rank === 1) return 'text-blue-500 bg-blue-500/10 border-blue-500/20'; // Runner up
        if (rank === 2) return 'text-amber-500 bg-amber-500/10 border-amber-500/20'; // Third
        return 'text-slate-400 bg-slate-100 dark:bg-slate-800 border-transparent';
    };

    const NutrientSection = ({ title, items, icon: Icon, theme = 'indigo', subtitle }: { title: string, items: Record<string, string[]>, icon: any, theme?: 'indigo' | 'rose' | 'emerald' | 'blue' | 'amber', subtitle?: string }) => {
        const themes = {
            indigo: { bg: "bg-slate-900 border-slate-800", text: "text-indigo-400", border: "border-slate-800", itemBorder: "border-indigo-900/50" },
            rose: { bg: "bg-slate-900 border-slate-800", text: "text-rose-400", border: "border-slate-800", itemBorder: "border-rose-900/50" },
            emerald: { bg: "bg-slate-900 border-slate-800", text: "text-emerald-400", border: "border-slate-800", itemBorder: "border-emerald-900/50" },
            blue: { bg: "bg-slate-900 border-slate-800", text: "text-blue-400", border: "border-slate-800", itemBorder: "border-blue-900/50" },
            amber: { bg: "bg-slate-900 border-slate-800", text: "text-amber-400", border: "border-slate-800", itemBorder: "border-amber-900/50" }
        };
        const t = themes[theme];

        return (
            <div className={cn("p-6 rounded-2xl border bg-gradient-to-br", t.bg)}>
                <h4 className={cn("font-black flex items-center gap-2 mb-1 uppercase tracking-widest text-sm", t.text)}><Icon className="h-5 w-5" /> {title}</h4>
                {subtitle && <p className={cn("text-[10px] text-muted-foreground mb-4 border-b pb-2", t.border)}>{subtitle}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {Object.entries(items).map(([label, keys]) => {
                        const unitLabel = label.includes('Folate') || label.includes('B12') || label.includes('Biotin') || label.includes('Selenium') || label.includes('Vitamin A') || label.includes('Vitamin K') || label.includes('Vitamin D') ? 'µg' : label.includes('Vitamin D') ? 'IU' : 'mg';

                        const key = keys.find(k => selectedItem?.micronutrients?.[k] !== undefined) || keys[0];
                        const val = selectedItem ? getVal(selectedItem, key) : 0;
                        const rda = userRDAs?.[label];
                        const pct = rda ? Math.round((val / rda) * 100) : 0;
                        const styles = getNutrientLevelStyles(pct, label);

                        return (
                            <div key={label} className={cn("p-4 rounded-xl border bg-white dark:bg-slate-900 hover:shadow-md transition-all", t.itemBorder)}>
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-[10px] uppercase font-black text-foreground/60 truncate">{label}</p>
                                    <span className="text-[10px] text-muted-foreground font-bold">{unitLabel}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold">{val >= 1 ? val.toFixed(0) : val.toFixed(1)}</span>
                                    {rda && (
                                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-black min-w-[32px] text-center", styles.bg, styles.textFill)}>
                                            {pct}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row -mx-8 -mt-8 h-[calc(100vh-128px)] overflow-hidden bg-slate-50 dark:bg-[#020617] relative">
            {/* Library Panel */}
            <div className={cn(
                "h-full overflow-y-auto custom-scrollbar transition-all duration-500 ease-in-out p-8 relative",
                isCompareOpen ? "lg:w-1/2 shadow-2xl z-10" : "w-full"
            )}>
                <div className={cn("space-y-8 animate-in fade-in duration-500 text-slate-800 dark:text-slate-100 pb-20", !isCompareOpen && "max-w-7xl mx-auto")}>
                    {/* Hero Section */}
                    <div className="relative h-48 rounded-[2.5rem] bg-emerald-600 overflow-hidden flex items-center px-12 group">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center mix-blend-overlay opacity-30" />
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600/50 mix-blend-multiply opacity-40" />

                        <div className="relative z-10 space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                                    <Library className="text-white" size={24} />
                                </div>
                                <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Foods Hub</h1>
                            </div>
                            <p className="text-emerald-50 font-medium max-w-md text-sm pl-1">
                                Explore our database of nutrient-dense whole foods with complete micronutrient profiles.
                            </p>
                        </div>


                        <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-1">
                                    {showFavoritesOnly ? "Favourite Foods" : "All Foods"}
                                </p>
                                <p className="text-3xl font-black text-white leading-none tracking-tighter italic">
                                    {totalCount} <span className="text-emerald-300">FOODS</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                <Button
                                    onClick={() => router.push('/dashboard/nutrients')}
                                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-xl gap-2 px-4 h-11 rounded-xl font-black uppercase tracking-widest group/btn transition-all text-[10px]"
                                >
                                    <Zap size={14} className="group-hover/btn:scale-110 transition-transform text-amber-300" />
                                    Nutrients
                                </Button>
                                <Button
                                    onClick={() => router.push('/dashboard/compare')}
                                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-xl gap-2 px-4 h-11 rounded-xl font-black uppercase tracking-widest group/btn transition-all text-[10px]"
                                >
                                    <Scale size={14} className="group-hover/btn:scale-110 transition-transform" />
                                    Compare
                                </Button>
                                <Button
                                    className="bg-white text-emerald-600 border-none shadow-xl gap-2 px-4 h-11 rounded-xl font-black uppercase tracking-widest pointer-events-none text-[10px]"
                                >
                                    <Library size={14} />
                                    Foods Hub
                                </Button>
                                <Button
                                    onClick={() => router.push('/dashboard/admin/add-food')}
                                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-xl gap-2 px-4 h-11 rounded-xl font-black uppercase tracking-widest group/btn transition-all text-[10px]"
                                >
                                    <Plus size={14} className="group-hover/btn:rotate-90 transition-transform" />
                                    Add Food
                                </Button>
                                <Button
                                    onClick={() => router.push('/dashboard/recipes')}
                                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-xl gap-2 px-4 h-11 rounded-xl font-black uppercase tracking-widest group/btn transition-all text-[10px]"
                                >
                                    <ChefHat size={14} className="group-hover/btn:scale-110 transition-transform" />
                                    Recipes Hub
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-col md:flex-row gap-4 justify-center">

                        {/* Favorites Switch Toggle */}
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 h-14 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all shrink-0">
                            <Globe
                                size={18}
                                className={cn(
                                    "transition-all cursor-pointer",
                                    !showFavoritesOnly ? "text-blue-500 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" : "text-slate-300 hover:text-slate-400"
                                )}
                                onClick={() => setShowFavoritesOnly(false)}
                            />
                            <Switch
                                id="favorites-mode"
                                checked={showFavoritesOnly}
                                onCheckedChange={setShowFavoritesOnly}
                                className="data-[state=checked]:bg-rose-500 data-[state=unchecked]:bg-blue-600 dark:data-[state=unchecked]:bg-blue-600"
                            />
                            <Heart
                                size={18}
                                className={cn(
                                    "transition-all cursor-pointer",
                                    showFavoritesOnly ? "text-rose-500 fill-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" : "text-slate-300 hover:text-slate-400"
                                )}
                                onClick={() => setShowFavoritesOnly(true)}
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative">
                            <div className="flex bg-white dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto no-scrollbar items-center h-14">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={cn(
                                        "px-4 h-full rounded-xl flex items-center gap-2 transition-all duration-300",
                                        isFilterOpen ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                >
                                    <Filter size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filter</span>
                                    <ChevronDown size={14} className={cn("transition-transform", isFilterOpen && "rotate-180")} />
                                </button>

                                <div className="w-px h-6 bg-slate-200 dark:border-slate-800 mx-1" />

                                {CATEGORIES.map(category => {
                                    const isActive = selectedCategories.includes(category);

                                    return (
                                        <button
                                            key={category}
                                            onClick={() => {
                                                if (isActive) {
                                                    setSelectedCategories(prev => prev.filter(c => c !== category));
                                                } else {
                                                    setSelectedCategories(prev => [...prev, category]);
                                                }
                                            }}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 whitespace-nowrap",
                                                isActive
                                                    ? "bg-emerald-600/10 text-emerald-600 border border-emerald-600/20"
                                                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                            )}
                                        >
                                            {category}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Dropdown Menu */}
                            {isFilterOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsFilterOpen(false)}
                                    />
                                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-0 w-64 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[70vh] overflow-y-auto no-scrollbar">
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Select Categories</p>
                                            <div className="space-y-1">
                                                {CATEGORIES.map(category => {
                                                    const isActive = selectedCategories.includes(category);
                                                    return (
                                                        <div
                                                            key={category}
                                                            onClick={() => {
                                                                if (isActive) {
                                                                    setSelectedCategories(prev => prev.filter(c => c !== category));
                                                                } else {
                                                                    setSelectedCategories(prev => [...prev, category]);
                                                                }
                                                            }}
                                                            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer group transition-colors"
                                                        >
                                                            <span className={cn(
                                                                "text-xs font-bold uppercase tracking-wide transition-colors",
                                                                isActive ? "text-emerald-600" : "text-slate-600 dark:text-slate-400"
                                                            )}>
                                                                {category}
                                                            </span>
                                                            <div className={cn(
                                                                "w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center",
                                                                isActive
                                                                    ? "bg-emerald-600 border-emerald-600"
                                                                    : "border-slate-200 dark:border-slate-700 group-hover:border-emerald-500/30"
                                                            )}>
                                                                {isActive && <Check size={12} className="text-white" />}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-2">
                                                <button
                                                    onClick={() => setSelectedCategories([])}
                                                    className="flex-1 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    Clear All
                                                </button>
                                                <button
                                                    onClick={() => setSelectedCategories(CATEGORIES)}
                                                    className="flex-1 py-2 text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors"
                                                >
                                                    Select All
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <Loader2 className="animate-spin text-emerald-500" size={24} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Querying Databank...</p>
                        </div>
                    ) : foods.length === 0 ? (
                        <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/30 dark:bg-slate-900/10 backdrop-blur-sm group">
                            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 group-hover:scale-110 transition-transform">
                                <Library size={32} />
                            </div>
                            <p className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                {showFavoritesOnly ? "No Favorites Yet" : "No results found."}
                            </p>
                            <p className="text-sm text-slate-500 text-center max-w-xs">
                                {showFavoritesOnly
                                    ? "Tap the heart icon on any food to add it to your personal collection."
                                    : "We couldn't find any foods matching your criteria."}
                            </p>
                            {showFavoritesOnly && (
                                <Button
                                    onClick={() => setShowFavoritesOnly(false)}
                                    className="mt-6 rounded-full bg-emerald-600 text-white px-8 font-black uppercase tracking-widest text-[10px]"
                                >
                                    Browse All Foods
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* List Header */}
                            <div className="hidden lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_80px] gap-4 px-8 pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                <div
                                    className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-500 transition-colors"
                                    onClick={() => handleSort('image')}
                                >
                                    <Camera size={14} className={cn(sortField === 'image' && "text-emerald-500")} />
                                    {sortField === 'image' && (sortDirection === 'asc' ? <Plus size={10} /> : <X size={10} className="rotate-45" />)}
                                </div>
                                <div
                                    className="flex items-center gap-1.5 cursor-pointer hover:text-emerald-500 transition-colors"
                                    onClick={() => handleSort('common_name')}
                                >
                                    <Info size={14} className={cn(sortField === 'common_name' && "text-emerald-500")} />
                                    <span>Name</span>
                                    {sortField === 'common_name' && (sortDirection === 'asc' ? <Plus size={10} /> : <X size={10} className="rotate-45" />)}
                                </div>
                                <div
                                    className="flex justify-end items-center gap-1.5 cursor-pointer hover:text-emerald-500 transition-colors"
                                    onClick={() => handleSort('energy_kcal')}
                                >
                                    <Zap size={14} className={cn(sortField === 'energy_kcal' ? "text-emerald-500" : "text-emerald-500/50")} />
                                    {sortField === 'energy_kcal' && (sortDirection === 'asc' ? <Plus size={10} /> : <X size={10} className="rotate-45" />)}
                                </div>
                                <div
                                    className="flex justify-end items-center gap-1.5 cursor-pointer hover:text-emerald-500 transition-colors"
                                    onClick={() => handleSort('carbs_g')}
                                >
                                    <Wheat size={14} className={cn(sortField === 'carbs_g' ? "text-amber-500" : "text-amber-500/50")} />
                                    {sortField === 'carbs_g' && (sortDirection === 'asc' ? <Plus size={10} /> : <X size={10} className="rotate-45" />)}
                                </div>
                                <div
                                    className="flex justify-end items-center gap-1.5 cursor-pointer hover:text-emerald-500 transition-colors"
                                    onClick={() => handleSort('fat_g')}
                                >
                                    <Droplet size={14} className={cn(sortField === 'fat_g' ? "text-amber-900" : "text-amber-900/50")} />
                                    {sortField === 'fat_g' && (sortDirection === 'asc' ? <Plus size={10} /> : <X size={10} className="rotate-45" />)}
                                </div>
                                <div
                                    className="flex justify-end items-center gap-1.5 cursor-pointer hover:text-emerald-500 transition-colors"
                                    onClick={() => handleSort('protein_g')}
                                >
                                    <Beef size={14} className={cn(sortField === 'protein_g' ? "text-rose-500" : "text-rose-500/50")} />
                                    {sortField === 'protein_g' && (sortDirection === 'asc' ? <Plus size={10} /> : <X size={10} className="rotate-45" />)}
                                </div>
                                <div></div>
                            </div>

                            {/* Food Items List */}
                            <div className="space-y-3">
                                {foods.map((food) => (
                                    <div
                                        key={food.id}
                                        onClick={() => router.push(`/dashboard/food/${food.id}`)}
                                        className="group relative bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 hover:shadow-lg transition-all cursor-pointer overflow-hidden p-2 lg:p-0"
                                    >
                                        <div className="lg:grid lg:grid-cols-[80px_1fr_100px_80px_80px_80px_80px] gap-4 lg:items-center lg:px-8">
                                            {/* Thumbnail */}
                                            <div className="aspect-[4/3] lg:aspect-square w-full lg:w-20 rounded-xl lg:rounded-none bg-slate-100 dark:bg-slate-950/50 overflow-hidden relative">
                                                {food.image ? (
                                                    <img src={food.image} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <Beef size={24} className="opacity-20" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="p-3 lg:p-0">
                                                <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight capitalize">
                                                    {food.common_name || food.name}
                                                </h3>
                                                {food.common_name && (
                                                    <p className="text-[10px] text-slate-400 italic truncate uppercase tracking-tighter">{food.name}</p>
                                                )}
                                                {food.category && (
                                                    <Badge className="lg:hidden mt-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] border-none">
                                                        {food.category}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Stats (Desktop View) */}
                                            <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                                {Math.round(food.energy_kcal)}
                                            </div>
                                            <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                                {food.carbs_g.toFixed(1)}g
                                            </div>
                                            <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                                {food.fat_g.toFixed(1)}g
                                            </div>
                                            <div className="hidden lg:block text-right font-black text-sm text-slate-600 dark:text-slate-300">
                                                {food.protein_g.toFixed(1)}g
                                            </div>


                                            {/* Mobile Stats Row */}
                                            <div className="lg:hidden grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                {[
                                                    { label: 'CAL', val: food.energy_kcal, sub: 'k', color: 'text-orange-500' },
                                                    { label: 'CHO', val: food.carbs_g, sub: 'g', color: 'text-amber-500' },
                                                    { label: 'FAT', val: food.fat_g, sub: 'g', color: 'text-amber-900' },
                                                    { label: 'PRO', val: food.protein_g, sub: 'g', color: 'text-rose-500' }
                                                ].map(stat => (
                                                    <div key={stat.label} className="text-center">
                                                        <p className="text-[8px] font-black text-slate-400 mb-0.5">{stat.label}</p>
                                                        <p className={cn("text-xs font-black", stat.color)}>{Math.round(stat.val)}{stat.sub}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Action */}
                                            <div className="p-3 lg:p-0 flex justify-end lg:justify-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToCompare(food);
                                                    }}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center transition-all border",
                                                        compareItems.some(i => i.id === food.id)
                                                            ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
                                                            : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 border-slate-100 dark:border-slate-700"
                                                    )}
                                                    title="Compare Food"
                                                >
                                                    <Scale size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => toggleFavorite(food, e)}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center transition-all border",
                                                        food.is_favorite
                                                            ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/20"
                                                            : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 border-slate-100 dark:border-slate-700"
                                                    )}
                                                >
                                                    <Heart size={14} fill={food.is_favorite ? "currentColor" : "none"} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Button */}
                            {hasMore && (
                                <div className="flex justify-center pt-8">
                                    <Button
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] shadow-xl group transition-all"
                                    >
                                        {loadingMore ? (
                                            <>
                                                <Loader2 className="animate-spin mr-3" size={18} />
                                                Loading Results...
                                            </>
                                        ) : (
                                            <>
                                                View More Foods
                                                <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" size={18} />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}


                </div>
            </div>

            {/* Edit Modal (Outside panels to cover both) */}
            {editingItem && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md">
                        <Card className="bg-white dark:bg-slate-900 p-6 space-y-6 shadow-2xl border-emerald-500/20">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold tracking-tight">Edit Food Entry</h3>
                                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Ingredient Name</Label>
                                    <Input
                                        value={editName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Common Name</Label>
                                    <Input
                                        value={editCommonName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditCommonName(e.target.value)}
                                        className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                                        placeholder="e.g. Garden Pea"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Category</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES.map(category => (
                                            <button
                                                key={category}
                                                onClick={() => setEditCategory(category)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                                                    editCategory === category
                                                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                )}
                                            >
                                                {category}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Reference Photo</Label>
                                    <div className="relative aspect-video rounded-2xl bg-white dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden group/upload flex items-center justify-center">
                                        {editImage ? (
                                            <>
                                                <img src={editImage} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button variant="secondary" size="sm" className="gap-2" onClick={() => setEditImage('')}>
                                                        <X size={14} /> Remove
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center p-4">
                                                {uploading ? (
                                                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
                                                ) : (
                                                    <>
                                                        <Upload size={24} className="text-slate-400 mx-auto mb-2" />
                                                        <p className="text-[10px] font-bold text-slate-500">Click to Upload</p>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            onChange={handleImageUpload}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => setEditingItem(null)}>
                                    Cancel
                                </Button>
                                <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold gap-2" onClick={handleEditSave}>
                                    <Save size={16} /> Save Changes
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* Comparison Panel */}
            <div className={cn(
                "transition-all duration-500 ease-in-out bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col z-[100] lg:z-0",
                isCompareOpen
                    ? "fixed lg:relative inset-0 lg:inset-auto w-full lg:w-1/2 opacity-100 translate-x-0"
                    : "w-0 opacity-0 border-none translate-x-full lg:translate-x-0 overflow-hidden"
            )}>
                <div className="h-full flex flex-col">
                    {/* Comparison Sidebar Header (Lab Control) */}
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950 sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                <Scale size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-sm uppercase tracking-widest leading-none">Analysis Lab</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Split-View Comparison</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsCompareOpen(false)}
                            className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-emerald-600 font-black text-xs uppercase tracking-widest border border-emerald-600/20"
                        >
                            + ADD
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 text-slate-800 dark:text-slate-100">
                        {/* Selected Food Slots */}
                        <div className="grid grid-cols-3 gap-3">
                            {[0, 1, 2].map((idx) => {
                                const item = compareItems[idx];
                                return (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-2 text-center transition-all duration-300 relative group overflow-hidden",
                                            item
                                                ? "border-emerald-500 bg-emerald-500/5"
                                                : "border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50"
                                        )}
                                    >
                                        {item ? (
                                            <>
                                                <div className="w-10 h-10 rounded-lg overflow-hidden mb-2 bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <Beef size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-[9px] font-black uppercase tracking-tighter leading-tight text-slate-800 dark:text-slate-200 line-clamp-2">
                                                    {item.common_name || item.name}
                                                </p>
                                                <button
                                                    onClick={() => setCompareItems(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute top-1 right-1 p-1 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-500"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-8 h-8 rounded-full border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-200 dark:text-slate-800">
                                                    <Scale size={14} className="opacity-20" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Empty Space for clarity */}
                        <div className="flex-1" />
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
                        <Button
                            onClick={() => {
                                const ids = compareItems.map(i => i.id).join(',');
                                router.push(`/dashboard/compare?ids=${ids}`);
                            }}
                            disabled={compareItems.length < 2}
                            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] shadow-xl transition-all gap-3"
                        >
                            <Scale size={18} />
                            Compare Foods
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Backdrop */}
            {isCompareOpen && (
                <div
                    className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-300 lg:hidden"
                    onClick={() => setIsCompareOpen(false)}
                />
            )}
        </div>
    );
}

export default function FoodsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            </div>
        }>
            <FoodsContent />
        </Suspense>
    );
}
