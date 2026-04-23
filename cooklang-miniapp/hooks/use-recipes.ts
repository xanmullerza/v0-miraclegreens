"use client";

import { useCallback, useEffect, useState } from "react";
import type { ParsedRecipe } from "@/lib/cooklang-parser";
import type { SavedRecipe } from "@/components/saved-recipes";

const STORAGE_KEY = "cooklang-recipes";

export function useRecipes() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load recipes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecipes(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load recipes:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever recipes change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
      } catch (error) {
        console.error("Failed to save recipes:", error);
      }
    }
  }, [recipes, isLoaded]);

  const saveRecipe = useCallback(
    (recipe: ParsedRecipe, filename?: string): string => {
      const id = crypto.randomUUID();
      const saved: SavedRecipe = {
        id,
        recipe,
        savedAt: new Date().toISOString(),
        filename,
      };
      setRecipes((prev) => [saved, ...prev]);
      return id;
    },
    []
  );

  const deleteRecipe = useCallback((id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const isRecipeSaved = useCallback(
    (recipe: ParsedRecipe): string | null => {
      // Check if a recipe with the same title exists
      const found = recipes.find(
        (r) => r.recipe.metadata.title === recipe.metadata.title
      );
      return found?.id || null;
    },
    [recipes]
  );

  return {
    recipes,
    isLoaded,
    saveRecipe,
    deleteRecipe,
    isRecipeSaved,
  };
}
