import type { StellarObject } from './StellarTypes.js';
import launch_mathjs from './astroMath.ts';
import { terrefStarSystem } from './example_star_systems/terref_system.ts';
import { getInteractions } from './interactions_calc.ts';
import { getFullOrbits } from './orbit_calc.ts';
import { standardiseSystem } from './utils.ts';

const isReferenceBody = (value: StellarObject): value is StellarObject & { referenceBody: boolean } => value?.referenceBody ?? false;

// configure specific units etc
export const astroMath = launch_mathjs(terrefStarSystem.find(isReferenceBody));

const standardisedStarSystem = standardiseSystem(terrefStarSystem);

const fullOrbits = getFullOrbits(standardisedStarSystem);

const fullInteractions = getInteractions(fullOrbits, terrefStarSystem);
// eslint-disable-next-line no-console
console.log(JSON.stringify(Object.values(fullInteractions), null, 2));
