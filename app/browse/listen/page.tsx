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

                    <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-muted/30">
                        <div className="max-w-md mx-auto">
                            <h3 className="text-lg font-semibold mb-2">Audio Studio in Progress</h3>
                            <p className="text-muted-foreground">
                                Our podcast series exploring the benefits of Moringa and stories from our community is currently in production.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
