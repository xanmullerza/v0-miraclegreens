'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, ChevronLeft, ChevronRight, ChevronDown, Activity, Zap, Gem,
    Battery, Droplet, Lightbulb, UtensilsCrossed, Leaf, Dna, Sparkles, Beaker
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { nutrientInfo } from '@/lib/data/nutrient-info';
import { useRDA } from '@/hooks/use-rda';
import { cn } from '@/lib/utils';
import { HeroSearch } from '@/components/ui/hero-search';

// ─── Types ────────────────────────────────────────────────────

interface NutrientNode {
    id: string;           // key used in the JSON data & RDA lookups
    label: string;        // display name
    unit: string;
    isParent?: boolean;   // has children → accent color
    children?: NutrientNode[];
}

interface AccordionSection {
    id: string;
    label: string;
    subtitle: string;
    icon: any;
    theme: string;
    nutrients: NutrientNode[];
}

interface FoodRanking {
    rank: number;
    name: string;
    common_name?: string;
    image_url: string | null;
    value: number;
}

// ─── Hierarchical Nutrient Data ───────────────────────────────

const ACCORDION_SECTIONS: AccordionSection[] = [
    {
        id: 'macronutrients',
        label: 'Macronutrients',
        subtitle: 'Energy sources, structural compounds, and hydration',
        icon: Zap,
        theme: 'orange',
        nutrients: [
            {
                id: 'Carbs', label: 'Carbohydrates', unit: 'g', isParent: true,
                children: [
                    {
                        id: 'Sugars', label: 'Sugars', unit: 'g', isParent: true,
                        children: [
                            { id: 'Fructose', label: 'Fructose', unit: 'g' },
                            { id: 'Glucose', label: 'Glucose', unit: 'g' },
                            { id: 'Galactose', label: 'Galactose', unit: 'g' },
                            { id: 'Sucrose', label: 'Sucrose', unit: 'g' },
                            { id: 'Lactose', label: 'Lactose', unit: 'g' },
                            { id: 'Maltose', label: 'Maltose', unit: 'g' },
                            { id: 'Allulose', label: 'Allulose', unit: 'g' },
                        ]
                    },
                    { id: 'Starch', label: 'Starch', unit: 'g' },
                    { id: 'Fiber', label: 'Fiber', unit: 'g' },
                    { id: 'Sugar Alcohol', label: 'Sugar Alcohol', unit: 'g' },
                ]
            },
            {
                id: 'Fat', label: 'Fat', unit: 'g', isParent: true,
                children: [
                    { id: 'Saturated Fat', label: 'Saturated Fat', unit: 'g' },
                    { id: 'Monounsaturated Fat', label: 'Monounsaturated Fat', unit: 'g' },
                    {
                        id: 'Polyunsaturated Fat', label: 'Polyunsaturated Fat', unit: 'g', isParent: true,
                        children: [
                            { id: 'Omega-3', label: 'Omega-3', unit: 'g' },
                            { id: 'Omega-6', label: 'Omega-6', unit: 'g' },
                        ]
                    },
                    { id: 'Trans Fat', label: 'Trans Fat', unit: 'g' },
                    { id: 'Cholesterol', label: 'Cholesterol', unit: 'mg' },
                    { id: 'Phytosterol', label: 'Phytosterol', unit: 'mg' },
                ]
            },
            {
                id: 'Protein', label: 'Protein', unit: 'g', isParent: true,
                children: [
                    {
                        id: '_essential_aa', label: 'Essential Amino Acids', unit: 'g', isParent: true,
                        children: [
                            { id: 'Histidine', label: 'Histidine', unit: 'g' },
                            { id: 'Isoleucine', label: 'Isoleucine', unit: 'g' },
                            { id: 'Leucine', label: 'Leucine', unit: 'g' },
                            { id: 'Lysine', label: 'Lysine', unit: 'g' },
                            { id: 'Methionine', label: 'Methionine', unit: 'g' },
                            { id: 'Phenylalanine', label: 'Phenylalanine', unit: 'g' },
                            { id: 'Threonine', label: 'Threonine', unit: 'g' },
                            { id: 'Tryptophan', label: 'Tryptophan', unit: 'g' },
                            { id: 'Valine', label: 'Valine', unit: 'g' },
                        ]
                    },
                    {
                        id: '_nonessential_aa', label: 'Non-Essential Amino Acids', unit: 'g', isParent: true,
                        children: [
                            { id: 'Alanine', label: 'Alanine', unit: 'g' },
                            { id: 'Arginine', label: 'Arginine', unit: 'g' },
                            { id: 'Aspartic acid', label: 'Aspartic Acid', unit: 'g' },
                            { id: 'Glutamic acid', label: 'Glutamic Acid', unit: 'g' },
                            { id: 'Glycine', label: 'Glycine', unit: 'g' },
                            { id: 'Proline', label: 'Proline', unit: 'g' },
                            { id: 'Serine', label: 'Serine', unit: 'g' },
                            { id: 'Tyrosine', label: 'Tyrosine', unit: 'g' },
                        ]
                    },
                ]
            },
            { id: 'Water', label: 'Water', unit: 'g' },
            { id: 'Ash', label: 'Ash', unit: 'g' },
            { id: 'Alcohol', label: 'Alcohol', unit: 'g' },
        ]
    },
    {
        id: 'minerals',
        label: 'Minerals',
        subtitle: 'Essential elements for cellular function and structure',
        icon: Gem,
        theme: 'rose',
        nutrients: [
            { id: 'Calcium', label: 'Calcium', unit: 'mg' },
            { id: 'Iron', label: 'Iron', unit: 'mg' },
            { id: 'Magnesium', label: 'Magnesium', unit: 'mg' },
            { id: 'Phosphorus', label: 'Phosphorus', unit: 'mg' },
            { id: 'Potassium', label: 'Potassium', unit: 'mg' },
            { id: 'Sodium', label: 'Sodium', unit: 'mg' },
            { id: 'Zinc', label: 'Zinc', unit: 'mg' },
            { id: 'Copper', label: 'Copper', unit: 'mg' },
            { id: 'Manganese', label: 'Manganese', unit: 'mg' },
            { id: 'Selenium', label: 'Selenium', unit: 'µg' },
            { id: 'Chromium', label: 'Chromium', unit: 'µg' },
            { id: 'Molybdenum', label: 'Molybdenum', unit: 'µg' },
            { id: 'Iodine', label: 'Iodine', unit: 'µg' },
            { id: 'Fluoride', label: 'Fluoride', unit: 'mg' },
        ]
    },
    {
        id: 'vitamins',
        label: 'Vitamins',
        subtitle: 'Organic compounds vital for metabolic processes',
        icon: Battery,
        theme: 'blue',
        nutrients: [
            {
                id: 'Vitamin A', label: 'Vitamin A', unit: 'µg', isParent: true,
                children: [
                    { id: 'Retinol', label: 'Retinol', unit: 'µg' },
                    { id: 'Beta-carotene', label: 'Beta-carotene', unit: 'µg' },
                    { id: 'Alpha-carotene', label: 'Alpha-carotene', unit: 'µg' },
                    { id: 'Beta-cryptoxanthin', label: 'Beta-cryptoxanthin', unit: 'µg' },
                ]
            },
            {
                id: 'Vitamin E', label: 'Vitamin E', unit: 'mg', isParent: true,
                children: [
                    { id: 'Alpha-tocopherol', label: 'Alpha-tocopherol', unit: 'mg' },
                    { id: 'Beta-tocopherol', label: 'Beta-tocopherol', unit: 'mg' },
                    { id: 'Delta-tocopherol', label: 'Delta-tocopherol', unit: 'mg' },
                    { id: 'Gamma-tocopherol', label: 'Gamma-tocopherol', unit: 'mg' },
                ]
            },
            { id: 'Vitamin C', label: 'Vitamin C', unit: 'mg' },
            { id: 'Vitamin D', label: 'Vitamin D', unit: 'µg' },
            { id: 'Vitamin K', label: 'Vitamin K', unit: 'µg' },
            {
                id: '_b_vitamins', label: 'B Vitamins', unit: '', isParent: true,
                children: [
                    { id: 'B1 (Thiamine)', label: 'B1 (Thiamine)', unit: 'mg' },
                    { id: 'B2 (Riboflavin)', label: 'B2 (Riboflavin)', unit: 'mg' },
                    { id: 'B3 (Niacin)', label: 'B3 (Niacin)', unit: 'mg' },
                    { id: 'B5 (Pantothenic Acid)', label: 'B5 (Pantothenic Acid)', unit: 'mg' },
                    { id: 'B6 (Pyridoxine)', label: 'B6 (Pyridoxine)', unit: 'mg' },
                    { id: 'B9 (Folate)', label: 'B9 (Folate)', unit: 'µg' },
                    { id: 'B12 (Cobalamin)', label: 'B12 (Cobalamin)', unit: 'µg' },
                ]
            },
            { id: 'Choline', label: 'Choline', unit: 'mg' },
        ]
    },
    {
        id: 'phytonutrients',
        label: 'Phytonutrients & Other',
        subtitle: 'Bioactive compounds, stimulants, and metabolic markers',
        icon: Leaf,
        theme: 'emerald',
        nutrients: [
            { id: 'Lycopene', label: 'Lycopene', unit: 'µg' },
            { id: 'Lutein + Zeaxanthin', label: 'Lutein + Zeaxanthin', unit: 'µg' },
            { id: 'Caffeine', label: 'Caffeine', unit: 'mg' },
            { id: 'Oxalate', label: 'Oxalate', unit: 'mg' },
            { id: 'Beta-Hydroxybutyrate', label: 'Beta-Hydroxybutyrate', unit: 'mg' },
        ]
    }
];

// ─── Theme Map ────────────────────────────────────────────────

const THEMES: Record<string, {
    bg: string; text: string; border: string;
    parentBorder: string; parentBg: string;
    sectionBg: string; badge: string;
}> = {
    orange: {
        bg: 'bg-orange-500/5', text: 'text-orange-500', border: 'border-orange-500/20',
        parentBorder: 'border-l-orange-500', parentBg: 'bg-orange-50 dark:bg-orange-950/20',
        sectionBg: 'bg-gradient-to-br from-orange-50/50 to-orange-100/30 dark:from-orange-950/20 dark:to-orange-900/10',
        badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
    rose: {
        bg: 'bg-rose-500/5', text: 'text-rose-500', border: 'border-rose-500/20',
        parentBorder: 'border-l-rose-500', parentBg: 'bg-rose-50 dark:bg-rose-950/20',
        sectionBg: 'bg-gradient-to-br from-rose-50/50 to-rose-100/30 dark:from-rose-950/20 dark:to-rose-900/10',
        badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
    blue: {
        bg: 'bg-blue-500/5', text: 'text-blue-500', border: 'border-blue-500/20',
        parentBorder: 'border-l-blue-500', parentBg: 'bg-blue-50 dark:bg-blue-950/20',
        sectionBg: 'bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10',
        badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    emerald: {
        bg: 'bg-emerald-500/5', text: 'text-emerald-500', border: 'border-emerald-500/20',
        parentBorder: 'border-l-emerald-500', parentBg: 'bg-emerald-50 dark:bg-emerald-950/20',
        sectionBg: 'bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10',
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
};

// ─── Utility: flatten tree for search ─────────────────────────

function flattenNodes(nodes: NutrientNode[], sectionLabel: string): { id: string; label: string; group: string }[] {
    const list: { id: string; label: string; group: string }[] = [];
    for (const n of nodes) {
        if (!n.id.startsWith('_')) {
            list.push({ id: n.id, label: n.label, group: sectionLabel });
        }
        if (n.children) {
            list.push(...flattenNodes(n.children, sectionLabel));
        }
    }
    return list;
}

// ─── Column map for Supabase queries ──────────────────────────

const COLUMN_MAP: Record<string, string> = {
    'Energy': 'energy_kcal', 'Protein': 'protein_g', 'Carbs': 'carbs_g', 'Fat': 'fat_g',
    'Fiber': 'fiber_g', 'Sodium': 'sodium_mg', 'Potassium': 'potassium_mg',
    'Magnesium': 'magnesium_mg', 'Calcium': 'calcium_mg', 'Phosphorus': 'phosphorus_mg',
    'Iron': 'iron_mg', 'Zinc': 'zinc_mg', 'Copper': 'copper_mg', 'Manganese': 'manganese_mg',
    'Selenium': 'selenium_ug', 'Vitamin A': 'vitamin_a_ug', 'Vitamin C': 'vitamin_c_mg',
    'Vitamin D': 'vitamin_d_ug', 'Vitamin E': 'vitamin_e_mg', 'Vitamin K': 'vitamin_k_ug',
    'B1 (Thiamine)': 'b1_mg', 'B2 (Riboflavin)': 'b2_mg', 'B3 (Niacin)': 'b3_mg',
    'B5 (Pantothenic Acid)': 'b5_mg', 'B6 (Pyridoxine)': 'b6_mg', 'B7 (Biotin)': 'b7_ug',
    'B9 (Folate)': 'b9_ug', 'B12 (Cobalamin)': 'b12_ug', 'Choline': 'choline_mg',
    'Omega-3': 'omega3_ala_g', 'Water': 'water_g',
};

// ─── Component ────────────────────────────────────────────────

interface NutridexViewProps {
    compact?: boolean;
}

export function NutridexView({ compact = false }: NutridexViewProps) {
    const router = useRouter();
    const { profile, dailyTargets, energyUnit } = useUserPreferences();

    // RDA hook
    const userRDAs = useRDA(
        typeof profile.age === 'number' ? profile.age : 30,
        profile.gender || 'female',
        dailyTargets.energy || 2000
    );

    // UI state
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['macronutrients']));
    const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
    const [selectedNutrient, setSelectedNutrient] = useState<NutrientNode | null>(null);
    const [topFoods, setTopFoods] = useState<FoodRanking[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [detailTab, setDetailTab] = useState<'foods' | 'learn'>('foods');
    const [excludeFlavour, setExcludeFlavour] = useState(true);
    const [excludeSupplements, setExcludeSupplements] = useState(true);

    // Hero search state
    const [heroQuery, setHeroQuery] = useState('');
    const [heroResults, setHeroResults] = useState<{ id: string; label: string; group: string }[]>([]);
    const [isHeroActive, setIsHeroActive] = useState(false);

    // All searchable nutrients (flattened)
    const ALL_NUTRIENTS = useMemo(() => {
        const list: { id: string; label: string; group: string }[] = [];
        for (const section of ACCORDION_SECTIONS) {
            list.push(...flattenNodes(section.nutrients, section.label));
        }
        return list;
    }, []);

    const handleHeroInput = useCallback((val: string) => {
        setHeroQuery(val);
        if (!val || val.length < 1) { setHeroResults([]); return; }
        const q = val.toLowerCase();
        setHeroResults(ALL_NUTRIENTS.filter(n =>
            n.label.toLowerCase().includes(q) || n.group.toLowerCase().includes(q)
        ));
    }, [ALL_NUTRIENTS]);

    // ─── RDA Lookup ───────────────────────────────────────────

    const getRDA = useCallback((nutrientId: string): number => {
        // Macros from daily targets
        const macroRDAs: Record<string, number> = {
            'Energy': energyUnit === 'kJ' ? dailyTargets.energy * 4.184 : dailyTargets.energy,
            'Protein': dailyTargets.protein,
            'Carbs': dailyTargets.carbs,
            'Fat': dailyTargets.fat,
            'Fiber': (dailyTargets.energy / 1000) * 14,
            'Sugars': (dailyTargets.energy * 0.10) / 4
        };
        return userRDAs?.[nutrientId] || macroRDAs[nutrientId] || 0;
    }, [userRDAs, dailyTargets, energyUnit]);

    // ─── Detail View: fetch top foods ─────────────────────────

    const selectNutrient = useCallback(async (node: NutrientNode) => {
        // Group headers like "_essential_aa" are not clickable for detail
        if (node.id.startsWith('_')) return;

        setSelectedNutrient(node);
        setDetailTab('foods');
        setIsLoading(true);

        try {
            const col = COLUMN_MAP[node.id];
            if (!col) {
                // Try micronutrients JSONB
                const { data: jsonMatch, error: jsonError } = await supabase
                    .from('food_items')
                    .select('id, name, common_name, image, micronutrients, category')
                    .not('micronutrients', 'is', null)
                    .limit(200);

                if (!jsonError && jsonMatch) {
                    const sorted = jsonMatch
                        .filter(f => {
                            if (!f.micronutrients || f.micronutrients[node.id] === undefined) return false;
                            if (excludeFlavour && f.category === 'Flavour') return false;
                            if (excludeSupplements && f.category === 'Supplements') return false;
                            return true;
                        })
                        .sort((a, b) => (b.micronutrients[node.id] || 0) - (a.micronutrients[node.id] || 0))
                        .slice(0, 10);

                    setTopFoods(sorted.map((item: any, idx) => ({
                        rank: idx + 1,
                        name: item.name,
                        common_name: item.common_name,
                        image_url: item.image || null,
                        value: item.micronutrients[node.id] || 0
                    })));
                } else {
                    setTopFoods([]);
                }
                return;
            }

            const { data, error } = await supabase
                .from('food_items')
                .select('id, name, common_name, image, category, ' + col)
                .not(col, 'is', null)
                .order(col, { ascending: false })
                .limit(20);

            const filterData = (items: any[]) => items.filter(item => {
                if (excludeFlavour && item.category === 'Flavour') return false;
                if (excludeSupplements && item.category === 'Supplements') return false;
                return true;
            }).slice(0, 10);

            if (error || !data || data.length === 0) {
                // Fallback to JSONB
                const { data: jsonMatch } = await supabase
                    .from('food_items')
                    .select('id, name, common_name, image, micronutrients, category')
                    .not('micronutrients', 'is', null)
                    .limit(200);

                if (jsonMatch) {
                    const sorted = jsonMatch
                        .filter(f => {
                            if (!f.micronutrients || f.micronutrients[node.id] === undefined) return false;
                            if (excludeFlavour && f.category === 'Flavour') return false;
                            if (excludeSupplements && f.category === 'Supplements') return false;
                            return true;
                        })
                        .sort((a, b) => (b.micronutrients[node.id] || 0) - (a.micronutrients[node.id] || 0))
                        .slice(0, 10);

                    setTopFoods(sorted.map((item: any, idx) => ({
                        rank: idx + 1, name: item.name, common_name: item.common_name,
                        image_url: item.image || null, value: item.micronutrients[node.id] || 0
                    })));
                } else {
                    setTopFoods([]);
                }
            } else {
                const filtered = filterData(data);
                setTopFoods(filtered.map((item: any, idx) => ({
                    rank: idx + 1, name: item.name, common_name: item.common_name,
                    image_url: item.image || null, value: item[col] || 0
                })));
            }
        } catch (err) {
            console.error('Error fetching nutrient data:', err);
            setTopFoods([]);
        } finally {
            setIsLoading(false);
        }
    }, [excludeFlavour, excludeSupplements]);

    // Re-fetch when filters change
    useEffect(() => {
        if (selectedNutrient) selectNutrient(selectedNutrient);
    }, [excludeFlavour, excludeSupplements]);

    // ─── Toggle helpers ───────────────────────────────────────

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            next.has(sectionId) ? next.delete(sectionId) : next.add(sectionId);
            return next;
        });
    };

    const toggleParent = (parentId: string) => {
        setExpandedParents(prev => {
            const next = new Set(prev);
            next.has(parentId) ? next.delete(parentId) : next.add(parentId);
            return next;
        });
    };

    // ─── Count leaves in a section ────────────────────────────

    function countLeaves(nodes: NutrientNode[]): number {
        let c = 0;
        for (const n of nodes) {
            if (n.children) c += countLeaves(n.children);
            else c++;
        }
        return c;
    }

    // ─── Render a nutrient row ────────────────────────────────

    const renderNutrientRow = (node: NutrientNode, theme: typeof THEMES['orange'], depth: number = 0) => {
        const isExpanded = expandedParents.has(node.id);
        const rda = getRDA(node.id);
        const isGroupHeader = node.id.startsWith('_');

        return (
            <div key={node.id}>
                <button
                    onClick={() => {
                        if (node.isParent) toggleParent(node.id);
                        if (!isGroupHeader) selectNutrient(node);
                    }}
                    className={cn(
                        "w-full text-left flex items-center gap-3 py-3 px-4 rounded-xl transition-all group",
                        node.isParent
                            ? cn("border-l-[3px]", theme.parentBorder, theme.parentBg, "hover:shadow-md")
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-[3px] border-l-transparent",
                        depth > 0 && "ml-4"
                    )}
                >
                    {/* Expand chevron for parents */}
                    {node.isParent ? (
                        <ChevronDown
                            size={14}
                            className={cn(
                                "shrink-0 transition-transform duration-200",
                                theme.text,
                                isExpanded ? "rotate-0" : "-rotate-90"
                            )}
                        />
                    ) : (
                        <div className="w-[14px] shrink-0" />
                    )}

                    {/* Label */}
                    <span className={cn(
                        "flex-1 text-[10px] font-black uppercase tracking-widest",
                        node.isParent ? cn(theme.text, "text-[11px]") : "text-slate-700 dark:text-slate-300"
                    )}>
                        {node.label}
                    </span>

                    {/* RDA value */}
                    {rda > 0 && !isGroupHeader && (
                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">
                            {rda >= 100 ? Math.round(rda) : parseFloat(rda.toFixed(1))} {node.unit}
                        </span>
                    )}

                    {/* Children count badge */}
                    {node.isParent && node.children && (
                        <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-full", theme.badge)}>
                            {node.children.length}
                        </span>
                    )}

                    {/* Navigate chevron for clickable items */}
                    {!isGroupHeader && (
                        <ChevronRight
                            size={12}
                            className="text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors shrink-0"
                        />
                    )}
                </button>

                {/* Children (expanded) */}
                {node.isParent && isExpanded && node.children && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        {node.children.map(child => renderNutrientRow(child, theme, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // ═══════════════════════════════════════════════════════════
    //  DETAIL VIEW
    // ═══════════════════════════════════════════════════════════

    if (selectedNutrient) {
        const info = nutrientInfo[selectedNutrient.id];

        return (
            <div className={cn("space-y-3", compact ? "max-h-[550px] overflow-y-auto" : "pb-32")}>
                <button
                    onClick={() => { setSelectedNutrient(null); setTopFoods([]); setDetailTab('foods'); }}
                    className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold uppercase tracking-wider mb-2"
                >
                    <ChevronLeft size={14} /> Back to Nutridex
                </button>

                {/* Header card */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/50">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-black text-sm text-emerald-900 dark:text-emerald-100 uppercase tracking-wider">{selectedNutrient.label}</h3>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 opacity-75">
                                Daily Target: {getRDA(selectedNutrient.id) >= 100 ? Math.round(getRDA(selectedNutrient.id)) : parseFloat(getRDA(selectedNutrient.id).toFixed(1))} {selectedNutrient.unit}
                            </p>
                        </div>
                        <Activity className="text-emerald-600 dark:text-emerald-400" size={18} />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setDetailTab('foods')}
                        className={cn(
                            "flex-1 text-[11px] font-black uppercase tracking-wider px-2 py-1.5 rounded transition-colors",
                            detailTab === 'foods' ? "bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                        )}
                    >
                        <span className="inline-flex items-center gap-1"><UtensilsCrossed size={12} /> Foods</span>
                    </button>
                    <button
                        onClick={() => setDetailTab('learn')}
                        className={cn(
                            "flex-1 text-[11px] font-black uppercase tracking-wider px-2 py-1.5 rounded transition-colors",
                            detailTab === 'learn' ? "bg-amber-600 text-white" : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                        )}
                    >
                        <span className="inline-flex items-center gap-1"><Lightbulb size={12} /> Learn</span>
                    </button>
                </div>

                {/* Foods Tab */}
                {detailTab === 'foods' && (
                    <div className="space-y-2.5">
                        <div className="space-y-2 bg-slate-900/30 rounded-lg p-2.5 border border-slate-700/50">
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Exclude categories:</p>
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={excludeFlavour} onChange={(e) => setExcludeFlavour(e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-600 cursor-pointer accent-emerald-500" />
                                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-300 transition-colors">Flavour/Spices</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={excludeSupplements} onChange={(e) => setExcludeSupplements(e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-600 cursor-pointer accent-emerald-500" />
                                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-300 transition-colors">Supplements</span>
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {isLoading ? (
                                <div className="text-center py-6 text-xs text-muted-foreground">Loading...</div>
                            ) : topFoods.length > 0 ? (
                                topFoods.map(food => (
                                    <div key={food.rank} className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:border-emerald-300 dark:hover:border-emerald-700/50 transition-colors">
                                        {food.image_url && (
                                            <img src={food.image_url} alt={food.name} className="w-10 h-10 rounded object-cover shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">#{food.rank}</span>
                                                <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{food.common_name || food.name}</p>
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                {food.value.toFixed(1)} {selectedNutrient.unit} / 100g
                                            </p>
                                        </div>
                                        {food.value >= ((getRDA(selectedNutrient.id) || 0) / 10) && (
                                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-[9px] font-bold whitespace-nowrap shrink-0">
                                                HIGH
                                            </span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-xs text-muted-foreground">No foods found</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Learn Tab */}
                {detailTab === 'learn' && info && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                            <p className="text-xs leading-relaxed italic text-slate-700 dark:text-slate-300 border-l-4 border-amber-500/40 pl-3">
                                &quot;{info.history} {info.importance}&quot;
                            </p>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4 border border-amber-200/50 dark:border-amber-800/30">
                            <h4 className="font-black text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400 mb-2">Why It Matters</h4>
                            <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-200">{info.importance}</p>
                        </div>

                        {info.relatedFacts && info.relatedFacts.length > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 mb-3">5 Fast Facts</h4>
                                <div className="space-y-2.5">
                                    {info.relatedFacts.map((fact, i) => (
                                        <div key={i} className="flex gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                                            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-black shrink-0 text-[10px]">{i + 1}</span>
                                            <span className="leading-relaxed">{fact}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {info.benefits && info.benefits.length > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 mb-2">Benefits</h4>
                                <ul className="space-y-1.5">
                                    {info.benefits.map((benefit, i) => (
                                        <li key={i} className="flex gap-2 text-xs text-slate-700 dark:text-slate-300">
                                            <span className="text-emerald-500 font-black">✓</span><span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {info.deficiencySigns && info.deficiencySigns.length > 0 && (
                            <div className="bg-red-50/50 dark:bg-red-900/10 rounded-lg p-4 border border-red-200/50 dark:border-red-800/30">
                                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-red-700 dark:text-red-400 mb-2">Deficiency Signs</h4>
                                <ul className="space-y-1.5">
                                    {info.deficiencySigns.map((sign, i) => (
                                        <li key={i} className="flex gap-2 text-xs text-red-900 dark:text-red-200">
                                            <span className="font-black">·</span><span>{sign}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {info.sources && info.sources.length > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 mb-2">Food Sources</h4>
                                <p className="text-xs text-slate-700 dark:text-slate-300">{info.sources.join(', ')}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Fallback when no info for learn tab */}
                {detailTab === 'learn' && !info && (
                    <div className="py-12 text-center text-xs text-muted-foreground italic">
                        No detailed information available yet for {selectedNutrient.label}.
                    </div>
                )}
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════
    //  LIST / ACCORDION VIEW
    // ═══════════════════════════════════════════════════════════

    return (
        <div className={cn("space-y-6", compact ? "max-h-[550px] overflow-y-auto" : "pb-32")}>

            {/* Hero Search */}
            {!compact && (
                <HeroSearch
                    searchQuery={heroQuery}
                    onQueryChange={handleHeroInput}
                    results={heroResults}
                    isLoading={false}
                    isActive={isHeroActive}
                    setIsActive={setIsHeroActive}
                    onSelect={(item) => {
                        // Find the node in the tree
                        const findNode = (nodes: NutrientNode[]): NutrientNode | null => {
                            for (const n of nodes) {
                                if (n.id === item.id) return n;
                                if (n.children) {
                                    const found = findNode(n.children);
                                    if (found) return found;
                                }
                            }
                            return null;
                        };
                        for (const section of ACCORDION_SECTIONS) {
                            const found = findNode(section.nutrients);
                            if (found) { selectNutrient(found); break; }
                        }
                        setIsHeroActive(false);
                        setHeroQuery('');
                    }}
                    theme="emerald"
                    placeholder="SEARCH NUTRIENTS..."
                    idleTitle="Nutridex"
                    idleSubtitle="Search vitamins, minerals, amino acids, and phytonutrients"
                    noResultsMessage="No matching nutrients found"
                    enterMessage="Enter nutrient name to search"
                    searchingMessage="Searching Nutrients..."
                    renderResult={(item: any) => (
                        <div className="flex items-center gap-4 min-w-0 w-full">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <Activity size={16} className="text-emerald-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white truncate">{item.label}</h4>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.group}</p>
                            </div>
                            <ChevronRight className="text-slate-200 group-hover:text-emerald-500 transition-colors shrink-0" size={20} />
                        </div>
                    )}
                />
            )}

            {/* Compact search */}
            {compact && (
                <div className="relative sticky top-0 z-20 bg-white dark:bg-slate-900 pb-3">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            placeholder="Search nutrients..."
                            value={heroQuery}
                            onChange={(e) => handleHeroInput(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700"
                        />
                    </div>
                </div>
            )}

            {/* Section header (non-compact) */}
            {!compact && (
                <div className="flex items-center gap-4 px-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-500/10">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                            Nutridex
                        </h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                            Complete nutrient reference &amp; profile targets
                        </p>
                    </div>
                </div>
            )}

            {/* Accordion Sections */}
            <div className="space-y-4">
                {ACCORDION_SECTIONS.map(section => {
                    const Icon = section.icon;
                    const isOpen = expandedSections.has(section.id);
                    const theme = THEMES[section.theme] || THEMES.emerald;
                    const leafCount = countLeaves(section.nutrients);

                    // If searching in compact mode, filter
                    const filteredNutrients = heroQuery
                        ? section.nutrients.filter(n => {
                            const q = heroQuery.toLowerCase();
                            const matchSelf = n.label.toLowerCase().includes(q);
                            const matchChild = n.children?.some(c =>
                                c.label.toLowerCase().includes(q) ||
                                c.children?.some(gc => gc.label.toLowerCase().includes(q))
                            );
                            return matchSelf || matchChild;
                        })
                        : section.nutrients;

                    if (heroQuery && filteredNutrients.length === 0) return null;

                    return (
                        <div key={section.id} className={cn("rounded-2xl border overflow-hidden transition-all", theme.border)}>
                            {/* Section Header */}
                            <button
                                onClick={() => toggleSection(section.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-5 py-4 transition-all",
                                    theme.sectionBg,
                                    "hover:opacity-90"
                                )}
                            >
                                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", theme.bg)}>
                                    <Icon size={16} className={theme.text} />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className={cn("text-[11px] font-black uppercase tracking-widest", theme.text)}>
                                        {section.label}
                                    </h3>
                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">{section.subtitle}</p>
                                </div>
                                <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full", theme.badge)}>
                                    {leafCount}
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={cn(
                                        "transition-transform duration-200",
                                        theme.text,
                                        isOpen ? "rotate-0" : "-rotate-90"
                                    )}
                                />
                            </button>

                            {/* Section Body */}
                            {isOpen && (
                                <div className="px-3 py-2 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-200 bg-white dark:bg-slate-950">
                                    {(heroQuery ? filteredNutrients : section.nutrients).map(node =>
                                        renderNutrientRow(node, theme, 0)
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Info Card (non-compact only) */}
            {!compact && (
                <div className="pt-6">
                    <div className="w-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                            <Sparkles size={32} />
                        </div>
                        <div className="space-y-4 flex-1">
                            <div className="space-y-1">
                                <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-blue-500">Biological Reference</h4>
                                <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Profile-Aware Intelligence</h3>
                            </div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic border-l-4 border-blue-500/20 pl-6">
                                &quot;The targets shown above are custom-calculated based on your age, gender, and activity levels. Tap any nutrient to discover life-enhancing benefits, deficiency warnings, and the best whole-food sources.&quot;
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
