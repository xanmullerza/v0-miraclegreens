import Image from 'next/image';
import { Package, Leaf, TreeDeciduous } from 'lucide-react';

const journeySteps = [
  {
    icon: Package,
    step: '01',
    name: 'Now: We Source',
    description: 'Quality powder from trusted growers',
    detail:
      'We currently partner with experienced moringa growers to source the highest quality leaf powder. This ensures our capsules deliver maximum nutritional benefit to those in need.',
    image: '/cycle.jpg',
  },
  {
    icon: TreeDeciduous,
    step: '02',
    name: 'Vision: We Grow',
    description: 'Our own sustainable moringa farm',
    detail:
      "With your help, we'll establish our own moringa plantation — giving us full control over quality, sustainability, and the ability to scale our impact exponentially.",
    image: '/moringa-tree-farm-plantation-sustainable-agricultu.jpg',
  },
  {
    icon: Leaf,
    step: '03',
    name: 'Vision: We Process',
    description: 'End-to-end in-house production',
    detail:
      'Processing our own leaves means lower costs, higher quality, and the ability to distribute even more capsules to communities fighting malnutrition.',
    image: '/moringa-leaves-being-harvested-and-dried-green-pow.jpg',
  },
];

export function Categories() {
  return (
    <section id="story" className="py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            Our Journey
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
            From Sourcing to Growing
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            We&apos;ve built a strong foundation sourcing quality moringa. Now we&apos;re ready to
            take the next step — with your help.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {journeySteps.map((step, index) => (
            <div
              key={step.name}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted"
            >
              <Image
                src={step.image || '/placeholder.svg'}
                alt={step.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  <step.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                {index > 0 && (
                  <span className="px-2 py-1 text-xs font-medium bg-accent text-accent-foreground rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-sm text-white/60 mb-1">Step {step.step}</p>
                <h3 className="text-xl font-semibold text-white mb-1">{step.name}</h3>
                <p className="text-sm text-white/80 mb-3">{step.description}</p>
                <p className="text-sm text-white/70 leading-relaxed">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
