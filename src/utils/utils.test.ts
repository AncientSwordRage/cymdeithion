import { faker } from '@faker-js/faker';
import { describe, expect, it } from 'vitest';
import { getAstroMath } from '../astroMath.ts';
import { simpleSolarSystem } from '../example_star_systems/simple_solar_system.ts';
import { unitToString } from './mathjsUtils.ts';
import { getBase, standardiseSystem, standardiseToAstroUnit } from './utils.ts';

const astroMath = getAstroMath();

describe('standardiseToAstroUnit', () => {
  it('rejects undefined units', () => {
    expect(() => standardiseToAstroUnit(undefined)).toThrow('Cannot standardise undefined values');
    expect(() => standardiseToAstroUnit(null)).toThrow('Cannot standardise null values');
  });
  it('parses strings that match a unit-like pattern', () => {
    const randomisedInt = faker.number.int({ min: 0, max: 100 });
    expect(unitToString(astroMath, standardiseToAstroUnit(`${randomisedInt} m`))).toEqual(`${randomisedInt} m`);
  });
  it('parses objects that match a unit-like structure', () => {
    const randomisedInt = faker.number.int({ min: 0, max: 100 });
    expect(unitToString(astroMath, standardiseToAstroUnit({ value: `${randomisedInt}`, unit: 'm' }))).toEqual(`${randomisedInt} m`);
  });
  it('passes through non-matching string, booleans and numbers', () => {
    const randomisedString = faker.string.sample({ min: 0, max: 100 });
    const randomisedInt = faker.number.int({ min: 0, max: 100 });
    expect(standardiseToAstroUnit(randomisedString)).toEqual(randomisedString);
    expect(standardiseToAstroUnit(true)).toEqual(true);
    expect(standardiseToAstroUnit(false)).toEqual(false);
    expect(standardiseToAstroUnit(randomisedInt)).toEqual(randomisedInt);
  });
});
describe('getBase', () => {
  const randomisedInt = faker.number.int({ min: 0, max: 100 });
  it('gets the base unit type', () => {
    expect(getBase(astroMath.unit(`${randomisedInt} m`))).toEqual('distance');
    expect(getBase(astroMath.unit(`${randomisedInt} s`))).toEqual('time');
    expect(getBase(astroMath.unit(`${randomisedInt} kg`))).toEqual('mass');
  });
});
describe('standardiseSystem', () => {
  it('takes a non-standard input and standardises it', () => {
    const standardisedStarSystem = standardiseSystem(simpleSolarSystem);
    const earth = standardisedStarSystem.find(body => body.name === 'Earth');
    const massOunce = earth?.intrinsicParams.mass.toNumber('oz');
    const earthWeeks = earth?.posParams.period.toNumber('weeks');
    const eccentricity = earth?.posParams.eccentricity;
    expect(massOunce).not.toBeUndefined();
    // @ts-expect-error this won't be undefined, but 'closeTo' is absolute
    // difference not relative, so divide by magnitude
    expect(massOunce / 1e+26).toBeCloseTo(2.107971966, 5);
    expect(earthWeeks).toBeCloseTo(52, 0);
    expect(eccentricity).toEqual(0.04);
  });
});
