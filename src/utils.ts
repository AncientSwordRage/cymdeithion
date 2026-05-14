import type { Unit } from 'mathjs';
import type { AstroUnit } from './astroMath.ts';
import type { StandardisedStellarObject, StellarObject, StringUnits, Transform } from './StellarTypes.js';
import { findKey, mapValues } from 'lodash-es';
import invariant from 'tiny-invariant';
import { astroMath } from './ground_control.ts';

/**
 * Utility function to do rounding.
 * In the future this might be replaced by a native function.
 * @param val the numerical value to round
 * @param places how many decimal places to round it to
 * @returns the rounded number
 */
export function rounding(val: number, places: number) {
  return Math.round(val * 10 ** places) / 10 ** places;
}

type ParamUnitKey = keyof StellarObject<'planet' | 'satellite' | 'star'>['intrinsicParams'] | keyof StellarObject<'planet' | 'satellite' | 'star'>['posParams'];

type ParamUnitRecord = Partial<Record<ParamUnitKey, string>>;

type DefaultUnitsByType = Record<StellarObject<'planet' | 'satellite' | 'star'>['type'], ParamUnitRecord>;

// outputs
export const defaultUnitsByType: DefaultUnitsByType = {
  planet: { mass: 'm_earth', semiMajorAxis: 'AU', radius: 'km' },
  star: { mass: 'm_sol', semiMajorAxis: 'AU', radius: 'km' },
  satellite: { mass: 'm_moon', semiMajorAxis: 'AU', radius: 'km' },
};

// outputs
const canonicalUnits = { mass: 'kg', distance: 'km', time: 'days' } as const;

export function getBase(unit: Unit) {
  const unitMap = mapValues(canonicalUnits, canonicalUnit => astroMath.unit(`1 ${canonicalUnit}`));
  return findKey(unitMap, thisUnit => thisUnit.equalBase(unit)) as unknown as keyof typeof canonicalUnits | undefined;
}

function transformObject<T extends Partial<Record<keyof T, unknown>>>(obj: T): {
  [K in keyof T]: Transform<T[K]>;
} {
  const result = {} as Partial<{ [K in keyof T]: Transform<T[K]> }>;
  for (const key in obj) {
    result[key] = standardiseToAstroUnit(obj[key]);
  }
  // console.log(result)
  return result as { [K in keyof T]: Transform<T[K]> };
}

export function standardiseSystem(bodies: StellarObject<'planet' | 'satellite' | 'star'>[]) {
  return bodies.map(body => standardiseBody(body));
};

export function standardiseBody<T extends 'star' | 'planet' | 'satellite'>(body: StellarObject<T>): StandardisedStellarObject<T> {
  const { intrinsicParams, posParams, satellites = [], ...rest } = body;

  const intrinsicStandardised = transformObject(intrinsicParams);
  const posStandardised = transformObject(posParams);
  return {
    ...rest,
    intrinsicParams: intrinsicStandardised,
    posParams: posStandardised,
    ...(satellites.length > 0
      ? { satellites: satellites.map(satellite => standardiseBody(satellite)) }
      : {}
    ),
  };
}

const unitPattern = /^(?<value>-?(?:\d*\.\d+|\d+)(?:E[+-]?\d+)?)\s+(?<unit>\w+(?:\s+\w+)*)$/i;

export function standardiseToAstroUnit<T>(inputUnit: T): Transform<T> {
  if (inputUnit === undefined || inputUnit === null) {
    throw new Error(`Cannot standardise ${typeof inputUnit} values`);
  }
  let standardUnit: AstroUnit | undefined;
  if (typeof inputUnit === 'string') {
    if (isUnitsFormattedString(inputUnit)) {
      const { value = '0', unit = '' } = inputUnit.match(unitPattern)?.groups ?? {};
      standardUnit = astroMath.unit(Number.parseFloat(value), unit).toSI();
    }
    else {
      return inputUnit as Transform<T>;
    }
  }
  else if (typeof inputUnit === 'number' || typeof inputUnit === 'boolean') {
    return inputUnit as Transform<T>;
  }
  else if (isUnitLike(inputUnit)) {
    const numericValue = typeof inputUnit.value === 'string' ? Number.parseFloat(inputUnit.value) : Number(inputUnit.value);
    standardUnit = astroMath.unit(numericValue, inputUnit.unit).toSI();
  }
  invariant(!!standardUnit, 'no valid input to transform');
  return standardUnit as Transform<T>;
}

function isUnitsFormattedString(inputUnit: string): inputUnit is StringUnits {
  return typeof inputUnit === 'string' && unitPattern.test(inputUnit);
}

function isUnitLike(x: unknown): x is { value: string | number; unit: string } {
  return typeof x === 'object' && x !== null && 'value' in x && 'unit' in x;
}
