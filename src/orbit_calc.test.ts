import type { OrbitalPosition } from './orbit.types.ts';
import { describe, expect, it } from 'vitest';
import { getAstroMath } from './astroMath.ts';
import { simpleSolarSystem } from './example_star_systems/simple_solar_system.ts';
import { getFullOrbits, getMeanAnomalyRad, getOrbitalPosition, getOrbitalPositions } from './orbit_calc.ts';
import { unitToString } from './utils/mathjsUtils.ts';
import { standardiseSystem } from './utils/utils.ts';

const astroMath = getAstroMath();

// what units to use when making calculations
const semiMajorAxisUnit = 'AU';
// const periodUnit = 'day';

const cartOrigin = {
  x: astroMath.unit(`0 ${semiMajorAxisUnit}`),
  y: astroMath.unit(`0 ${semiMajorAxisUnit}`),
  z: astroMath.unit(`0 ${semiMajorAxisUnit}`),
};

describe('getMeanAnomalyRad', () => {
  it('converts to radians', () => {
    expect(getMeanAnomalyRad(5, 10)).toEqual(Math.PI);
  });
  it('converts to radians with offset', () => {
    expect(getMeanAnomalyRad(3, 10, 2)).toEqual(Math.PI);
  });
});

const testOrbitalShape = { period: 100, semiMajorAxis: 1, eccentricity: 0 };
const testOrbitalOrientation = { longitudeAscendingNode: 0, inclination: 0, argPeriapsis: 0 };
const testOptions = { barycentre: cartOrigin, meanAnomalyOffset: 0 };
describe('getOrbitalPosition', () => {
  it('basic use case', () => {
    const orbitalPosition = getOrbitalPosition(
      'Test Body',
      0,
      testOrbitalShape,
      testOrbitalOrientation,
      testOptions,
    );
    expect(orbitalPosition).toBeDefined();
  });
  it('phi and revolutions calculated', () => {
    const orbitalPosition = getOrbitalPosition(
      'Test Body',
      250,
      testOrbitalShape,
      testOrbitalOrientation,
      testOptions,
    );
    expect(orbitalPosition.revolutions).toEqual(2);
    expect(unitToString(astroMath, orbitalPosition.phi, 'radian')).toMatch(/3.1415\d+ radian/);
  });
  it('phi and revolutions calculated - eccentric', () => {
    const eccentricShape = { ...testOrbitalShape, eccentricity: 0.9 };
    const orbitalPosition = getOrbitalPosition(
      'Test Body',
      75,
      eccentricShape,
      testOrbitalOrientation,
      testOptions,
    );
    expect(orbitalPosition.revolutions).toEqual(0);
    expect(unitToString(astroMath, orbitalPosition.phi, 'radian')).toMatch(/-2.9269\d+ radian/);
  });
});
describe('getOrbitalPositions', () => {
  // TODO add more test cases
  it('basic use case', () => {
    const orbitalPosition = getOrbitalPositions(
      'Test Body',
      testOrbitalShape,
      testOrbitalOrientation,
      testOptions,
    );
    Array.from({ length: 10 }).keys().forEach((stepProportion: number) => {
      const tenthOfOrbit = Math.round(testOrbitalShape.period / 10);
      const stepOfOrbit = stepProportion * tenthOfOrbit;
      const expectedStep = expect.objectContaining({
        name: 'Test Body',
        stepOfOrbit,
      }) as OrbitalPosition;
      expect(orbitalPosition[stepOfOrbit] as OrbitalPosition).toMatchObject(expectedStep);
    });
  });
});

describe('getFullOrbits', () => {
  const standardisedStarSystem = standardiseSystem(simpleSolarSystem);
  const fullOrbits = getFullOrbits(standardisedStarSystem);
  const earth = simpleSolarSystem.find(body => body.name === 'Earth');
  expect(earth).toBeDefined();
  const period = Number.parseInt(earth?.posParams?.period as `\d+`, 10);
  const tenthOfOrbit = Math.round(period / 10);
  Array.from({ length: 10 }).keys().forEach((stepProportion: number) => {
    const stepOfOrbit = stepProportion * tenthOfOrbit;
    const expectedStep = expect.objectContaining({
      name: 'Test Body',
      stepOfOrbit,
    }) as OrbitalPosition;
    expect(fullOrbits[stepOfOrbit] as OrbitalPosition[]).toMatchObject(expectedStep);
  });
});
