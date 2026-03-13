'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ParsedNutrition {
  name: string;
  common_name?: string;
  energy_kcal?: number;
  energy_kj?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  servings?: Array<{ label: string; weight_g: number }>;
  micronutrients: Record<string, number>;
}

export default function CronometerImporterPage() {
  const router = useRouter();
  const [foodId, setFoodId] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedNutrition | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basics']));
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!foodId.trim()) {
      toast.error('Please enter a Cronometer food ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/cronometer/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId: foodId.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to parse food');
        return;
      }

      const result = await response.json();
      setParsedData(result.data);
      setExpandedSections(new Set(['basics', 'macros']));
      toast.success('Food parsed successfully!');
    } catch (error) {
      console.error('Parse error:', error);
      toast.error('Error parsing food: ' + String(error));
    } finally {
      setLoading(false);
    }
  };

  const Section = ({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
      >
        <h3 className="font-black uppercase tracking-widest text-sm text-slate-900 dark:text-white">
          {title}
        </h3>
        {expandedSections.has(id) ? (
          <ChevronUp size={18} className="text-slate-500" />
        ) : (
          <ChevronDown size={18} className="text-slate-500" />
        )}
      </button>
      {expandedSections.has(id) && (
        <div className="p-4 space-y-3 bg-white dark:bg-slate-900">{children}</div>
      )}
    </div>
  );

  const ValueDisplay = ({
    label,
    value,
    unit = '',
  }: {
    label: string;
    value: string | number | undefined;
    unit?: string;
  }) => {
    const displayValue = value === undefined || value === '' ? '—' : `${value}${unit ? ' ' + unit : ''}`;
    return (
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg group">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-black text-slate-900 dark:text-white">{displayValue}</span>
          <button
            onClick={() => copyToClipboard(String(value), label)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
            title="Copy value"
          >
            {copiedField === label ? (
              <Check size={14} className="text-emerald-500" />
            ) : (
              <Copy size={14} className="text-slate-400" />
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 text-sky-500 font-bold text-xs uppercase tracking-widest mb-4 hover:translate-x-[-4px] transition-transform"
        >
          <ArrowLeft size={14} /> Back to Admin
        </button>

        <div className="space-y-2">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
            Cronometer Food Parser
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Test parsing of Cronometer food items. Enter a food ID to fetch and parse nutrition data.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleParse} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
            Cronometer Food ID
          </label>
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="e.g. 1, 2604, or 1&amount=100&measure=0"
              value={foodId}
              onChange={(e) => setFoodId(e.target.value)}
              className="flex-1 h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            />
            <Button
              type="submit"
              disabled={loading}
              className="bg-sky-500 hover:bg-sky-600 text-white font-black uppercase px-6"
            >
              {loading ? 'Parsing...' : 'Parse'}
            </Button>
          </div>
        </div>
      </form>

      {/* Results */}
      {parsedData && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
            ✓ Successfully parsed and saved to staging table
          </div>

          {/* Basics Section */}
          <Section id="basics" title="Food Basics">
            <div className="space-y-3">
              <ValueDisplay label="Official Name" value={parsedData.name} />
              <ValueDisplay
                label="Common Name (Auto-Generated)"
                value={parsedData.common_name}
              />
            </div>
          </Section>

          {/* Macronutrients Section */}
          <Section id="macros" title="Macronutrients (per 100g)">
            <div className="space-y-3">
              <ValueDisplay label="Energy" value={parsedData.energy_kcal} unit="kcal" />
              <ValueDisplay label="Energy" value={parsedData.energy_kj} unit="kJ" />
              <ValueDisplay label="Protein" value={parsedData.protein_g} unit="g" />
              <ValueDisplay label="Carbohydrates" value={parsedData.carbs_g} unit="g" />
              <ValueDisplay label="Fat" value={parsedData.fat_g} unit="g" />
            </div>
          </Section>

          {/* Serving Sizes Section */}
          {parsedData.servings && parsedData.servings.length > 0 && (
            <Section id="servings" title={`Serving Sizes (${parsedData.servings.length})`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left p-2 font-black text-slate-900 dark:text-white">
                        Measure
                      </th>
                      <th className="text-right p-2 font-black text-slate-900 dark:text-white">
                        Grams
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.servings.map((serving, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="p-2 text-slate-700 dark:text-slate-300">{serving.label}</td>
                        <td className="p-2 text-right font-medium text-slate-900 dark:text-white">
                          {serving.weight_g}g
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Micronutrients Section */}
          {Object.keys(parsedData.micronutrients).length > 0 && (
            <Section
              id="micros"
              title={`Micronutrients (${Object.keys(parsedData.micronutrients).length})`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(parsedData.micronutrients).map(([key, value]) => (
                  <div
                    key={key}
                    className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-between group"
                  >
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {key}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        {value}
                      </span>
                      <button
                        onClick={() => copyToClipboard(String(value), key)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                      >
                        {copiedField === key ? (
                          <Check size={12} className="text-emerald-500" />
                        ) : (
                          <Copy size={12} className="text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Raw JSON */}
          <Section id="json" title="Raw JSON Data">
            <pre className="p-4 bg-slate-950 dark:bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-xs font-mono">
              {JSON.stringify(parsedData, null, 2)}
            </pre>
          </Section>
        </div>
      )}

      {/* Placeholder */}
      {!parsedData && (
        <div className="text-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-slate-500 dark:text-slate-400">
            Enter a Cronometer food ID above to parse and preview the nutrition data.
          </p>
        </div>
      )}
    </div>
  );
}
