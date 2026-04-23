"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Pill,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MealSlot {
  id: string;
  type: "breakfast" | "lunch" | "dinner" | "snack" | "supplement";
  recipe?: string;
}

const MEAL_TYPES = [
  { type: "breakfast" as const, label: "Breakfast", icon: Coffee },
  { type: "lunch" as const, label: "Lunch", icon: Sun },
  { type: "dinner" as const, label: "Dinner", icon: Moon },
  { type: "snack" as const, label: "Snack", icon: Cookie },
  { type: "supplement" as const, label: "Supplement", icon: Pill },
];

export function MealPlanner() {
  const [dayOffset, setDayOffset] = useState(0);

  const currentDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date;
  }, [dayOffset]);

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const canGoBack = dayOffset > 0;
  const canGoForward = dayOffset < 7;

  // Mock meal data - in real app this would come from storage
  const getMealsForDay = (): MealSlot[] => {
    return MEAL_TYPES.map((meal) => ({
      id: `${currentDate.toISOString()}-${meal.type}`,
      type: meal.type,
      recipe: undefined, // No meals planned yet
    }));
  };

  const meals = getMealsForDay();

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDayOffset((d) => d - 1)}
              disabled={!canGoBack}
            >
              <ChevronLeft className="size-5" />
              <span className="sr-only">Previous day</span>
            </Button>

            <div className="text-center">
              <p className="text-lg font-semibold">{formatDate(currentDate)}</p>
              <p className="text-xs text-muted-foreground">
                {formatFullDate(currentDate)}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDayOffset((d) => d + 1)}
              disabled={!canGoForward}
            >
              <ChevronRight className="size-5" />
              <span className="sr-only">Next day</span>
            </Button>
          </div>

          {/* Day indicators */}
          <div className="mt-4 flex justify-center gap-1.5">
            {Array.from({ length: 8 }, (_, i) => (
              <button
                key={i}
                onClick={() => setDayOffset(i)}
                className={cn(
                  "size-2 rounded-full transition-colors",
                  dayOffset === i
                    ? "bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to day ${i + 1}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meal Slots */}
      <div className="grid gap-3">
        {meals.map((meal) => {
          const mealType = MEAL_TYPES.find((m) => m.type === meal.type);
          if (!mealType) return null;

          const Icon = mealType.icon;

          return (
            <Card
              key={meal.id}
              className={cn(
                "transition-colors",
                !meal.recipe && "border-dashed"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg",
                      meal.recipe ? "bg-primary/10" : "bg-muted"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-5",
                        meal.recipe
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{mealType.label}</p>
                    {meal.recipe ? (
                      <p className="truncate text-sm text-muted-foreground">
                        {meal.recipe}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No meal planned
                      </p>
                    )}
                  </div>

                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Plus className="size-4" />
                    <span className="sr-only">Add {mealType.label}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
