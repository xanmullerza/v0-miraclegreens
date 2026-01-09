import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-4">Premium Organic Foods</p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-tight text-balance">
              Nourish your body with nature's best
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Discover our curated selection of organic produce, superfoods, and wellness products. Sustainably sourced,
              thoughtfully delivered to your doorstep.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2">
                Shop Now
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Explore Categories
              </Button>
            </div>
            <div className="mt-12 flex items-center gap-8">
              <div>
                <p className="text-3xl font-semibold text-foreground">500+</p>
                <p className="text-sm text-muted-foreground">Organic Products</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <p className="text-3xl font-semibold text-foreground">50k+</p>
                <p className="text-sm text-muted-foreground">Happy Customers</p>
              </div>
              <div className="h-12 w-px bg-border hidden sm:block" />
              <div className="hidden sm:block">
                <p className="text-3xl font-semibold text-foreground">100%</p>
                <p className="text-sm text-muted-foreground">Natural</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
              <Image
                src="/fresh-organic-vegetables-and-fruits-arranged-beaut.jpg"
                alt="Fresh organic produce"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-xl shadow-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">🌱</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">100% Organic</p>
                  <p className="text-sm text-muted-foreground">Certified products</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
