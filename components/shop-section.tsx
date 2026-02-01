import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { TreeDeciduous, Pill, ExternalLink, Leaf } from 'lucide-react';

const products = [
	{
		icon: TreeDeciduous,
		name: 'Vitala Starter Seedlings',
		description:
			'Begin your journey with high-density greens at home. Easy to care for and produces nutrient-rich leaves year-round.',
		price: 'R125',
		image: '/moringa-tree-sapling-being-planted-hands-in-soil-.jpg',
		features: [
			'Bio-optimized growth',
			'Step-by-step care guide',
			'High mineral yield',
		],
	},
	{
		icon: Leaf,
		name: 'Vitala Density Powder',
		description:
			'Pure, bioavailable nutritional powerhouse. Perfect for smoothies, soups, and protocol-based wellness.',
		price: 'R150',
		image: '/powder.png',
		features: ['250g precision pack', '100% pure isolate', 'High micronutrient boost'],
	},
	{
		icon: Pill,
		name: 'Vitala Precision Capsules',
		description:
			'Clean, lab-tested nutritional density in easy-to-take format. Optimized for systemic absorption.',
		price: 'R100',
		image: '/moringa-powder-and-capsules-on-wooden-surface-with.jpg',
		features: ['90 capsules', 'Clinically pure', 'Lab tested quality'],
	},
];

export function ShopSection() {
	return (
		<section id="shop" className="py-16 md:py-24 bg-background">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-12">
					<p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
						Protocol Resources
					</p>
					<h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
						Power Your Biological Goals
					</h2>
					<p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
						Every purchase supports the research and distribution of nutritional intelligence to communities worldwide. Premium products, scientific impact.
					</p>
				</div>

				<div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
					{products.map((product) => (
						<div
							key={product.name}
							className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
						>
							<div className="aspect-[4/3] relative bg-muted">
								<Image
									src={product.image || '/placeholder.svg'}
									alt={product.name}
									fill
									className="object-cover"
								/>
							</div>
							<div className="p-6">
								<h3 className="text-xl font-semibold text-foreground mb-2">
									{product.name}
								</h3>
								<p className="text-muted-foreground text-sm mb-4">
									{product.description}
								</p>
								<ul className="space-y-1 mb-6">
									{product.features.map((feature) => (
										<li
											key={feature}
											className="text-sm text-muted-foreground flex items-center gap-2"
										>
											<div className="h-1.5 w-1.5 rounded-full bg-primary" />
											{feature}
										</li>
									))}
								</ul>
								<div className="flex items-center justify-between">
									<p className="text-2xl font-bold text-foreground">
										{product.price}
									</p>
									<Button className="gap-2">
										Buy Now
										<ExternalLink className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
