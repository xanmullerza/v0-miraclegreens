import React from 'react';
import { Calendar, ShoppingBasket, Shapes, Zap, Plus, Upload, Download, Book } from 'lucide-react';

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
    },
    {
        id: 'cookbook',
        label: 'Library',
        icon: <Book size={12} className="text-indigo-500" />,
        onClick: () => navigateTo('recipes')
    }
];

export const getCookbookNavOptions = (navigateTo: (v: any) => void) => [
    {
        id: 'create',
        label: 'Create',
        icon: <Plus size={12} className="text-emerald-500" />,
        onClick: () => navigateTo('recipe-builder')
    },
    {
        id: 'import',
        label: 'Import',
        icon: <Upload size={12} className="text-blue-500" />,
        onClick: () => navigateTo('import')
    },
    {
        id: 'export',
        label: 'Export',
        icon: <Download size={12} className="text-amber-500" />,
        onClick: () => navigateTo('export-recipes')
    }
];
