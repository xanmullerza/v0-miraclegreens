"use client";

import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function RecipesSection() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Construction className="size-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Recipes Section</h2>
            <p className="text-muted-foreground">
              Coming soon. We&apos;re working on something great!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}