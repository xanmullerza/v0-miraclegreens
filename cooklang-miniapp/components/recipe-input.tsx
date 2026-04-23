"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, ClipboardPaste } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RecipeInputProps {
  onRecipeSubmit: (content: string, filename?: string) => void;
}

export function RecipeInput({ onRecipeSubmit }: RecipeInputProps) {
  const [pastedText, setPastedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string } | null>(null);

  const handleFileRead = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setUploadedFile({ name: file.name, content });
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".cook") || file.type === "text/plain")) {
        handleFileRead(file);
      }
    },
    [handleFileRead]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileRead(file);
      }
    },
    [handleFileRead]
  );

  const handlePasteSubmit = () => {
    if (pastedText.trim()) {
      onRecipeSubmit(pastedText.trim());
      setPastedText("");
    }
  };

  const handleFileSubmit = () => {
    if (uploadedFile) {
      onRecipeSubmit(uploadedFile.content, uploadedFile.name);
      setUploadedFile(null);
    }
  };

  const exampleRecipe = `---
title: Classic Carbonara
servings: 4
time: 30 minutes
author: Traditional Italian
description: A rich and creamy Roman pasta dish made with eggs, cheese, and guanciale. This authentic recipe uses no cream!
image: https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&h=600&fit=crop
tags:
  - pasta
  - italian
  - quick
  - comfort food
cuisine: Italian
category: Main Course
difficulty: Medium
prep_time: 10 minutes
cook_time: 20 minutes
calories: 650
protein: 28g
carbs: 65g
fat: 32g
---

= Preparation

Bring a #large pot{} of @water{} to boil. Add @salt{1%tbsp} generously.

Dice @guanciale{200%g} into small cubes. -- pancetta works too

= Sauce

In a #bowl{}, whisk together @eggs{3} and @egg yolks{2} with @pecorino romano{100%g}(finely grated) and @black pepper{1%tsp}(freshly ground).

= Cooking

Cook @spaghetti{400%g} in the boiling water for ~pasta{10%minutes}.

Meanwhile, cook the guanciale in a #large pan{} over medium heat for ~{5%minutes} until crispy.

Reserve @pasta water{1%cup} before draining.

Off heat, add hot pasta to the pan with guanciale. Quickly toss with the egg mixture, adding pasta water as needed to create a creamy sauce.

Serve immediately with extra pecorino and black pepper.`;

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl">Add a Recipe</CardTitle>
        <CardDescription className="text-sm">
          Upload a .cook file or paste Cooklang formatted text
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Tabs defaultValue="paste" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste" className="gap-1.5 text-sm sm:gap-2">
              <ClipboardPaste className="size-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Paste</span>
              <span className="xs:hidden sm:hidden">Paste</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-1.5 text-sm sm:gap-2">
              <Upload className="size-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Upload</span>
              <span className="xs:hidden sm:hidden">Upload</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="mt-4 space-y-4">
            <div className="space-y-3">
              <Textarea
                placeholder="Paste your Cooklang recipe here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="min-h-[150px] font-mono text-sm sm:min-h-[200px]"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPastedText(exampleRecipe)}
                  className="w-full sm:w-auto"
                >
                  Load Example
                </Button>
                <Button 
                  onClick={handlePasteSubmit} 
                  disabled={!pastedText.trim()}
                  className="w-full sm:w-auto"
                >
                  Parse Recipe
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4 space-y-4">
            <div
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors sm:p-8",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {uploadedFile ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <FileText className="size-8 text-primary sm:size-10" />
                  <p className="font-medium text-sm sm:text-base break-all">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {uploadedFile.content.length} characters
                  </p>
                  <div className="flex flex-col gap-2 mt-2 w-full sm:flex-row sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                      className="w-full sm:w-auto"
                    >
                      Remove
                    </Button>
                    <Button size="sm" onClick={handleFileSubmit} className="w-full sm:w-auto">
                      Parse Recipe
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <Upload className="size-8 text-muted-foreground sm:size-10" />
                  <p className="font-medium text-sm sm:text-base">Drop your .cook file here</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    or tap to browse
                  </p>
                  <input
                    type="file"
                    accept=".cook,.txt"
                    onChange={handleFileInput}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
