'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BookOpen, PlayCircle, Search, ArrowRight, ArrowLeft, Headphones, X, Maximize2, ExternalLink, Download, Sparkles, Baby, Sprout, Leaf, Activity, Microscope } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '../../components/ui/badge';
import { cn } from '@/lib/utils';



const resources = [
    {
        id: 'malnutrition',
        title: 'Complementary Feeding Practices and Childhood Malnutrition in South Africa',
        description: 'A comprehensive narrative review exploring Moringa leaf powder as a malnutrition fortificant.',
        pdfUrl: '/nutrients-15-02011.pdf',
        audioUrl: '/Moringa_Powder_Combats_South_African_Malnutrition.m4a',
        videoUrl: '/The_Moringa_Solution.mp4',
        pdfSize: '335 KB',
        source: 'Nutrients',
        icon: Baby,
        iconColor: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20'
    },
    {
        id: 'production',
        title: 'Moringa oleifera in South Africa: A Review on Production & Consumption',
        description: 'High-level research on growing conditions, production, and processing within South Africa.',
        pdfUrl: '/moringa_production_in_south_africa.pdf',
        audioUrl: '/Moringa_The_Miracle_Tree_in_South_Africa.m4a',
        videoUrl: '/The_Miracle_Tree.mp4',
        pdfSize: '415 KB',
        source: 'Research Review',
        icon: Sprout,
        iconColor: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
        id: 'amino-acids',
        title: 'Amino acid and mineral composition of moringa',
        description: 'Detailed analysis of the essential amino acids and rich mineral profile found in Moringa leaves.',
        pdfUrl: '/Amino acid and mineral composition of moringa.pdf',
        audioUrl: '/Amino acid and mineral composition of moringa.m4a',
        videoUrl: '/Amino acid and mineral composition of moringa.mp4',
        pdfSize: '610 KB',
        source: 'Composition Study',
        icon: Microscope,
        iconColor: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
        id: 'nutritive-review',
        title: 'Moringa - Nutritive Review',
        description: 'A comprehensive review of the pharmacological properties and nutritional value of the Miracle Tree.',
        pdfUrl: '/Moringa - Nutritive Review.pdf',
        audioUrl: '/Moringa - Nutritive Review.m4a',
        videoUrl: '/Moringa - Nutritive Review.mp4',
        pdfSize: '1.4 MB',
        source: 'Nutritive Review',
        icon: Leaf,
        iconColor: 'text-green-500 bg-green-50 dark:bg-green-900/20'
    },
    {
        id: 'prominent-nutrients',
        title: 'Moringa oleifera as a Prominent Source of Nutrients',
        description: 'Evaluation of Moringa as a sustainable solution for food security and nutrient fortification.',
        pdfUrl: '/Moringa oleifera as a Prominent Source of Nutrients.pdf',
        audioUrl: '/Moringa oleifera as a Prominent Source of Nutrients.m4a',
        videoUrl: '/Moringa oleifera as a Prominent Source of Nutrients.mp4',
        pdfSize: '719 KB',
        source: 'Nutrient Source Study',
        icon: Activity,
        iconColor: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
    }
];

export default function BrowsePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [listeningId, setListeningId] = useState<string | null>(null);
    const [watchingId, setWatchingId] = useState<string | null>(null);
    const [readingId, setReadingId] = useState<string | null>(null);
    const [fullScreenItem, setFullScreenItem] = useState<{
        type: 'pdf' | 'video';
        url: string;
        title: string;
    } | null>(null);

    const filteredResources = resources.filter(res =>
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                                Nutritional Intelligence
                            </h1>
                            <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
                                Access our curated library of clinical studies and research papers. From high-density superfoods like Moringa to broader nutritional science, we provide the data behind the protocols.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    size="lg"
                                    className="h-14 px-8 text-lg gap-2"
                                    onClick={() => {
                                        setWatchingId('production');
                                        setTimeout(() => document.getElementById('resource-production')?.scrollIntoView({ behavior: 'smooth' }), 100);
                                    }}
                                >
                                    <PlayCircle className="h-6 w-6" />
                                    Watch Now
                                </Button>

                            </div>
                        </div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Search and Navigation */}
                    <div className="space-y-12">
                        <div className="flex flex-col md:flex-row gap-6 items-center justify-between border-b pb-8">
                            <div>
                                <h2 className="text-4xl font-bold font-serif text-foreground mb-2">Knowledge Base</h2>
                                <p className="text-muted-foreground text-lg">Deep dive into scientific studies and comprehensive research.</p>
                            </div>
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder="Search articles, videos, podcasts..."
                                    className="pl-10 h-12 bg-card text-lg rounded-xl shadow-sm border-muted-foreground/20"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Knowledge Base List */}
                        <div id="knowledge-base" className="space-y-2">
                            {/* Resource Rows */}
                            <div className="space-y-3">
                                {filteredResources.map((res) => (
                                    <div
                                        key={res.id}
                                        id={`resource-${res.id}`}
                                        className={cn(
                                            "group flex flex-col rounded-2xl border transition-all hover:bg-primary/10",
                                            (readingId === res.id || watchingId === res.id || listeningId === res.id)
                                                ? "bg-primary/10 border-primary/20 shadow-sm"
                                                : "bg-card border-border shadow-none"
                                        )}
                                    >
                                        <div className="md:grid grid-cols-12 gap-4 items-center px-6 py-4">
                                            {/* Custom Theme Icon */}
                                            <div className="hidden md:block col-span-1">
                                                <div className={cn("p-2.5 w-fit rounded-xl transition-transform group-hover:scale-110 duration-300", res.iconColor)}>
                                                    <res.icon className="h-6 w-6" />
                                                </div>
                                            </div>

                                            {/* Title & Description */}
                                            <div className="col-span-12 md:col-span-7 space-y-1">
                                                <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                                                    {res.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground md:line-clamp-1 group-hover:line-clamp-none transition-all">
                                                    {res.description}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="col-span-12 md:col-span-4 flex items-center justify-end gap-2 mt-4 md:mt-0">
                                                <Button
                                                    variant={readingId === res.id ? "default" : "ghost"}
                                                    size="sm"
                                                    onClick={() => {
                                                        setReadingId(readingId === res.id ? null : res.id);
                                                        setListeningId(null);
                                                        setWatchingId(null);
                                                    }}
                                                    className="gap-2 rounded-lg"
                                                >
                                                    <BookOpen className="h-4 w-4" />
                                                    <span className="hidden lg:inline">{readingId === res.id ? 'Close' : 'Read'}</span>
                                                </Button>
                                                {res.audioUrl && (
                                                    <Button
                                                        variant={listeningId === res.id ? "default" : "ghost"}
                                                        size="sm"
                                                        onClick={() => {
                                                            setListeningId(listeningId === res.id ? null : res.id);
                                                            setWatchingId(null);
                                                            setReadingId(null);
                                                        }}
                                                        className="gap-2 rounded-lg"
                                                    >
                                                        <Headphones className="h-4 w-4" />
                                                        <span className="hidden lg:inline">{listeningId === res.id ? 'Close' : 'Listen'}</span>
                                                    </Button>
                                                )}
                                                {res.videoUrl && (
                                                    <Button
                                                        variant={watchingId === res.id ? "default" : "ghost"}
                                                        size="sm"
                                                        onClick={() => {
                                                            setWatchingId(watchingId === res.id ? null : res.id);
                                                            setListeningId(null);
                                                            setReadingId(null);
                                                        }}
                                                        className="gap-2 rounded-lg"
                                                    >
                                                        <PlayCircle className="h-4 w-4" />
                                                        <span className="hidden lg:inline">{watchingId === res.id ? 'Close' : 'Watch'}</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expandable Content Area */}
                                        <div className="px-6 overflow-hidden">
                                            {/* Video Player */}
                                            {watchingId === res.id && (
                                                <div className="pb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl group/video">
                                                        <video controls autoPlay className="w-full h-full object-cover">
                                                            <source src={res.videoUrl!} type="video/mp4" />
                                                        </video>
                                                        <div className="absolute top-4 right-4 flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                className="bg-black/50 backdrop-blur-md text-white border-0 hover:bg-black/70"
                                                                onClick={() => setFullScreenItem({ type: 'video', url: res.videoUrl!, title: res.title })}
                                                            >
                                                                <Maximize2 className="h-4 w-4 mr-2" />
                                                                Fullscreen
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="secondary"
                                                                className="bg-black/50 backdrop-blur-md text-white border-0 hover:bg-black/70"
                                                                onClick={() => setWatchingId(null)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Audio Player */}
                                            {listeningId === res.id && (
                                                <div className="pb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                                    <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 flex flex-col md:flex-row items-center gap-4">
                                                        <div className="flex-1 w-full">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono tracking-tighter">AUDIO SUMMARY • {res.source}</span>
                                                                <button onClick={() => setListeningId(null)} className="text-muted-foreground hover:text-foreground">
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                            <audio controls className="w-full h-10">
                                                                <source src={res.audioUrl!} type="audio/x-m4a" />
                                                            </audio>
                                                        </div>
                                                        <Button variant="outline" size="sm" asChild className="shrink-0 gap-2 border-purple-200 text-purple-600 hover:bg-purple-100">
                                                            <a href={res.audioUrl!} download={res.audioUrl!.split('/').pop()}>
                                                                <Download className="h-4 w-4" />
                                                                Download
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* PDF Viewer */}
                                            {readingId === res.id && (
                                                <div className="pb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                                    <div className="relative h-[600px] rounded-2xl overflow-hidden bg-white border border-blue-100 shadow-xl group/pdf">
                                                        <iframe
                                                            src={`${res.pdfUrl}#toolbar=0&navpanes=0`}
                                                            className="w-full h-full border-none"
                                                            title={res.title}
                                                        />
                                                        <div className="absolute top-4 right-4 flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                className="bg-white/90 backdrop-blur-md shadow-sm border-blue-100 text-blue-600 hover:bg-white"
                                                                onClick={() => setFullScreenItem({ type: 'pdf', url: res.pdfUrl, title: res.title })}
                                                            >
                                                                <Maximize2 className="h-4 w-4 mr-2" />
                                                                Fullscreen View
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="secondary"
                                                                className="bg-white/90 backdrop-blur-md shadow-sm border-blue-100 text-blue-600 hover:bg-white"
                                                                onClick={() => setReadingId(null)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {filteredResources.length === 0 && (
                                    <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-muted-foreground/30">
                                        <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                        <p className="text-xl text-muted-foreground font-medium">No articles found matching "{searchQuery}"</p>
                                        <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2 text-primary">
                                            Clear search query
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Future placeholder */}
                        <div className="rounded-3xl border-2 border-dashed border-muted-foreground/20 p-12 text-center bg-muted/5 flex flex-col items-center justify-center">
                            <Sparkles className="h-8 w-8 text-amber-500/50 mb-3" />
                            <p className="text-muted-foreground text-lg font-medium italic">Our library is growing. New research papers are added regularly.</p>
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
                                    <a
                                        href={fullScreenItem.url}
                                        download={fullScreenItem.url.split('/').pop()}
                                    >
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
