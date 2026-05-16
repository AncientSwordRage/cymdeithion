import invariant from 'tiny-invariant';
import { getAstroMath } from './astroMath.ts';
import { terrefStarSystem } from './example_star_systems/terref_system.ts';
import { getInteractions } from './interactions_calc.ts';
import { describeMathJsValue, unitToString } from './mathjsUtils.ts';
import { getFullOrbits } from './orbit_calc.ts';
import { standardiseSystem } from './utils.ts';

const astroMath = getAstroMath();

const standardisedStarSystem = standardiseSystem(terrefStarSystem);
const fullOrbits = getFullOrbits(standardisedStarSystem);
console.log(Object.values(fullOrbits).at(0)?.at(0));
const fullInteractions = getInteractions(fullOrbits, standardisedStarSystem);
const firstInteraction = Object.values(fullInteractions).at(0);
invariant(!!firstInteraction, 'No First interaction');
const firstPair = firstInteraction?.interactions?.at(0);
invariant(!!firstPair, 'No First pair');

const { gravity } = Object.values(firstPair).at(0) ?? {};

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
