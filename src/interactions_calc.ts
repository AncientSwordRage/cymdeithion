import type { Unit } from 'mathjs';
import type { OrbitalPosition } from './orbit.types.ts';
import type { StandardisedStellarObject } from './StellarTypes.js';
import { mapValues, merge } from 'lodash-es';
import { astroMath } from './ground_control.ts';

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
  return Math.hypot(x_a - x_b, y_a - y_b, z_a - z_b);
}

/**
 * calculates gravitational forces
 * @param massA in kg
 * @param massB in kg
 * @param distance in m
 * @returns newtons
 */
export function getGravitationalForce(massA: number, massB: number, distance: number) {
  const gravForce = astroMath.divide(
    astroMath.multiply<Unit>(
      astroMath.gravitationConstant,
      astroMath.unit(`${massA}kg`),
      astroMath.unit(`${massB}kg`),
    ),
    astroMath.pow(astroMath.unit(`${distance}m`), 2) as Unit,
  ) as Unit;
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
      return first && second
        ? [{ [pair]: { separation: getSeparation(first, second) } }]
        : [];
    });
    const gravity = separations.flatMap((bodyPair: { [x: PairKey]: { separation: number } }) => {
      const [pairKey = ':', distance] = Object.entries(bodyPair).at(0) ?? [':', { separation: 'missing' }];
      const separation = typeof distance?.separation === 'number' ? distance?.separation : Number.NaN;
      const [first, second] = pairKey.split(':').map(bodyName => flattenedStarSystem.find(body => body.name === bodyName));
      const firstMass = first?.intrinsicParams?.mass;
      const secondMass = second?.intrinsicParams?.mass;
      return firstMass !== undefined && secondMass !== undefined
        ? [{
            [pairKey]: {
              gravity: getGravitationalForce(firstMass, secondMass, separation),
            },
          }]
        : [];
    });
    const interactions = merge(separations, gravity);
    return { bodies, interactions };
  });
}
