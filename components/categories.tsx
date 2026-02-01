import Image from 'next/image';
import { Package, Leaf, TreeDeciduous } from 'lucide-react';

const journeySteps = [
  {
    icon: Leaf,
    step: '01',
    name: 'Foundation: Data',
    description: 'Aggregating global nutritional markers',
    detail:
      'We started by collecting clinical data on superfoods like Moringa. This provided the blueprint for understanding how high-density nutrients interact with human biology.',
    image: '/cycle.jpg',
  },
  {
    icon: TreeDeciduous,
    step: '02',
    name: 'Expansion: Intelligence',
    description: 'Dynamic biological meal protocols',
    detail:
      "We are evolving into a comprehensive intelligence platform. Our focus has expanded to all whole foods, enabling us to curate precise protocols for any health objective.",
    image: '/vitala-research-lab.png',
  },
  {
    icon: Package,
    step: '03',
    name: 'Future: Ecosystem',
    description: 'Unified health performance platform',
    detail:
      'The final phase of Vitala is a complete health ecosystem. From DNA-aligned supplementation to AI-driven recipe architecture, we are building the future of human optimization.',
    image: '/products.jpg',
  },
];

export function Categories() {
  return (
    <section id="story" className="py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            The Vision
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
            From Moringa to Biological Intelligence
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Our journey began with a single superfood. Today, Vitala has grown into a comprehensive platform for nutritional excellence and biological optimization.
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
                    {index === 1 ? 'Coming Soon' : 'Coming Later'}
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
