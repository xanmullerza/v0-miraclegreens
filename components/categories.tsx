import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

const categories = [
  {
    name: "Fresh Produce",
    description: "Organic fruits & vegetables",
    image: "/fresh-organic-fruits-and-vegetables-basket.jpg",
    count: "120+ items",
  },
  {
    name: "Superfoods",
    description: "Nutrient-dense essentials",
    image: "/superfoods-acai-berries-chia-seeds-quinoa.jpg",
    count: "85+ items",
  },
  {
    name: "Supplements",
    description: "Natural vitamins & minerals",
    image: "/natural-supplements-vitamins-bottles-on-wooden-sur.jpg",
    count: "65+ items",
  },
]

export function Categories() {
  return (
    <section id="categories" className="py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Our Categories</p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">Shop by Category</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href="#"
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted"
            >
              <Image
                src={category.image || "/placeholder.svg"}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-sm text-white/80 mb-1">{category.count}</p>
                <h3 className="text-xl font-semibold text-white mb-1">{category.name}</h3>
                <p className="text-sm text-white/80">{category.description}</p>
              </div>
              <div className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="h-5 w-5 text-white" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
