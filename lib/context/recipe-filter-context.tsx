'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const { profile } = useUserPreferences();
  const [filters, setFilters] = useState<RecipeFilterState>({
    selectedEquipment: [],
    selectedDietType: profile?.dietType || 'anything',
    selectedExclusions: profile?.exclusions || [],
    selectedHealthConditions: profile?.healthConditions || [],
    pantryMode: 'all',
    showFlavours: false,
    showSupplements: false,
    selectedDifficulty: [],
    selectedTags: [],
  });

  // Sync with profile changes
  useEffect(() => {
    setFilters((prev) => ({
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
        setFilters((prev) => ({
          ...prev,
          selectedEquipment: parsed.selectedEquipment || [],
          pantryMode: parsed.pantryMode || 'all',
          showFlavours: parsed.showFlavours || false,
          showSupplements: parsed.showSupplements || false,
          selectedDifficulty: parsed.selectedDifficulty || [],
          selectedTags: parsed.selectedTags || [],
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
      })
    );
  }, [filters.selectedEquipment, filters.pantryMode, filters.showFlavours, filters.showSupplements]);

  const updateFilter = (key: keyof RecipeFilterState, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
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
    });
  };

  const hasActiveFilters =
    filters.selectedEquipment.length > 0 ||
    filters.selectedExclusions.length > 0 ||
    filters.selectedHealthConditions.length > 0 ||
    filters.pantryMode === 'pantry-only' ||
    filters.showFlavours ||
    filters.selectedDifficulty.length > 0 ||
    filters.selectedTags.length > 0;

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
