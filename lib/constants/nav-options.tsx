import React from 'react';
import { Calendar, ShoppingBasket, Shapes, Zap } from 'lucide-react';

export const getSharedNavOptions = (navigateTo: (v: any) => void, onSubViewChange?: (v: any) => void) => [
    {
        id: 'planner',
        label: 'Planner',
        icon: <Calendar size={12} />,
        onClick: () => { navigateTo('planner'); onSubViewChange?.(null); }
    },
    {
        id: 'shopping',
        label: 'Shopping',
        icon: <ShoppingBasket size={12} className="text-amber-500" />,
        onClick: () => onSubViewChange?.('shopping')
    },
    {
        id: 'pantry',
        label: 'Pantry',
        icon: <Shapes size={12} className="text-sky-500" />,
        onClick: () => onSubViewChange?.('pantry')
    },
    {
        id: 'nutridex',
        label: 'Nutridex',
        icon: <Zap size={12} className="text-emerald-500" />,
        onClick: () => navigateTo('nutridex')
    }
];
