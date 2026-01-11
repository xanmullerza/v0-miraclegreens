import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { TreeDeciduous, Pill, ExternalLink, Star } from 'lucide-react';

const products = [
  {
    icon: TreeDeciduous,
    name: 'Moringa Sapling',
    description:
      'Grow your own miracle tree at home. Easy to care for and produces nutritious leaves year-round.',
    price: 'R150',
    image: '/moringa-tree-sapling-being-planted-hands-in-soil-.jpg',
    features: ['Ready to plant', 'Care guide included', 'Grows in most climates'],
    rating: 4.9,
    reviews: 127,
  },
  {
    icon: Pill,
    name: 'Moringa Capsules',
    description:
      'Premium moringa leaf powder in easy-to-take capsules. 60 capsules per bottle, one month supply.',
    price: 'R250',
    image: '/moringa-powder-and-capsules-on-wooden-surface-with.jpg',
    features: ['60 capsules', '100% pure moringa', 'Lab tested quality'],
    rating: 4.8,
    reviews: 243,
  },
];

export function ShopSection() {
  return (
    <section id="shop" className="py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            Shop With Purpose
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
            Buy for Yourself, Give to Others
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Every product you purchase directly funds moringa capsules for families in need. Quality
            products, meaningful impact.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{product.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{product.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{product.description}</p>
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
                  <p className="text-2xl font-bold text-foreground">{product.price}</p>
                  <Button className="gap-2">
                    Buy Now
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Looking for bulk orders or corporate gifting?
          </p>
          <Button variant="outline" className="gap-2 bg-transparent">
            Contact Us for Bulk Pricing
          </Button>
        </div>
      </div>
    </section>
  );
}
