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
import { AVAILABLE_EQUIPMENT } from '@/lib/utils/equipment-inference';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RecipeFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type SectionKey = 'equipment' | 'dietary' | 'exclusions' | 'health' | 'pantry' | 'extras';

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

export function RecipeFilterDialog({
  isOpen,
  onClose,
}: RecipeFilterDialogProps) {
  const { filters, updateFilter, resetToProfile, hasActiveFilters } =
    useRecipeFilter();
  const { profile, updateProfile } = useUserPreferences();

  const [localFilters, setLocalFilters] = useState(filters);
  const [expandedSections, setExpandedSections] = useState({
    equipment: true,
    dietary: true,
    exclusions: true,
    health: true,
    pantry: true,
    extras: false,
  });

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  const handleToggleSection = (section: SectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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

  const handleSave = async () => {
    if (
      JSON.stringify(localFilters.selectedExclusions) !==
      JSON.stringify(profile?.exclusions || [])
    ) {
      await updateProfile({
        exclusions: localFilters.selectedExclusions,
      });
    }

    if (
      JSON.stringify(localFilters.selectedHealthConditions) !==
      JSON.stringify(profile?.healthConditions || [])
    ) {
      await updateProfile({
        healthConditions: localFilters.selectedHealthConditions,
      });
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
    });
    toast.info('Filters reset to profile defaults');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden sm:max-h-[90vh] flex flex-col gap-0 border-none sm:border bg-white dark:bg-slate-900 shadow-2xl rounded-t-3xl sm:rounded-2xl top-auto bottom-0 sm:top-[50%] sm:bottom-auto translate-y-0 sm:translate-y-[-50%]">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex items-center justify-between">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            Filter Recipes
            {hasActiveFilters && (
              <span className="ml-2 inline-block bg-blue-500 text-white text-xs font-bold rounded-full px-2.5 py-1">
                {filters.selectedEquipment.length +
                  filters.selectedExclusions.length +
                  filters.selectedHealthConditions.length +
                  (filters.pantryMode === 'pantry-only' ? 1 : 0) +
                  (filters.showFlavours ? 1 : 0)}
              </span>
            )}
          </DialogTitle>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden flex-1 scrollbar-thin">
          {/* Equipment Section */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() => handleToggleSection('equipment')}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Equipment ({localFilters.selectedEquipment.length})
              </h3>
              {expandedSections.equipment ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {expandedSections.equipment && (
              <div className="p-4 bg-white dark:bg-slate-900 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AVAILABLE_EQUIPMENT.map((eq) => (
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
        </div>

        {/* Footer Actions */}
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
      </DialogContent>
    </Dialog>
  );
}
