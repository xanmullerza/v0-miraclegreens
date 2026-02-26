import { TrendingDown, Award, Users, Scaling } from 'lucide-react';

const benefits = [
  {
    icon: TrendingDown,
    title: '60% Cost Reduction',
    description:
      'By eliminating sourcing costs and middlemen, each capsule costs significantly less — meaning more nutrition for more people.',
  },
  {
    icon: Award,
    title: 'Quality Guarantee',
    description:
      'When we control the entire process, we ensure every leaf is harvested at peak nutrition and processed under optimal conditions.',
  },
  {
    icon: Users,
    title: 'Community Employment',
    description:
      'Our farm will create jobs for local community members, providing income while producing nutrition for those in need.',
  },
  {
    icon: Scaling,
    title: 'Scalable Impact',
    description:
      'A self-sustaining farm can grow with demand, allowing us to reach more communities year after year.',
  },
];

export function Benefits() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

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
  );
}
