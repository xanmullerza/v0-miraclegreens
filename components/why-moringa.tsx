import { Shield, Zap, Brain, Heart, Leaf, Sparkles, Bone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const benefits = [
	{
		icon: Leaf,
		title: 'Rich in Nutrients',
		description:
			'Moringa contains vitamins A, C, E, calcium, potassium, and protein – essential nutrients for fighting malnutrition.',
	},
	{
		icon: Shield,
		title: 'Immune Booster',
		description:
			'Rich in vitamin C, vitamin A, and iron to strengthen your body&apos;s natural defenses.',
	},
	{
		icon: Zap,
		title: 'Energy Booster',
		description:
			'Packed with B vitamins and iron to combat fatigue and increase natural energy levels.',
	},
	{
		icon: Brain,
		title: 'Brain Health',
		description:
			'Contains antioxidants and neuro-enhancers that support cognitive function, mental clarity, and healthy development.',
	},
	{
		icon: Heart,
		title: 'Heart Health',
		description: 'Helps maintain healthy cholesterol levels and supports cardiovascular function.',
	},
	{
		icon: Bone,
		title: 'Strong Bones',
		description:
			'High levels of calcium and phosphorus support bone development and help prevent osteoporosis.',
	},
	{
		icon: Leaf,
		title: 'Anti-Inflammatory',
		description: 'Contains isothiocyanates that help reduce inflammation throughout the body.',
	},
	{
		icon: Sparkles,
		title: 'Complete Nutrition',
		description: 'All 9 essential amino acids, 27 vitamins, and 46 antioxidants in one superfood.',
	},
];

export function WhyMoringa() {
	return (
		<section id="why-moringa" className="py-16 md:py-24 bg-muted/30">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
					<div>
						<p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
							The Miracle Tree
						</p>
						<h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
							Why Moringa?
						</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							Moringa oleifera, known as the &quot;Miracle Tree&quot; or &quot;Tree of Life,&quot;
							has been used for centuries across Africa and Asia for its remarkable nutritional and
							medicinal properties. Every part of this extraordinary plant offers benefits.
						</p>
						<p className="text-muted-foreground leading-relaxed">
							Its leaves contain more vitamin A than carrots, more calcium than milk,
							more iron than spinach, and more potassium than bananas. By growing moringa and
							distributing its benefits as easy-to-take capsules, we're providing a sustainable
							solution to nutritional deficiency in underserved communities.
						</p>
					</div>
					<div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
						<Image
							src="/moringa-leaves-close-up-green-vibrant-natural-supe.jpg"
							alt="Fresh moringa leaves"
							fill
							className="object-cover"
						/>
					</div>
				</div>

				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
					{benefits.map((benefit) => (
						<div
							key={benefit.title}
							className="bg-background rounded-xl p-6 border border-border hover:border-primary/30 transition-colors"
						>
							<div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
								<benefit.icon className="h-6 w-6 text-primary" />
							</div>
							<h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
							<p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
						</div>
					))}
				</div>

				<div className="flex justify-center mt-8">
					<Button asChild size="lg" className="px-8">
						<Link href="/browse">Find Out More</Link>
					</Button>
				</div>

			</div>
		</section>
	);
}
