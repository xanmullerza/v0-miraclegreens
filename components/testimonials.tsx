import Image from "next/image"
import { Quote } from "lucide-react"

const testimonials = [
  {
    name: "Dr. Amara Okonkwo",
    role: "Community Health Director",
    image: "/african-woman-doctor-professional-headshot.jpg",
    content:
      "The moringa capsules from Miracle Greens have made a remarkable difference in our clinic. We've seen significant improvements in children suffering from malnutrition.",
  },
  {
    name: "Pastor Emmanuel Mensah",
    role: "Community Leader",
    image: "/african-man-pastor-community-leader-headshot.jpg",
    content:
      "Since partnering with Miracle Greens, our community has access to vital nutrition that was previously unavailable. The impact on our mothers and children has been life-changing.",
  },
  {
    name: "Maria Santos",
    role: "NGO Partner Coordinator",
    image: "/latina-woman-nonprofit-worker-headshot.jpg",
    content:
      "What sets Miracle Greens apart is their end-to-end approach – from growing the trees to distributing the capsules. Their commitment to those in need is unwavering.",
  },
]

export function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Stories of Impact</p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground text-balance">
            Voices From Our Community
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="bg-card rounded-2xl p-6 border border-border">
              <Quote className="h-8 w-8 text-primary/30 mb-4" />
              <p className="text-foreground leading-relaxed mb-6">"{testimonial.content}"</p>
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
