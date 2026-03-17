'use client';

import type { ElementType } from 'react';
import {
    Apple, Carrot, Beef, Bean, Wheat, Droplet, Flame, Leaf, Pill, Box,
} from 'lucide-react';

// ── Interfaces ──────────────────────────────────────────────────

export interface PantryFoodItem {
    id: string;
    name: string;
    common_name: string;
    energy_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    image: string | null;
    is_in_pantry: boolean;
    is_favorite: boolean;
    category?: string;
    source_table?: 'food_items' | 'pantry_items';
    quantity?: string;
}

export interface QuantityEntry {
    qty: number;
    label: string | null;
    weight_g: number | null;
    unit: string | null;
    raw: string;
}

export interface CategoryStyle {
    bg: string;
    border: string;
    text: string;
    icon: ElementType;
}

// ── Constants ───────────────────────────────────────────────────

export const PANTRY_QUANTITIES_KEY = 'pantry_quantities';

export const CATEGORY_ORDER = [
    'Fruit', 'Vegetables', 'Grains', 'Legumes', 'Proteins',
    'Nuts', 'Oils', 'Flavour', 'Supplements', 'Other'
];

export const PORTION_EXCLUDE_REGEX = /cup|tbsp|tsp|tablespoon|teaspoon|slice|serving|fluid|pint|quart|gallon|ring|wedge|strip|stalk|sprig|patty|fillet|spear|floret|link/i;

// ── Category helpers ────────────────────────────────────────────

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

// ── cn utility ──────────────────────────────────────────────────

export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
}

// ── Quantity parsing ────────────────────────────────────────────

export function parseQuantityEntry(s: string): QuantityEntry {
    // "5 Large (223g)"
    const labeled = s.trim().match(/^(\d+(?:\.\d+)?)\s+(.+?)\s+\((\d+(?:\.\d+)?)g\)$/);
    if (labeled) return { qty: parseFloat(labeled[1]), label: labeled[2], weight_g: parseFloat(labeled[3]), unit: 'g', raw: s };
    // "1 x 100g"
    const weighted = s.trim().match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(g|ml|oz|lb|kg)$/i);
    if (weighted) return { qty: parseFloat(weighted[1]), label: null, weight_g: weighted[3].toLowerCase() === 'kg' ? parseFloat(weighted[2]) * 1000 : parseFloat(weighted[2]), unit: 'g', raw: s };
    // "10 kg", "300 grams"
    const textbased = s.trim().match(/^(\d+(?:\.\d+)?)\s*(kg|kilograms?|grams?|g)$/i);
    if (textbased) {
        const qty = parseFloat(textbased[1]);
        const unit = textbased[2].toLowerCase();
        if (unit === 'kg' || unit === 'kilogram' || unit === 'kilograms') {
            return { qty: 1, label: null, weight_g: qty * 1000, unit: 'g', raw: s };
        }
        return { qty: 1, label: null, weight_g: qty, unit: 'g', raw: s };
    }
    // Plain number
    const plain = s.trim().match(/^(\d+(?:\.\d+)?)$/);
    if (plain) return { qty: parseFloat(plain[1]), label: null, weight_g: 1000, unit: 'g', raw: s };
    return { qty: 1, label: null, weight_g: 1000, unit: 'g', raw: s };
}

export function parseQuantityEntries(quantity: string | undefined): string[] {
    if (!quantity) return [];
    return quantity.split(/\s*\+\s*/).map(s => s.trim()).filter(Boolean);
}

// ── Weight detection & formatting ───────────────────────────────

export function isWeightOnlyEntry(entry: QuantityEntry): boolean {
    if (!entry.label) return entry.weight_g != null && (entry.unit === 'g' || entry.unit === null);
    return /^(gram|kilogram)s?$/i.test(entry.label);
}

export function entryTotalGrams(entry: QuantityEntry): number {
    return entry.qty * (entry.weight_g ?? 0);
}

export function formatGramsEntry(grams: number): string {
    if (grams >= 1000) {
        const kg = grams / 1000;
        const kgStr = parseFloat(kg.toFixed(3)).toString();
        return `${kgStr} kg`;
    }
    return `${Math.round(grams)} g`;
}

export function stripZeroEntries(qtyStr: string): string {
    const entries = qtyStr.split(/\s*\+\s*/).map(s => s.trim()).filter(s => {
        if (!s) return false;
        const parsed = parseQuantityEntry(s);
        if (parsed.qty <= 0) return false;
        const totalG = (parsed.qty || 0) * (parsed.weight_g || 0);
        if (parsed.weight_g != null && totalG <= 0) return false;
        return true;
    });
    return entries.join(' + ');
}

// ── Quantity building & merging ─────────────────────────────────

export function buildQuantityString(
    qty: string,
    portion: { label: string; weight_g: number } | null,
    weight: string,
    unit: string
): string {
    if (portion) return `${qty} ${portion.label} (${portion.weight_g}g)`;
    if (weight) return `${qty} x ${weight}${unit}`;
    return qty;
}

export function mergeQuantityStrings(existing: string | undefined, incoming: string): string {
    if (!existing) return incoming;

    const existingEntries = existing.split(/\s*\+\s*/).map(s => s.trim()).filter(s => {
        if (!s) return false;
        const e = parseQuantityEntry(s);
        return e.qty > 0;
    });
    if (existingEntries.length === 0) return incoming;

    const b = parseQuantityEntry(incoming);

    // Pure weight → consolidate with ALL existing weight entries
    if (isWeightOnlyEntry(b)) {
        let totalGrams = entryTotalGrams(b);
        const nonWeightEntries: string[] = [];
        for (const raw of existingEntries) {
            const parsed = parseQuantityEntry(raw);
            if (isWeightOnlyEntry(parsed)) {
                totalGrams += entryTotalGrams(parsed);
            } else {
                nonWeightEntries.push(raw);
            }
        }
        const consolidated = formatGramsEntry(totalGrams);
        return nonWeightEntries.length > 0 ? `${nonWeightEntries.join(' + ')} + ${consolidated}` : consolidated;
    }

    // Non-weight entries — match by label + approximate weight_g
    const matchIndex = existingEntries.findIndex(e => {
        const a = parseQuantityEntry(e);
        if (!b.label || !a.label) return a.label === b.label && a.weight_g === b.weight_g && a.unit === b.unit;
        const labelMatch = a.label.toLowerCase() === b.label.toLowerCase();
        const weightClose = a.weight_g != null && b.weight_g != null ? Math.abs(a.weight_g - b.weight_g) < 1 : a.weight_g === b.weight_g;
        return labelMatch && weightClose;
    });

    if (matchIndex >= 0) {
        const a = parseQuantityEntry(existingEntries[matchIndex]);
        const sumQty = a.qty + b.qty;
        if (b.label && b.weight_g) {
            existingEntries[matchIndex] = `${sumQty} ${b.label} (${b.weight_g}g)`;
        } else if (b.weight_g) {
            existingEntries[matchIndex] = `${sumQty} x ${b.weight_g}${b.unit}`;
        } else {
            existingEntries[matchIndex] = `${sumQty}`;
        }
        return existingEntries.join(' + ');
    }

    return `${existingEntries.join(' + ')} + ${incoming}`;
}

// ── Pluralize unit labels ───────────────────────────────────────

export function pluralizeUnit(label: string, qty: number): string {
    if (qty <= 1) return label;
    const l = label.toLowerCase().trim();
    const unchanged = ['tbsp', 'tsp', 'ml', 'g', 'kg', 'oz', 'lb', 'lbs'];
    if (unchanged.includes(l)) return label;
    if (/[^aeiou]y$/i.test(label)) return label.slice(0, -1) + 'ies';
    if (/(s|sh|ch|x|z)$/i.test(label)) return label + 'es';
    if (/s$/i.test(label)) return label;
    return label + 's';
}
