import { Activity } from 'lucide-react';
import { NutrientGrid } from './NutrientGrid';

interface ExtraMarkersSectionProps {
    getVal: (keys: string[]) => number;
    food?: any;
    setBreakdownNutrient?: (nutrient: string | null) => void;
    nutrientDisplayMode?: string;
    userRDAs?: Record<string, number>;
    energyUnit?: string;
    dailyTargets?: { energy: number; protein: number; carbs: number; fat: number };
}

export function ExtraMarkersSection({ 
    getVal, 
    food, 
    setBreakdownNutrient, 
    nutrientDisplayMode, 
    userRDAs,
    energyUnit,
    dailyTargets 
}: ExtraMarkersSectionProps) {
    return (
        <NutrientGrid
            title="Extra Markers"
            icon={Activity}
            theme="amber"
            subtitle="Extra health markers worth tracking"
            forceRaw={true}
            items={{
                'Fiber': ['Fiber', 'fiber_g'],
                'Sugars': ['Sugars', 'sugars_g'],
                'Oxalate': ['Oxalate', 'oxalate_mg'],
                'Cholesterol': ['Cholesterol', 'cholesterol_mg'],
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
