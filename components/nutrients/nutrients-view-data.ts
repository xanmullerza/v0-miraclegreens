import { Zap, Gem, Battery } from 'lucide-react';

export interface NutrientNode {
    id: string;
    label: string;
    unit: string;
    isParent?: boolean;
    children?: NutrientNode[];
    theme?: string;
}

export interface AccordionSection {
    id: string;
    label: string;
    subtitle: string;
    icon: any;
    theme: string;
    nutrients: NutrientNode[];
}

export const ACCORDION_SECTIONS: AccordionSection[] = [
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
