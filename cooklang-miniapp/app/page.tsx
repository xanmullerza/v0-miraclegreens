"use client";

import { useState } from "react";
import { ChefHat, Home, BookOpen, Apple } from "lucide-react";
import {
  BottomNavbar,
  Submenu,
  type Section,
} from "@/components/bottom-navbar";
import { HomeSection } from "@/components/home-section";
import { RecipesSection } from "@/components/recipes-section";
import { FoodsSection } from "@/components/foods-section";
import { AddRecipeDialog, AddRecipeFAB } from "@/components/add-recipe-dialog";
import { Toaster } from "@/components/ui/sonner";

export default function CooklangApp() {
  const [activeSection, setActiveSection] = useState<Section>("recipes");
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [pendingRecipe, setPendingRecipe] = useState<{
    content: string;
    filename?: string;
  } | null>(null);

  const getSectionTitle = () => {
    switch (activeSection) {
      case "home":
        return { title: "Home", subtitle: "Welcome to Cooklang" };
      case "recipes":
        return {
          title: "Recipes",
          subtitle: "Parse and organize your .cook recipes",
        };
      case "foods":
        return { title: "Foods", subtitle: "Track your ingredients" };
    }
  };

  const getSectionIcon = () => {
    switch (activeSection) {
      case "home":
        return Home;
      case "recipes":
        return BookOpen;
      case "foods":
        return Apple;
    }
  };

  const handleCooklangSubmit = (content: string, filename?: string) => {
    setPendingRecipe({ content, filename });
    setActiveSection("recipes");
  };

  const handlePendingRecipeProcessed = () => {
    setPendingRecipe(null);
  };

  const { title, subtitle } = getSectionTitle();
  const Icon = getSectionIcon();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background pb-20">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground sm:size-10">
            <ChefHat className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-bold sm:text-xl">{title}</h1>
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <p className="hidden text-sm text-muted-foreground sm:block">
              {subtitle}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-4 sm:py-8">
        {activeSection === "home" && <HomeSection />}
        {activeSection === "recipes" && (
          <RecipesSection
            pendingRecipe={pendingRecipe}
            onPendingRecipeProcessed={handlePendingRecipeProcessed}
          />
        )}
        {activeSection === "foods" && <FoodsSection />}
      </main>

      {/* Footer - only show on larger screens */}
      <footer className="mt-8 hidden border-t bg-card sm:block">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-sm text-muted-foreground">
          <p>
            Built for{" "}
            <a
              href="https://cooklang.org/docs/spec"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Cooklang
            </a>{" "}
            recipe format
          </p>
        </div>
      </footer>

      {/* Add Recipe FAB - only show when dialog is closed */}
      {!isAddDialogOpen && (
        <AddRecipeFAB onClick={() => setIsAddDialogOpen(true)} />
      )}

      {/* Add Recipe Dialog */}
      <AddRecipeDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onCooklangSubmit={handleCooklangSubmit}
      />

      {/* Bottom Navigation */}
      <BottomNavbar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isSubmenuOpen={isSubmenuOpen}
        onSubmenuToggle={() => setIsSubmenuOpen(!isSubmenuOpen)}
      />

      {/* Submenu */}
      <Submenu
        isOpen={isSubmenuOpen}
        onClose={() => setIsSubmenuOpen(false)}
        activeSection={activeSection}
      />
    </div>
  );
}
