import { Dna } from 'lucide-react';
import { NutrientGrid } from './NutrientGrid';

interface BiologicalRatiosSectionProps {
    getVal: (keys: string[]) => number;
    food?: any;
    setBreakdownNutrient?: (nutrient: string | null) => void;
    nutrientDisplayMode?: string;
    userRDAs?: Record<string, number>;
    energyUnit?: string;
    dailyTargets?: { energy: number; protein: number; carbs: number; fat: number };
}

export function BiologicalRatiosSection({ 
    getVal, 
    food, 
    setBreakdownNutrient, 
    nutrientDisplayMode, 
    userRDAs,
    energyUnit,
    dailyTargets 
}: BiologicalRatiosSectionProps) {
    return (
        <NutrientGrid
            title="Biological Ratios"
            icon={Dna}
            theme="amber"
            subtitle="Key nutrient balances for a healthy body"
            items={{
                'Sodium & Potassium': ['Sodium', 'Potassium'],
                'Zinc & Copper': ['Zinc', 'Copper'],
                'Omega 3 to 6 ratio': ['Omega-6', 'Omega-3'],
                'Calcium & Magnesium': ['Calcium', 'Magnesium'],
                'Calcium & Phosphorus': ['Calcium', 'Phosphorus'],
            }}
            food={food}
            getVal={getVal}
            setBreakdownNutrient={setBreakdownNutrient}
            nutrientDisplayMode={nutrientDisplayMode}
            userRDAs={userRDAs}
            energyUnit={energyUnit}
            dailyTargets={dailyTargets}
        />
    );
}
