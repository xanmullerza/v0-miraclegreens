"use client";

import Image from "next/image";
import { Clock, Users, ChefHat, Timer, Utensils, Bookmark, X, Info, Apple } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ParsedRecipe, StepToken } from "@/lib/cooklang-parser";

interface RecipeDisplayProps {
  recipe: ParsedRecipe;
  onSave?: () => void;
  onClose?: () => void;
  isSaved?: boolean;
}

function TokenRenderer({ tokens }: { tokens: StepToken[] }) {
  return (
    <span>
      {tokens.map((token, index) => {
        switch (token.type) {
          case "ingredient":
            return (
              <span
                key={index}
                className="inline-flex items-baseline gap-1 font-medium text-amber-700 dark:text-amber-400"
              >
                <span className="underline decoration-amber-400/50 decoration-2 underline-offset-2">
                  {token.value}
                </span>
              </span>
            );
          case "cookware":
            return (
              <span
                key={index}
                className="inline-flex items-baseline gap-1 font-medium text-blue-700 dark:text-blue-400"
              >
                <span className="underline decoration-blue-400/50 decoration-2 underline-offset-2">
                  {token.value}
                </span>
              </span>
            );
          case "timer":
            return (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                <Timer className="size-3" />
                {token.value}
              </span>
            );
          default:
            return <span key={index}>{token.value}</span>;
        }
      })}
    </span>
  );
}

function isValidImageUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  // Check if it's a valid URL or relative path
  try {
    // Check for common image extensions
    if (/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(url)) return true;
    // Check if it's a valid URL
    new URL(url);
    return true;
  } catch {
    // Not a valid absolute URL, check if it looks like a relative path
    return url.startsWith("/") || url.startsWith("./") || url.startsWith("http");
  }
}

export function RecipeDisplay({ recipe, onSave, onClose, isSaved }: RecipeDisplayProps) {
  const { metadata, sections, ingredients, cookware } = recipe;
  const title = metadata.title || "Untitled Recipe";

  // Extract metadata fields for Information tab
  const description = metadata.description as string | undefined;
  const notes = metadata.notes as string | string[] | undefined;
  const source = metadata.source;
  const author = metadata.author;
  const tags = Array.isArray(metadata.tags) ? metadata.tags : undefined;
  const servings = metadata.servings;
  const time = metadata.time;
  const prepTime = metadata.prep_time || metadata.prepTime;
  const cookTime = metadata.cook_time || metadata.cookTime;
  const difficulty = metadata.difficulty;
  const cuisine = metadata.cuisine;
  const category = metadata.category;
  
  // Extract image - can be 'image', 'photo', or 'picture'
  const imageUrl = metadata.image || metadata.photo || metadata.picture;
  const hasValidImage = isValidImageUrl(imageUrl);
  
  // Check for nutrition data - can be nested object or flat keys starting with nutrition_
  let nutrition: Record<string, string | number> | undefined;
  if (metadata.nutrition && typeof metadata.nutrition === "object") {
    nutrition = metadata.nutrition as Record<string, string | number>;
  } else {
    // Check for flat nutrition keys like nutrition_calories, calories, protein, etc.
    const nutritionKeys = ["calories", "protein", "carbs", "carbohydrates", "fat", "fiber", "sugar", "sodium", "cholesterol"];
    const foundNutrition: Record<string, string | number> = {};
    for (const key of Object.keys(metadata)) {
      const lowerKey = key.toLowerCase();
      if (nutritionKeys.some(nk => lowerKey === nk || lowerKey === `nutrition_${nk}`)) {
        const displayKey = lowerKey.replace("nutrition_", "");
        foundNutrition[displayKey] = metadata[key] as string | number;
      }
    }
    if (Object.keys(foundNutrition).length > 0) {
      nutrition = foundNutrition;
    }
  }

  // Collect "other" metadata that isn't shown elsewhere
  const knownKeys = new Set([
    "title", "description", "notes", "source", "author", "tags", 
    "servings", "time", "prep_time", "prepTime", "cook_time", "cookTime",
    "difficulty", "cuisine", "category", "nutrition", "image", "photo", "picture",
    "calories", "protein", "carbs", "carbohydrates", "fat", "fiber", "sugar", "sodium", "cholesterol"
  ]);
  const otherMetadata = Object.entries(metadata).filter(
    ([key]) => !knownKeys.has(key) && !key.toLowerCase().startsWith("nutrition_")
  );

  const hasInformation = description || notes || source || author || tags?.length || 
    prepTime || cookTime || difficulty || cuisine || category || otherMetadata.length > 0;

  return (
    <Card className="relative w-full overflow-hidden">
      {/* Recipe Image */}
      {hasValidImage && (
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={imageUrl as string}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
            unoptimized={!(imageUrl as string).startsWith("/")}
          />
        </div>
      )}
      
      {/* Header with prominent Save button */}
      <CardHeader className="space-y-4 px-4 pb-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-xl font-bold text-balance sm:text-2xl">{title}</CardTitle>
            {/* Meta Info */}
            <div className="flex flex-wrap gap-3 pt-2 text-sm text-muted-foreground sm:gap-4">
              {servings && (
                <div className="flex items-center gap-1.5">
                  <Users className="size-4 shrink-0" />
                  <span>{servings} servings</span>
                </div>
              )}
              {time && (
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4 shrink-0" />
                  <span>{time}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {onSave && (
              <Button
                variant={isSaved ? "secondary" : "default"}
                size="default"
                onClick={onSave}
                className="gap-2"
              >
                <Bookmark className={isSaved ? "fill-current size-4" : "size-4"} />
                <span className="hidden sm:inline">{isSaved ? "Saved" : "Save Recipe"}</span>
                <span className="sm:hidden">{isSaved ? "Saved" : "Save"}</span>
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="px-4 pt-6 sm:px-6">
        <Tabs defaultValue="instructions" className="w-full">
          <TabsList className="mb-6 flex w-full">
            {hasInformation && (
              <TabsTrigger value="information" className="flex-1 gap-1.5 px-2 sm:gap-2 sm:px-4">
                <Info className="size-4 shrink-0" />
                <span className="hidden sm:inline">Information</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="ingredients" className="flex-1 gap-1.5 px-2 sm:gap-2 sm:px-4">
              <Utensils className="size-4 shrink-0" />
              <span className="hidden sm:inline">Ingredients</span>
            </TabsTrigger>
            <TabsTrigger value="instructions" className="flex-1 gap-1.5 px-2 sm:gap-2 sm:px-4">
              <ChefHat className="size-4 shrink-0" />
              <span className="hidden sm:inline">Instructions</span>
            </TabsTrigger>
            {nutrition && (
              <TabsTrigger value="nutrition" className="flex-1 gap-1.5 px-2 sm:gap-2 sm:px-4">
                <Apple className="size-4 shrink-0" />
                <span className="hidden sm:inline">Nutrition</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Information Tab */}
          {hasInformation && (
            <TabsContent value="information" className="space-y-6">
              {description && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">{description}</p>
                </div>
              )}

              {notes && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Notes</h3>
                  {Array.isArray(notes) ? (
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {notes.map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">{notes}</p>
                  )}
                </div>
              )}

              {/* Tags */}
              {tags && tags.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Details Grid */}
              {(prepTime || cookTime || difficulty || cuisine || category || author || source) && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Details</h3>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {author && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Author:</span>
                        <span className="break-all">{String(author)}</span>
                      </div>
                    )}
                    {source && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="shrink-0 text-muted-foreground">Source:</span>
                        <span className="break-all">{typeof source === "string" ? source : String(source)}</span>
                      </div>
                    )}
                    {prepTime && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Prep Time:</span>
                        <span>{String(prepTime)}</span>
                      </div>
                    )}
                    {cookTime && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Cook Time:</span>
                        <span>{String(cookTime)}</span>
                      </div>
                    )}
                    {difficulty && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Difficulty:</span>
                        <span>{String(difficulty)}</span>
                      </div>
                    )}
                    {cuisine && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Cuisine:</span>
                        <span>{String(cuisine)}</span>
                      </div>
                    )}
                    {category && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Category:</span>
                        <span>{String(category)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Equipment/Cookware */}
              {cookware.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Equipment Needed</h3>
                  <ul className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                    {cookware.map((cw, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <span className="size-1.5 shrink-0 rounded-full bg-blue-500" />
                        <span>{cw.name}</span>
                        {cw.quantity && (
                          <span className="text-muted-foreground">({cw.quantity})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Other metadata */}
              {otherMetadata.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Additional Information</h3>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {otherMetadata.map(([key, value]) => (
                      <div key={key} className="flex items-start gap-2 text-sm">
                        <span className="shrink-0 text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</span>
                        <span className="break-all">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          )}

          {/* Ingredients Tab */}
          <TabsContent value="ingredients" className="space-y-4">
            {ingredients.length > 0 ? (
              <div className="rounded-lg border bg-amber-50/50 p-4 sm:p-6 dark:bg-amber-950/20">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-amber-800 dark:text-amber-300">
                  <Utensils className="size-5 shrink-0" />
                  Ingredients ({ingredients.length})
                </h3>
                <ul className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {ingredients.map((ing, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-2 size-2 shrink-0 rounded-full bg-amber-500" />
                      <span className="break-words">
                        <span className="font-medium">{ing.name}</span>
                        {ing.quantity && (
                          <span className="text-muted-foreground">
                            {" "}
                            - {ing.quantity}
                            {ing.unit && ` ${ing.unit}`}
                          </span>
                        )}
                        {ing.preparation && (
                          <span className="text-muted-foreground italic">
                            {" "}
                            ({ing.preparation})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-muted-foreground">No ingredients found in this recipe.</p>
            )}
          </TabsContent>

          {/* Instructions Tab */}
          <TabsContent value="instructions" className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-4">
                {section.name && (
                  <h4 className="font-semibold text-primary border-b pb-2 text-lg">
                    {section.name}
                  </h4>
                )}
                <ol className="space-y-4">
                  {section.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex gap-3 sm:gap-4">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground sm:size-8">
                        {stepIndex + 1}
                      </span>
                      <p className="min-w-0 flex-1 leading-relaxed pt-0.5 sm:pt-1 break-words">
                        <TokenRenderer tokens={step} />
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </TabsContent>

          {/* Nutrition Tab */}
          {nutrition && (
            <TabsContent value="nutrition" className="space-y-4">
              <div className="rounded-lg border bg-green-50/50 p-4 sm:p-6 dark:bg-green-950/20">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-green-800 dark:text-green-300">
                  <Apple className="size-5 shrink-0" />
                  Nutrition Information
                </h3>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  {Object.entries(nutrition).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded-md border bg-background p-3 text-center"
                    >
                      <p className="text-xs text-muted-foreground capitalize sm:text-sm">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="text-base font-semibold sm:text-lg">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
