import Image from "next/image"
import { TreeDeciduous, Leaf, Pill } from "lucide-react"

const processSteps = [
  {
    icon: TreeDeciduous,
    step: "01",
    name: "We Grow",
    description: "Sustainable moringa tree cultivation",
    detail:
      "We plant and nurture moringa trees on our farms, using organic and sustainable farming practices that benefit both the environment and local communities.",
    image: "/moringa-tree-farm-plantation-sustainable-agricultu.jpg",
  },
  {
    icon: Leaf,
    step: "02",
    name: "We Harvest",
    description: "Nutrient-rich leaf powder",
    detail:
      "Fresh moringa leaves are carefully harvested, dried naturally, and ground into fine powder that retains maximum nutritional value.",
    image: "/moringa-leaves-being-harvested-and-dried-green-pow.jpg",
  },
  {
    icon: Pill,
    step: "03",
    name: "We Distribute",
    description: "Capsules for the needy",
    detail:
      "The moringa powder is encapsulated and distributed free of charge to malnourished communities, clinics, and families in need.",
    image: "/moringa-capsules-supplements-being-distributed-to-.jpg",
  },
]

export function Categories() {
  return (
    <section id="process" className="py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Our Process</p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">From Seed to Service</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Every capsule represents our commitment to fighting malnutrition through the power of moringa.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {processSteps.map((step) => (
            <div key={step.name} className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
              <Image
                src={step.image || "/placeholder.svg"}
                alt={step.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute top-4 left-4 h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <step.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-sm text-white/60 mb-1">Step {step.step}</p>
                <h3 className="text-xl font-semibold text-white mb-1">{step.name}</h3>
                <p className="text-sm text-white/80 mb-3">{step.description}</p>
                <p className="text-sm text-white/70 leading-relaxed">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
