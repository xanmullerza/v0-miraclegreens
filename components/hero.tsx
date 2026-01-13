import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Heart } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-tight text-balance">
              Nutrition for everyone
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              We sell premium moringa saplings and capsules to the public. Every purchase funds the
              production and distribution of moringa capsules to families fighting malnutrition.
              Shop with purpose — your wellness supports their health.
            </p>
            <div className="mt-8">
              <Button size="lg" className="gap-2" asChild>
                <a href="/shop">
                  <ShoppingBag className="h-4 w-4" />
                  Shop Now
                </a>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
              <Image
                src="/child_with_plant.jpg"
                alt="Child with plant"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Every Sale Gives Back</p>
                  <p className="text-sm text-muted-foreground">
                    Profits fund capsules for the needy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
