import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Headphones, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Listen - Miracle Greens',
    description: 'Podcasts and audio content for learning about Moringa on the go.',
};

export default function ListenPage() {
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
                        <div className="p-3 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                            <Headphones className="h-8 w-8" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                            Listen
                        </h1>
                    </div>

                    <p className="text-xl text-muted-foreground mb-12 max-w-2xl">
                        Podcasts and audio content for learning on the go.
                    </p>

                    <div className="grid gap-6">
                        <div id="moringa-south-africa" className="group relative bg-card p-6 rounded-2xl border border-border transition-all hover:shadow-lg">
                            <div className="flex flex-col sm:flex-row items-start gap-6">
                                <div className="h-24 w-24 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                                    <Headphones className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="flex-1 w-full">
                                    <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                        Moringa: The Miracle Tree in South Africa
                                    </h3>
                                    <p className="text-muted-foreground mb-4 leading-relaxed">
                                        A deep dive into how Moringa Oleifera is transforming health and agriculture across South Africa. Learn about its origins, benefits, and the community impact.
                                    </p>
                                    <div className="w-full bg-muted/50 rounded-full p-2">
                                        <audio controls className="w-full h-8">
                                            <source src="/Moringa_The_Miracle_Tree_in_South_Africa.m4a" type="audio/x-m4a" />
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Future placeholder */}
                        <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-muted/30 flex flex-col items-center justify-center">
                            <p className="text-muted-foreground">More episodes coming soon...</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
