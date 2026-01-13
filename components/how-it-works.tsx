import { ShoppingBag, Factory, Heart, Repeat } from 'lucide-react';

const steps = [
  {
    icon: ShoppingBag,
    step: '01',
    title: 'You Shop',
    description: 'Purchase moringa saplings, powder or capsules from our store at affordable prices.',
  },
  {
    icon: Factory,
    step: '02',
    title: 'We Produce',
    description: 'Your purchase funds the distribution of moringa leaf powder to families and communities fighting malnutrition.',
  },
  {
    icon: Heart,
    step: '03',
    title: 'We Donate',
    description: 'We distribute moringa leaf powder to families and communities fighting malnutrition.',
  },
  {
    icon: Repeat,
    step: '04',
    title: 'The Cycle Continues',
    description: 'Every sale sustains our mission, creating lasting impact for years to come.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-primary/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            Our Model
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
            How Your Purchase Makes a Difference
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            We&apos;re a social enterprise. When you buy from us, you&apos;re not just getting
            premium moringa products — you&apos;re funding nutrition for families who can&apos;t
            afford it.
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
