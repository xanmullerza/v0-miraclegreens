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

                    <div className="grid gap-6">
                        <div className="group relative bg-card p-6 rounded-2xl border border-border transition-all hover:shadow-lg">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                        Complementary Feeding Practices and Childhood Malnutrition in South Africa
                                    </h3>
                                    <p className="text-muted-foreground mb-4 leading-relaxed">
                                        See the impact firsthand. This short film explores how we are using the "Miracle Tree" to combat malnutrition and build sustainable food systems in South Africa.
                                    </p>
                                </div>
                                <div className="w-full aspect-video bg-muted rounded-xl overflow-hidden relative">
                                    <video controls className="w-full h-full object-cover">
                                        <source src="/The_Moringa_Solution.mp4" type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            </div>
                        </div>

                        <div className="group relative bg-card p-6 rounded-2xl border border-border transition-all hover:shadow-lg">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                                        Moringa oleifera in South Africa: A Review on Production & Consumption
                                    </h3>
                                    <p className="text-muted-foreground mb-4 leading-relaxed">
                                        Discover the incredible potential of the Moringa tree. Learn about its nutritional benefits and why it represents hope for sustainable nutrition.
                                    </p>
                                </div>
                                <div className="w-full aspect-video bg-muted rounded-xl overflow-hidden relative">
                                    <video controls className="w-full h-full object-cover">
                                        <source src="/The_Miracle_Tree.mp4" type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            </div>
                        </div>

                        {/* Future placeholder */}
                        <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-muted/30 flex flex-col items-center justify-center">
                            <p className="text-muted-foreground">More videos coming soon...</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
