"use client";

import React from 'react';
import { Clock, Users, ChefHat, Timer, Utensils, Apple } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ParsedRecipe, StepToken } from '@/lib/cooklang-parser';

interface CooklangRecipeDisplayProps {
  recipe: ParsedRecipe;
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

export function CooklangRecipeDisplay({ recipe }: CooklangRecipeDisplayProps) {
  const { metadata = {}, sections = [], ingredients = [], cookware = [] } = recipe;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          {hasValidImage && (
            <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border">
              <img
                src={imageUrl}
                alt={String(title)}
                className="size-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {description}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {servings && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Users className="size-4" />
              <span>{servings} servings</span>
            </div>
          )}
          {time && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Clock className="size-4" />
              <span>{time}</span>
            </div>
          )}
          {prepTime && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <ChefHat className="size-4" />
              <span>Prep: {prepTime}min</span>
            </div>
          )}
          {cookTime && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Utensils className="size-4" />
              <span>Cook: {cookTime}min</span>
            </div>
          )}
        </div>
      </div>

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-amber-500" />
                <span className="text-sm">
                  {ingredient.name}
                  {ingredient.quantity && (
                    <span className="text-slate-600 dark:text-slate-400">
                      {" "}({ingredient.quantity}{ingredient.unit ? ` ${ingredient.unit}` : ""})
                    </span>
                  )}
                  {ingredient.preparation && (
                    <span className="text-slate-600 dark:text-slate-400">
                      , {ingredient.preparation}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Cookware */}
      {cookware.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cookware</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {cookware.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-blue-500" />
                  <span className="text-sm">
                    {item.name}
                    {item.quantity && (
                      <span className="text-slate-600 dark:text-slate-400">
                        {" "}({item.quantity})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {sections.map((section, sectionIndex) => (
        <Card key={sectionIndex}>
          <CardHeader>
            <CardTitle className="text-lg">
              {section.name || `Instructions`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {section.steps.map((step: any[], stepIndex: number) => (
                <li key={stepIndex} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {stepIndex + 1}
                  </span>
                  <div className="flex-1 text-sm leading-relaxed">
                    <TokenRenderer tokens={step} />
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ))}

      {/* Recipe Information */}
      {(source || author || difficulty || cuisine || category || notes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recipe Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {source && (
              <div>
                <h4 className="font-medium text-sm text-slate-900 dark:text-white mb-1">
                  Source
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {source}
                </p>
              </div>
            )}

            {author && (
              <div>
                <h4 className="font-medium text-sm text-slate-900 dark:text-white mb-1">
                  Author
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {author}
                </p>
              </div>
            )}

            {difficulty && (
              <div>
                <h4 className="font-medium text-sm text-slate-900 dark:text-white mb-1">
                  Difficulty
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {difficulty}
                </p>
              </div>
            )}

            {cuisine && (
              <div>
                <h4 className="font-medium text-sm text-slate-900 dark:text-white mb-1">
                  Cuisine
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {cuisine}
                </p>
              </div>
            )}

            {category && (
              <div>
                <h4 className="font-medium text-sm text-slate-900 dark:text-white mb-1">
                  Category
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {category}
                </p>
              </div>
            )}

            {notes && (
              <div>
                <h4 className="font-medium text-sm text-slate-900 dark:text-white mb-1">
                  Notes
                </h4>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {Array.isArray(notes) ? (
                    <ul className="list-disc list-inside space-y-1">
                      {notes.map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{notes}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}