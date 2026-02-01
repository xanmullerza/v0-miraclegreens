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

const nutritionalMarkers = [
  {
    icon: Leaf,
    title: 'Nutrient Concentration',
    description:
      'Identifying whole foods with the highest concentration of essential vitamins for systemic health.',
  },
  {
    icon: Heart,
    title: 'Cardiovascular Support',
    description:
      'Designing protocols that optimize lipid profiles and electrolyte balance for heart efficiency.',
  },
  {
    icon: Zap,
    title: 'Biological Energy',
    description:
      'Focusing on iron-rich and B-vitamin complexes that drive cellular energy production.',
  },
  {
    icon: Shield,
    title: 'Immune Resilience',
    description:
      'Using micronutrient data to build natural defenses against oxidative stress and infection.',
  },
  {
    icon: Brain,
    title: 'Neuro-Enhancement',
    description:
      'Selecting antioxidants and healthy fats known to support cognitive function and mental longevity.',
  },
  {
    icon: Bone,
    title: 'Mineral Integrity',
    description:
      'Ensuring precise intake of calcium, phosphorus, and vitamin D for skeletal strength.',
  },
];

const sponsorBenefits = [
  'Data points for personalized meal protocols',
  'Advanced clinical nutritional research',
  'Global food accessibility initiatives',
  'Priority access to future biological tools',
  'Digital certificate of nutritional impact',
  'Your name on our Research Wall',
];

export function FeaturedProducts() {
  return (
    <>
      <section id="sponsor" className="py-16 md:py-24 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
                Advancing Science
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-6">
                Invest in Nutritional Intelligence
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our legacy began with Moringa, but the future of Vitala is a global data ecosystem. We are building the tools to map every nutrient to its biological outcome, making optimal health an accessible reality for everyone.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                By supporting Vitala research for R500, you are funding the development of our open-source nutritional databases and the distribution of high-density meal protocols to communities in need. Join the optimization revolution.
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
                  src="/forest.png"
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
