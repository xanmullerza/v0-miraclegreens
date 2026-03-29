'use client';

import React, { createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';

interface FoodFilterContextType {
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (value: boolean) => void;
  selectedCategories: string[];
  setSelectedCategories: Dispatch<SetStateAction<string[]>>;
  resetFoodFilters: () => void;
}

const FoodFilterContext = createContext<FoodFilterContextType | undefined>(undefined);

export function FoodFilterProvider({ children }: { children: ReactNode }) {
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const resetFoodFilters = () => {
    setShowFavoritesOnly(false);
    setSelectedCategories([]);
  };

  return (
    <FoodFilterContext.Provider
      value={{
        showFavoritesOnly,
        setShowFavoritesOnly,
        selectedCategories,
        setSelectedCategories,
        resetFoodFilters,
      }}
    >
      {children}
    </FoodFilterContext.Provider>
  );
}

export function useFoodFilter() {
  const context = useContext(FoodFilterContext);
  if (context === undefined) {
    throw new Error('useFoodFilter must be used within a FoodFilterProvider');
  }
  return context;
}
