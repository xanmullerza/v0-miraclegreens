import Image from "next/image"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Health Coach",
    image: "/professional-woman-smiling-headshot.png",
    content:
      "Miracle Greens has completely transformed my approach to healthy eating. The quality of their organic produce is unmatched, and delivery is always on time.",
    rating: 5,
  },
  {
    name: "James Chen",
    role: "Fitness Enthusiast",
    image: "/athletic-man-smiling-headshot.jpg",
    content:
      "I've tried many superfood suppliers, but none compare to the freshness and variety offered here. My go-to for all my nutrition needs.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Yoga Instructor",
    image: "/woman-with-calm-expression-headshot.jpg",
    content:
      "The commitment to sustainability really sets them apart. I feel good knowing I'm supporting ethical farming practices with every purchase.",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Testimonials</p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground text-balance">
            What Our Customers Say
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="bg-card rounded-2xl p-6 border border-border">
              <Quote className="h-8 w-8 text-primary/30 mb-4" />
              <p className="text-foreground leading-relaxed mb-6">"{testimonial.content}"</p>
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-muted">
                  <Image
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
