import invariant from 'tiny-invariant';
import { getAstroMath } from './astroMath.ts';
import { terrefStarSystem } from './example_star_systems/terref_system.ts';
import { getInteractions } from './interactions_calc.ts';
import { describeMathJsValue, unitToString } from './mathjsUtils.ts';
import { getFullOrbits } from './orbit_calc.ts';
import { standardAstroUnits, standardiseSystem } from './utils.ts';

const astroMath = getAstroMath();

const standardisedStarSystem = standardiseSystem(terrefStarSystem);
const fullOrbits = getFullOrbits(standardisedStarSystem);
const fullInteractions = getInteractions(fullOrbits, standardisedStarSystem);
const firstInteraction = Object.values(fullInteractions).at(0);
invariant(!!firstInteraction, 'No First interaction');
const firstPair = firstInteraction?.interactions?.at(0);
invariant(!!firstPair, 'No First pair');

const { gravity } = Object.values(firstPair).at(0) ?? {};

// eslint-disable-next-line no-console
console.log('[mathjs diagnostic] gravity', describeMathJsValue(astroMath, gravity));

// eslint-disable-next-line no-console
console.log('Outputting day 0 of orbital interactions and positions');
// eslint-disable-next-line no-console
console.log(JSON.stringify(fullInteractions, (key, value) => {
  const preferredUnit = key in standardAstroUnits
    ? standardAstroUnits[key as keyof typeof standardAstroUnits]
    : undefined;
  const formatted = unitToString(astroMath, value, preferredUnit);
  if (formatted !== null) {
    return formatted;
  }

  // eslint-disable-next-line ts/no-unsafe-return
  return value;
}, 2));
