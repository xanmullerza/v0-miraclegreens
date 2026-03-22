'use client';

import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRecipeFilter } from '@/lib/context/recipe-filter-context';
import { useUserPreferences } from '@/lib/context/user-preferences-context';
import { EQUIPMENT_CATEGORIES } from '@/lib/utils/equipment-inference';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface RecipeFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type SectionKey = 'cookingSetup' | 'dietary' | 'exclusions' | 'health' | 'pantry' | 'extras';

const DIET_OPTIONS = ['anything', 'vegetarian', 'vegan', 'pescatarian'];

const HEALTH_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'High Cholesterol',
  'Celiac',
  'IBS',
  'Kidney Disease',
  'Thyroid Issues',
  'PCOS',
  'Gout',
];

const EXCLUSION_OPTIONS = [
  'Dairy',
  'Eggs',
  'Peanuts',
  'Tree Nuts',
  'Shellfish',
  'Fish',
  'Soy',
  'Gluten',
  'Sesame',
  'Mustard',
  'Celery',
  'Sulfites',
  'Nightshades',
  'Corn',
];

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

const PREDEFINED_TAGS = ['#Quick', '#Budget', '#Keto', '#Vegan', '#Vegetarian', '#Gluten-Free', '#BatchCook'];

export function RecipeFilterDialog({
  isOpen,
  onClose,
}: RecipeFilterDialogProps) {
  const { filters, updateFilter, resetToProfile, hasActiveFilters } =
    useRecipeFilter();
  const { profile, updateProfile } = useUserPreferences();

  const [localFilters, setLocalFilters] = useState(filters);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    cookingSetup: true,
    dietary: true,
    exclusions: true,
    health: true,
    pantry: true,
    extras: true,
    difficulty: true,
    tags: true,
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  const handleToggleSection = (section: SectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const selectedInCategory = (items: string[]) =>
    items.filter((i) => localFilters.selectedEquipment.includes(i)).length;

  const handleEquipmentToggle = (equipment: string) => {
    const updated = localFilters.selectedEquipment.includes(equipment)
      ? localFilters.selectedEquipment.filter((e) => e !== equipment)
      : [...localFilters.selectedEquipment, equipment];
    setLocalFilters((prev) => ({
      ...prev,
      selectedEquipment: updated,
    }));
  };

  const handleExclusionToggle = (exclusion: string) => {
    const updated = localFilters.selectedExclusions.includes(exclusion)
      ? localFilters.selectedExclusions.filter((e) => e !== exclusion)
      : [...localFilters.selectedExclusions, exclusion];
    setLocalFilters((prev) => ({
      ...prev,
      selectedExclusions: updated,
    }));
  };

  const handleHealthConditionToggle = (condition: string) => {
    const updated = localFilters.selectedHealthConditions.includes(condition)
      ? localFilters.selectedHealthConditions.filter((c) => c !== condition)
      : [...localFilters.selectedHealthConditions, condition];
    setLocalFilters((prev) => ({
      ...prev,
      selectedHealthConditions: updated,
    }));
  };

  const handleDifficultyToggle = (difficulty: string) => {
    const updated = localFilters.selectedDifficulty.includes(difficulty)
      ? localFilters.selectedDifficulty.filter((d) => d !== difficulty)
      : [...localFilters.selectedDifficulty, difficulty];
    setLocalFilters((prev) => ({
      ...prev,
      selectedDifficulty: updated,
    }));
  };

  const handleTagToggle = (tag: string) => {
    const updated = localFilters.selectedTags.includes(tag)
      ? localFilters.selectedTags.filter((t) => t !== tag)
      : [...localFilters.selectedTags, tag];
    setLocalFilters((prev) => ({
      ...prev,
      selectedTags: updated,
    }));
  };

  const handleSave = async () => {
    const profileUpdates: any = {};

    if (localFilters.selectedDietType !== profile?.dietType) {
      profileUpdates.dietType = localFilters.selectedDietType;
    }

    if (
      JSON.stringify(localFilters.selectedExclusions) !==
      JSON.stringify(profile?.exclusions || [])
    ) {
      profileUpdates.exclusions = localFilters.selectedExclusions;
    }

    if (
      JSON.stringify(localFilters.selectedHealthConditions) !==
      JSON.stringify(profile?.healthConditions || [])
    ) {
      profileUpdates.healthConditions = localFilters.selectedHealthConditions;
    }

    if (Object.keys(profileUpdates).length > 0) {
      await updateProfile(profileUpdates);
    }

    Object.keys(localFilters).forEach((key) => {
      updateFilter(key as any, (localFilters as any)[key]);
    });

    toast.success('Filter preferences saved');
    onClose();
  };

  const handleReset = () => {
    resetToProfile();
    setLocalFilters({
      selectedEquipment: [],
      selectedDietType: profile?.dietType || 'anything',
      selectedExclusions: profile?.exclusions || [],
      selectedHealthConditions: profile?.healthConditions || [],
      pantryMode: 'all',
      showFlavours: false,
      showSupplements: false,
      selectedDifficulty: [],
      selectedTags: [],
    });
    toast.info('Filters reset to profile defaults');
  };

  const FilterContentInner = (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden flex-1 scrollbar-thin">
      {/* Cooking Setup Section */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => handleToggleSection('cookingSetup')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Cooking Setup ({localFilters.selectedEquipment.length})
          </h3>
          {expandedSections.cookingSetup ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
        {expandedSections.cookingSetup && (
          <div className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            {EQUIPMENT_CATEGORIES.map((category) => {
              const selectedCount = selectedInCategory(category.items);
              const isRaw = category.tier === 0;
              return (
                <div key={category.id} className="px-4 py-3">
                  {/* Category sub-header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{category.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {category.label}
                          {selectedCount > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-emerald-500 text-white rounded-full">
                              {selectedCount}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{category.description}</p>
                      </div>
                    </div>
                  </div>
                  {/* Items */}
                  {isRaw ? (
                    // Tier 0: single wide checkbox row
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                      <Checkbox
                        checked={localFilters.selectedEquipment.includes('raw')}
                        onCheckedChange={() => handleEquipmentToggle('raw')}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No Prep / Raw</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Salads, fresh fruit, ready-to-eat — no cooking needed</p>
                      </div>
                    </label>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {category.items.map((eq) => (
                        <label
                          key={eq}
                          className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <Checkbox
                            checked={localFilters.selectedEquipment.includes(eq)}
                            onCheckedChange={() => handleEquipmentToggle(eq)}
                          />
                          <span className="text-sm capitalize text-slate-700 dark:text-slate-300">
                            {eq}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dietary Preferences Section */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => handleToggleSection('dietary')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Diet Type
          </h3>
          {expandedSections.dietary ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
        {expandedSections.dietary && (
          <div className="p-4 bg-white dark:bg-slate-900 space-y-2">
            {DIET_OPTIONS.map((diet) => (
              <label
                key={diet}
                className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <input
                  type="radio"
                  name="diet"
                  value={diet}
                  checked={localFilters.selectedDietType === diet}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      selectedDietType: e.target.value,
                    }))
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm capitalize text-slate-700 dark:text-slate-300">
                  {diet}
                </span>
              </label>
            ))}
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-3 p-2 bg-slate-50 dark:bg-slate-800 rounded">
              📌 Synced with your profile
            </div>
          </div>
        )}
      </div>

      {/* Exclusions Section */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => handleToggleSection('exclusions')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Allergies & Exclusions ({localFilters.selectedExclusions.length}
            )
          </h3>
          {expandedSections.exclusions ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
        {expandedSections.exclusions && (
          <div className="p-4 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {EXCLUSION_OPTIONS.map((exc) => (
                <label
                  key={exc}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Checkbox
                    checked={localFilters.selectedExclusions.includes(exc)}
                    onCheckedChange={() => handleExclusionToggle(exc)}
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {exc}
                  </span>
                </label>
              ))}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-800 rounded">
              📌 Synced with your profile. Changes here update your profile settings.
            </div>
          </div>
        )}
      </div>

      {/* Health Conditions Section */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => handleToggleSection('health')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Health Conditions ({localFilters.selectedHealthConditions.length}
            )
          </h3>
          {expandedSections.health ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
        {expandedSections.health && (
          <div className="p-4 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {HEALTH_CONDITIONS.map((condition) => (
                <label
                  key={condition}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Checkbox
                    checked={localFilters.selectedHealthConditions.includes(
                      condition
                    )}
                    onCheckedChange={() =>
                      handleHealthConditionToggle(condition)
                    }
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {condition}
                  </span>
                </label>
              ))}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-800 rounded">
              📌 Synced with your profile. Changes here update your profile settings.
            </div>
          </div>
        )}
      </div>

      {/* Pantry Mode Section */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => handleToggleSection('pantry')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Pantry Filtering
          </h3>
          {expandedSections.pantry ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
        {expandedSections.pantry && (
          <div className="p-4 bg-white dark:bg-slate-900 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <input
                type="radio"
                name="pantryMode"
                value="all"
                checked={localFilters.pantryMode === 'all'}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    pantryMode: e.target.value as any,
                  }))
                }
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Show All Recipes
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mark recipes with missing pantry items
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <input
                type="radio"
                name="pantryMode"
                value="pantry-only"
                checked={localFilters.pantryMode === 'pantry-only'}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    pantryMode: e.target.value as any,
                  }))
                }
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Pantry Only
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hide recipes with missing pantry items
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Extras Section */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => handleToggleSection('extras')}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Optional Items
          </h3>
          {expandedSections.extras ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
        {expandedSections.extras && (
          <div className="p-4 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Show Flavours
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Optional taste enhancements
                </p>
              </div>
              <Switch
                checked={localFilters.showFlavours}
                onCheckedChange={(checked) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    showFlavours: checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Show Supplements
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Optional nutritional additions
                </p>
              </div>
              <Switch
                checked={localFilters.showSupplements}
                onCheckedChange={(checked) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    showSupplements: checked,
                  }))
                }
              />
            </div>
          </div>
        )}
      </div>
      {/* Difficulty Section */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => handleToggleSection('difficulty' as any)}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Difficulty ({localFilters.selectedDifficulty.length})
          </h3>
          {(expandedSections as any).difficulty ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
        {(expandedSections as any).difficulty && (
          <div className="p-4 bg-white dark:bg-slate-900 grid grid-cols-3 gap-2">
            {DIFFICULTY_OPTIONS.map((diff) => (
              <label
                key={diff}
                className={cn(
                  "flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-all text-[10px] font-black uppercase tracking-tight",
                  localFilters.selectedDifficulty.includes(diff)
                    ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300"
                )}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={localFilters.selectedDifficulty.includes(diff)}
                  onChange={() => handleDifficultyToggle(diff)}
                />
                {diff}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Tags Section */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <button
          onClick={() => handleToggleSection('tags' as any)}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Tags ({localFilters.selectedTags.length})
          </h3>
          {(expandedSections as any).tags ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
        {(expandedSections as any).tags && (
          <div className="p-4 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                    localFilters.selectedTags.includes(tag)
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-300"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const FilterFooter = (
    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex gap-3">
      <Button
        variant="outline"
        onClick={handleReset}
        className="flex-1 gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Reset
      </Button>
      <Button onClick={handleSave} className="flex-1 gap-2">
        <Save className="w-4 h-4" />
        Apply
      </Button>
    </div>
  );

  const FilterBadge = hasActiveFilters && (
    <span className="ml-2 inline-block bg-blue-500 text-white text-xs font-bold rounded-full px-2.5 py-1">
      {filters.selectedEquipment.length +
        filters.selectedExclusions.length +
        filters.selectedHealthConditions.length +
        (filters.pantryMode === 'pantry-only' ? 1 : 0) +
        (filters.showFlavours ? 1 : 0) +
        filters.selectedDifficulty.length +
        filters.selectedTags.length}
    </span>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="h-[90vh] bg-white dark:bg-slate-900 border-none flex flex-col p-0" aria-describedby={undefined}>
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              Filter Recipes
              {FilterBadge}
            </DrawerTitle>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {FilterContentInner}
          {FilterFooter}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="z-[200] max-w-2xl w-full p-0 overflow-hidden max-h-[90vh] flex flex-col gap-0 border-none sm:border bg-white dark:bg-slate-900 shadow-2xl rounded-t-3xl sm:rounded-2xl fixed inset-x-0 bottom-0 top-auto translate-x-0 translate-y-0 data-[state=open]:translate-x-0 data-[state=open]:translate-y-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:data-[state=open]:-translate-x-1/2 sm:data-[state=open]:-translate-y-1/2" aria-describedby={undefined}>
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex items-center justify-between">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            Filter Recipes
            {FilterBadge}
          </DialogTitle>
        </div>
        {FilterContentInner}
        {FilterFooter}
      </DialogContent>
    </Dialog>
  );
}
