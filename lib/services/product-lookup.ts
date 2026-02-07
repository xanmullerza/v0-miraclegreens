import { supabase } from '@/lib/supabase';

export interface ScannedProduct {
    barcode: string;
    name: string;
    brand?: string;
    weight_g?: number;
    default_unit?: string;
    image_url?: string;
    nutrition?: {
        energy_kcal?: number;
        protein_g?: number;
        carbs_g?: number;
        fat_g?: number;
        fiber_g?: number;
        sodium_mg?: number;
        [key: string]: number | undefined;
    };
    source: 'local' | 'openfoodfacts' | 'manual';
    food_item_id?: string;
}

export interface OpenFoodFactsProduct {
    code: string;
    product?: {
        product_name?: string;
        brands?: string;
        quantity?: string;
        image_url?: string;
        image_front_url?: string;
        nutriments?: {
            'energy-kcal_100g'?: number;
            'proteins_100g'?: number;
            'carbohydrates_100g'?: number;
            'fat_100g'?: number;
            'fiber_100g'?: number;
            'sodium_100g'?: number;
            [key: string]: number | string | undefined;
        };
    };
    status: number;
    status_verbose: string;
}

// Local storage key for offline cache
const PRODUCT_CACHE_KEY = 'scanned_products_cache';

/**
 * Get cached products from localStorage for offline access
 */
export function getCachedProducts(): Record<string, ScannedProduct> {
    if (typeof window === 'undefined') return {};
    try {
        const cached = localStorage.getItem(PRODUCT_CACHE_KEY);
        return cached ? JSON.parse(cached) : {};
    } catch {
        return {};
    }
}

/**
 * Cache a product locally for offline access
 */
export function cacheProduct(product: ScannedProduct): void {
    if (typeof window === 'undefined') return;
    try {
        const cache = getCachedProducts();
        cache[product.barcode] = product;
        localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error('Failed to cache product:', e);
    }
}

/**
 * Parse weight from Open Food Facts quantity string (e.g., "500g", "1L")
 */
function parseWeight(quantity?: string): number | undefined {
    if (!quantity) return undefined;

    const match = quantity.match(/(\d+(?:\.\d+)?)\s*(g|kg|ml|l|oz)/i);
    if (!match) return undefined;

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
        case 'kg':
        case 'l':
            return value * 1000;
        case 'oz':
            return value * 28.35;
        default:
            return value;
    }
}

/**
 * Lookup product by barcode - checks local DB first, then Open Food Facts
 */
export async function lookupProduct(barcode: string): Promise<ScannedProduct | null> {
    // 1. Check offline cache first (for instant response)
    const cached = getCachedProducts();
    if (cached[barcode]) {
        console.log('Product found in offline cache:', barcode);
        return cached[barcode];
    }

    // 2. Check our Supabase database
    try {
        const { data: localProduct, error } = await supabase
            .from('scanned_products')
            .select('*')
            .eq('barcode', barcode)
            .single();

        if (localProduct && !error) {
            const product: ScannedProduct = {
                barcode: localProduct.barcode,
                name: localProduct.name,
                brand: localProduct.brand,
                weight_g: localProduct.weight_g,
                default_unit: localProduct.default_unit || 'g',
                image_url: localProduct.image_url,
                nutrition: localProduct.nutrition,
                source: 'local',
                food_item_id: localProduct.food_item_id
            };
            cacheProduct(product);
            return product;
        }
    } catch (e) {
        console.log('Local lookup failed, trying Open Food Facts...');
    }

    // 3. Query Open Food Facts API
    try {
        const response = await fetch(
            `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
            {
                headers: { 'User-Agent': 'Vitala/1.0 - Health App' },
                // Add cache control for better offline experience
                cache: 'force-cache'
            }
        );

        if (!response.ok) {
            console.log('Open Food Facts API error:', response.status);
            return null;
        }

        const data: OpenFoodFactsProduct = await response.json();

        if (data.status === 1 && data.product) {
            const p = data.product;
            const product: ScannedProduct = {
                barcode: barcode,
                name: p.product_name || 'Unknown Product',
                brand: p.brands,
                weight_g: parseWeight(p.quantity),
                default_unit: 'g',
                image_url: p.image_front_url || p.image_url,
                nutrition: p.nutriments ? {
                    energy_kcal: p.nutriments['energy-kcal_100g'],
                    protein_g: p.nutriments['proteins_100g'],
                    carbs_g: p.nutriments['carbohydrates_100g'],
                    fat_g: p.nutriments['fat_100g'],
                    fiber_g: p.nutriments['fiber_100g'],
                    sodium_mg: p.nutriments['sodium_100g'] ? p.nutriments['sodium_100g'] * 1000 : undefined
                } : undefined,
                source: 'openfoodfacts'
            };

            // Cache locally for offline access
            cacheProduct(product);

            // Also save to our database for future lookups
            await saveScannedProduct(product);

            return product;
        }
    } catch (e) {
        console.error('Open Food Facts lookup failed:', e);
    }

    return null;
}

/**
 * Save a scanned product to our database
 */
export async function saveScannedProduct(product: ScannedProduct): Promise<void> {
    try {
        const { error } = await supabase
            .from('scanned_products')
            .upsert({
                barcode: product.barcode,
                name: product.name,
                brand: product.brand,
                weight_g: product.weight_g,
                default_unit: product.default_unit,
                image_url: product.image_url,
                nutrition: product.nutrition,
                source: product.source,
                food_item_id: product.food_item_id,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'barcode',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('Failed to save scanned product:', error);
        }
    } catch (e) {
        console.error('Error saving scanned product:', e);
    }
}

/**
 * Record a purchase with price for budget tracking
 */
export async function recordPurchase(purchase: {
    scanned_product_id?: string;
    product_name: string;
    barcode?: string;
    quantity: number;
    unit: string;
    weight_g?: number;
    price?: number;
    currency?: string;
    store?: string;
    notes?: string;
}): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('User not authenticated');
            return false;
        }

        const { error } = await supabase
            .from('shopping_purchases')
            .insert({
                user_id: user.id,
                ...purchase,
                currency: purchase.currency || 'ZAR',
                purchased_at: new Date().toISOString()
            });

        if (error) {
            console.error('Failed to record purchase:', error);
            return false;
        }

        return true;
    } catch (e) {
        console.error('Error recording purchase:', e);
        return false;
    }
}

/**
 * Get purchase history for a user
 */
export async function getPurchaseHistory(limit = 50): Promise<any[]> {
    try {
        const { data, error } = await supabase
            .from('shopping_purchases')
            .select('*')
            .order('purchased_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error('Error fetching purchase history:', e);
        return [];
    }
}

/**
 * Get spending summary by time period
 */
export async function getSpendingSummary(days = 30): Promise<{
    totalSpent: number;
    itemCount: number;
    avgPerItem: number;
    byStore: Record<string, number>;
}> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
        const { data, error } = await supabase
            .from('shopping_purchases')
            .select('*')
            .gte('purchased_at', startDate.toISOString());

        if (error) throw error;

        const purchases = data || [];
        const totalSpent = purchases.reduce((sum, p) => sum + (p.price || 0), 0);
        const itemCount = purchases.length;
        const byStore: Record<string, number> = {};

        purchases.forEach(p => {
            if (p.store && p.price) {
                byStore[p.store] = (byStore[p.store] || 0) + p.price;
            }
        });

        return {
            totalSpent,
            itemCount,
            avgPerItem: itemCount > 0 ? totalSpent / itemCount : 0,
            byStore
        };
    } catch (e) {
        console.error('Error getting spending summary:', e);
        return { totalSpent: 0, itemCount: 0, avgPerItem: 0, byStore: {} };
    }
}

/**
 * Try to match a scanned product to an item in our food library
 */
export async function matchToFoodLibrary(productName: string): Promise<string | null> {
    try {
        // Simple fuzzy match - search for similar names
        const { data, error } = await supabase
            .from('food_items')
            .select('id, name, common_name')
            .or(`name.ilike.%${productName}%,common_name.ilike.%${productName}%`)
            .limit(1);

        if (error || !data || data.length === 0) return null;
        return data[0].id;
    } catch (e) {
        console.error('Error matching to food library:', e);
        return null;
    }
}
