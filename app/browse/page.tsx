'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BookOpen, Headphones, PlayCircle, Search, ArrowRight, Sparkles, Filter } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '../../components/ui/badge';
import { cn } from '@/lib/utils';

// Mock data based on existing content
const allResources = [
    {
        id: '1',
        title: 'The Miracle Tree: A Review',
        type: 'watch',
        category: 'Watch',
        href: '/browse/watch#moringa-south-africa',
        description: 'Discover the incredible potential of the Moringa tree and its production in South Africa.',
        icon: PlayCircle,
        date: 'Recent',
        color: 'text-red-500 bg-red-100 dark:bg-red-900/30',
    },
    {
        id: '2',
        title: 'Childhood Malnutrition Study',
        type: 'read',
        category: 'Read',
        href: '/browse/read#malnutrition-south-africa',
        description: 'Scientific study on complementary feeding practices and malnutrition.',
        icon: BookOpen,
        date: 'Scientific Paper',
        color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
    },
    {
        id: '3',
        title: 'Moringa vs Malnutrition Podcast',
        type: 'listen',
        category: 'Listen',
        href: '/browse/listen#malnutrition-south-africa',
        description: 'Audio discussion on using Moringa leaf powder to fight malnutrition.',
        icon: Headphones,
        date: 'Podcast',
        color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
    },
    {
        id: '4',
        title: 'South African Production Review',
        type: 'read',
        category: 'Read',
        href: '/browse/read#moringa-south-africa',
        description: 'Comprehensive review of Moringa production and processing.',
        icon: BookOpen,
        date: 'Review',
        color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
    },
    {
        id: '5',
        title: 'The Moringa Solution',
        type: 'watch',
        category: 'Watch',
        href: '/browse/watch#malnutrition-south-africa',
        description: 'See the impact firsthand: combating malnutrition with sustainable food systems.',
        icon: PlayCircle,
        date: 'Documentary',
        color: 'text-red-500 bg-red-100 dark:bg-red-900/30',
    },
    {
        id: '6',
        title: 'Moringa The Miracle Tree Audio',
        type: 'listen',
        category: 'Listen',
        href: '/browse/listen#moringa-south-africa',
        description: 'Audio guide to the origins and benefits of the Miracle Tree.',
        icon: Headphones,
        date: 'Audio Guide',
        color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
    },
];

export default function BrowsePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'read' | 'watch' | 'listen'>('all');
    const [isListening, setIsListening] = useState(false);

    const filteredResources = allResources.filter(resource => {
        const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resource.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'all' || resource.type === activeFilter;
        return matchesSearch && matchesFilter;
    });

    return (
        <main className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
            <Header />

            <div className="flex-1">
                {/* Hero Section - Featured Resource */}
                <section className="relative overflow-hidden bg-slate-900 py-16 sm:py-24">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/50 z-10" />
                        <video
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="h-full w-full object-cover opacity-40 mix-blend-overlay"
                        >
                            <source src="/The_Miracle_Tree.mp4" type="video/mp4" />
                        </video>
                    </div>

                    <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-2xl">
                            <Badge className="mb-6 bg-primary/20 text-primary border-primary/20 backdrop-blur-sm px-4 py-1.5 text-sm uppercase tracking-wider">
                                Featured Resource
                            </Badge>
                            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">
                                The Miracle Tree
                            </h1>
                            <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
                                Discover why Moringa Oleifera is called the "Tree of Life."
                                A visual journey through its origins, nutritional power, and sustainable impact.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Button size="lg" className="h-14 px-8 text-lg gap-2" asChild>
                                    <Link href="/browse/watch#moringa-south-africa">
                                        <PlayCircle className="h-6 w-6" />
                                        Watch Now
                                    </Link>
                                </Button>
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg gap-2 text-white border-white/20 hover:bg-white/10 hover:text-white" asChild>
                                    <Link href="/browse/read">
                                        <BookOpen className="h-6 w-6" />
                                        Read Study
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
                    {/* Search and Navigation */}
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                            <h2 className="text-3xl font-bold font-serif text-foreground">Explore Resources</h2>
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder="Search articles, videos, podcasts..."
                                    className="pl-10 h-12 bg-card text-lg"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Bento Grid Categories */}
                        {!searchQuery && (
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 h-auto md:h-[400px]">
                                {/* Read - Large Square */}
                                <Link href="/browse/read" className="group md:col-span-3 relative overflow-hidden rounded-3xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 p-8 transition-all hover:shadow-xl hover:-translate-y-1">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10 h-full flex flex-col justify-between">
                                        <div className="p-4 rounded-2xl bg-blue-100 dark:bg-blue-900/50 w-fit text-blue-600 dark:text-blue-400">
                                            <BookOpen className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-bold text-foreground mb-2">Read</h3>
                                            <p className="text-muted-foreground text-lg">Deep dive into scientific studies and nutritional facts.</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="absolute bottom-8 right-8 h-6 w-6 text-blue-500 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                </Link>

                                <div className="md:col-span-3 grid grid-rows-2 gap-6">
                                    {/* Listen - Wide Rectangle */}
                                    <div
                                        onClick={() => setIsListening(!isListening)}
                                        className={cn(
                                            "group cursor-pointer relative overflow-hidden rounded-3xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 transition-all hover:shadow-xl",
                                            isListening ? "ring-2 ring-purple-500 shadow-lg h-auto" : "h-auto hover:-translate-y-1"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative z-10 p-8">
                                            <div className="flex items-center gap-6">
                                                <div className="p-4 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                                                    <Headphones className="h-8 w-8" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-2xl font-bold text-foreground">Listen</h3>
                                                    <p className="text-muted-foreground">{isListening ? 'Playing Podcast' : 'Podcasts for on-the-go.'}</p>
                                                </div>
                                            </div>

                                            {isListening && (
                                                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300" onClick={(e) => e.stopPropagation()}>
                                                    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl space-y-2 border border-purple-100/50 dark:border-purple-900/50">
                                                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Now Playing</p>
                                                        <p className="text-sm font-semibold truncate leading-tight">Moringa oleifera: A Review on Production & Consumption</p>
                                                        <audio controls className="w-full h-8 mt-2">
                                                            <source src="/Moringa_The_Miracle_Tree_in_South_Africa.m4a" type="audio/x-m4a" />
                                                        </audio>
                                                    </div>
                                                    <Link
                                                        href="/browse/listen"
                                                        className="inline-flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors"
                                                    >
                                                        Explore all episodes <ArrowRight className="h-4 w-4" />
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Watch - Wide Rectangle */}
                                    <Link href="/browse/watch" className="group relative overflow-hidden rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 p-8 transition-all hover:shadow-xl hover:-translate-y-1">
                                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative z-10 h-full flex items-center gap-6">
                                            <div className="p-4 rounded-2xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
                                                <PlayCircle className="h-8 w-8" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-foreground">Watch</h3>
                                                <p className="text-muted-foreground">Visual guides & tutorials.</p>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['all', 'read', 'watch', 'listen'].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter as any)}
                                className={cn(
                                    "px-6 py-2 rounded-full text-sm font-medium transition-all capitalize border",
                                    activeFilter === filter
                                        ? "bg-foreground text-background border-foreground"
                                        : "bg-transparent text-muted-foreground border-transparent hover:bg-muted"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* Resources Grid */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            <h3 className="text-lg font-medium">
                                {searchQuery ? 'Search Results' : 'Trending Now'}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredResources.map((resource) => (
                                <Link
                                    key={resource.id}
                                    href={resource.href}
                                    className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
                                >
                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={cn("p-2 rounded-lg", resource.color)}>
                                                <resource.icon className="h-6 w-6" />
                                            </div>
                                            <Badge variant="secondary" className="font-normal">
                                                {resource.date}
                                            </Badge>
                                        </div>
                                        <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                            {resource.title}
                                        </h4>
                                        <p className="text-muted-foreground text-sm line-clamp-3">
                                            {resource.description}
                                        </p>
                                    </div>
                                    <div className="px-6 py-4 bg-muted/30 border-t border-border mt-auto flex items-center text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                                        View {resource.category}
                                        <ArrowRight className="ml-auto h-4 w-4 transform transition-transform group-hover:translate-x-1" />
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {filteredResources.length === 0 && (
                            <div className="text-center py-20 text-muted-foreground">
                                <p className="text-lg">No resources found for "{searchQuery}"</p>
                                <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2 text-primary">
                                    Clear Search
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
