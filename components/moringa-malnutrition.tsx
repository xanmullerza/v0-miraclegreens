import Image from 'next/image';

export function MoringaMalnutrition() {
    return (
        <section className="py-16 md:py-24 bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                        <Image
                            src="/african-children-healthy-smiling-community-nutriti.jpg"
                            alt="Healthy children in community"
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
                            Our Mission
                        </p>
                        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
                            Moringa in the Fight Against Malnutrition
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            The World Health Organization recognizes moringa as a key solution for addressing
                            malnutrition in developing countries. Just 6 spoonfuls of moringa powder can meet a
                            child&apos;s daily iron and calcium needs.
                        </p>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            For nursing mothers, moringa has been shown to significantly increase breast milk
                            production and nutritional quality, giving babies the best possible start in life.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            This is why Miracle Greens is committed to distributing moringa capsules to those
                            who need them most. When you support us, you&apos;re helping bring this superfood to
                            communities fighting hunger and malnutrition.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
