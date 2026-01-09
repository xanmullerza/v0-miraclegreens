"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Heart, Star } from "lucide-react"

const products = [
  {
    id: 1,
    name: "Organic Avocados",
    price: 8.99,
    originalPrice: 12.99,
    rating: 4.9,
    reviews: 124,
    image: "/fresh-organic-avocados-on-white-background.jpg",
    badge: "Best Seller",
  },
  {
    id: 2,
    name: "Chia Seeds Premium",
    price: 14.99,
    originalPrice: null,
    rating: 4.8,
    reviews: 89,
    image: "/chia-seeds-in-wooden-bowl.jpg",
    badge: "Organic",
  },
  {
    id: 3,
    name: "Raw Honey Collection",
    price: 18.99,
    originalPrice: 24.99,
    rating: 5.0,
    reviews: 256,
    image: "/raw-organic-honey-jar-with-honeycomb.jpg",
    badge: "Sale",
  },
  {
    id: 4,
    name: "Mixed Berry Blend",
    price: 12.99,
    originalPrice: null,
    rating: 4.7,
    reviews: 67,
    image: "/mixed-berries-blueberries-raspberries-strawberries.jpg",
    badge: "New",
  },
  {
    id: 5,
    name: "Green Superfood Powder",
    price: 34.99,
    originalPrice: 44.99,
    rating: 4.9,
    reviews: 198,
    image: "/green-superfood-powder-in-container-with-spinach-k.jpg",
    badge: "Popular",
  },
  {
    id: 6,
    name: "Organic Quinoa",
    price: 9.99,
    originalPrice: null,
    rating: 4.8,
    reviews: 145,
    image: "/organic-quinoa-in-glass-jar.jpg",
    badge: "Organic",
  },
]

export function FeaturedProducts() {
  const [wishlist, setWishlist] = useState<number[]>([])

  const toggleWishlist = (id: number) => {
    setWishlist((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  return (
    <section id="shop" className="py-16 md:py-24 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Featured Products</p>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">Customer Favorites</h2>
          </div>
          <Button variant="outline">View All Products</Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-square bg-muted">
                <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                {product.badge && (
                  <span className="absolute top-3 left-3 px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                    {product.badge}
                  </span>
                )}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-3 right-3 h-9 w-9 rounded-full bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card transition-colors"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      wishlist.includes(product.id) ? "fill-destructive text-destructive" : "text-foreground"
                    }`}
                  />
                </button>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="text-sm font-medium text-foreground">{product.rating}</span>
                  <span className="text-sm text-muted-foreground">({product.reviews})</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-foreground">${product.price.toFixed(2)}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <Button size="sm" className="gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
