import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Leaf,
  FlaskConical,
  Globe,
  Heart,
  Shield,
  Zap,
  Brain,
  Bone,
  Eye,
  Baby,
} from 'lucide-react';

export const metadata = {
  title: 'About Moringa - The Miracle Tree | Miracle Greens',
  description:
    'Learn about the incredible nutritional benefits, history, and science behind Moringa oleifera - the Miracle Tree.',
};

const nutritionFacts = [
  { nutrient: 'Vitamin A', comparison: '4x more than carrots', amount: '6,780 mcg per 100g' },
  { nutrient: 'Vitamin C', comparison: '7x more than oranges', amount: '220 mg per 100g' },
  { nutrient: 'Calcium', comparison: '4x more than milk', amount: '440 mg per 100g' },
  { nutrient: 'Potassium', comparison: '3x more than bananas', amount: '1,324 mg per 100g' },
  { nutrient: 'Iron', comparison: '3x more than spinach', amount: '7 mg per 100g' },
  { nutrient: 'Protein', comparison: '2x more than yogurt', amount: '9.4 g per 100g' },
];

const healthBenefits = [
  {
    icon: Shield,
    title: 'Boosts Immune System',
    description:
      'Moringa is loaded with vitamin C, beta-carotene, and quercetin — powerful antioxidants that strengthen the immune system and help the body fight infections and diseases.',
  },
  {
    icon: Zap,
    title: 'Increases Energy Naturally',
    description:
      'Rich in iron and B vitamins, moringa helps transport oxygen throughout the body and supports energy metabolism without the crash associated with caffeine.',
  },
  {
    icon: Brain,
    title: 'Supports Brain Health',
    description:
      "Contains vitamins E and C which combat oxidative stress linked to Alzheimer's and Parkinson's. The neuro-enhancer properties support memory and cognitive function.",
  },
  {
    icon: Heart,
    title: 'Promotes Heart Health',
    description:
      'Moringa helps control lipid levels in the blood, prevents plaque formation in arteries, and reduces cholesterol levels, supporting overall cardiovascular health.',
  },
  {
    icon: Bone,
    title: 'Strengthens Bones',
    description:
      'With high levels of calcium, phosphorus, and magnesium, moringa supports bone density and helps prevent conditions like osteoporosis.',
  },
  {
    icon: Eye,
    title: 'Improves Eye Health',
    description:
      'The high beta-carotene content protects eye cells from damage and may help prevent macular degeneration and cataracts.',
  },
  {
    icon: Leaf,
    title: 'Reduces Inflammation',
    description:
      'Contains isothiocyanates, flavonoids, and phenolic acids that suppress inflammatory enzymes and proteins in the body.',
  },
  {
    icon: Baby,
    title: 'Combats Malnutrition',
    description:
      'Used by organizations worldwide to treat malnutrition in children and nursing mothers due to its complete nutritional profile and easy digestibility.',
  },
];

export default function AboutMoringaPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
                The Miracle Tree
              </p>
              <h1 className="font-serif text-4xl md:text-5xl font-semibold text-foreground mb-6">
                Moringa Oleifera
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                Known as the &quot;Miracle Tree,&quot; &quot;Tree of Life,&quot; or
                &quot;Mother&apos;s Best Friend,&quot; Moringa oleifera is one of the most
                nutrient-dense plants ever discovered. Native to the foothills of the Himalayas in
                India, it now grows throughout tropical and subtropical regions worldwide.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                For over 4,000 years, moringa has been revered in traditional medicine systems
                including Ayurveda, which documents its use in treating over 300 diseases. Today,
                modern science is confirming what ancient healers knew all along.
              </p>
            </div>
            <div className="relative aspect-square rounded-2xl overflow-hidden">
              <Image
                src="/moringa-tree-full-view-with-green-leaves-sunlight.jpg"
                alt="Moringa tree in sunlight"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="py-16 md:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
              Ancient Wisdom
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
              A History of Healing
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-muted/30 rounded-xl p-6 border border-border">
              <Globe className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Ancient Origins</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                First cultivated in India over 4,000 years ago, moringa was used by ancient warriors
                for strength and stamina. Egyptian pharaohs used moringa oil in cosmetics and
                medicines.
              </p>
            </div>
            <div className="bg-muted/30 rounded-xl p-6 border border-border">
              <FlaskConical className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Traditional Medicine</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Ayurvedic medicine documents moringa treating 300+ conditions including diabetes,
                infections, and inflammation. Romans, Greeks, and Egyptians extracted oil from the
                seeds for perfumes.
              </p>
            </div>
            <div className="bg-muted/30 rounded-xl p-6 border border-border">
              <Leaf className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Modern Recognition</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Today, the WHO, FAO, and numerous NGOs promote moringa as a solution to
                malnutrition. Over 1,300 scientific studies have validated its nutritional and
                medicinal properties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nutrition Facts */}
      <section className="py-16 md:py-24 bg-primary/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
              The Science
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Nutritional Powerhouse
            </h2>
            <p className="text-muted-foreground">
              Gram for gram, dried moringa leaves contain more nutrients than most common
              superfoods.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nutritionFacts.map((fact) => (
              <div
                key={fact.nutrient}
                className="bg-background rounded-xl p-6 border border-border"
              >
                <h3 className="text-xl font-semibold text-primary mb-1">{fact.nutrient}</h3>
                <p className="text-foreground font-medium mb-2">{fact.comparison}</p>
                <p className="text-sm text-muted-foreground">{fact.amount}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 bg-background rounded-xl p-6 border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Complete Amino Acid Profile
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Moringa is one of the few plant sources that contains all 9 essential amino acids,
              making it a complete protein. This is especially valuable for vegetarians, vegans, and
              communities with limited access to animal protein. The leaves also contain 46
              antioxidants, 36 anti-inflammatory compounds, and 27 vitamins and minerals.
            </p>
          </div>
        </div>
      </section>

      {/* Health Benefits */}
      <section className="py-16 md:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
              Proven Benefits
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Health Benefits of Moringa
            </h2>
            <p className="text-muted-foreground">
              Backed by over 1,300 scientific studies, moringa offers a wide range of health
              benefits.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {healthBenefits.map((benefit) => (
              <div key={benefit.title} className="bg-muted/30 rounded-xl p-6 border border-border">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fighting Malnutrition */}
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
                Moringa in the Fight Against Malnutrition
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The World Health Organization recognizes moringa as a key solution for addressing
                malnutrition in developing countries. Just 6 spoonfuls of moringa powder can meet a
                child&apos;s daily iron and calcium needs.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For nursing mothers, moringa has been shown to significantly increase breast milk
                production and nutritional quality, giving babies the best possible start in life.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This is why Miracle Greens is committed to distributing moringa capsules to those
                who need them most. When you support us, you&apos;re helping bring this superfood to
                communities fighting hunger and malnutrition.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4">
            Be Part of the Solution
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Help us bring the miracle of moringa to communities in need. Every purchase and
            sponsorship helps us distribute capsules to those fighting malnutrition.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#shop">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Shop & Support
              </Button>
            </Link>
            <Link href="/#sponsor">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
              >
                Sponsor a Tree
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm opacity-70">
            &copy; {new Date().getFullYear()} Miracle Greens. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
