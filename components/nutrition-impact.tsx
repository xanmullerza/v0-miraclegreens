import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function NutritionImpact() {
    return (
        <section className="py-16 md:py-24 bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                        <Image
                            src="/african-children-healthy-smiling-community-nutriti.jpg"
                            alt="Healthy children in community"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
                            Our Mission
                        </p>
                        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
                            The Fight Against Malnutrition
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            High-density nutrition is the foundation of human performance and health. By optimizing the intake of micronutrients and essential minerals, we can address malnutrition and energy deficits globally.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            For developing communities, access to nutrient-dense protocols and superfoods can be life-changing, providing a sustainable way to meet daily biological requirements.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            This is why Vitala is committed to making nutritional intelligence accessible to everyone. We believe that better choices lead to better lives, regardless of where you are in the world.
                        </p>
                    </div>
                </div>

                {/* <div className="flex justify-center mt-12">
                    <Button asChild size="lg" className="px-8">
                        <Link href="/donate">Support Our Mission</Link>
                    </Button>
                </div> */}
            </div>
        </section>
    );
}
