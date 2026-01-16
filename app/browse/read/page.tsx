'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BookOpen, ArrowLeft, Headphones, PlayCircle, X, Maximize2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';



export default function ReadPage() {
    const [listeningId, setListeningId] = useState<string | null>(null);
    const [watchingId, setWatchingId] = useState<string | null>(null);
    const [readingId, setReadingId] = useState<string | null>(null);
    const [fullScreenItem, setFullScreenItem] = useState<{
        type: 'pdf' | 'video';
        url: string;
        title: string;
    } | null>(null);

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
                                            <div className="flex items-center justify-between mb-2 px-2 pt-1 border-b border-red-100/50 dark:border-red-800/50 pb-2">
                                                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Video Documentary</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setFullScreenItem({ type: 'video', url: '/The_Moringa_Solution.mp4', title: 'The Moringa Solution' })}
                                                        className="text-muted-foreground hover:text-red-600 transition-colors"
                                                        title="Fullscreen"
                                                    >
                                                        <Maximize2 className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setWatchingId(null)} className="text-muted-foreground hover:text-foreground">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div
                                                className="group/video relative aspect-video rounded-lg overflow-hidden bg-black shadow-inner cursor-pointer"
                                                onClick={() => setFullScreenItem({ type: 'video', url: '/The_Moringa_Solution.mp4', title: 'The Moringa Solution' })}
                                            >
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/video:opacity-100 transition-opacity z-10 flex items-center justify-center">
                                                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-full">
                                                        <Maximize2 className="h-8 w-8 text-white" />
                                                    </div>
                                                </div>
                                                <video muted playsInline className="w-full h-full object-cover">
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
                                            <div className="flex items-center justify-between mb-2 px-2 pt-1 border-b border-blue-100/50 dark:border-blue-800/50 pb-2">
                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Research Document</span>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setFullScreenItem({ type: 'pdf', url: '/nutrients-15-02011.pdf', title: 'Malnutrition Study' })}
                                                        className="text-muted-foreground hover:text-blue-600 transition-colors"
                                                        title="Fullscreen"
                                                    >
                                                        <Maximize2 className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setReadingId(null)} className="text-muted-foreground hover:text-foreground">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div
                                                className="group/pdf relative w-full h-[400px] rounded-lg overflow-hidden bg-white border border-blue-100/50 cursor-pointer"
                                                onClick={() => setFullScreenItem({ type: 'pdf', url: '/nutrients-15-02011.pdf', title: 'Malnutrition Study' })}
                                            >
                                                <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover/pdf:opacity-100 transition-opacity z-10 flex items-center justify-center pointer-events-none">
                                                    <div className="bg-white shadow-xl p-3 rounded-full scale-90 group-hover/pdf:scale-100 transition-transform">
                                                        <div className="flex items-center gap-2 text-blue-600 font-bold px-1">
                                                            <Maximize2 className="h-5 w-5" />
                                                            <span>Click to expand</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <iframe
                                                    src="/nutrients-15-02011.pdf#toolbar=0&navpanes=0"
                                                    className="w-full h-full pointer-events-none"
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
                                            <div className="flex items-center justify-between mb-2 px-2 pt-1 border-b border-red-100/50 dark:border-red-800/50 pb-2">
                                                <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Visual Guide</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setFullScreenItem({ type: 'video', url: '/The_Miracle_Tree.mp4', title: 'The Miracle Tree' })}
                                                        className="text-muted-foreground hover:text-red-600 transition-colors"
                                                        title="Fullscreen"
                                                    >
                                                        <Maximize2 className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setWatchingId(null)} className="text-muted-foreground hover:text-foreground">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div
                                                className="group/video relative aspect-video rounded-lg overflow-hidden bg-black shadow-inner cursor-pointer"
                                                onClick={() => setFullScreenItem({ type: 'video', url: '/The_Miracle_Tree.mp4', title: 'The Miracle Tree' })}
                                            >
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/video:opacity-100 transition-opacity z-10 flex items-center justify-center">
                                                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-full">
                                                        <Maximize2 className="h-8 w-8 text-white" />
                                                    </div>
                                                </div>
                                                <video muted playsInline className="w-full h-full object-cover">
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
                                            <div className="flex items-center justify-between mb-2 px-2 pt-1 border-b border-blue-100/50 dark:border-blue-800/50 pb-2">
                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Production & Processing Review</span>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setFullScreenItem({ type: 'pdf', url: '/moringa_production_in_south_africa.pdf', title: 'Production Review' })}
                                                        className="text-muted-foreground hover:text-blue-600 transition-colors"
                                                        title="Fullscreen"
                                                    >
                                                        <Maximize2 className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setReadingId(null)} className="text-muted-foreground hover:text-foreground">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div
                                                className="group/pdf relative w-full h-[400px] rounded-lg overflow-hidden bg-white border border-blue-100/50 cursor-pointer"
                                                onClick={() => setFullScreenItem({ type: 'pdf', url: '/moringa_production_in_south_africa.pdf', title: 'Production Review' })}
                                            >
                                                <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover/pdf:opacity-100 transition-opacity z-10 flex items-center justify-center pointer-events-none">
                                                    <div className="bg-white shadow-xl p-3 rounded-full scale-90 group-hover/pdf:scale-100 transition-transform">
                                                        <div className="flex items-center gap-2 text-blue-600 font-bold px-1">
                                                            <Maximize2 className="h-5 w-5" />
                                                            <span>Click to expand</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <iframe
                                                    src="/moringa_production_in_south_africa.pdf#toolbar=0&navpanes=0"
                                                    className="w-full h-full pointer-events-none"
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

            {/* Fullscreen Modal */}
            {fullScreenItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 p-4 md:p-8">
                    <div className="relative w-full h-full max-w-7xl flex flex-col">
                        <div className="flex justify-between items-center mb-4 text-white">
                            <h3 className="text-xl md:text-2xl font-serif font-bold truncate pr-8">{fullScreenItem.title}</h3>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white border border-white/20 hover:bg-white/10 hover:text-white gap-2 h-10 px-4"
                                    asChild
                                >
                                    <a href={fullScreenItem.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                        <span>{fullScreenItem.type === 'pdf' ? 'Download PDF' : 'Download Video'}</span>
                                    </a>
                                </Button>
                                <button
                                    onClick={() => setFullScreenItem(null)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="h-8 w-8 text-white" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-2xl relative">
                            {fullScreenItem.type === 'pdf' ? (
                                <iframe
                                    src={fullScreenItem.url}
                                    className="w-full h-full border-none"
                                    title={fullScreenItem.title}
                                />
                            ) : (
                                <video controls autoPlay className="w-full h-full bg-black">
                                    <source src={fullScreenItem.url} type="video/mp4" />
                                </video>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
