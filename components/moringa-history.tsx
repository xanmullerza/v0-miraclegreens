import { Globe, FlaskConical, Leaf } from 'lucide-react';

export function MoringaHistory() {
    return (
        <section className="py-16 md:py-24 bg-background">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto text-center mb-12">
                    <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
                        Ancient Wisdom
                    </p>
                    <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
                        A History of Healing
                    </h2>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-muted/30 rounded-xl p-6 border border-border">
                        <Globe className="h-8 w-8 text-primary mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Ancient Origins</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            First cultivated in India over 4,000 years ago, moringa was used by ancient warriors
                            for strength and stamina. Egyptian pharaohs used moringa oil in cosmetics and
                            medicines.
                        </p>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-6 border border-border">
                        <FlaskConical className="h-8 w-8 text-primary mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Traditional Medicine</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Ayurvedic medicine documents moringa treating 300+ conditions including diabetes,
                            infections, and inflammation. Romans, Greeks, and Egyptians extracted oil from the
                            seeds for perfumes.
                        </p>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-6 border border-border">
                        <Leaf className="h-8 w-8 text-primary mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Modern Recognition</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Today, the WHO, FAO, and numerous NGOs, just like ours promote moringa as a solution to
                            malnutrition. Over 1,300 scientific studies have validated its nutritional and
                            medicinal properties.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
