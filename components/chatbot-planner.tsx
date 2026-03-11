'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface MealPlanItem {
    id: string;
    date: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    recipe_name: string;
    servings: number;
}

interface ChatbotPlannerProps {
    onBack?: () => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export function ChatbotPlanner({ onBack }: ChatbotPlannerProps) {
    const [currentWeek, setCurrentWeek] = useState(getWeekStart(new Date()));
    const [meals, setMeals] = useState<MealPlanItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | null>(null);
    const [newMealName, setNewMealName] = useState('');

    useEffect(() => {
        loadMeals();
    }, [currentWeek]);

    function getWeekStart(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    const loadMeals = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id) return;

            const weekEnd = new Date(currentWeek);
            weekEnd.setDate(weekEnd.getDate() + 6);

            const { data, error } = await supabase
                .from('meal_plan')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', currentWeek.toISOString().split('T')[0])
                .lte('date', weekEnd.toISOString().split('T')[0])
                .order('date', { ascending: true });

            if (error) throw error;
            setMeals(data || []);
        } catch (error) {
            console.error('Error loading meals:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addMeal = async () => {
        if (!selectedDay || !selectedMealType || !newMealName.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.id) return;

            const { data, error } = await supabase
                .from('meal_plan')
                .insert([{
                    user_id: user.id,
                    date: selectedDay,
                    meal_type: selectedMealType,
                    recipe_name: newMealName.trim(),
                    servings: 1,
                }])
                .select()
                .single();

            if (error) throw error;
            setMeals(prev => [...prev, data]);
            setNewMealName('');
            setSelectedDay(null);
            setSelectedMealType(null);
            toast.success('Meal added');
        } catch (error: any) {
            toast.error(error.message || 'Failed to add meal');
        }
    };

    const deleteMeal = async (id: string) => {
        try {
            const { error } = await supabase
                .from('meal_plan')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMeals(prev => prev.filter(meal => meal.id !== id));
            toast.success('Meal removed');
        } catch (error) {
            console.error('Error deleting meal:', error);
        }
    };

    const getMealsForDay = (date: string) => {
        return meals.filter(meal => meal.date === date);
    };

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeek);
        date.setDate(date.getDate() + i);
        return date;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-slate-500 dark:text-slate-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Header with Navigation */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 dark:text-white">Meal Planner</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                            <ChevronLeft size={16} className="text-slate-600 dark:text-slate-400" />
                        </button>
                        <span className="text-xs text-slate-500 dark:text-slate-400 min-w-[80px] text-center">
                            {currentWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <button
                            onClick={() => setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                            <ChevronRight size={16} className="text-slate-600 dark:text-slate-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Meal Plan Grid */}
            <div className="flex-1 overflow-x-auto p-4">
                <div className="space-y-3 min-w-full">
                    {weekDays.map(date => {
                        const dateStr = date.toISOString().split('T')[0];
                        const dayMeals = getMealsForDay(dateStr);
                        
                        return (
                            <div key={dateStr} className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700">
                                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                                        {DAYS[date.getDay()]} - {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>

                                <div className="p-3 space-y-2 bg-white dark:bg-slate-900">
                                    {dayMeals.length === 0 ? (
                                        <p className="text-xs text-slate-400">No meals planned</p>
                                    ) : (
                                        dayMeals.map(meal => (
                                            <div key={meal.id} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                                                <div>
                                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 capitalize">
                                                        {meal.meal_type}
                                                    </p>
                                                    <p className="text-sm text-slate-900 dark:text-white">
                                                        {meal.recipe_name}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => deleteMeal(meal.id)}
                                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                    <button
                                        onClick={() => setSelectedDay(dateStr)}
                                        className="w-full mt-2 px-2 py-1.5 rounded text-xs font-medium text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 border border-pink-200 dark:border-pink-800 transition-colors"
                                    >
                                        + Add Meal
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add Meal Modal */}
            {selectedDay && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 max-w-sm w-full space-y-4">
                        <h4 className="font-bold text-slate-900 dark:text-white">
                            Add Meal for {new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </h4>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Meal Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {MEAL_TYPES.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedMealType(type as any)}
                                        className={cn(
                                            'px-3 py-2 rounded text-xs font-medium capitalize transition-colors',
                                            selectedMealType === type
                                                ? 'bg-pink-500 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <input
                            type="text"
                            value={newMealName}
                            onChange={(e) => setNewMealName(e.target.value)}
                            placeholder="Meal name..."
                            className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setSelectedDay(null);
                                    setSelectedMealType(null);
                                    setNewMealName('');
                                }}
                                className="flex-1 px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addMeal}
                                className="flex-1 px-3 py-2 rounded-lg bg-pink-500 text-white text-sm font-medium hover:bg-pink-600 transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function cn(...classes: (string | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}
