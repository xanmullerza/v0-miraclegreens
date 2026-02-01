import { ShoppingBag, Factory, Heart, Repeat } from 'lucide-react';

const steps = [
  {
    icon: ShoppingBag,
    step: '01',
    title: 'Data Collection',
    description: 'We aggregate clinical nutritional data from global biological databases.',
  },
  {
    icon: Factory,
    step: '02',
    title: 'Protocol Analysis',
    description: 'Our system analyzes food items to identify the highest density of essential nutrients.',
  },
  {
    icon: Heart,
    step: '03',
    title: 'Personalized Planning',
    description: 'We architect daily nutrition protocols tailored to your unique biological metrics.',
  },
  {
    icon: Repeat,
    step: '04',
    title: 'Continual Optimization',
    description: 'Your protocols evolve as your body changes, ensuring sustained high performance.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-primary/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            The Protocol
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
            How Vitala Optimizes Your Life
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            We provide a scientific bridge between complex nutritional data and your daily eating habits.
            Our multi-step process ensures you get the density you need to perform at your peak.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-full h-0.5 bg-primary/20" />
              )}
              <div className="bg-card rounded-2xl p-6 border border-border relative z-10">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center mb-4">
                  <step.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <p className="text-xs font-medium text-primary mb-2">Step {step.step}</p>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
