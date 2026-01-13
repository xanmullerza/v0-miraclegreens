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
import Link from 'next/link';

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
  'Your tree produces leaves for many years',
  'Each tree yields thousands of capsules annually',
  "Full transparency on your tree's impact",
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
                Invest in an Eternal Moringa Tree
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Right now, we source our moringa powder from trusted growers. But our vision is
                bigger — we want to grow and process our own trees. This means lower costs, better
                quality control, and the ability to help even more families.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                By sponsoring an Eternal Moringa Tree for R500, you are investing in our future.
                Your tree will be planted on our farm and will produce leaves for years to come,
                with every leaf processed for the community. Truly a gift that keeps giving.
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

              <Button size="lg" className="gap-2" asChild>
                <Link href="/donate">
                  <TreeDeciduous className="h-4 w-4" />
                  Donate — R500
                </Link>
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
                  <p className="text-sm opacity-80">One tree, for life</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
