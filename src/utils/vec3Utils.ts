import type { OrbitalPosition } from '../orbit.types.ts';
import { getAstroMath } from '../astroMath.ts';

const astroMath = getAstroMath();

export type Vec3 = readonly [number, number, number];

export function getDirection(bodyA: OrbitalPosition, bodyB: OrbitalPosition): Vec3 {
  const vecA = getThreeVec(bodyA);
  const vecB = getThreeVec(bodyB);
  return astroMath.subtract<[number, number, number]>([...vecA], [...vecB]);
}

export function getThreeVec(body: OrbitalPosition): Vec3 {
  const { x, y, z } = coordsFromUnit(body, 'm');
  return [x, y, z];
}

export function normalizeThreeVec(v: Vec3, magnitude?: number): Vec3 {
  const mag = magnitude ?? astroMath.hypot(...v);
  return mag === 0 ? [0, 0, 0] : astroMath.dotDivide<[number, number, number]>([...v], mag);
}

export function coordsFromUnit(body: OrbitalPosition, unitString: string) {
  const x = body?.x?.toNumber(unitString) ?? 0;
  const y = body?.y?.toNumber(unitString) ?? 0;
  const z = body?.z?.toNumber(unitString) ?? 0;
  return { x, y, z };
}
