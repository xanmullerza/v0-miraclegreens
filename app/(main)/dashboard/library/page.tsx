"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IngredientsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/foods");
    }, [router]);

    return null;
}

