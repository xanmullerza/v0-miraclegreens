'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BookOpen, PlayCircle, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '../../components/ui/badge';
import { cn } from '@/lib/utils';



export default function BrowsePage() {
    const [searchQuery, setSearchQuery] = useState('');



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
                        <div className="grid grid-cols-1 gap-6">
                            {/* Read - Large Square */}
                            <Link href="/browse/read" className="group relative overflow-hidden rounded-3xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 p-8 md:p-12 transition-all hover:shadow-xl hover:-translate-y-1 min-h-[300px] flex items-center">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        <div className="p-5 rounded-2xl bg-blue-100 dark:bg-blue-900/50 w-fit text-blue-600 dark:text-blue-400">
                                            <BookOpen className="h-10 w-10" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Read Category</h3>
                                            <p className="text-muted-foreground text-xl max-w-xl">Deep dive into scientific studies, nutritional facts, and comprehensive research papers.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-blue-600 font-bold text-lg">
                                        <span>Start Reading</span>
                                        <ArrowRight className="h-6 w-6 transform transition-transform group-hover:translate-x-2" />
                                    </div>
                                </div>
                            </Link>


                        </div>
                    </div>


                </div>
            </div>
            <Footer />
        </main>
    );
}
