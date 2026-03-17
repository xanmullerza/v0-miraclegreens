'use client';

import type { ElementType } from 'react';
import {
    Apple, Carrot, Beef, Bean, Wheat, Droplet, Flame, Leaf, Pill, Box,
} from 'lucide-react';

// ── Interfaces ──────────────────────────────────────────────────

export interface ShoppingItem {
    id: string;
    name: string;
    quantity: string;
    unit: string;
    category?: string;
    is_miracle_product?: boolean;
    source?: 'manual' | 'mealplan' | 'scanned';
    barcode?: string;
    price?: number;
    image_url?: string;
    image?: string;
    common_name?: string;
    food_item_id?: string;
}

// ── Enrichment Cache ────────────────────────────────────────────

export const enrichmentCache = new Map<string, {
    id: string;
    category: string;
    image: string;
    common_name: string;
}>();

// ── LocalStorage Key ────────────────────────────────────────────

export const SHOPPING_STORAGE_KEY = 'vitala_shopping_manual_items';

// ── Category helpers ────────────────────────────────────────────

export interface CategoryStyle {
    bg: string;
    border: string;
    text: string;
    icon: ElementType;
}

export const CATEGORY_ORDER = [
    'Fruit', 'Vegetables', 'Grains', 'Legumes', 'Proteins',
    'Nuts', 'Oils', 'Flavour', 'Supplements', 'Other'
];

export function getCategoryGroup(category?: string): string {
    if (!category) return 'Other';
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

export function getCategoryColor(group: string): CategoryStyle {
    const base = {
        bg: 'bg-slate-50 dark:bg-slate-800/30',
        border: 'border-slate-200 dark:border-slate-700',
        text: 'text-slate-700 dark:text-slate-400',
    };
    const normalized = group.toLowerCase();
    const iconMap: Record<string, ElementType> = {
        fruit: Apple, vegetables: Carrot, proteins: Beef,
        legumes: Bean, grains: Wheat, oils: Droplet,
        flavour: Flame, nuts: Leaf, supplements: Pill,
    };
    return { ...base, icon: iconMap[normalized] || Box };
}

// ── Quantity utilities ──────────────────────────────────────────

export function parseQuantityToGrams(quantity: string): number {
    let totalGrams = 0;
    const entries = quantity.split(/\s*\+\s*/);
    for (const entry of entries) {
        const trimmed = entry.trim();
        if (!trimmed) continue;
        const labeled = trimmed.match(/^(\d+(?:\.\d+)?)\s+.+?\s+\((\d+(?:\.\d+)?)g\)$/);
        if (labeled) { totalGrams += parseFloat(labeled[1]) * parseFloat(labeled[2]); continue; }
        const weighted = trimmed.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(g|kg)$/i);
        if (weighted) { const w = weighted[3].toLowerCase() === 'kg' ? parseFloat(weighted[2]) * 1000 : parseFloat(weighted[2]); totalGrams += parseFloat(weighted[1]) * w; continue; }
        const textUnit = trimmed.match(/^(\d+(?:\.\d+)?)\s*(kg|kilograms?|grams?|g)$/i);
        if (textUnit) { const val = parseFloat(textUnit[1]); const unit = textUnit[2].toLowerCase(); totalGrams += (unit === 'kg' || unit.startsWith('kilogram')) ? val * 1000 : val; continue; }
    }
    return totalGrams;
}

export function formatGramsShort(grams: number): string {
    if (grams >= 1000) { const kg = grams / 1000; return `${parseFloat(kg.toFixed(1))} kg`; }
    return `${Math.round(grams)} g`;
}

/** Sums same-portion entries, concatenates different portions */
export function smartCombineQuantities(existing: string, incoming: string): string {
    const parseEntry = (s: string) => {
        const portionMatch = s.trim().match(/^(\d+(?:\.\d+)?)\s+(.+?)\s+\((\d+(?:\.\d+)?)g\)$/);
        if (portionMatch) return { value: parseFloat(portionMatch[1]), label: portionMatch[2].trim(), weight: portionMatch[3] };
        const simpleMatch = s.trim().match(/^(\d+(?:\.\d+)?)$/);
        if (simpleMatch) return { value: parseFloat(simpleMatch[1]), label: '', weight: '' };
        return null;
    };

    const existingParts = existing.split(/\s*\+\s*/).map(s => s.trim()).filter(Boolean);
    const incomingParsed = parseEntry(incoming);
    if (!incomingParsed) return existing ? `${existing} + ${incoming}` : incoming;

    let merged = false;
    const updatedParts = existingParts.map(part => {
        const parsed = parseEntry(part);
        if (parsed && parsed.label === incomingParsed.label && parsed.weight === incomingParsed.weight) {
            merged = true;
            const newValue = parsed.value + incomingParsed.value;
            return parsed.label ? `${newValue} ${parsed.label} (${parsed.weight}g)` : `${newValue}`;
        }
        return part;
    });

    if (merged) return updatedParts.join(' + ');
    return existing ? `${existing} + ${incoming}` : incoming;
}

/** Combine two quantity strings (for pantry aggregation) */
export function aggregateQuantities(existing: string, added: string): string {
    if (!existing) return added;
    if (!added) return existing;

    const parse = (s: string) => {
        const match = s.trim().match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
        if (!match) return null;
        return { num: parseFloat(match[1]), unit: match[2].trim() };
    };

    const nonZeroExisting = existing
        .split(/\s*\+\s*/)
        .filter(s => { const p = parse(s.trim()); return p ? p.num > 0 : !!s.trim(); })
        .join(' + ');

    if (!nonZeroExisting) return added;

    const e = parse(nonZeroExisting);
    const a = parse(added);

    if (e && a && e.unit === a.unit) {
        const sum = e.num + a.num;
        return e.unit ? `${sum} ${e.unit}` : `${sum}`;
    }

    return `${nonZeroExisting} + ${added}`;
}

/** Format grams as kg when >= 1000g (for pantry) */
export function formatGramsFull(g: number): string {
    if (g >= 1000) {
        const kg = g / 1000;
        const kgStr = kg % 1 === 0 ? kg.toString() : kg.toFixed(1);
        const kgNum = parseFloat(kgStr);
        const unit = kgNum === 1 ? 'kilogram' : 'kilograms';
        return `${kgStr} ${unit}`;
    }
    const gramsNum = Math.round(g);
    const unit = gramsNum === 1 ? 'gram' : 'grams';
    return `${gramsNum} ${unit}`;
}

/** cn utility (simple class joiner) */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
}

/** Portion filter regex — exclude non-shopping-friendly measures */
export const PORTION_EXCLUDE_REGEX = /cup|tbsp|tsp|tablespoon|teaspoon|slice|serving|fluid|pint|quart|gallon|ring|wedge|strip|stalk|sprig|patty|fillet|spear|floret|link/i;
