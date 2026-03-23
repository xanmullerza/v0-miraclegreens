'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    Loader2,
    Search,
    FlaskConical,
    ArrowRight,
    Trash2,
    Beaker,
    Sparkles,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LabView } from '@/app/(main)/foods/views/lab-view';

interface MixItem {
    id: string;
    name: string;
    description?: string;
    category?: string;
    ingredients?: any[];
    image?: string;
    created_at?: string;
}

export function MixLabView() {
    const router = useRouter();
    const [mixes, setMixes] = useState<MixItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSpiceLab, setShowSpiceLab] = useState(false);

    useEffect(() => {
        fetchMixes();
    }, []);

    const fetchMixes = async () => {
        setLoading(true);
        try {
            // For now, fetch from recipes table with a specific category or tag
            // In the future, this could be a dedicated 'concoctions' or 'mixes' table
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .or('category.ilike.%mix%,category.ilike.%blend%,category.ilike.%spice%,category.ilike.%condiment%,category.ilike.%sauce%')
                .order('name', { ascending: true });

            if (error) throw error;
            setMixes(data || []);
        } catch (error) {
            console.error('Error fetching mixes:', error);
            // Don't show error, just set empty
            setMixes([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredMixes = mixes.filter(mix =>
        mix.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mix.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sample categories for Mix Lab
    const mixCategories = [
        { name: 'Spice Blends', icon: '???', description: 'Garam masala, curry powder, za\'atar...', action: 'spicelab' },
        { name: 'Condiments', icon: '??', description: 'Homemade mayo, margarine, mustard...' },
        { name: 'Sauces', icon: '??', description: 'Pasta sauce, BBQ sauce, hot sauce...' },
        { name: 'Dressings', icon: '??', description: 'Vinaigrettes, ranch, tahini...' },
    ];

    const handleCategoryClick = (cat: typeof mixCategories[0]) => {
        if (cat.action === 'spicelab') {
            setShowSpiceLab(true);
        }
    };

    // If showing Spice Lab, render it with a back button
    if (showSpiceLab) {
        return (
            <div className="space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => setShowSpiceLab(false)}
                    className="text-muted-foreground hover:text-foreground font-black uppercase tracking-widest text-[10px]"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Mix Lab
                </Button>
                <LabView />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30">
                    <FlaskConical size={16} className="text-purple-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                        Mix Lab
                    </span>
                </div>
                <Button
                    onClick={() => router.push('/admin/recipebuilder?type=mix')}
                    className="bg-purple-500 hover:bg-purple-600 text-white rounded-full px-6"
                >
                    <Plus size={16} className="mr-2" />
                    Create New Mix
                </Button>
            </div>

            {/* Intro Section */}
            <div className="bg-muted/50 rounded-3xl p-8 border border-border">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-purple-500 text-white shadow-lg shadow-purple-500/20">
                        <Beaker size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                            DIY Concoctions
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Create and save your homemade spice blends, sauces, and condiments
                        </p>
                    </div>
                </div>

                {/* Category Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {mixCategories.map((cat) => (
                        <div
                            key={cat.name}
                            onClick={() => handleCategoryClick(cat)}
                            className="bg-card rounded-2xl p-4 border border-border hover:border-purple-500/30 hover:shadow-lg transition-all cursor-pointer group"
                        >
                            <div className="text-3xl mb-3">{cat.icon}</div>
                            <h3 className="font-bold text-sm text-foreground group-hover:text-purple-600 transition-colors">
                                {cat.name}
                            </h3>
                            <p className="text-[10px] text-muted-foreground/60 mt-1 line-clamp-2">
                                {cat.description}
                            </p>
                            {cat.action === 'spicelab' && (
                                <Badge className="mt-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] border-none uppercase font-black">
                                    Spice Lab
                                </Badge>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                    placeholder="Search your mixes..."
                    className="pl-12 h-14 rounded-2xl border-border bg-card shadow-sm focus:ring-purple-500 focus:border-purple-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Mixes List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="animate-spin text-purple-500" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Loading your mixes...</p>
                </div>
            ) : filteredMixes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-border rounded-[3rem]">
                    <div className="p-6 rounded-full bg-purple-500/10 mb-6">
                        <FlaskConical size={48} className="text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">No mixes yet</h3>
                    <p className="text-sm text-muted-foreground mb-6">Start creating your homemade concoctions!</p>
                    <Button
                        onClick={() => router.push('/admin/recipebuilder?type=mix')}
                        className="bg-purple-500 hover:bg-purple-600 text-white rounded-full px-8"
                    >
                        <Sparkles size={16} className="mr-2" />
                        Create Your First Mix
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMixes.map((mix) => (
                        <div
                            key={mix.id}
                            onClick={() => router.push(`/recipes/${mix.id}`)}
                            className="group bg-card rounded-2xl border border-border hover:border-purple-500/30 hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                        >
                            <div className="aspect-video bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/30 dark:to-fuchsia-900/30 flex items-center justify-center">
                                {mix.image ? (
                                    <img src={mix.image} alt={mix.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <FlaskConical size={48} className="text-purple-300" />
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-foreground group-hover:text-purple-600 transition-colors">
                                    {mix.name}
                                </h3>
                                {mix.category && (
                                    <Badge className="mt-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[9px] border-none uppercase font-black">
                                        {mix.category}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

