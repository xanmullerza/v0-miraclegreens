'use client';

import { useState, useEffect } from 'react';
import {
    X,
    Loader2,
    Package,
    Scale,
    Hash,
    DollarSign,
    Store,
    Check,
    AlertCircle,
    Sparkles,
    ImageOff,
    Link
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScannedProduct, lookupProduct, matchToFoodLibrary } from '@/lib/services/product-lookup';

interface ScanConfirmDialogProps {
    isOpen: boolean;
    barcode: string;
    onClose: () => void;
    onConfirm: (product: {
        name: string;
        barcode: string;
        quantity: number;
        unit: string;
        weight_g?: number;
        price?: number;
        store?: string;
        food_item_id?: string;
        image_url?: string;
        nutrition?: any;
    }) => void;
}

type LookupState = 'loading' | 'found' | 'not_found' | 'error';

export function ScanConfirmDialog({ isOpen, barcode, onClose, onConfirm }: ScanConfirmDialogProps) {
    const [lookupState, setLookupState] = useState<LookupState>('loading');
    const [product, setProduct] = useState<ScannedProduct | null>(null);
    const [matchedFoodId, setMatchedFoodId] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [unit, setUnit] = useState('item');
    const [weight, setWeight] = useState('');
    const [price, setPrice] = useState('');
    const [store, setStore] = useState('');

    const units = ['item', 'g', 'kg', 'ml', 'L', 'pack', 'box', 'can', 'bottle'];

    useEffect(() => {
        if (!isOpen || !barcode) return;

        const lookup = async () => {
            setLookupState('loading');
            setProduct(null);
            setMatchedFoodId(null);

            try {
                const result = await lookupProduct(barcode);

                if (result) {
                    setProduct(result);
                    setName(result.name);
                    setWeight(result.weight_g?.toString() || '');
                    setUnit(result.default_unit || 'g');
                    setMatchedFoodId(result.food_item_id || null);
                    setLookupState('found');

                    // Try to match to our food library if not already linked
                    if (!result.food_item_id) {
                        const foodId = await matchToFoodLibrary(result.name);
                        if (foodId) {
                            setMatchedFoodId(foodId);
                        }
                    }
                } else {
                    setLookupState('not_found');
                    setName('');
                }
            } catch (e) {
                console.error('Product lookup error:', e);
                setLookupState('error');
            }
        };

        lookup();
    }, [isOpen, barcode]);

    const handleConfirm = () => {
        if (!name.trim()) return;

        onConfirm({
            name: name.trim(),
            barcode,
            quantity: parseFloat(quantity) || 1,
            unit,
            weight_g: weight ? parseFloat(weight) : undefined,
            price: price ? parseFloat(price) : undefined,
            store: store.trim() || undefined,
            food_item_id: matchedFoodId || undefined,
            image_url: product?.image_url,
            nutrition: product?.nutrition
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-900 p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center",
                            lookupState === 'found' ? "bg-emerald-500/10 text-emerald-600" :
                                lookupState === 'loading' ? "bg-slate-100 dark:bg-slate-800 text-slate-400" :
                                    "bg-amber-500/10 text-amber-600"
                        )}>
                            {lookupState === 'loading' ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : lookupState === 'found' ? (
                                <Check size={24} />
                            ) : (
                                <AlertCircle size={24} />
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                {lookupState === 'loading' ? 'Looking Up Product...' :
                                    lookupState === 'found' ? 'Product Found!' :
                                        lookupState === 'not_found' ? 'Product Not Found' :
                                            'Lookup Error'}
                            </h2>
                            <p className="text-xs text-slate-500 font-mono">{barcode}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X size={20} />
                    </Button>
                </div>

                {/* Loading State */}
                {lookupState === 'loading' && (
                    <div className="p-12 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <Loader2 className="animate-spin text-emerald-500" size={32} />
                        </div>
                        <p className="text-slate-500 text-sm">Searching product database...</p>
                    </div>
                )}

                {/* Found / Not Found - Show Form */}
                {(lookupState === 'found' || lookupState === 'not_found') && (
                    <div className="p-6 space-y-6">
                        {/* Product Image & Info */}
                        {product?.image_url && (
                            <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 dark:text-white line-clamp-2">{product.name}</p>
                                    {product.brand && (
                                        <p className="text-sm text-slate-500 mt-0.5">{product.brand}</p>
                                    )}
                                    {product.nutrition && (
                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {product.nutrition.energy_kcal && (
                                                <Badge className="text-[9px] bg-orange-500/10 text-orange-600 border-none">
                                                    {Math.round(product.nutrition.energy_kcal)} kcal
                                                </Badge>
                                            )}
                                            {product.nutrition.protein_g && (
                                                <Badge className="text-[9px] bg-rose-500/10 text-rose-600 border-none">
                                                    {product.nutrition.protein_g.toFixed(1)}g protein
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Linked to Library Badge */}
                        {matchedFoodId && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                                <Link size={14} className="text-emerald-600" />
                                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                                    Linked to food library
                                </span>
                                <Sparkles size={12} className="text-emerald-500 ml-auto" />
                            </div>
                        )}

                        {/* Not Found Message */}
                        {lookupState === 'not_found' && (
                            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                                <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                        Product not in database
                                    </p>
                                    <p className="text-xs text-amber-600/80 dark:text-amber-400/60 mt-0.5">
                                        Enter the product details manually below. It will be saved for future scans.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Form Fields */}
                        <div className="space-y-4">
                            {/* Product Name */}
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                                    <Package size={12} /> Product Name *
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter product name"
                                    className="h-12 rounded-xl border-slate-200 dark:border-slate-700"
                                />
                            </div>

                            {/* Quantity & Unit */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                                        <Hash size={12} /> Quantity
                                    </label>
                                    <Input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="h-12 rounded-xl border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                        Unit
                                    </label>
                                    <select
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                        className="w-full h-12 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    >
                                        {units.map(u => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Weight */}
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                                    <Scale size={12} /> Weight (grams)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="e.g., 500"
                                    className="h-12 rounded-xl border-slate-200 dark:border-slate-700"
                                />
                            </div>

                            {/* Price (Optional) */}
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                                    <DollarSign size={12} /> Price (Optional)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="h-12 pl-8 rounded-xl border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>

                            {/* Store (Optional) */}
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                                    <Store size={12} /> Store (Optional)
                                </label>
                                <Input
                                    value={store}
                                    onChange={(e) => setStore(e.target.value)}
                                    placeholder="e.g., Woolworths, Checkers"
                                    className="h-12 rounded-xl border-slate-200 dark:border-slate-700"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {lookupState === 'error' && (
                    <div className="p-12 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center mb-4">
                            <AlertCircle className="text-rose-500" size={32} />
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium mb-2">Something went wrong</p>
                        <p className="text-slate-500 text-sm text-center mb-4">
                            Unable to look up product. Please try again.
                        </p>
                        <Button onClick={onClose} variant="outline" className="rounded-xl">
                            Close
                        </Button>
                    </div>
                )}

                {/* Footer Actions */}
                {(lookupState === 'found' || lookupState === 'not_found') && (
                    <div className="sticky bottom-0 p-6 pt-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-widest"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!name.trim()}
                            className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20"
                        >
                            <Check size={18} className="mr-2" />
                            Add to List
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
