"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RecipesPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard/recipes/meal-o-matic");
    }, [router]);

    return null;
}
