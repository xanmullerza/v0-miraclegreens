export const getNutrientLevelStyles = (percentage: number, label?: string) => {
    const l = label?.toLowerCase() || '';
    const isLimit = l.includes('sugar');
    const isStrictCurve = l.includes('sodium') || l.includes('vitamin d');
    const isAbundance = l.includes('potassium') || l.includes('iron') || l.includes('vitamin a');

    let color: 'green' | 'emerald' | 'blue' | 'yellow' | 'orange' | 'red' = 'red';

    if (isLimit) {
        if (percentage <= 50) color = 'green';
        else if (percentage <= 75) color = 'blue';
        else if (percentage <= 90) color = 'yellow';
        else if (percentage <= 100) color = 'orange';
        else color = 'red';
    } else if (isAbundance) {
        if (percentage >= 150) color = 'emerald';
        else if (percentage >= 120) color = 'emerald';
        else if (percentage >= 100) color = 'green';
        else if (percentage >= 70) color = 'blue';
        else if (percentage >= 50) color = 'yellow';
        else if (percentage >= 35) color = 'orange';
        else color = 'red';
    } else if (isStrictCurve) {
        if (percentage > 200) color = 'red';
        else if (percentage > 150) color = 'orange';
        else if (percentage > 120) color = 'yellow';
        else if (percentage >= 100) color = 'green';
        else if (percentage >= 70) color = 'blue';
        else if (percentage >= 50) color = 'yellow';
        else if (percentage >= 35) color = 'orange';
        else color = 'red';
    } else {
        if (percentage >= 150) color = 'emerald';
        else if (percentage >= 100) color = 'green';
        else if (percentage >= 70) color = 'blue';
        else if (percentage >= 50) color = 'yellow';
        else if (percentage >= 35) color = 'orange';
        else color = 'red';
    }

    const map = {
        emerald: { bg: 'bg-emerald-800', border: 'border-emerald-800', borderLight: 'border-emerald-800/30 dark:border-emerald-400/20', text: 'text-emerald-900 dark:text-emerald-400', textFill: 'text-white', fade: 'bg-emerald-50 dark:bg-emerald-950/20' },
        green: { bg: 'bg-green-700', border: 'border-green-700', borderLight: 'border-green-700/30 dark:border-green-400/20', text: 'text-green-800 dark:text-green-400', textFill: 'text-white', fade: 'bg-green-50 dark:bg-green-950/20' },
        blue: { bg: 'bg-blue-700', border: 'border-blue-700', borderLight: 'border-blue-700/30 dark:border-blue-400/20', text: 'text-blue-800 dark:text-blue-400', textFill: 'text-white', fade: 'bg-blue-50 dark:bg-blue-950/20' },
        yellow: { bg: 'bg-amber-500', border: 'border-amber-500', borderLight: 'border-amber-500/30 dark:border-amber-400/20', text: 'text-amber-800 dark:text-amber-400', textFill: 'text-white', fade: 'bg-amber-50 dark:bg-amber-950/20' },
        orange: { bg: 'bg-orange-700', border: 'border-orange-700', borderLight: 'border-orange-700/30 dark:border-orange-400/20', text: 'text-orange-800 dark:text-orange-400', textFill: 'text-white', fade: 'bg-orange-50 dark:bg-orange-950/20' },
        red: { bg: 'bg-red-700', border: 'border-red-700', borderLight: 'border-red-700/30 dark:border-red-400/20', text: 'text-red-800 dark:text-red-400', textFill: 'text-white', fade: 'bg-red-50 dark:bg-red-950/20' },
    };

    return map[color] || map.red;
};
