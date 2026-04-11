import Image from 'next/image';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Dr. Amara Okonkwo',
    role: 'Community Health Director',
    image: '/african-woman-doctor-professional-headshot.jpg',
    content:
      "The quality of BookoFood's recipe collection tools is exceptional. They've built a platform that truly understands home cooks — I've seen a massive shift in how our community approaches cooking and meal planning.",
  },
  {
    name: 'Samuel Ndlovu',
    role: 'Nutrition Research Partner',
    image: '/african-man-farmer-headshot.jpg',
    content:
      "BookoFood insists on the highest standards when it comes to recipe management. Their vision to make personal recipe books accessible to everyone is exactly what home cooks need.",
  },
  {
    name: 'Maria Santos',
    role: 'Wellness Coordinator',
    image: '/latina-woman-nonprofit-worker-headshot.jpg',
    content:
      "BookoFood is brilliant. It's not just a recipe app — it's a complete kitchen companion that empowers people to discover, organize, and share their love of food effortlessly.",
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
