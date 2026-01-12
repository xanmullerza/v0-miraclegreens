
import { Calendar, Utensils } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const plannerCategories = [
    {
        title: "Meal Plans",
        description: "Structured plans to help you stay on track.",
        icon: Calendar,
        href: "/plan/meal-plans",
        color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    },
    {
        title: "Recipes",
        description: "Delicious and healthy moringa-infused recipes.",
        icon: Utensils,
        href: "/plan/recipes",
        color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    },
];

export default function PlanPage() {
    return (
        <main className="min-h-screen flex flex-col">
            <Header />
            <div className="flex-1 bg-background py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-16">
                    <div className="text-center">
                        <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground sm:text-5xl">
                            Meal Planner
                        </h1>
                        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                            Plan your journey to health with our curated meal plans and delicious recipes.
                        </p>
                    </div>

                    {/* Planner Section */}
                    <div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
                            {plannerCategories.map((category) => (
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
                                    <p className="text-muted-foreground text-sm">
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
