import { SPICE_TRANSFORMATIONS, transformPortions, findSpiceFactor } from '../lib/utils/spice-conversion';

async function verifyConversion() {
    console.log('--- Verifying Spice Conversion Logic ---');

    // 1. Test Factor Lookup
    const cuminFactor = findSpiceFactor('Cumin Seeds, whole');
    console.log('\n[Factor Lookup]');
    console.log(`Input: "Cumin Seeds, whole" | Matched: ${cuminFactor.name} (V->G: ${cuminFactor.vToG}x, Ground Density: ${cuminFactor.gPerTspGround}g/tsp)`);

    // 2. Test Portion Transformation (Whole -> Ground)
    const mockPortions = [
        { label: 'tsp', weight_g: 2.1 }, // Traditional cumin seed weight
        { label: 'tbsp', weight_g: 6.3 },
        { label: 'gram', weight_g: 1.0 }
    ];

    console.log('\n[Portion Transformation: Whole -> Ground]');
    const groundPortions = transformPortions(mockPortions, cuminFactor, 'ground');

    groundPortions.forEach((p, i) => {
        const original = mockPortions[i];
        console.log(`Label: ${p.label} | Original: ${original.weight_g}g -> Transformed: ${p.weight_g}g (Ratio: ${(p.weight_g / original.weight_g).toFixed(2)})`);
    });

    // 3. Test Inverse Transformation (Ground -> Whole)
    console.log('\n[Portion Transformation: Ground -> Whole]');
    const backToWhole = transformPortions(groundPortions, cuminFactor, 'whole');

    backToWhole.forEach((p, i) => {
        const original = groundPortions[i];
        console.log(`Label: ${p.label} | Ground: ${original.weight_g}g -> Whole: ${p.weight_g}g (Ratio: ${(p.weight_g / original.weight_g).toFixed(2)})`);
    });

    // 4. Sanity Check
    const finalTspWeight = backToWhole.find(p => p.label === 'tsp')?.weight_g;
    if (Math.abs((finalTspWeight || 0) - 2.1) < 0.05) {
        console.log('\n✅ SANITY CHECK PASSED: Round-trip transformation is consistent.');
    } else {
        console.log('\n❌ SANITY CHECK FAILED: Drift detected in round-trip.');
    }
}

verifyConversion().catch(console.error);
