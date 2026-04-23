"use client";

import { Globe, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function AllRecipes() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <div className="relative">
              <Globe className="size-8 text-muted-foreground" />
              <Construction className="absolute -bottom-1 -right-1 size-4 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">All Recipes</h2>
            <p className="text-muted-foreground">
              Curated and community-shared recipes coming soon!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
