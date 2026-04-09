'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowDownUp, Search, ChevronLeft, ChevronRight, ChevronDown, Activity, Zap, Gem,
    Battery, Droplet, Lightbulb, UtensilsCrossed, Leaf, Dna, Sparkles, Beaker, BookOpen, Filter, Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { nutrientInfo } from '@/lib/data/nutrient-info';
import { useRDA } from '@/hooks/use-rda';
import { cn } from '@/lib/utils';
import { useActionPanel } from '@/lib/context/action-panel-context';
import { Switch } from '@/components/ui/switch';
import { NutrientNode, AccordionSection, ACCORDION_SECTIONS } from './nutrients-view-data';
import { NutrientDetailContent } from './nutrient-detail-content';

interface NutrientFilterPanelProps {
    excludeFlavour: boolean;
    setExcludeFlavour: (value: boolean) => void;
    excludeSupplements: boolean;
    setExcludeSupplements: (value: boolean) => void;
    onClose?: () => void;
}

export function NutrientFilterPanel({
    excludeFlavour,
    setExcludeFlavour,
    excludeSupplements,
    setExcludeSupplements,
    onClose,
}: NutrientFilterPanelProps) {
    const activeCount = (excludeFlavour ? 1 : 0) + (excludeSupplements ? 1 : 0);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 p-5">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Nutridex Filters</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Refine the nutrient list in the sidebar.</p>
                </div>
                {activeCount > 0 && (
                    <button
                        onClick={() => {
                            setExcludeFlavour(false);
                            setExcludeSupplements(false);
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-500"
                    >
                        Clear
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Exclude Flavour/Spices</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Remove flavour and spice foods from the list.</p>
                        </div>
                        <Switch checked={excludeFlavour} onCheckedChange={setExcludeFlavour} className="data-[state=checked]:bg-emerald-600" />
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Exclude Supplements</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Remove supplement foods from nutrient rankings.</p>
                        </div>
                        <Switch checked={excludeSupplements} onCheckedChange={setExcludeSupplements} className="data-[state=checked]:bg-emerald-600" />
                    </div>
                </div>
            </div>

            {onClose && (
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <button
                        onClick={onClose}
                        className="w-full h-12 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all"
                    >
                        Apply Filters
                    </button>
                </div>
            )}
        </div>
    );
}

// Data moved to nutrients-view-data.ts

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

const NUTRIENT_SORT_OPTIONS = [
    { id: 'section', label: 'By Group' },
    { id: 'name', label: 'A-Z' },
] as const;

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

interface NutrientsViewProps {
    compact?: boolean;
    noContainer?: boolean;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

export function NutrientsView({ 
    compact = false, 
    noContainer = false,
    searchQuery: externalSearchQuery,
    onSearchChange
}: NutrientsViewProps) {
    const router = useRouter();
    const { profile, dailyTargets, energyUnit } = useUserPreferences();
    const { setActiveView, setIsActionPanelOpen, excludeFlavour, setExcludeFlavour, excludeSupplements, setExcludeSupplements } = useActionPanel();

    // RDA hook
    const userRDAs = useRDA(
        typeof profile.age === 'number' ? profile.age : 30,
        profile.gender || 'female',
        dailyTargets.energy || 2000
    );

    // UI state
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
    const [nutrientSortField, setNutrientSortField] = useState<'section' | 'name'>('section');
    const [nutrientSortDirection, setNutrientSortDirection] = useState<'asc' | 'desc'>('asc');
    const [showSortOptions, setShowSortOptions] = useState(false);

    const currentSortLabel = NUTRIENT_SORT_OPTIONS.find(opt => opt.id === nutrientSortField)?.label || 'Sort';

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
        onSearchChange?.(val);
    }, [onSearchChange]);

    // Sync external searchQuery with local hero search
    useEffect(() => {
        if (externalSearchQuery !== undefined) {
             setHeroQuery(externalSearchQuery);
        }
    }, [externalSearchQuery]);

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

    const selectNutrient = useCallback((node: NutrientNode) => {
        // Group headers like "_essential_aa" are not clickable for detail
        if (node.id.startsWith('_')) return;
        
        // Navigate to dedicated nutrient page
        router.push(`/nutrients/${encodeURIComponent(node.id)}`);
    }, [router]);

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
                    "w-full mx-auto bg-slate-100 dark:bg-slate-900/80 rounded-none sm:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden",
                    !compact && "max-w-6xl"
                )}>
                    
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                        
                        <div className="flex items-center justify-between gap-4 px-6 md:px-10 py-4 w-full">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        setActiveView('nutrient-filters');
                                        setIsActionPanelOpen(true);
                                    }}
                                    className={cn(
                                        'flex items-center gap-2 h-9 px-4 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0',
                                        (excludeFlavour || excludeSupplements)
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                            : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300 hover:text-emerald-600 shadow-sm'
                                    )}
                                >
                                    <Filter size={11} />
                                    Filter
                                    {(excludeFlavour || excludeSupplements) && (
                                        <span className="w-3.5 h-3.5 flex items-center justify-center bg-white dark:bg-slate-900 text-emerald-600 text-[8px] font-black rounded-full border border-white dark:border-slate-900">
                                            {(excludeFlavour ? 1 : 0) + (excludeSupplements ? 1 : 0)}
                                        </span>
                                    )}
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={() => setShowSortOptions(prev => !prev)}
                                        className={cn(
                                            "h-9 px-4 rounded-full flex items-center gap-2 transition-all border text-[10px] font-black uppercase tracking-widest",
                                            showSortOptions
                                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-indigo-200'
                                                : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-200 hover:text-indigo-500'
                                        )}
                                        title="Sort Options"
                                    >
                                        <ArrowDownUp size={13} />
                                        <span className="hidden sm:inline">{currentSortLabel}</span>
                                    </button>
                                    {showSortOptions && (
                                        <div className="absolute left-0 top-full mt-2 w-40 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-20 p-1.5">
                                            {NUTRIENT_SORT_OPTIONS.map(option => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => {
                                                        if (nutrientSortField === option.id) {
                                                            setNutrientSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                                        } else {
                                                            setNutrientSortField(option.id);
                                                            setNutrientSortDirection('asc');
                                                        }
                                                        setShowSortOptions(false);
                                                    }}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                                                        nutrientSortField === option.id
                                                            ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600'
                                                            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    )}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={13} />
                                    <input
                                        type="text"
                                        value={heroQuery}
                                        onChange={(e) => handleHeroInput(e.target.value)}
                                        placeholder="Search nutrients..."
                                        className={cn(
                                            "w-32 sm:w-64 h-9 pl-9 pr-4 rounded-xl border text-[10px] font-semibold tracking-wide transition-all duration-300 outline-none",
                                            "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
                                            "placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white",
                                            "focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-0"
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="hidden lg:block ml-auto text-[10px] font-black uppercase tracking-[0.2em] text-slate-400/50">Nutrients Library</div>
                        </div>
                    </div>

                    <div className="p-4 md:p-10 space-y-8">
                        {renderNutrientList()}
                    </div>
                </div>
            ) : (
                <div className="p-4 md:p-10 space-y-8">
                    {renderNutrientList()}
                </div>
            )}
        </div>
    );


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
                                {isOpen && <div className="px-5 py-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300 bg-white dark:bg-slate-950/50">{(nutrientSortField === 'name' ? filteredNutrients.slice().sort((a, b) => nutrientSortDirection === 'asc' ? a.label.localeCompare(b.label) : b.label.localeCompare(a.label)) : filteredNutrients).map(node => renderNutrientRow(node, theme, 0))}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
}
