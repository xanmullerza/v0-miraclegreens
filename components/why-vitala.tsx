import { Shield, Zap, Brain, Heart, Leaf, Sparkles, Bone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const benefits = [
	{
		icon: Leaf,
		title: 'Nutrient Density',
		description:
			'Prioritize foods with the highest concentration of vitamins and minerals per calorie.',
	},
	{
		icon: Shield,
		title: 'Immune Resilience',
		description:
			"Optimize your intake of vitamins C, A, and Zinc to strengthen natural defenses.",
	},
	{
		icon: Zap,
		title: 'Metabolic Energy',
		description:
			'Fuel your cells with precise micronutrients that drive ATP production and vitality.',
	},
	{
		icon: Brain,
		title: 'Cognitive Clarity',
		description:
			'Support neuro-regeneration and focus through antioxidant-rich biological protocols.',
	},
	{
		icon: Heart,
		title: 'Cardiac Health',
		description: 'Maintain cardiovascular efficiency through electrolyte and lipid balance.',
	},
	{
		icon: Bone,
		title: 'Structural Integrity',
		description:
			'Optimize bone and joint health through bioavailable calcium and mineral profiles.',
	},
	{
		icon: Leaf,
		title: 'Bio-Efficiency',
		description: 'Focus on foods with high bioavailability for maximum systemic absorption.',
	},
	{
		icon: Sparkles,
		title: 'Protocol Precision',
		description: 'Data-driven meal plans tailored to your unique biological requirements.',
	},
];

export function WhyVitala() {
	return (
		<section id="why-vitala" className="py-16 md:py-24 bg-muted/30">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
					<div>
						<p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
							Biological Intelligence
						</p>
						<h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
							Why Vitala?
						</h2>
						<p className="text-muted-foreground leading-relaxed mb-4">
							Optimal health isn't built on generic advice. It's built on <strong>biological precision</strong>. Vitala connects the dots between clinical data and your daily plate, ensuring every bite serves a purpose.
						</p>
						<p className="text-muted-foreground leading-relaxed">
							By focusing on high-density nutrition and bio-efficiency, we help you navigate the complex world of food choices. Whether you're optimizing performance or fighting deficiency, our protocols provide a data-driven path to wellness.
						</p>
					</div>
					<div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
						<Image
							src="/vitala-high-density-foods.png"
							alt="High-density whole foods"
							fill
							className="object-cover"
						/>
					</div>
				</div>

				<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
					{benefits.map((benefit) => (
						<div
							key={benefit.title}
							className="group bg-background rounded-xl p-6 border border-border hover:bg-primary/10 transition-all duration-300"
						>
							<div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
								<benefit.icon className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
							</div>
							<h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
							<p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
						</div>
					))}
				</div>

				{/* <div className="flex justify-center mt-8">
					<Button asChild size="lg" className="px-8">
						<Link href="/about-us">Find Out More</Link>
					</Button>
				</div> */}

			</div>
		</section>
	);
}
