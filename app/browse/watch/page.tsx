import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PlayCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
    title: 'Watch - Miracle Greens',
    description: 'Video tutorials, testimonials, and visual guides about Moringa.',
};

export default function WatchPage() {
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
                        <div className="p-3 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            <PlayCircle className="h-8 w-8" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
                            Watch
                        </h1>
                    </div>

                    <p className="text-xl text-muted-foreground mb-12 max-w-2xl">
                        Video tutorials, testimonials, and visual guides for hands-on learners.
                    </p>

                    <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-muted/30">
                        <div className="max-w-md mx-auto">
                            <h3 className="text-lg font-semibold mb-2">Video Content Coming Soon</h3>
                            <p className="text-muted-foreground">
                                We are filming comprehensive guides on planting, processing, and using Moringa. Stay tuned for our visual library.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
