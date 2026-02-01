import Image from 'next/image';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Dr. Amara Okonkwo',
    role: 'Community Health Director',
    image: '/african-woman-doctor-professional-headshot.jpg',
    content:
      "The quality of Vitala's nutritional protocols is exceptional. They've built a platform that truly understands biological needs — I've seen a massive shift in how our patients approach their daily eating habits.",
  },
  {
    name: 'Samuel Ndlovu',
    role: 'Nutrition Research Partner',
    image: '/african-man-farmer-headshot.jpg',
    content:
      "Vitala insists on the highest standards of data integrity and food quality. Their vision to provide personalized, science-backed nutrition for everyone is exactly what the industry needs.",
  },
  {
    name: 'Maria Santos',
    role: 'Wellness Coordinator',
    image: '/latina-woman-nonprofit-worker-headshot.jpg',
    content:
      "The Vitala Biological Protocol is brilliant. It's not just a meal planner — it's an education system that empowers people to take control of their health through density-focused nutrition.",
  },
];

export function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            Stories of Impact
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground text-balance">
            Voices From Our Community
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="bg-card rounded-2xl p-6 border border-border">
              <Quote className="h-8 w-8 text-primary/30 mb-4" />
              <p className="text-foreground leading-relaxed mb-6">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full overflow-hidden bg-muted">
                  <Image
                    src={testimonial.image || '/placeholder.svg'}
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
  );
}
