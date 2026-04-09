import { ACCORDION_SECTIONS, NutrientNode } from '@/components/nutrients/nutrients-view-data';

export function findNutrientById(id: string): NutrientNode | null {
    const search = (nodes: NutrientNode[]): NutrientNode | null => {
        for (const n of nodes) {
            if (n.id.toLowerCase() === id.toLowerCase()) return n;
            if (n.children) {
                const found = search(n.children);
                if (found) return found;
            }
        }
        return null;
    };

    for (const section of ACCORDION_SECTIONS) {
        const found = search(section.nutrients);
        if (found) return found;
    }
    return null;
}
