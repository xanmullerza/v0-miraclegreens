'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BookOpen, ArrowLeft, Headphones, PlayCircle, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';



export default function ReadPage() {
    const [listeningId, setListeningId] = useState<string | null>(null);
    const [watchingId, setWatchingId] = useState<string | null>(null);
    const [readingId, setReadingId] = useState<string | null>(null);

    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Header />
            <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <Button variant="ghost" asChild className="pl-0 gap-2 hover:bg-transparent hover:text-primary">
                            <Link href="/browse">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Resources
                            </Link>
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <BookOpen className="h-8 w-8" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                            Read
                        </h1>
                    </div>

                    <p className="text-xl text-muted-foreground mb-12 max-w-2xl">
                        Articles, scientific studies, and nutritional information for the knowledge seekers.
                    </p>

                    <div className="grid gap-6">
                        <div className="group relative bg-card p-6 rounded-2xl border border-border transition-all hover:shadow-lg">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                        Complementary Feeding Practices and Childhood Malnutrition in South Africa
                                    </h3>
                                    <p className="text-muted-foreground mb-4 leading-relaxed">
                                        A comprehensive narrative review exploring the potential of Moringa Oleifera leaf powder as a fortificant to fight childhood malnutrition. Published in <em>Nutrients</em> (2023).
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Button
                                            variant={readingId === 'malnutrition' ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => {
                                                setReadingId(readingId === 'malnutrition' ? null : 'malnutrition');
                                                setListeningId(null);
                                                setWatchingId(null);
                                            }}
                                            className="gap-2"
                                        >
                                            <BookOpen className="h-4 w-4" />
                                            {readingId === 'malnutrition' ? 'Close Paper' : 'Read Paper'}
                                        </Button>
                                        <Button
                                            variant={listeningId === 'malnutrition' ? "default" : "secondary"}
                                            size="sm"
                                            onClick={() => {
                                                setListeningId(listeningId === 'malnutrition' ? null : 'malnutrition');
                                                setWatchingId(null);
                                                setReadingId(null);
                                            }}
                                            className="gap-2"
                                        >
                                            <Headphones className="h-4 w-4" />
                                            {listeningId === 'malnutrition' ? 'Close Player' : 'Listen to Podcast'}
                                        </Button>
                                        <Button
                                            variant={watchingId === 'malnutrition' ? "default" : "secondary"}
                                            size="sm"
                                            onClick={() => {
                                                setWatchingId(watchingId === 'malnutrition' ? null : 'malnutrition');
                                                setListeningId(null);
                                                setReadingId(null);
                                            }}
                                            className="gap-2"
                                        >
                                            <PlayCircle className="h-4 w-4" />
                                            {watchingId === 'malnutrition' ? 'Close Video' : 'Watch Video'}
                                        </Button>
                                        <span className="text-xs text-muted-foreground ml-1">PDF • 335 KB</span>
                                    </div>

                                    {watchingId === 'malnutrition' && (
                                        <div className="mt-4 p-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between mb-2 px-2 pt-1">
                                                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Video Documentary</span>
                                                <button onClick={() => setWatchingId(null)} className="text-muted-foreground hover:text-foreground">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="aspect-video rounded-lg overflow-hidden bg-black shadow-inner">
                                                <video controls className="w-full h-full">
                                                    <source src="/The_Moringa_Solution.mp4" type="video/mp4" />
                                                </video>
                                            </div>
                                        </div>
                                    )}

                                    {listeningId === 'malnutrition' && (
                                        <div className="mt-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Audio Summary</span>
                                                <button onClick={() => setListeningId(null)} className="text-muted-foreground hover:text-foreground">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <audio controls className="w-full h-8">
                                                <source src="/Moringa_Powder_Combats_South_African_Malnutrition.m4a" type="audio/x-m4a" />
                                            </audio>
                                        </div>
                                    )}

                                    {readingId === 'malnutrition' && (
                                        <div className="mt-4 p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between mb-2 px-2 pt-1">
                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Research Document</span>
                                                <div className="flex gap-2">
                                                    <a href="/nutrients-15-02011.pdf" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center">
                                                        Open Fullscreen
                                                    </a>
                                                    <button onClick={() => setReadingId(null)} className="text-muted-foreground hover:text-foreground">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="w-full h-[600px] rounded-lg overflow-hidden bg-white border border-blue-100/50">
                                                <iframe
                                                    src="/nutrients-15-02011.pdf"
                                                    className="w-full h-full"
                                                    title="Malnutrition Study"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="group relative bg-card p-6 rounded-2xl border border-border transition-all hover:shadow-lg">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                        Moringa oleifera in South Africa: A Review on Production & Consumption
                                    </h3>
                                    <p className="text-muted-foreground mb-4 leading-relaxed">
                                        This review highlights research on growing conditions, production, processing, and the consumption of Moringa as a food source within South Africa.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Button
                                            variant={readingId === 'production' ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => {
                                                setReadingId(readingId === 'production' ? null : 'production');
                                                setListeningId(null);
                                                setWatchingId(null);
                                            }}
                                            className="gap-2"
                                        >
                                            <BookOpen className="h-4 w-4" />
                                            {readingId === 'production' ? 'Close Paper' : 'Read Paper'}
                                        </Button>
                                        <Button
                                            variant={listeningId === 'production' ? "default" : "secondary"}
                                            size="sm"
                                            onClick={() => {
                                                setListeningId(listeningId === 'production' ? null : 'production');
                                                setWatchingId(null);
                                                setReadingId(null);
                                            }}
                                            className="gap-2"
                                        >
                                            <Headphones className="h-4 w-4" />
                                            {listeningId === 'production' ? 'Close Player' : 'Listen to Podcast'}
                                        </Button>
                                        <Button
                                            variant={watchingId === 'production' ? "default" : "secondary"}
                                            size="sm"
                                            onClick={() => {
                                                setWatchingId(watchingId === 'production' ? null : 'production');
                                                setListeningId(null);
                                                setReadingId(null);
                                            }}
                                            className="gap-2"
                                        >
                                            <PlayCircle className="h-4 w-4" />
                                            {watchingId === 'production' ? 'Close Video' : 'Watch Video'}
                                        </Button>
                                        <span className="text-xs text-muted-foreground ml-1">PDF • 415 KB</span>
                                    </div>

                                    {watchingId === 'production' && (
                                        <div className="mt-4 p-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between mb-2 px-2 pt-1">
                                                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Visual Guide</span>
                                                <button onClick={() => setWatchingId(null)} className="text-muted-foreground hover:text-foreground">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="aspect-video rounded-lg overflow-hidden bg-black shadow-inner">
                                                <video controls className="w-full h-full">
                                                    <source src="/The_Miracle_Tree.mp4" type="video/mp4" />
                                                </video>
                                            </div>
                                        </div>
                                    )}

                                    {listeningId === 'production' && (
                                        <div className="mt-4 p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Audio Review</span>
                                                <button onClick={() => setListeningId(null)} className="text-muted-foreground hover:text-foreground">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <audio controls className="w-full h-8">
                                                <source src="/Moringa_The_Miracle_Tree_in_South_Africa.m4a" type="audio/x-m4a" />
                                            </audio>
                                        </div>
                                    )}

                                    {readingId === 'production' && (
                                        <div className="mt-4 p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between mb-2 px-2 pt-1">
                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Production & Processing Review</span>
                                                <div className="flex gap-2">
                                                    <a href="/moringa_production_in_south_africa.pdf" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center">
                                                        Open Fullscreen
                                                    </a>
                                                    <button onClick={() => setReadingId(null)} className="text-muted-foreground hover:text-foreground">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="w-full h-[600px] rounded-lg overflow-hidden bg-white border border-blue-100/50">
                                                <iframe
                                                    src="/moringa_production_in_south_africa.pdf"
                                                    className="w-full h-full"
                                                    title="Production Review"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Future placeholder */}
                        <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-muted/30 flex flex-col items-center justify-center">
                            <p className="text-muted-foreground">More research papers coming soon...</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
