"use client";

import { useState } from "react";
import {
  ShoppingCart,
  Package,
  Library,
  Construction,
  Apple,
  Plus,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

function PlaceholderContent({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <div className="relative">
              <Icon className="size-8 text-muted-foreground" />
              <Construction className="absolute -bottom-1 -right-1 size-4 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ShoppingList() {
  return (
    <PlaceholderContent
      icon={ShoppingCart}
      title="Shopping List"
      description="Plan your grocery shopping based on recipes. Coming soon!"
    />
  );
}

function Pantry() {
  return (
    <PlaceholderContent
      icon={Package}
      title="Pantry"
      description="Track what you have at home with Pantry integration. Coming soon!"
    />
  );
}

function FoodLibrary() {
  // Mock food items - in real app would come from storage
  const foods: { id: string; name: string; category: string }[] = [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Your Foods</h3>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Add Food
        </Button>
      </div>

      {foods.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Apple className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No foods yet</EmptyTitle>
                <EmptyDescription>
                  Start building your food library by adding ingredients you use
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {foods.map((food) => (
            <Card key={food.id}>
              <CardContent className="p-4">
                <p className="font-medium">{food.name}</p>
                <p className="text-sm text-muted-foreground">{food.category}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function FoodsSection() {
  const [activeTab, setActiveTab] = useState("library");

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="shopping"
            className="gap-1.5 text-xs sm:text-sm"
          >
            <ShoppingCart className="size-4 shrink-0" />
            <span className="hidden sm:inline">Shopping</span>
            <span className="sm:hidden">Shop</span>
          </TabsTrigger>
          <TabsTrigger value="pantry" className="gap-1.5 text-xs sm:text-sm">
            <Package className="size-4 shrink-0" />
            <span className="hidden sm:inline">Pantry</span>
            <span className="sm:hidden">Pantry</span>
          </TabsTrigger>
          <TabsTrigger value="library" className="gap-1.5 text-xs sm:text-sm">
            <Library className="size-4 shrink-0" />
            <span className="hidden sm:inline">Library</span>
            <span className="sm:hidden">Library</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shopping" className="mt-4">
          <ShoppingList />
        </TabsContent>

        <TabsContent value="pantry" className="mt-4">
          <Pantry />
        </TabsContent>

        <TabsContent value="library" className="mt-4">
          <FoodLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}
