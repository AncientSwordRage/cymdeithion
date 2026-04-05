import { terrefStarSystem } from './example_star_systems/terref_system.ts';
import { getInteractions } from './interactions_calc.ts';
import { getFullOrbits } from './orbit_calc.ts';

const fullOrbits = getFullOrbits(terrefStarSystem);

console.log(JSON.stringify(Object.values(getInteractions(fullOrbits, terrefStarSystem)), null, 2));
