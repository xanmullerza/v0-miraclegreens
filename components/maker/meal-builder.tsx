'use client';

import { UserRecipeBuilder } from './user-recipe-builder';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MealBuilderContent({ onBack }: { onBack?: () => void }) {
    const router = useRouter();
    
    return (
        <div className="space-y-6">
            {onBack && (
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="text-muted-foreground hover:text-foreground font-black uppercase tracking-widest text-[10px]"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Menu
                </Button>
            )}
            <UserRecipeBuilder 
                defaultType="meal" 
                onSaveSuccess={(id) => {
                    router.push(`/recipes/${id}`);
                }}
            />
        </div>
    );
}
