import { BookOpen, Headphones, PlayCircle } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const learningCategories = [
    {
        title: "Read",
        description: "Articles, scientific studies, and nutritional information for the knowledge seekers.",
        icon: BookOpen,
        href: "/browse/read",
        color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
        title: "Listen",
        description: "Podcasts and audio content for learning on the go.",
        icon: Headphones,
        href: "/browse/listen",
        color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
        title: "Watch",
        description: "Video tutorials, testimonials, and visual guides for hands-on learners.",
        icon: PlayCircle,
        href: "/browse/watch",
        color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    },
];

export default function BrowsePage() {
    return (
        <main className="min-h-screen flex flex-col">
            <Header />
            <div className="flex-1 bg-background py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-16">
                    <div className="text-center">
                        <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground sm:text-5xl">
                            Resource Library
                        </h1>
                        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                            Discover the power of Miracle Greens through multiple learning formats. Choose the one that fits your style.
                        </p>
                    </div>

                    {/* Learning Categories */}
                    <div>
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {learningCategories.map((category) => (
                                <Link
                                    key={category.title}
                                    href={category.href}
                                    className="group relative flex flex-col items-start p-8 bg-card rounded-2xl border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20"
                                >
                                    <div className={`p-4 rounded-xl ${category.color} mb-4 transition-transform group-hover:scale-110`}>
                                        <category.icon className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors">
                                        {category.title}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {category.description}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
