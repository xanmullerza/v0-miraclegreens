const nutritionFacts = [
    { nutrient: 'Vitamin A', comparison: '4x more than carrots', amount: '6,780 mcg per 100g' },
    { nutrient: 'Vitamin C', comparison: '7x more than oranges', amount: '220 mg per 100g' },
    { nutrient: 'Calcium', comparison: '4x more than milk', amount: '440 mg per 100g' },
    { nutrient: 'Potassium', comparison: '3x more than bananas', amount: '1,324 mg per 100g' },
    { nutrient: 'Iron', comparison: '3x more than spinach', amount: '7 mg per 100g' },
    { nutrient: 'Protein', comparison: '2x more than yogurt', amount: '9.4 g per 100g' },
];

export function MoringaNutrition() {
    return (
        <section className="py-16 md:py-24 bg-primary/5">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto text-center mb-12">
                    <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
                        The Science
                    </p>
                    <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
                        Nutritional Powerhouse
                    </h2>
                    <p className="text-muted-foreground">
                        Gram for gram, dried moringa leaves contain more nutrients than most common
                        superfoods.
                    </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {nutritionFacts.map((fact) => (
                        <div
                            key={fact.nutrient}
                            className="bg-background rounded-xl p-6 border border-border"
                        >
                            <h3 className="text-xl font-semibold text-primary mb-1">{fact.nutrient}</h3>
                            <p className="text-foreground font-medium mb-2">{fact.comparison}</p>
                            <p className="text-sm text-muted-foreground">{fact.amount}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-8 bg-background rounded-xl p-6 border border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                        Complete Amino Acid Profile
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                        Moringa is one of the few plant sources that contains all 9 essential amino acids,
                        making it a complete protein. This is especially valuable for vegetarians, vegans, and
                        communities with limited access to animal protein. The leaves also contain 46
                        antioxidants, 36 anti-inflammatory compounds, and 27 vitamins and minerals.
                    </p>
                </div>
            </div>
        </section>
    );
}
