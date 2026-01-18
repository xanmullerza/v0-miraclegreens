
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const getFallbackRDAs = (uAge: number, uGender: 'male' | 'female', uCalories: number) => {
    // Base RDAs (Female 19-30) - Defaults for Adults
    let rdas: Record<string, number> = {
        'Potassium': 2600,
        'Magnesium': 310,
        'Calcium': 1000,
        'Phosphorus': 700,
        'Sodium': 1500,
        'Iron': 18,
        'Zinc': 8,
        'Selenium': 55,
        'Copper': 0.9,
        'Manganese': 1.8,
        'Vitamin A': 700,
        'Vitamin C': 75,
        'Vitamin D': 600,
        'Vitamin E': 15,
        'Vitamin K': 90,
        'B1 (Thiamine)': 1.1,
        'B2 (Riboflavin)': 1.1,
        'B3 (Niacin)': 14,
        'B5 (Pantothenic Acid)': 5,
        'B6 (Pyridoxine)': 1.3,
        'B7 (Biotin)': 30,
        'B9 (Folate)': 400,
        'B12 (Cobalamin)': 2.4,
        'Choline': 425,
        'Fiber': (uCalories / 1000) * 14
    };

    // --- Child Logic (Overrides Base) ---
    if (uAge <= 3) {
        // Toddlers (1-3)
        rdas = {
            ...rdas,
            'Potassium': 2000, 'Magnesium': 80, 'Calcium': 700, 'Phosphorus': 460, 'Sodium': 800,
            'Iron': 7, 'Zinc': 3, 'Selenium': 20, 'Copper': 0.34, 'Manganese': 1.2,
            'Vitamin A': 300, 'Vitamin C': 15, 'Vitamin D': 600, 'Vitamin E': 6, 'Vitamin K': 30,
            'B1 (Thiamine)': 0.5, 'B2 (Riboflavin)': 0.5, 'B3 (Niacin)': 6, 'B5 (Pantothenic Acid)': 2,
            'B6 (Pyridoxine)': 0.5, 'B7 (Biotin)': 8, 'B9 (Folate)': 150, 'B12 (Cobalamin)': 0.9,
            'Choline': 200, 'Fiber': 19
        };
    } else if (uAge <= 8) {
        // Children (4-8)
        rdas = {
            ...rdas,
            'Potassium': 2300, 'Magnesium': 130, 'Calcium': 1000, 'Phosphorus': 500, 'Sodium': 1000,
            'Iron': 10, 'Zinc': 5, 'Selenium': 30, 'Copper': 0.44, 'Manganese': 1.5,
            'Vitamin A': 400, 'Vitamin C': 25, 'Vitamin D': 600, 'Vitamin E': 7, 'Vitamin K': 55,
            'B1 (Thiamine)': 0.6, 'B2 (Riboflavin)': 0.6, 'B3 (Niacin)': 8, 'B5 (Pantothenic Acid)': 3,
            'B6 (Pyridoxine)': 0.6, 'B7 (Biotin)': 12, 'B9 (Folate)': 200, 'B12 (Cobalamin)': 1.2,
            'Choline': 250, 'Fiber': 25
        };
    } else if (uAge <= 13) {
        // Children (9-13)
        rdas = {
            ...rdas,
            'Potassium': 2500, 'Magnesium': 240, 'Calcium': 1300, 'Phosphorus': 1250, 'Sodium': 1200,
            'Iron': 8, 'Zinc': 8, 'Selenium': 40, 'Copper': 0.7, 'Manganese': 1.9,
            'Vitamin A': 600, 'Vitamin C': 45, 'Vitamin D': 600, 'Vitamin E': 11, 'Vitamin K': 60,
            'B1 (Thiamine)': 0.9, 'B2 (Riboflavin)': 0.9, 'B3 (Niacin)': 12, 'B5 (Pantothenic Acid)': 4,
            'B6 (Pyridoxine)': 1.0, 'B7 (Biotin)': 20, 'B9 (Folate)': 300, 'B12 (Cobalamin)': 1.8,
            'Choline': 375, 'Fiber': (uCalories / 1000) * 14
        };
    } else if (uAge <= 18) {
        // Teens (14-18)
        rdas['Calcium'] = 1300;
        rdas['Phosphorus'] = 1250;
        if (uGender === 'male') {
            rdas['Magnesium'] = 410; rdas['Iron'] = 11; rdas['Zinc'] = 11; rdas['Vitamin A'] = 900; rdas['Vitamin C'] = 75;
        } else {
            rdas['Magnesium'] = 360; rdas['Iron'] = 15; rdas['Zinc'] = 9; rdas['Vitamin A'] = 700; rdas['Vitamin C'] = 65;
        }
    }

    // --- Adult Logic (19+) ---
    else {
        if (uGender === 'male') {
            rdas['Potassium'] = 3400;
            rdas['Magnesium'] = 400;
            rdas['Iron'] = 8;
            rdas['Zinc'] = 11;
            rdas['Manganese'] = 2.3;
            rdas['Vitamin A'] = 900;
            rdas['Vitamin C'] = 90;
            rdas['Vitamin K'] = 120;
            rdas['B1 (Thiamine)'] = 1.2;
            rdas['B2 (Riboflavin)'] = 1.3;
            rdas['B3 (Niacin)'] = 16;
            rdas['Choline'] = 550;
        }

        if (uAge > 50) {
            rdas['Calcium'] = 1200;
            rdas['B6 (Pyridoxine)'] = uGender === 'male' ? 1.7 : 1.5;
            if (uGender === 'female') rdas['Iron'] = 8;
        }
    }

    return rdas;
};

export const useRDA = (age: number | undefined, gender: 'male' | 'female' | undefined, calories: number) => {
    const [rdas, setRdas] = useState<Record<string, number> | null>(null);

    useEffect(() => {
        if (!age || !gender || !calories) return;

        let isMounted = true;

        const fetchRDAs = async () => {
            try {
                // Try to fetch from DB
                // We use gender.eq.both OR gender.eq.{gender} to match
                const { data, error } = await supabase
                    .from('dietary_reference_intakes')
                    .select('nutrient, value')
                    .lte('min_age', age)
                    .gte('max_age', age)
                    .or(`gender.eq.both,gender.eq.${gender}`);

                if (error || !data || data.length === 0) {
                    if (isMounted) {
                        // If DB call fails or returns empty, use fallback
                        console.warn('Falling back to hardcoded RDAs due to:', error?.message || 'No data found');
                        setRdas(getFallbackRDAs(age, gender, calories));
                    }
                    return;
                }

                // If success, map to object
                const rdaMap: Record<string, number> = {};
                data.forEach((row: any) => {
                    rdaMap[row.nutrient] = Number(row.value);
                });

                // Ensure Fiber is handled if missing from DB response but present in fallback logic
                if (!rdaMap['Fiber']) {
                    // Default fiber calc if not in DB
                    rdaMap['Fiber'] = (calories / 1000) * 14;
                }

                if (isMounted) {
                    setRdas(rdaMap);
                }

            } catch (err) {
                console.error("Error fetching RDA:", err);
                if (isMounted) {
                    setRdas(getFallbackRDAs(age, gender, calories));
                }
            }
        };

        fetchRDAs();

        return () => { isMounted = false; };
    }, [age, gender, calories]);

    return rdas;
};
