import type { AstroUnit } from './astroMath.ts';
import type { OrbitalPosition } from './orbit.types.ts';
import type { StandardisedStellarObject } from './StellarTypes.js';
import { mapValues, merge } from 'lodash-es';
import invariant from 'tiny-invariant';
import { astroMath } from './ground_control.ts';
import { getBase } from './utils.ts';

type PairKey = `${string}:${string}`;

function getPairings(bodies: OrbitalPosition[]) {
  return bodies.flatMap((eachBody, i) => bodies
    .slice(i + 1)
    .map((otherBody) => {
      return [eachBody.name, otherBody.name].sort().join(':') as PairKey;
    })).sort();
}

export function getRadialDistance(body: OrbitalPosition) {
  return Math.hypot(body?.x ?? 0, body.y ?? 0, body.z ?? 0);
}

export function getSeparation(bodyA: OrbitalPosition, bodyB: OrbitalPosition) {
  const { x: x_a = 0, y: y_a = 0, z: z_a = 0 } = bodyA;
  const { x: x_b = 0, y: y_b = 0, z: z_b = 0 } = bodyB;
  return astroMath.unit(`${Math.hypot(x_a - x_b, y_a - y_b, z_a - z_b)} m`);
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
      return [{ [pair]: { separation: getSeparation(first, second) } }] as Record<PairKey, { separation: AstroUnit }>[];
    });
    const gravity = separations.flatMap((bodyPair: { [x: PairKey]: { separation: AstroUnit } }) => {
      const [pairKey = ':', distance] = (Object.entries(bodyPair).at(0) ?? [':', { separation: astroMath.unit('0 m') }]) as [PairKey, { separation: AstroUnit }];
      const separation = distance?.separation;
      const [first, second] = pairKey.split(':').map(bodyName => flattenedStarSystem.find(body => body.name === bodyName));
      const firstMass = first?.intrinsicParams?.mass;
      const secondMass = second?.intrinsicParams?.mass;
      invariant(firstMass !== undefined && secondMass !== undefined, 'neither mass can be undefined');
      return [{
        [pairKey]: {
          gravity: getGravitationalForce(firstMass, secondMass, separation),
        },
      }] as Record<PairKey, { gravity: AstroUnit }>[];
    });
    const interactions = merge(
      separations,
      gravity,
    ) as Record<PairKey, { separation: AstroUnit; gravity: AstroUnit }>[];
    return { bodies, interactions };
  });
}
