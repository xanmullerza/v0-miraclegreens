"use client";

import { Clock, Users, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { BookOpen } from "lucide-react";
import type { ParsedRecipe } from "@/lib/cooklang-parser";

export interface SavedRecipe {
  id: string;
  recipe: ParsedRecipe;
  savedAt: string;
  filename?: string;
}

interface SavedRecipesProps {
  recipes: SavedRecipe[];
  onView: (recipe: SavedRecipe) => void;
  onDelete: (id: string) => void;
}

export function SavedRecipes({ recipes, onView, onDelete }: SavedRecipesProps) {
  if (recipes.length === 0) {
    return (
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg">My Recipes</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookOpen className="size-5" />
              </EmptyMedia>
              <EmptyTitle>No saved recipes yet</EmptyTitle>
              <EmptyDescription>
                Tap the + button to add a recipe using Cooklang format
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-lg">My Recipes ({recipes.length})</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="grid gap-3 sm:gap-4">
          {recipes.map((saved) => {
            const { recipe } = saved;
            const title = recipe.metadata.title || "Untitled Recipe";
            const tags = Array.isArray(recipe.metadata.tags) ? recipe.metadata.tags : undefined;

            return (
              <div
                key={saved.id}
                className="group relative flex flex-col rounded-lg border bg-card p-3 transition-shadow hover:shadow-md sm:p-4"
              >
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold leading-tight text-balance text-sm sm:text-base">{title}</h4>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {recipe.metadata.servings && (
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {recipe.metadata.servings}
                      </span>
                    )}
                    {recipe.metadata.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {recipe.metadata.time}
                      </span>
                    )}
                    <span>{recipe.ingredients.length} ingredients</span>
                  </div>

                  {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => onView(saved)}
                  >
                    <Eye className="size-3.5" />
                    View Recipe
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(saved.id)}
                  >
                    <Trash2 className="size-3.5" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
