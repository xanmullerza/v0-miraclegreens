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

                    <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-muted/30">
                        <div className="max-w-md mx-auto">
                            <h3 className="text-lg font-semibold mb-2">Library Under Construction</h3>
                            <p className="text-muted-foreground">
                                We are currently compiling and verifying scientific research and articles to ensure you get the most accurate information about Moringa. Check back soon.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
