"use client";

import { Home, BookOpen, Apple, Menu, X, HelpCircle, MessageCircle, Settings, Tag, Share, Printer, Search, Filter, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type Section = "home" | "recipes" | "foods";

interface BottomNavbarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  isSubmenuOpen: boolean;
  onSubmenuToggle: () => void;
}

export function BottomNavbar({
  activeSection,
  onSectionChange,
  isSubmenuOpen,
  onSubmenuToggle,
}: BottomNavbarProps) {
  const navItems = [
    { id: "home" as const, label: "Home", icon: Home },
    { id: "recipes" as const, label: "Recipes", icon: BookOpen },
    { id: "foods" as const, label: "Foods", icon: Apple },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-card safe-area-bottom">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onSubmenuToggle}
          className={cn(
            "flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors",
            isSubmenuOpen
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Menu className="size-5" />
          <span className="text-xs font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}

interface SubmenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: Section;
}

export function Submenu({ isOpen, onClose, activeSection }: SubmenuProps) {
  // Different menu items based on section
  const getMenuItems = () => {
    switch (activeSection) {
      case "home":
        return [
          { id: "help", label: "Help", icon: HelpCircle },
          { id: "chat", label: "Chat", icon: MessageCircle },
          { id: "settings", label: "Settings", icon: Settings },
        ];
      case "recipes":
        return [
          { id: "tags", label: "Tags", icon: Tag },
          { id: "share", label: "Share", icon: Share },
          { id: "print", label: "Print", icon: Printer },
        ];
      case "foods":
        return [
          { id: "search", label: "Search", icon: Search },
          { id: "filter", label: "Filter", icon: Filter },
          { id: "add", label: "Add", icon: Plus },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      {/* Submenu */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 border-t bg-card transition-transform duration-300 ease-out safe-area-bottom",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  // Handle menu item click
                  onClose();
                }}
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon className="size-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}