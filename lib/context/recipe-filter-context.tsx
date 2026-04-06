'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useUserPreferences } from './user-preferences-context';

export interface RecipeFilterState {
  selectedEquipment: string[];
  selectedDietType: string;
  selectedExclusions: string[];
  selectedHealthConditions: string[];
  pantryMode: 'all' | 'pantry-only'; // 'all' = show all but mark missing, 'pantry-only' = hide missing
  showFlavours: boolean;
  showSupplements: boolean;
  selectedDifficulty: string[];
  selectedTags: string[];
  onlyMyRecipes: boolean;
  showMixes: boolean;
  showRemixes: boolean;
  nutritionViewMode: 'per-serving' | 'total';
  servingsOverrides: Record<string, number>;
  globalServings: number | null;
}

interface RecipeFilterContextType {
  filters: RecipeFilterState;
  setFilters: (filters: RecipeFilterState) => void;
  updateFilter: (key: keyof RecipeFilterState, value: any) => void;
  resetToProfile: () => void;
  resetAllFilters: () => void;
  hasActiveFilters: boolean;
}

const RecipeFilterContext = createContext<RecipeFilterContextType | undefined>(
  undefined
);

export function RecipeFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, selectedServings, setSelectedServings } = useUserPreferences();
  const [filters, setFiltersState] = useState<RecipeFilterState>({
    selectedEquipment: [],
    selectedDietType: profile?.dietType || 'anything',
    selectedExclusions: profile?.exclusions || [],
    selectedHealthConditions: profile?.healthConditions || [],
    pantryMode: 'all',
    showFlavours: false,
    showSupplements: false,
    selectedDifficulty: [],
    selectedTags: [],
    onlyMyRecipes: false,
    showMixes: false,
    showRemixes: false,
    nutritionViewMode: 'per-serving',
    servingsOverrides: {},
    globalServings: selectedServings,
  });

  // Keep globalServings in sync when selectedServings changes (e.g. from Tracker)
  const prevSelectedServings = useRef(selectedServings);
  useEffect(() => {
    if (selectedServings !== prevSelectedServings.current) {
      prevSelectedServings.current = selectedServings;
      setFiltersState(prev => ({ ...prev, globalServings: selectedServings }));
    }
  }, [selectedServings]);

  // Wrapper: when globalServings changes, also write back to the shared context
  const setFilters = (newFilters: RecipeFilterState) => {
    if (newFilters.globalServings !== null && newFilters.globalServings !== undefined && newFilters.globalServings !== filters.globalServings) {
      prevSelectedServings.current = newFilters.globalServings;
      setSelectedServings(newFilters.globalServings);
    }
    setFiltersState(newFilters);
  };


  // Sync with profile changes
  useEffect(() => {
    setFiltersState((prev: RecipeFilterState) => ({
      ...prev,
      selectedDietType: profile?.dietType || 'anything',
      selectedExclusions: profile?.exclusions || [],
      selectedHealthConditions: profile?.healthConditions || [],
    }));
  }, [profile?.dietType, profile?.exclusions, profile?.healthConditions]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recipeFilterState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFiltersState((prev: RecipeFilterState) => ({
          ...prev,
          selectedEquipment: parsed.selectedEquipment || [],
          pantryMode: parsed.pantryMode || 'all',
          showFlavours: parsed.showFlavours || false,
          showSupplements: parsed.showSupplements || false,
          selectedDifficulty: parsed.selectedDifficulty || [],
          selectedTags: parsed.selectedTags || [],
          onlyMyRecipes: parsed.onlyMyRecipes || false,
          showMixes: parsed.showMixes || false,
          showRemixes: parsed.showRemixes || false,
          nutritionViewMode: parsed.nutritionViewMode || 'per-serving',
          servingsOverrides: parsed.servingsOverrides || {},
          globalServings: parsed.globalServings || null,
        }));

      } catch (e) {
        console.error('Failed to load recipe filters from localStorage', e);
      }
    }
  }, []);

  // Save to localStorage whenever filters change
  useEffect(() => {
    localStorage.setItem(
      'recipeFilterState',
      JSON.stringify({
        selectedEquipment: filters.selectedEquipment,
        pantryMode: filters.pantryMode,
        showFlavours: filters.showFlavours,
        showSupplements: filters.showSupplements,
        selectedDifficulty: filters.selectedDifficulty,
        selectedTags: filters.selectedTags,
        onlyMyRecipes: filters.onlyMyRecipes,
        showMixes: filters.showMixes,
        showRemixes: filters.showRemixes,
        nutritionViewMode: filters.nutritionViewMode,
        servingsOverrides: filters.servingsOverrides,
        globalServings: filters.globalServings,
      })
    );
  }, [filters.selectedEquipment, filters.pantryMode, filters.showFlavours, filters.showSupplements, filters.onlyMyRecipes, filters.showMixes, filters.showRemixes, filters.nutritionViewMode, filters.servingsOverrides, filters.globalServings]);


  const updateFilter = (key: keyof RecipeFilterState, value: any) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
  };

  const resetToProfile = () => {
    setFilters({
      selectedEquipment: [],
      selectedDietType: profile?.dietType || 'anything',
      selectedExclusions: profile?.exclusions || [],
      selectedHealthConditions: profile?.healthConditions || [],
      pantryMode: 'all',
      showFlavours: false,
      showSupplements: false,
      selectedDifficulty: [],
      selectedTags: [],
      onlyMyRecipes: false,
      showMixes: false,
      showRemixes: false,
      nutritionViewMode: 'per-serving',
      servingsOverrides: {},
      globalServings: null,
    });
  };

  const resetAllFilters = () => {
    setFilters({
      selectedEquipment: [],
      selectedDietType: 'anything',
      selectedExclusions: [],
      selectedHealthConditions: [],
      pantryMode: 'all',
      showFlavours: false,
      showSupplements: false,
      selectedDifficulty: [],
      selectedTags: [],
      onlyMyRecipes: false,
      showMixes: false,
      showRemixes: false,
      nutritionViewMode: 'per-serving',
      servingsOverrides: {},
      globalServings: null,
    });
  };


  const hasActiveFilters =
    filters.selectedEquipment.length > 0 ||
    filters.selectedExclusions.length > 0 ||
    filters.selectedHealthConditions.length > 0 ||
    filters.pantryMode === 'pantry-only' ||
    filters.showFlavours ||
    filters.selectedDifficulty.length > 0 ||
    filters.selectedTags.length > 0 ||
    filters.onlyMyRecipes ||
    filters.showMixes ||
    filters.showRemixes;


  return (
    <RecipeFilterContext.Provider
      value={{
        filters,
        setFilters,
        updateFilter,
        resetToProfile,
        resetAllFilters,
        hasActiveFilters,
      }}
    >
      {children}
    </RecipeFilterContext.Provider>
  );
}

export function useRecipeFilter(): RecipeFilterContextType {
  const context = useContext(RecipeFilterContext);
  if (!context) {
    throw new Error(
      'useRecipeFilter must be used within RecipeFilterProvider'
    );
  }
  return context;
}
