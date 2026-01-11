'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  TreeDeciduous,
  Heart,
  Leaf,
  Zap,
  Shield,
  Brain,
  Bone,
  Check,
  Infinity,
} from 'lucide-react';

const moringaBenefits = [
  {
    icon: Leaf,
    title: 'Rich in Nutrients',
    description:
      'Moringa contains vitamins A, C, E, calcium, potassium, and protein – essential nutrients for fighting malnutrition.',
  },
  {
    icon: Heart,
    title: 'Supports Heart Health',
    description:
      'The antioxidants in moringa help lower cholesterol and support cardiovascular health in communities we serve.',
  },
  {
    icon: Zap,
    title: 'Natural Energy Boost',
    description:
      'Iron-rich moringa helps combat fatigue and anemia, providing sustainable energy for daily activities.',
  },
  {
    icon: Shield,
    title: 'Immune Support',
    description:
      'High vitamin C content strengthens immune systems, protecting vulnerable populations from illness.',
  },
  {
    icon: Brain,
    title: 'Cognitive Function',
    description:
      'Antioxidants and neuro-enhancers in moringa support brain health and cognitive development in children.',
  },
  {
    icon: Bone,
    title: 'Strong Bones',
    description:
      'Calcium and phosphorus content supports bone development and helps prevent osteoporosis.',
  },
];

const sponsorBenefits = [
  'Your tree produces leaves for 20+ years',
  'Each tree yields thousands of capsules annually',
  'Full transparency on your tree&apos;s impact',
  'Certificate of sponsorship with tree location',
  'Regular updates on harvest and distribution',
  'Your name on our Wall of Growth',
];

export function FeaturedProducts() {
  return (
    <>
      <section id="sponsor" className="py-16 md:py-24 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
                Help Us Grow
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-6">
                Invest in an Eternal Moringa Tree — R500
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Right now, we source our moringa powder from trusted growers. But our vision is
                bigger — we want to grow and process our own trees. This means lower costs, better
                quality control, and the ability to help even more families.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                By sponsoring an Eternal Moringa Tree for R500, you&apos;re investing in our future.
                Your tree will be planted on our farm and will produce leaves for 20+ years — a gift
                that keeps giving.
              </p>

              <div className="space-y-3 mb-8">
                {sponsorBenefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>

              <Button size="lg" className="gap-2">
                <TreeDeciduous className="h-4 w-4" />
                Sponsor a Tree — R500
              </Button>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
                <Image
                  src="/images/moringa-farm.svg"
                  alt="Our future moringa tree farm"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-primary p-6 rounded-xl shadow-lg">
                <div className="text-center text-primary-foreground">
                  <Infinity className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">R500</p>
                  <p className="text-sm opacity-80">One tree, forever</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="vision" className="py-16 md:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
              Our Vision
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Why Growing Our Own Changes Everything
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              By establishing our own moringa farm and processing facility, we can dramatically
              increase our impact while reducing costs and ensuring the highest quality for those we
              serve.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                title: 'Lower Costs',
                desc: 'Eliminate sourcing markups and reduce per-capsule cost by up to 60%',
              },
              {
                title: 'Quality Control',
                desc: 'Oversee every step from seed to capsule for maximum nutritional value',
              },
              {
                title: 'Sustainability',
                desc: 'Build a self-sustaining operation that grows with community needs',
              },
              {
                title: 'Local Jobs',
                desc: 'Create employment opportunities in the communities we serve',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-card rounded-2xl p-6 border border-border text-center"
              >
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="mission" className="py-16 md:py-24 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
                Why Moringa
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-6">
                The Miracle Tree That Transforms Lives
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Known as the &quot;Miracle Tree,&quot; moringa oleifera has been used for centuries
                to combat malnutrition. Its leaves contain more vitamin A than carrots, more calcium
                than milk, more iron than spinach, and more potassium than bananas.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                By growing moringa and distributing its benefits as easy-to-take capsules,
                we&apos;re providing a sustainable solution to nutritional deficiency in underserved
                communities.
              </p>
            </div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
              <Image
                src="/images/moringa-powder.svg"
                alt="Moringa powder and capsules"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {moringaBenefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
