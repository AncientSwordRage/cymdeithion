import { expect, it } from 'vitest';
import { isReferenceBody } from './bodyGuards.ts';
import { simpleSolarSystem } from './example_star_systems/simple_solar_system.ts';
import { terrefStarSystem } from './example_star_systems/terref_system.ts';

it('finds reference bodies that exist', () => {
  const referenceBody = terrefStarSystem.find(isReferenceBody);
  expect(referenceBody).not.toBeUndefined();
});

it('finds nothing when reference bodies don\'t exist', () => {
  const referenceBody = simpleSolarSystem.find(isReferenceBody);
  expect(referenceBody).toBeUndefined();
});
