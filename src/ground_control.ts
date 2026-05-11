import type { Unit } from 'mathjs';
import type { StellarObject } from './StellarTypes.js';
import launch_mathjs from './astroMath.ts';
import { terrefStarSystem } from './example_star_systems/terref_system.ts';
import { getInteractions } from './interactions_calc.ts';
import { getFullOrbits } from './orbit_calc.ts';
import { standardiseSystem } from './utils.ts';

const isReferenceBody = (value: StellarObject<'planet' | 'satellite' | 'star'>): value is StellarObject<'planet' | 'satellite' | 'star'> & { referenceBody: boolean } => value?.referenceBody ?? false;

// configure specific units etc
export const astroMath = launch_mathjs(terrefStarSystem.find(isReferenceBody));

const standardisedStarSystem = standardiseSystem(terrefStarSystem);
const fullOrbits = getFullOrbits(standardisedStarSystem);
const fullInteractions = getInteractions(fullOrbits, standardisedStarSystem);
// eslint-disable-next-line no-console
console.log(JSON.stringify(Object.values(fullInteractions)[0], (key, value) => {
  if (key === 'gravity') {
    const myUnit = value as Unit;
    console.log(isUnit(myUnit) ? myUnit.format({}) : 'floop');
  }
  // eslint-disable-next-line ts/no-unsafe-return
  return isUnit(value) ? `formatted '${value.format({})}'` : value;
}, 2));

function isUnit(myUnit: unknown): myUnit is Unit {
  return myUnit?.constructor?.name === 'Unit';
}

