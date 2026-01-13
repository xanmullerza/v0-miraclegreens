import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Read - Miracle Greens',
    description: 'Articles, scientific studies, and nutritional information about Moringa.',
};

export default function ReadPage() {
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
                                    <div className="flex items-center gap-4">
                                        <Button variant="outline" size="sm" asChild>
                                            <a href="/nutrients-15-02011.pdf" target="_blank" rel="noopener noreferrer">
                                                <BookOpen className="mr-2 h-4 w-4" />
                                                Read Paper
                                            </a>
                                        </Button>
                                        <span className="text-xs text-muted-foreground">PDF • 335 KB</span>
                                    </div>
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
