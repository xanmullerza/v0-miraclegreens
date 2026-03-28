'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Search, ChevronLeft, ChevronRight, ChevronDown, Activity, Zap, Gem,
    Battery, Droplet, Lightbulb, UtensilsCrossed, Leaf, Dna, Sparkles, Beaker, BookOpen, Filter, Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { nutrientInfo } from '@/lib/data/nutrient-info';
import { useRDA } from '@/hooks/use-rda';
import { cn } from '@/lib/utils';
import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuCheckboxItem 
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetTrigger, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';

// ─── Types ────────────────────────────────────────────────────

interface NutrientNode {
    id: string;           // key used in the JSON data & RDA lookups
    label: string;        // display name
    unit: string;
    isParent?: boolean;   // has children → accent color
    children?: NutrientNode[];
    theme?: string;       // override theme for this node & children
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
        theme: 'emerald',
        nutrients: [
            {
                id: 'Carbs', label: 'Carbohydrates', unit: 'g', isParent: true,
                theme: 'orange',
                children: [
                    {
                        id: 'Sugars', label: 'Sugars', unit: 'g', isParent: true,
                        theme: 'violet',
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
                    { id: 'Starch', label: 'Starch', unit: 'g', theme: 'amber' },
                    { id: 'Fiber', label: 'Fiber', unit: 'g', theme: 'teal' },
                    { id: 'Sugar Alcohol', label: 'Sugar Alcohol', unit: 'g', theme: 'sky' },
                ]
            },
            {
                id: 'Fat', label: 'Fat', unit: 'g', isParent: true,
                theme: 'rose',
                children: [
                    {
                        id: 'Polyunsaturated Fat', label: 'Polyunsaturated Fat', unit: 'g', isParent: true,
                        theme: 'teal',
                        children: [
                            { id: 'Omega-3', label: 'Omega-3', unit: 'g' },
                            { id: 'Omega-6', label: 'Omega-6', unit: 'g' },
                        ]
                    },
                    { id: 'Saturated Fat', label: 'Saturated Fat', unit: 'g', theme: 'orange' },
                    { id: 'Monounsaturated Fat', label: 'Monounsaturated Fat', unit: 'g', theme: 'amber' },
                    { id: 'Trans Fat', label: 'Trans Fat', unit: 'g', theme: 'sky' },
                    { id: 'Cholesterol', label: 'Cholesterol', unit: 'mg', theme: 'violet' },
                    { id: 'Phytosterol', label: 'Phytosterol', unit: 'mg', theme: 'emerald' },
                ]
            },
            {
                id: 'Protein', label: 'Protein', unit: 'g', isParent: true,
                theme: 'blue',
                children: [
                    {
                        id: '_essential_aa', label: 'Essential Amino Acids', unit: 'g', isParent: true,
                        theme: 'purple',
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
                        theme: 'pink',
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
        ]
    },
    {
        id: 'minerals',
        label: 'Minerals',
        subtitle: 'Essential elements for cellular function and structure',
        icon: Gem,
        theme: 'emerald',
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
        theme: 'emerald',
        nutrients: [
            {
                id: 'Vitamin A', label: 'Vitamin A', unit: 'µg', isParent: true,
                theme: 'orange',
                children: [
                    { id: 'Retinol', label: 'Retinol', unit: 'µg' },
                    { id: 'Beta-carotene', label: 'Beta-carotene', unit: 'µg' },
                    { id: 'Alpha-carotene', label: 'Alpha-carotene', unit: 'µg' },
                    { id: 'Beta-cryptoxanthin', label: 'Beta-cryptoxanthin', unit: 'µg' },
                ]
            },
            {
                id: 'Vitamin E', label: 'Vitamin E', unit: 'mg', isParent: true,
                theme: 'pink',
                children: [
                    { id: 'Alpha-tocopherol', label: 'Alpha-tocopherol', unit: 'mg' },
                    { id: 'Beta-tocopherol', label: 'Beta-tocopherol', unit: 'mg' },
                    { id: 'Delta-tocopherol', label: 'Delta-tocopherol', unit: 'mg' },
                    { id: 'Gamma-tocopherol', label: 'Gamma-tocopherol', unit: 'mg' },
                ]
            },
            { id: 'Vitamin C', label: 'Vitamin C', unit: 'mg', theme: 'sky' },
            { id: 'Vitamin D', label: 'Vitamin D', unit: 'µg', theme: 'amber' },
            { id: 'Vitamin K', label: 'Vitamin K', unit: 'µg', theme: 'rose' },
            {
                id: '_b_vitamins', label: 'B Vitamins', unit: '', isParent: true,
                theme: 'purple',
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
            { id: 'Choline', label: 'Choline', unit: 'mg', theme: 'teal' },
        ]
    },
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
    amber: {
        bg: 'bg-amber-500/5', text: 'text-amber-500', border: 'border-amber-500/20',
        parentBorder: 'border-l-amber-500', parentBg: 'bg-amber-50 dark:bg-amber-950/20',
        sectionBg: 'bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10',
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    teal: {
        bg: 'bg-teal-500/5', text: 'text-teal-500', border: 'border-teal-500/20',
        parentBorder: 'border-l-teal-500', parentBg: 'bg-teal-50 dark:bg-teal-950/20',
        sectionBg: 'bg-gradient-to-br from-teal-50/50 to-teal-100/30 dark:from-teal-950/20 dark:to-teal-900/10',
        badge: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    },
    purple: {
        bg: 'bg-purple-500/5', text: 'text-purple-500', border: 'border-purple-500/20',
        parentBorder: 'border-l-purple-500', parentBg: 'bg-purple-50 dark:bg-purple-950/20',
        sectionBg: 'bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10',
        badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    pink: {
        bg: 'bg-pink-500/5', text: 'text-pink-500', border: 'border-pink-500/20',
        parentBorder: 'border-l-pink-500', parentBg: 'bg-pink-50 dark:bg-pink-950/20',
        sectionBg: 'bg-gradient-to-br from-pink-50/50 to-pink-100/30 dark:from-pink-950/20 dark:to-pink-900/10',
        badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    },
    violet: {
        bg: 'bg-violet-500/5', text: 'text-violet-500', border: 'border-violet-500/20',
        parentBorder: 'border-l-violet-500', parentBg: 'bg-violet-50 dark:bg-violet-950/20',
        sectionBg: 'bg-gradient-to-br from-violet-50/50 to-violet-100/30 dark:from-violet-950/20 dark:to-violet-900/10',
        badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    sky: {
        bg: 'bg-sky-500/5', text: 'text-sky-500', border: 'border-sky-500/20',
        parentBorder: 'border-l-sky-500', parentBg: 'bg-sky-50 dark:bg-sky-950/20',
        sectionBg: 'bg-gradient-to-br from-sky-50/50 to-sky-100/30 dark:from-sky-950/20 dark:to-sky-900/10',
        badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
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
    noContainer?: boolean;
}

export function NutridexView({ compact = false, noContainer = false }: NutridexViewProps) {
    const router = useRouter();
    const { profile, dailyTargets, energyUnit } = useUserPreferences();

    // RDA hook
    const userRDAs = useRDA(
        typeof profile.age === 'number' ? profile.age : 30,
        profile.gender || 'female',
        dailyTargets.energy || 2000
    );

    // UI state
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
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
    }, []);

    // Auto-expand sections when searching
    useEffect(() => {
        if (heroQuery && heroQuery.length > 0) {
            const q = heroQuery.toLowerCase();
            const newExpanded = new Set(expandedSections);
            let changed = false;

            ACCORDION_SECTIONS.forEach(section => {
                const matchSelf = section.label.toLowerCase().includes(q);
                const matchNutrient = section.nutrients.some(n => {
                    if (n.label.toLowerCase().includes(q)) return true;
                    if (n.children?.some(c => c.label.toLowerCase().includes(q))) return true;
                    return false;
                });

                if ((matchSelf || matchNutrient) && !newExpanded.has(section.id)) {
                    newExpanded.add(section.id);
                    changed = true;
                }
            });

            if (changed) setExpandedSections(newExpanded);
        }
    }, [heroQuery]);

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

    const renderNutrientRow = (node: NutrientNode, sectionTheme: typeof THEMES['orange'], depth: number = 0) => {
        const theme = node.theme ? (THEMES[node.theme] || sectionTheme) : sectionTheme;
        const isExpanded = expandedParents.has(node.id);
        const rda = getRDA(node.id);
        const isGroupHeader = node.id.startsWith('_');

        return (
            <div key={node.id}>
                <div
                    className={cn(
                        "w-full text-left flex items-center gap-3 py-3 px-4 rounded-xl transition-all group",
                        node.isParent
                            ? cn("border-l-[3px]", theme.parentBorder, theme.parentBg, "hover:shadow-md cursor-pointer")
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-[3px] border-l-transparent",
                        depth > 0 && "ml-4"
                    )}
                    onClick={() => {
                        if (node.isParent) toggleParent(node.id);
                        else if (!isGroupHeader) selectNutrient(node);
                    }}
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
                        (node.isParent || node.theme || depth > 0) ? theme.text : "text-slate-700 dark:text-slate-300",
                        (node.isParent || node.theme) && "text-[11px]"
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

                    {/* Learn Button for clickable items */}
                    {!isGroupHeader && !node.isParent && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                selectNutrient(node);
                            }}
                            title={`Learn about ${node.label}`}
                            className={cn(
                                "flex-shrink-0 p-1.5 rounded-md transition-colors",
                                theme.text,
                                "hover:bg-black/5 dark:hover:bg-white/10"
                            )}
                        >
                            <BookOpen size={16} />
                        </button>
                    )}
                </div>

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
    //  MAIN RENDER
    // ═══════════════════════════════════════════════════════════

    return (
        <div className={cn("space-y-8 animate-in fade-in duration-500", compact ? "max-h-full" : "pb-32")}>
            
            {/* List Container */}
            {!noContainer ? (
                <div className={cn(
                    "w-full mx-auto bg-slate-100 dark:bg-slate-900/80 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden",
                    !compact && "max-w-6xl"
                )}>
                    
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                        
                        {/* Mobile header (Drawer for filters + Search) */}
                        <div className="flex md:hidden items-center justify-between gap-2 px-4 py-3">
                            {!selectedNutrient && (
                                <>
                                    <Sheet>
                                        <SheetTrigger asChild>
                                            <button className={cn(
                                                'flex items-center gap-2 h-9 px-4 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0',
                                                (excludeFlavour || excludeSupplements)
                                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                                    : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300 hover:text-emerald-600 shadow-sm'
                                            )}>
                                                <Filter size={11} />
                                                Filter
                                                {(excludeFlavour || excludeSupplements) && (
                                                    <span className="w-3.5 h-3.5 flex items-center justify-center bg-white dark:bg-slate-900 text-emerald-600 text-[8px] font-black rounded-full border border-white dark:border-slate-900">
                                                        {(excludeFlavour ? 1 : 0) + (excludeSupplements ? 1 : 0)}
                                                    </span>
                                                )}
                                            </button>
                                        </SheetTrigger>
                                        <SheetContent side="bottom" className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl px-6 pt-6 pb-10">
                                            <SheetHeader className="mb-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Nutridex Filters</h3>
                                                </div>
                                            </SheetHeader>

                                            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Exclude Flavour/Spices</span>
                                                <Switch checked={excludeFlavour} onCheckedChange={setExcludeFlavour} className="data-[state=checked]:bg-emerald-600" />
                                            </div>

                                            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Exclude Supplements</span>
                                                <Switch checked={excludeSupplements} onCheckedChange={setExcludeSupplements} className="data-[state=checked]:bg-emerald-600" />
                                            </div>
                                        </SheetContent>
                                    </Sheet>

                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={13} />
                                        <input
                                            type="text"
                                            value={heroQuery}
                                            onChange={(e) => handleHeroInput(e.target.value)}
                                            placeholder="Search nutrients..."
                                            className={cn(
                                                "w-full h-9 pl-9 pr-4 rounded-full border text-[10px] font-semibold tracking-wide transition-all duration-300 outline-none",
                                                "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
                                                "placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white",
                                                "focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-0"
                                            )}
                                        />
                                    </div>
                                </>
                            )}
                            {selectedNutrient && (
                                <button
                                    onClick={() => { setSelectedNutrient(null); setTopFoods([]); setDetailTab('foods'); }}
                                    className="flex items-center gap-2 h-9 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-full transition-all"
                                >
                                    <ChevronLeft size={14} /> Back to Nutridex
                                </button>
                            )}
                        </div>

                        {/* Desktop header row */}
                        {!compact && (
                            <div className="hidden md:flex md:items-center gap-4 px-10 py-4 w-full">
                                {!selectedNutrient ? (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className={cn(
                                                        'h-9 px-4 rounded-xl flex items-center gap-2 transition-all border relative shadow-sm text-[10px] font-black uppercase tracking-widest',
                                                        (excludeFlavour || excludeSupplements)
                                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                                            : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300 hover:text-emerald-600'
                                                    )}>
                                                        <Filter size={13} />
                                                        Filter
                                                        {(excludeFlavour || excludeSupplements) && (
                                                            <span className="w-3.5 h-3.5 flex items-center justify-center bg-white dark:bg-slate-900 text-emerald-600 text-[7px] font-black rounded-full border border-white dark:border-slate-900">
                                                                {(excludeFlavour ? 1 : 0) + (excludeSupplements ? 1 : 0)}
                                                            </span>
                                                        )}
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-2xl">
                                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 py-1.5">Exclude Categories</DropdownMenuLabel>
                                                    <div className="px-2 py-1.5">
                                                        <div className="flex items-center justify-between py-2">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Flavour/Spices</span>
                                                            <Switch checked={excludeFlavour} onCheckedChange={setExcludeFlavour} className="data-[state=checked]:bg-emerald-600" />
                                                        </div>
                                                        <div className="flex items-center justify-between py-2">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Supplements</span>
                                                            <Switch checked={excludeSupplements} onCheckedChange={setExcludeSupplements} className="data-[state=checked]:bg-emerald-600" />
                                                        </div>
                                                    </div>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={13} />
                                                <input
                                                    type="text"
                                                    value={heroQuery}
                                                    onChange={(e) => handleHeroInput(e.target.value)}
                                                    placeholder="Search nutrients..."
                                                    className={cn(
                                                        "w-64 h-9 pl-9 pr-4 rounded-xl border text-[10px] font-semibold tracking-wide transition-all duration-300 outline-none",
                                                        "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
                                                        "placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white",
                                                        "focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-0"
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <div className="ml-auto text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/50">Nutridex Library</div>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => { setSelectedNutrient(null); setTopFoods([]); setDetailTab('foods'); }}
                                            className="flex items-center gap-2 h-9 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-xl transition-all"
                                        >
                                            <ChevronLeft size={14} /> Back to Nutridex
                                        </button>
                                        <div className="ml-auto flex items-center gap-3">
                                            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{selectedNutrient?.label}</h3>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/50">Nutrient Intelligence</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={cn("p-4 md:p-10", selectedNutrient ? "space-y-6" : "space-y-8")}>
                        {selectedNutrient && renderNutrientDetail()}
                        {!selectedNutrient && renderNutrientList()}
                    </div>
                </div>
            ) : (
                <div className={cn("p-4 md:p-10", selectedNutrient ? "space-y-6" : "space-y-8")}>
                    {selectedNutrient ? renderNutrientDetail() : renderNutrientList()}
                </div>
            )}
        </div>
    );

    function renderNutrientDetail() {
        if (!selectedNutrient) return null;
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20 rounded-3xl p-6 md:p-8 border border-emerald-200 dark:border-emerald-800/50 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Activity size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Activity size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-2xl text-emerald-900 dark:text-emerald-100 uppercase tracking-tighter italic italic-bold">{selectedNutrient?.label}</h3>
                                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mt-0.5 opacity-75">
                                    Target: {getRDA(selectedNutrient?.id || '') >= 100 ? Math.round(getRDA(selectedNutrient?.id || '')) : parseFloat(getRDA(selectedNutrient?.id || '').toFixed(1))} {selectedNutrient?.unit}
                                </p>
                            </div>
                        </div>
                        {selectedNutrient && nutrientInfo[selectedNutrient.id]?.importance && (
                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300/80 leading-relaxed max-w-2xl">
                                {nutrientInfo[selectedNutrient.id].importance}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800 max-w-md">
                    <button onClick={() => setDetailTab('foods')} className={cn("flex-1 text-[11px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all", detailTab === 'foods' ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-md border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white")}>
                        <span className="inline-flex items-center gap-2"><UtensilsCrossed size={14} /> Top Foods</span>
                    </button>
                    <button onClick={() => setDetailTab('learn')} className={cn("flex-1 text-[11px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all", detailTab === 'learn' ? "bg-white dark:bg-slate-800 text-amber-600 shadow-md border border-slate-200 dark:border-slate-700" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white")}>
                        <span className="inline-flex items-center gap-2"><Lightbulb size={14} /> Information</span>
                    </button>
                </div>

                {detailTab === 'foods' ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {isLoading ? (
                                <div className="col-span-full py-20 text-center animate-pulse">
                                    <Loader2 size={32} className="mx-auto text-emerald-500 animate-spin mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scanning Library...</p>
                                </div>
                            ) : topFoods.length > 0 ? (
                                topFoods.map(food => (
                                    <Link key={food.name} href={`/foods/${food.name}`} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-emerald-400/50 hover:shadow-lg transition-all group">
                                        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-950 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800">
                                            {food.image_url ? <img src={food.image_url} alt={food.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Leaf size={24} className="opacity-10" /></div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-black text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-wider">#{food.rank}</span>
                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate capitalize">{food.common_name || food.name}</p>
                                            </div>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                {food.value >= 100 ? Math.round(food.value) : food.value.toFixed(1)} {selectedNutrient?.unit} <span className="text-[8px] opacity-40 ml-1">/ 100G</span>
                                            </p>
                                        </div>
                                        {profile.isPremium && food.value >= ((getRDA(selectedNutrient.id) || 0) / 10) && (
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap shrink-0 border border-emerald-500/20">PREMIUM SOURCE</span>
                                        )}
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">No food data available for this nutrient.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {(() => {
                            const info = nutrientInfo[selectedNutrient.id];
                            if (!info) return <p className="text-center text-slate-400 italic">No scientific briefing available yet.</p>;
                            return (
                                <>
                                    <div className="space-y-6">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
                                            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-amber-500 mb-4 flex items-center gap-2"><Activity size={14} /> Biological Role</h4>
                                            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium">{info.history}</p>
                                        </div>
                                        {info.benefits && (
                                            <div className="bg-emerald-500/5 dark:bg-emerald-500/5 rounded-3xl p-6 border border-emerald-500/10">
                                                <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-4">Core Benefits</h4>
                                                <ul className="space-y-3">{info.benefits.map((b, i) => (<li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium"><span className="text-emerald-500 shrink-0 mt-0.5">✓</span><span>{b}</span></li>))}</ul>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-6">
                                        {info.relatedFacts && (
                                            <div className="bg-blue-500/5 dark:bg-blue-500/5 rounded-3xl p-6 border border-blue-500/10">
                                                <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-4">Discovery & Science</h4>
                                                <div className="space-y-4">{info.relatedFacts.map((f, i) => (<div key={i} className="flex gap-4 group"><span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black shrink-0 text-[10px]">{i + 1}</span><p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 font-medium">{f}</p></div>))}</div>
                                            </div>
                                        )}
                                        {info.deficiencySigns && (
                                            <div className="bg-rose-500/5 dark:bg-rose-500/5 rounded-3xl p-6 border border-rose-500/10">
                                                <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 mb-4">Deficiency Signals</h4>
                                                <ul className="space-y-3">{info.deficiencySigns.map((s, i) => (<li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium"><span className="text-rose-500 shrink-0 mt-1">●</span><span>{s}</span></li>))}</ul>
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>
        );
    }

    function renderNutrientList() {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-4">
                    {ACCORDION_SECTIONS.map(section => {
                        const Icon = section.icon;
                        const isOpen = expandedSections.has(section.id);
                        const theme = THEMES[section.theme] || THEMES.emerald;
                        const leafCount = countLeaves(section.nutrients);
                        const filteredNutrients = heroQuery ? section.nutrients.filter(n => n.label.toLowerCase().includes(heroQuery.toLowerCase()) || n.children?.some(c => c.label.toLowerCase().includes(heroQuery.toLowerCase()))) : section.nutrients;
                        if (heroQuery && filteredNutrients.length === 0) return null;
                        return (
                            <div key={section.id} className={cn("rounded-2xl border overflow-hidden transition-all duration-300", theme.border, isOpen ? "shadow-md scale-[1.01]" : "hover:scale-[1.005]")}>
                                <button onClick={() => toggleSection(section.id)} className={cn("w-full flex items-center gap-3 px-6 py-5 transition-all text-left", theme.sectionBg, "hover:opacity-95")}>
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", theme.bg, "shadow-sm border border-current/10")}><Icon size={18} className={theme.text} /></div>
                                    <div className="flex-1"><h3 className={cn("text-[13px] font-black uppercase tracking-[0.1em]", theme.text)}>{section.label}</h3><p className="text-[10px] font-bold text-slate-500/60 dark:text-slate-400/60 mt-0.5">{section.subtitle}</p></div>
                                    <div className="flex items-center gap-4"><span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full", theme.badge)}>{leafCount}</span><ChevronDown size={18} className={cn("transition-transform duration-300", theme.text, isOpen ? "rotate-0" : "-rotate-90")} /></div>
                                </button>
                                {isOpen && <div className="px-5 py-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300 bg-white dark:bg-slate-950/50">{filteredNutrients.map(node => renderNutrientRow(node, theme, 0))}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}
