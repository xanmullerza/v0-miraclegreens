import { Utensils, Calendar, Activity, FileText, Microscope, PlayCircle } from "lucide-react";
import Link from "next/link";

const categories = [
    {
        title: "Recipes",
        description: "Delicious and healthy moringa-infused recipes.",
        icon: Utensils,
        href: "/browse/recipes",
        color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    },
    {
        title: "Meal Plans",
        description: "Structured plans to help you stay on track.",
        icon: Calendar,
        href: "/browse/meal-plans",
        color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    },
    {
        title: "Nutritional Info",
        description: "Detailed breakdown of Moringa's benefits.",
        icon: Activity,
        href: "/browse/nutrition",
        color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
        title: "Articles",
        description: "Read about the latest health trends and news.",
        icon: FileText,
        href: "/browse/articles",
        color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
        title: "Scientific Studies",
        description: "Research backing the power of Miracle Greens.",
        icon: Microscope,
        href: "/browse/studies",
        color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
    },
    {
        title: "Videos",
        description: "Watch tutorials, testimonials, and guides.",
        icon: PlayCircle,
        href: "/browse/videos",
        color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    },
];

export default function BrowsePage() {
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground sm:text-5xl">
                        Resource Library
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Explore our comprehensive collection of recipes, meal plans, nutritional information, and more to support your journey with Miracle Greens.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                        <Link
                            key={category.title}
                            href={category.href}
                            className="group relative flex flex-col items-start p-6 bg-card rounded-2xl border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20"
                        >
                            <div className={`p-3 rounded-xl ${category.color} mb-4 transition-transform group-hover:scale-110`}>
                                <category.icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-card-foreground mb-2 group-hover:text-primary transition-colors">
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
    );
}
