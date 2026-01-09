import { Users, Globe, Sprout, HandHeart } from "lucide-react"

const benefits = [
  {
    icon: Sprout,
    title: "Sustainable Farming",
    description:
      "We employ eco-friendly agricultural practices and provide employment to local farmers in the communities we serve.",
  },
  {
    icon: Users,
    title: "Community Impact",
    description:
      "Every capsule distributed helps combat malnutrition in children, pregnant women, and vulnerable populations.",
  },
  {
    icon: HandHeart,
    title: "Free Distribution",
    description: "100% of our moringa capsules are distributed free of charge to those who need them most.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description:
      "We partner with clinics, schools, and NGOs worldwide to reach communities facing nutritional challenges.",
  },
]

export function Benefits() {
  return (
    <section id="impact" className="py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Our Impact</p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
            Making a Difference Together
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
