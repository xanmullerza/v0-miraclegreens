"use client";

import { useState } from "react";
import { Globe, BookOpen, CalendarDays } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecipeDisplay } from "@/components/recipe-display";
import { SavedRecipes, type SavedRecipe } from "@/components/saved-recipes";
import { AllRecipes } from "@/components/all-recipes";
import { MealPlanner } from "@/components/meal-planner";
import { parseCooklang, type ParsedRecipe } from "@/lib/cooklang-parser";
import { useRecipes } from "@/hooks/use-recipes";
import { toast } from "sonner";

interface RecipesSectionProps {
  onRequestCooklang?: () => void;
  pendingRecipe?: { content: string; filename?: string } | null;
  onPendingRecipeProcessed?: () => void;
}

export function RecipesSection({
  pendingRecipe,
  onPendingRecipeProcessed,
}: RecipesSectionProps) {
  const [currentRecipe, setCurrentRecipe] = useState<{
    recipe: ParsedRecipe;
    filename?: string;
  } | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<SavedRecipe | null>(null);
  const [activeTab, setActiveTab] = useState("my-recipes");

  const { recipes, isLoaded, saveRecipe, deleteRecipe, isRecipeSaved } =
    useRecipes();

  // Process pending recipe from dialog
  if (pendingRecipe && onPendingRecipeProcessed) {
    try {
      const parsed = parseCooklang(pendingRecipe.content);
      setCurrentRecipe({ recipe: parsed, filename: pendingRecipe.filename });
      setViewingRecipe(null);
      setActiveTab("my-recipes");
      toast.success("Recipe parsed successfully!");
    } catch {
      toast.error("Failed to parse recipe. Please check the Cooklang syntax.");
    }
    onPendingRecipeProcessed();
  }

  const handleSaveRecipe = () => {
    const recipeToSave = currentRecipe?.recipe || viewingRecipe?.recipe;
    if (recipeToSave) {
      const existingId = isRecipeSaved(recipeToSave);
      if (existingId) {
        toast.info("Recipe is already saved!");
        return;
      }
      saveRecipe(recipeToSave, currentRecipe?.filename);
      toast.success("Recipe saved to My Recipes!");
    }
  };

  const handleViewSavedRecipe = (saved: SavedRecipe) => {
    setViewingRecipe(saved);
    setCurrentRecipe(null);
  };

  const handleDeleteRecipe = (id: string) => {
    deleteRecipe(id);
    if (viewingRecipe?.id === id) {
      setViewingRecipe(null);
    }
    toast.success("Recipe removed from My Recipes");
  };

  const handleCloseRecipe = () => {
    setCurrentRecipe(null);
    setViewingRecipe(null);
  };

  const displayedRecipe = viewingRecipe?.recipe || currentRecipe?.recipe;
  const savedId = displayedRecipe ? isRecipeSaved(displayedRecipe) : null;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-recipes" className="gap-1.5 text-xs sm:text-sm">
            <Globe className="size-4 shrink-0" />
            <span className="hidden sm:inline">All Recipes</span>
            <span className="sm:hidden">All</span>
          </TabsTrigger>
          <TabsTrigger value="my-recipes" className="gap-1.5 text-xs sm:text-sm">
            <BookOpen className="size-4 shrink-0" />
            <span className="hidden sm:inline">My Recipes</span>
            <span className="sm:hidden">Mine</span>
          </TabsTrigger>
          <TabsTrigger value="my-meals" className="gap-1.5 text-xs sm:text-sm">
            <CalendarDays className="size-4 shrink-0" />
            <span className="hidden sm:inline">My Meals</span>
            <span className="sm:hidden">Meals</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-recipes" className="mt-4">
          <AllRecipes />
        </TabsContent>

        <TabsContent value="my-recipes" className="mt-4">
          {displayedRecipe ? (
            <RecipeDisplay
              recipe={displayedRecipe}
              onSave={handleSaveRecipe}
              onClose={handleCloseRecipe}
              isSaved={!!savedId}
            />
          ) : (
            isLoaded && (
              <SavedRecipes
                recipes={recipes}
                onView={handleViewSavedRecipe}
                onDelete={handleDeleteRecipe}
              />
            )
          )}
        </TabsContent>

        <TabsContent value="my-meals" className="mt-4">
          <MealPlanner />
        </TabsContent>
      </Tabs>
    </div>
  );
}
