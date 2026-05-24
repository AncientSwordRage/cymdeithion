import type { MathArray } from 'mathjs';
import type { AstroUnit } from './astroMath.ts';
import type { OrbitalPosition } from './orbit.types.ts';
import type { StandardisedStellarObject } from './StellarTypes.js';
import type { Vec3 } from './utils/vec3Utils.ts';
import { mapValues } from 'lodash-es';
import invariant from 'tiny-invariant';
import { getAstroMath } from './astroMath.ts';
import { getBase } from './utils.ts';
import { coordsFromUnit, getDirection, normalizeThreeVec } from './utils/vec3Utils.ts';

const astroMath = getAstroMath();

type PairKey = `${string}:${string}`;

type PairwiseSeparations = Record<PairKey, {
  separation: AstroUnit;
  directionAB: Vec3;
  directionBA: Vec3;
}>;

type PairwiseInteractions = Record<PairKey, {
  gravity: AstroUnit;
  separation: AstroUnit;
  directionAB: Vec3;
  directionBA: Vec3;
}>;

function getPairings(bodies: OrbitalPosition[]) {
  return bodies.flatMap((eachBody, i) => bodies
    .slice(i + 1)
    .map((otherBody) => {
      return [eachBody.name, otherBody.name].sort().join(':') as PairKey;
    })).sort();
}

export function getRadialDistance(body: OrbitalPosition) {
  const { x, y, z } = coordsFromUnit(body, 'm');
  return astroMath.unit(Math.hypot(x, y, z), 'm');
}

export function getSeparation(bodyA: OrbitalPosition, bodyB: OrbitalPosition) {
  const { x: x_a, y: y_a, z: z_a } = coordsFromUnit(bodyA, 'm');
  const { x: x_b, y: y_b, z: z_b } = coordsFromUnit(bodyB, 'm');
  const magScalar = Math.hypot(x_a - x_b, y_a - y_b, z_a - z_b);
  const magnitude = astroMath.unit(`${magScalar} m`);
  const directionAB = normalizeThreeVec(getDirection(bodyA, bodyB), magScalar);
  const directionBA = normalizeThreeVec(getDirection(bodyB, bodyA), magScalar);
  return { magnitude, directionAB, directionBA };
}

/**
 * calculates gravitational forces
 * @param massA
 * @param massB
 * @param distance
 * @returns newtons
 */
export function getGravitationalForce(massA: AstroUnit, massB: AstroUnit, distance: AstroUnit) {
  invariant(getBase(massA) === 'mass', 'Mass A is not a mass unit');
  invariant(getBase(massB) === 'mass', 'Mass B is not a mass unit');
  invariant(getBase(distance) === 'distance', 'distance is not a distance unit');
  const gravForce = astroMath.divide(
    astroMath.multiply<AstroUnit>(
      astroMath.gravitationConstant,
      massA,
      massB,
    ),
    astroMath.pow(distance, 2) as AstroUnit,
  ) as AstroUnit;
  return gravForce.toBest();
}
const zeroGravityVector = Array.from({ length: 3 }).fill(astroMath.unit('0 N')) as MathArray<AstroUnit>;
export function getInteractions(
  fullOrbit: Record<number, OrbitalPosition[]>,
  starSystem: StandardisedStellarObject<'star' | 'planet' | 'satellite'>[],
) {
  const flattenedStarSystem = [
    ...starSystem,
    ...starSystem.flatMap(body => body.satellites ? body.satellites : []),
  ];
  return mapValues(fullOrbit, (bodies) => {
    const pairings = getPairings(bodies);
    const separations = pairings.flatMap((pair: PairKey) => {
      const [first, second] = pair.split(':').map(bodyName => bodies.find(body => body.name === bodyName));
      invariant(first && second, 'neither body can be undefined');
      const { magnitude: separation, directionAB, directionBA } = getSeparation(first, second);
      return [{ [pair]: { separation, directionAB, directionBA } } as PairwiseSeparations];
    });
    const interactions = separations.flatMap((bodyPair: PairwiseSeparations) => {
      const [pairKey = ':', distance] = (Object.entries(bodyPair).at(0)
        ?? [':', { separation: astroMath.unit('0 m') }]) as [PairKey, PairwiseSeparations[PairKey]];
      const { separation, directionAB, directionBA } = distance;
      const [first, second] = pairKey.split(':').map(bodyName => flattenedStarSystem.find(body => body.name === bodyName));
      const firstMass = first?.intrinsicParams?.mass;
      const secondMass = second?.intrinsicParams?.mass;
      invariant(firstMass !== undefined && secondMass !== undefined, 'neither mass can be undefined');
      const gravity = getGravitationalForce(firstMass, secondMass, separation);
      return [{
        [pairKey]: {
          gravity,
          separation,
          directionAB,
          directionBA,
        },
      }] as PairwiseInteractions[];
    });
    const bodyTotals = interactions.reduce((memo, bodyPair: PairwiseInteractions) => {
      const [pairKey = ':', interactions] = Object.entries(bodyPair).at(0)
        ?? [':', {}];
      const [first, second] = pairKey.split(':') as [keyof typeof memo, keyof typeof memo];
      invariant(first !== undefined && second !== undefined, 'neither key can be undefined');
      const { gravity, directionAB, directionBA } = interactions;
      invariant(gravity !== undefined, 'gravity cannot be undefined');
      invariant(directionAB !== undefined && directionBA !== undefined, 'neither direction can be undefined');
      const { totalGravity: totalGravityA } = memo[first] ?? { totalGravity: zeroGravityVector };
      const { totalGravity: totalGravityB } = memo[second] ?? { totalGravity: zeroGravityVector };
      const newGravityA = astroMath.multiply(gravity, [...directionAB]) as MathArray<AstroUnit>;
      const newGravityB = astroMath.multiply(gravity, [...directionBA]) as MathArray<AstroUnit>;
      memo = {
        ...memo,
        // @ts-expect-error 'add' doesn't like '<MathArray<AstroUnit>>'
        [first]: { ...memo[first], totalGravity: astroMath.add<MathArray<AstroUnit>>(totalGravityA, newGravityA) },
        // @ts-expect-error 'add' doesn't like '<MathArray<AstroUnit>>'
        [second]: { ...memo[second], totalGravity: astroMath.add<MathArray<AstroUnit>>(totalGravityB, newGravityB) },
      };
      return memo;
    }, Object.fromEntries(bodies.map(body => [
      body.name,
      {
        totalGravity: zeroGravityVector,
      },
    ])));
    return { bodies, interactions, bodyTotals };
  });
}
