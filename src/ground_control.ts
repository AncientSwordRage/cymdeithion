import type { StellarObject } from './StellarTypes.js';
import launch_mathjs from './astroMath.ts';
import { terrefStarSystem } from './example_star_systems/terref_system.ts';
import { getInteractions } from './interactions_calc.ts';
import { describeMathJsValue, unitToString } from './mathjsUtils.ts';
import { getFullOrbits } from './orbit_calc.ts';
import { standardiseSystem } from './utils.ts';

const isReferenceBody = (value: StellarObject<'planet' | 'satellite' | 'star'>): value is StellarObject<'planet' | 'satellite' | 'star'> & { referenceBody: boolean } => value?.referenceBody ?? false;

// configure specific units etc
export const astroMath = launch_mathjs(terrefStarSystem.find(isReferenceBody));

const standardisedStarSystem = standardiseSystem(terrefStarSystem);
const fullOrbits = getFullOrbits(standardisedStarSystem);
const fullInteractions = getInteractions(fullOrbits, standardisedStarSystem);

const [firstInteraction] = Object.values(fullInteractions);

const { gravity } = Object.values(firstInteraction?.interactions.at(0) ?? {}).at(0) ?? {};

// eslint-disable-next-line no-console
console.log('[mathjs diagnostic]', describeMathJsValue(astroMath, gravity));

// eslint-disable-next-line no-console
console.log(JSON.stringify(Object.values(fullInteractions)[0], (_key, value) => {
  const formatted = unitToString(astroMath, value);
  if (formatted !== null) {
    return formatted;
  }

  // eslint-disable-next-line ts/no-unsafe-return
  return value;
}, 2));
