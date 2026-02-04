'use client';

import React, { useState, useMemo } from 'react';
import { X, Copy, Check, Download, ClipboardCheck } from 'lucide-react';
import { CalculatedNutrition } from '@/lib/utils/nutrition-calculator';
import { toast } from 'sonner';

interface NutrientExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    nutrition: CalculatedNutrition;
    recipeName: string;
}

const RDA_STANDARD = {
    'Energy': 2000,
    'Fat': 70,
    'Saturated Fat': 20,
    'Cholesterol': 300,
    'Sodium': 2400,
    'Carbohydrates': 275,
    'Carbs': 275,
    'Total Carbs': 275,
    'Fiber': 28,
    'Sugars': 50,
    'Protein': 50,
    'Vitamin A': 800,
    'Vitamin C': 90,
    'Vitamin D': 200,
    'Vitamin E': 12,
    'Vitamin K': 75,
    'B1 (Thiamine)': 1.16,
    'B2 (Riboflavin)': 1.4,
    'B3 (Niacin)': 15,
    'B5 (Pantothenic Acid)': 6,
    'B6 (Pyridoxine)': 1.7,
    'B12 (Cobalamin)': 2.5,
    'Calcium': 800,
    'Copper': 0.8,
    'Iodine': 150,
    'Iron': 14,
    'Magnesium': 370,
    'Manganese': 2.3,
    'Phosphorus': 700,
    'Potassium': 2000,
    'Selenium': 55,
    'Zinc': 10,
    'Biotin': 30,
    'Folate': 400,
    'Choline': 550,
    'Chromium': 35,
    'Molybdenum': 45,
    'Fluoride': 4,
};

export default function NutrientExportModal({ isOpen, onClose, nutrition, recipeName }: NutrientExportModalProps) {
    const [copied, setCopied] = useState(false);

    const formattedText = useMemo(() => {
        if (!nutrition) return '';

        const m = nutrition.micronutrients || {};

        const getVal = (names: string[]) => {
            for (const name of names) {
                if (m[name] !== undefined) return m[name];
                // Try case-insensitive
                const found = Object.keys(m).find(k => k.toLowerCase() === name.toLowerCase());
                if (found) return m[found];
            }
            return 0;
        };

        const formatLine = (label: string, value: number | string | undefined, unit: string, rdaKey?: string, indent: number = 0) => {
            const prefix = ' '.repeat(indent * 4);
            let valStr = '-';
            let dvStr = '';

            if (typeof value === 'number') {
                valStr = value.toFixed(2);
                if (rdaKey && (RDA_STANDARD as any)[rdaKey]) {
                    const dv = (value / (RDA_STANDARD as any)[rdaKey]) * 100;
                    dvStr = dv < 0.1 ? '<0.1%' : `${dv.toFixed(1)}%`;
                }
            } else if (typeof value === 'string') {
                valStr = value;
            }

            // The format requested is very specific:
            // Label
            // Amount
            // Unit
            // % DV (if present)
            // But actually it looks like:
            // Energy
            // 155.00
            // kcal
            // 7.8%

            const lines = [prefix + label, prefix + valStr, prefix + unit];
            if (dvStr) lines.push(prefix + dvStr);
            return lines.join('\n');
        };

        const lines: string[] = [];

        // General
        lines.push('General');
        lines.push('Amount');
        lines.push('% DV');
        lines.push(formatLine('Energy', nutrition.calories, 'kcal', 'Energy'));
        lines.push(formatLine('', nutrition.energy_kj, 'kJ')); // Energy KJ doesn't repeat the label in user's example? 
        // Wait, looking at the snippet:
        // Energy
        // 155.00
        // kcal
        // 7.8%
        // 648.95
        // kJ

        // Re-reading snippet:
        /*
        Energy
        155.00
        kcal
        7.8%
        648.95
        kJ
        */
        // Let's adjust formatLine to handle this specific Energy case or more general cases.

        const output: string[] = [];
        output.push('General');
        output.push('Amount');
        output.push('% DV');

        // Energy
        output.push('Energy');
        output.push(nutrition.calories.toFixed(2));
        output.push('kcal');
        output.push(((nutrition.calories / 2000) * 100).toFixed(1) + '%');
        output.push(nutrition.energy_kj.toFixed(2));
        output.push('kJ');

        const addNutrient = (label: string, names: string[], unit: string, rdaKey?: string, indent: number = 0) => {
            const val = getVal(names);
            const prefix = ' '.repeat(indent * 4);
            output.push(prefix + label);
            if (val === 0 && !Object.keys(m).some(k => names.map(n => n.toLowerCase()).includes(k.toLowerCase()))) {
                output.push(prefix + '-');
            } else {
                output.push(prefix + val.toFixed(2));
            }
            output.push(prefix + unit);
            if (rdaKey && (RDA_STANDARD as any)[rdaKey]) {
                const dv = (val / (RDA_STANDARD as any)[rdaKey]) * 100;
                output.push(prefix + (dv < 0.1 ? '<0.1%' : `${dv.toFixed(1)}%`));
            }
        };

        addNutrient('Alcohol', ['Alcohol'], 'g');
        addNutrient('Ash', ['Ash'], 'g');
        addNutrient('Beta-Hydroxybutyrate', ['Beta-Hydroxybutyrate'], 'g');
        addNutrient('Caffeine', ['Caffeine'], 'mg');
        addNutrient('Oxalate', ['Oxalate'], 'mg');
        addNutrient('Water', ['Water'], 'g');

        // Carbohydrates
        output.push('Carbohydrates');
        output.push('Amount');
        output.push('% DV');
        addNutrient('Total Carbs', ['Carbs', 'Carbohydrates', 'Total Carbohydrates'], 'g', 'Carbs');
        addNutrient('Fiber', ['Fiber', 'Dietary Fiber'], 'g', 'Fiber', 1);
        addNutrient('Starch', ['Starch'], 'g', undefined, 1);
        addNutrient('Sugars', ['Sugars', 'Total Sugars'], 'g', 'Sugars', 1);
        addNutrient('Allulose', ['Allulose'], 'g', undefined, 2);
        addNutrient('Fructose', ['Fructose'], 'g', undefined, 2);
        addNutrient('Galactose', ['Galactose'], 'g', undefined, 2);
        addNutrient('Glucose', ['Glucose'], 'g', undefined, 2);
        addNutrient('Lactose', ['Lactose'], 'g', undefined, 2);
        addNutrient('Maltose', ['Maltose'], 'g', undefined, 2);
        addNutrient('Sucrose', ['Sucrose'], 'g', undefined, 2);
        addNutrient('Added Sugars', ['Added Sugars'], 'g', 'Sugars', 1);
        addNutrient('Sugar Alcohol', ['Sugar Alcohol'], 'g', undefined, 1);

        // Lipids
        output.push('Lipids');
        output.push('Amount');
        output.push('% DV');
        addNutrient('Fat', ['Fat', 'Total Fat'], 'g', 'Fat');
        addNutrient('Monounsaturated', ['Monounsaturated Fat', 'Monounsaturated'], 'g', undefined, 1);
        addNutrient('Polyunsaturated', ['Polyunsaturated Fat', 'Polyunsaturated'], 'g', undefined, 1);
        addNutrient('Omega-3', ['Omega-3'], 'g', undefined, 2);
        addNutrient('Omega-6', ['Omega-6'], 'g', undefined, 2);
        addNutrient('Saturated', ['Saturated Fat', 'Saturated'], 'g', 'Saturated Fat', 1);
        addNutrient('Trans-Fats', ['Trans Fat', 'Trans-Fats'], 'g', undefined, 1);
        addNutrient('Cholesterol', ['Cholesterol'], 'mg', 'Cholesterol');
        addNutrient('Phytosterol', ['Phytosterol'], 'mg');

        // Protein
        output.push('Protein');
        output.push('Amount');
        output.push('% DV');
        addNutrient('Protein', ['Protein'], 'g', 'Protein');
        const aminos = ['Alanine', 'Arginine', 'Aspartic acid', 'Cystine', 'Glutamic acid', 'Glycine', 'Histidine', 'Hydroxyproline', 'Isoleucine', 'Leucine', 'Lysine', 'Methionine', 'Phenylalanine', 'Proline', 'Serine', 'Threonine', 'Tryptophan', 'Tyrosine', 'Valine'];
        aminos.forEach(a => addNutrient(a, [a], 'g', undefined, 1));

        // Vitamins
        output.push('Vitamins');
        output.push('Amount');
        output.push('% DV');
        addNutrient('B1 (Thiamine)', ['B1 (Thiamine)', 'Thiamine'], 'mg', 'B1 (Thiamine)');
        addNutrient('B2 (Riboflavin)', ['B2 (Riboflavin)', 'Riboflavin'], 'mg', 'B2 (Riboflavin)');
        addNutrient('B3 (Niacin)', ['B3 (Niacin)', 'Niacin'], 'mg', 'B3 (Niacin)');
        addNutrient('B5 (Pantothenic Acid)', ['B5 (Pantothenic Acid)', 'Pantothenic Acid'], 'mg', 'B5 (Pantothenic Acid)');
        addNutrient('B6 (Pyridoxine)', ['B6 (Pyridoxine)', 'B6', 'Pyridoxine'], 'mg', 'B6 (Pyridoxine)');
        addNutrient('B12 (Cobalamin)', ['B12 (Cobalamin)', 'B12', 'Cobalamin'], 'µg', 'B12 (Cobalamin)');
        addNutrient('Biotin', ['Biotin', 'Vitamin B7'], 'µg', 'Biotin');
        addNutrient('Choline', ['Choline'], 'mg', 'Choline');
        addNutrient('Folate', ['Folate', 'Vitamin B9', 'B9 (Folate)'], 'µg', 'Folate');
        addNutrient('Vitamin A', ['Vitamin A'], 'µg', 'Vitamin A');
        addNutrient('Alpha-carotene', ['Alpha-carotene'], 'µg', undefined, 1);
        addNutrient('Beta-carotene', ['Beta-carotene'], 'µg', undefined, 1);
        addNutrient('Beta-cryptoxanthin', ['Beta-cryptoxanthin'], 'µg', undefined, 1);
        addNutrient('Lutein+Zeaxanthin', ['Lutein + Zeaxanthin', 'Lutein+Zeaxanthin'], 'µg', undefined, 1);
        addNutrient('Lycopene', ['Lycopene'], 'µg', undefined, 1);
        addNutrient('Retinol', ['Retinol'], 'µg', undefined, 1);
        addNutrient('Vitamin C', ['Vitamin C'], 'mg', 'Vitamin C');
        addNutrient('Vitamin D', ['Vitamin D'], 'IU', 'Vitamin D');
        addNutrient('Vitamin E', ['Vitamin E'], 'mg', 'Vitamin E');
        addNutrient('Beta Tocopherol', ['Beta Tocopherol'], 'mg', undefined, 1);
        addNutrient('Delta Tocopherol', ['Delta Tocopherol'], 'mg', undefined, 1);
        addNutrient('Gamma Tocopherol', ['Gamma Tocopherol'], 'mg', undefined, 1);
        addNutrient('Vitamin K', ['Vitamin K'], 'µg', 'Vitamin K');

        // Minerals
        output.push('Minerals');
        output.push('Amount');
        output.push('% DV');
        addNutrient('Calcium', ['Calcium'], 'mg', 'Calcium');
        addNutrient('Chromium', ['Chromium'], 'µg', 'Chromium');
        addNutrient('Copper', ['Copper'], 'mg', 'Copper');
        addNutrient('Fluoride', ['Fluoride'], 'µg', 'Fluoride');
        addNutrient('Iodine', ['Iodine'], 'µg', 'Iodine');
        addNutrient('Iron', ['Iron'], 'mg', 'Iron');
        addNutrient('Magnesium', ['Magnesium'], 'mg', 'Magnesium');
        addNutrient('Manganese', ['Manganese'], 'mg', 'Manganese');
        addNutrient('Molybdenum', ['Molybdenum'], 'µg', 'Molybdenum');
        addNutrient('Phosphorus', ['Phosphorus'], 'mg', 'Phosphorus');
        addNutrient('Potassium', ['Potassium'], 'mg', 'Potassium');
        addNutrient('Selenium', ['Selenium'], 'µg', 'Selenium');
        addNutrient('Sodium', ['Sodium'], 'mg', 'Sodium');
        addNutrient('Zinc', ['Zinc'], 'mg', 'Zinc');

        return output.join('\n');
    }, [nutrition]);

    const handleCopy = () => {
        navigator.clipboard.writeText(formattedText);
        setCopied(true);
        toast.success('Nutrient data copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([formattedText], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${recipeName.replace(/\s+/g, '_')}_nutrients.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <Download className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white italic">
                                Export Nutrients
                            </h2>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                            Format optimized for food database entry
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-full transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="relative group">
                        <pre className="w-full h-[50vh] p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-xs font-mono text-slate-600 dark:text-slate-400 overflow-auto whitespace-pre custom-scrollbar shadow-inner">
                            {formattedText}
                        </pre>

                        <div className="absolute top-4 right-4 flex gap-2">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-4 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                            >
                                {copied ? <ClipboardCheck size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied' : 'Copy Text'}
                            </button>
                        </div>
                    </div>

                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-relaxed">
                            <span className="opacity-50">Note:</span> This data represents the full calculated nutritional profile of "{recipeName}", normalized for copy-pasting into individual food creation forms. Values are based on a standard 2000 kcal reference diet.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-8 h-12 rounded-2xl text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleDownload}
                        className="px-8 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-xl"
                    >
                        Download .txt
                    </button>
                </div>
            </div>
        </div>
    );
}
