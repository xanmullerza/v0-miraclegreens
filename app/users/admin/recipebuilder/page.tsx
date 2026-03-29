'use client';

import { UserRecipeBuilder } from '@/components/maker/user-recipe-builder';
import { useRouter } from 'next/navigation';

export default function RecipeBuilderPage() {
    const router = useRouter();
    
    return (
        <div className="p-8">
            <UserRecipeBuilder 
                onSaveSuccess={(id) => {
                    router.push(`/recipes/${id}`);
                }} 
            />
        </div>
    );
}
