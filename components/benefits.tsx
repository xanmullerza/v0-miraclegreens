import { Truck, Leaf, Shield, Sparkles } from "lucide-react"

const benefits = [
  {
    icon: Leaf,
    title: "100% Organic",
    description: "All our products are certified organic, free from pesticides and harmful chemicals.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Fresh products delivered to your doorstep within 24-48 hours of ordering.",
  },
  {
    icon: Shield,
    title: "Quality Guarantee",
    description: "Not satisfied? We offer a 100% money-back guarantee on all products.",
  },
  {
    icon: Sparkles,
    title: "Sustainably Sourced",
    description: "We partner with local farmers committed to sustainable farming practices.",
  },
]

export function Benefits() {
  return (
    <section id="about" className="py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Why Choose Us</p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
            The Miracle Greens Difference
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <benefit.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
