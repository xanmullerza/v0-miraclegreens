"use client";

import { useState } from "react";
import {
  Plus,
  X,
  PenLine,
  ClipboardPaste,
  Link2,
  Camera,
  FileCode,
  Construction,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecipeInput } from "@/components/recipe-input";

interface AddRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCooklangSubmit: (content: string, filename?: string) => void;
}

type DialogView = "menu" | "cooklang" | "mock";

export function AddRecipeDialog({
  isOpen,
  onClose,
  onCooklangSubmit,
}: AddRecipeDialogProps) {
  const [view, setView] = useState<DialogView>("menu");
  const [mockTitle, setMockTitle] = useState("");

  const menuItems = [
    { id: "write", label: "Write Recipe", icon: PenLine, isMock: true },
    { id: "paste", label: "Paste Recipe", icon: ClipboardPaste, isMock: true },
    { id: "link", label: "Share Link", icon: Link2, isMock: true },
    { id: "photos", label: "Upload Photos", icon: Camera, isMock: true },
    { id: "cooklang", label: "Cooklang", icon: FileCode, isMock: false },
  ];

  const handleMenuClick = (id: string) => {
    if (id === "cooklang") {
      setView("cooklang");
    } else {
      setMockTitle(menuItems.find((item) => item.id === id)?.label || "");
      setView("mock");
    }
  };

  const handleCooklangSubmit = (content: string, filename?: string) => {
    onCooklangSubmit(content, filename);
    setView("menu");
    onClose();
  };

  const handleBack = () => {
    setView("menu");
  };

  const handleClose = () => {
    setView("menu");
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Slide-out panel from left */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-full max-w-sm transform bg-background shadow-xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-lg font-semibold">
              {view === "menu" && "Add Recipe"}
              {view === "cooklang" && "Cooklang Parser"}
              {view === "mock" && mockTitle}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="size-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {view === "menu" && (
              <div className="grid gap-3">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id)}
                      className="flex items-center gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.label}</p>
                        {item.isMock && (
                          <p className="text-xs text-muted-foreground">
                            Coming soon
                          </p>
                        )}
                        {item.id === "cooklang" && (
                          <p className="text-xs text-muted-foreground">
                            Parse .cook files
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {view === "cooklang" && (
              <div className="space-y-4">
                <Button variant="outline" size="sm" onClick={handleBack}>
                  Back to menu
                </Button>
                <RecipeInput onRecipeSubmit={handleCooklangSubmit} />
              </div>
            )}

            {view === "mock" && (
              <div className="space-y-4">
                <Button variant="outline" size="sm" onClick={handleBack}>
                  Back to menu
                </Button>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Construction className="size-5" />
                      {mockTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      This feature is under construction and will be available
                      soon.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAB Button */}
      <button
        onClick={() => (isOpen ? handleClose() : onClose())}
        className={cn(
          "fixed bottom-20 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 active:scale-95",
          isOpen && "rotate-45"
        )}
        aria-label={isOpen ? "Close add recipe dialog" : "Add recipe"}
      >
        <Plus className="size-6" />
      </button>
    </>
  );
}

interface AddRecipeFABProps {
  onClick: () => void;
}

export function AddRecipeFAB({ onClick }: AddRecipeFABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 active:scale-95"
      aria-label="Add recipe"
    >
      <Plus className="size-6" />
    </button>
  );
}
