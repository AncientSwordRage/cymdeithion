import { describe, expect, it } from 'vitest';
import { getAstroMath } from './astroMath.ts';
import { getGravitationalForce, getPairings, getRadialDistance, getSeparation } from './interactions_calc.ts';
import { unitToString } from './utils/mathjsUtils.ts';

const astroMath = getAstroMath();

const testBody = {
  name: 'Test Body',
  stepOfOrbit: 0,
  period: astroMath.unit('1 year'),
  revolutions: 0,
  x: astroMath.unit('0 AU'),
  y: astroMath.unit('0 AU'),
  z: astroMath.unit('0 AU'),
  phi: astroMath.unit('0 rad'),
};

const oneDimensionBody = { ...testBody, name: 'One Dim', x: astroMath.unit('1 AU') };
const twoDimensionBody = { ...oneDimensionBody, name: 'Two Dim', y: astroMath.unit('1 AU') };
const threeDimensionBody = { ...twoDimensionBody, name: 'Three Dim', z: astroMath.unit('1 AU') };

it('getPairings', () => {
  expect(getPairings([oneDimensionBody, twoDimensionBody, threeDimensionBody])).toEqual([
    'One Dim:Three Dim',
    'One Dim:Two Dim',
    'Three Dim:Two Dim',
  ]);
});

describe('getRadialDistance', () => {
  it('calculates radial distance in one dimension', () => {
    const radialDistance = getRadialDistance(oneDimensionBody);
    expect(unitToString(astroMath, radialDistance, 'AU')).toEqual('1 AU');
  });

  it('calculates radial distance in two dimension', () => {
    const radialDistance = getRadialDistance(twoDimensionBody);
    expect(unitToString(astroMath, radialDistance, 'AU')).toMatch(/1\.414\d+ AU/);
  });

  it('calculates radial distance in three dimension', () => {
    const radialDistance = getRadialDistance(threeDimensionBody);
    expect(unitToString(astroMath, radialDistance, 'AU')).toMatch(/1\.732\d+ AU/);
  });
});

it('getSeparation', () => {
  const testSeparation = getSeparation(oneDimensionBody, twoDimensionBody);
  expect(unitToString(astroMath, testSeparation.magnitude, 'AU')).toEqual('1 AU');
  expect(testSeparation).toMatchObject({
    directionAB: [0, -1, 0],
    directionBA: [0, 1, 0],
  });
});

describe('getGravitationalForce', () => {
  it('throws when given invalid arguments', () => {
    expect(() => getGravitationalForce(astroMath.unit('1 m'), astroMath.unit('1 kg'), astroMath.unit('1 kg'))).toThrow('Invariant failed: Mass A is not a mass unit');
  });
  it('calculates gravitational forces', () => {
    expect(() => getGravitationalForce(astroMath.unit('1 kg'), astroMath.unit('1 kg'), astroMath.unit('1 m'))).not.toThrow();
    const gravForce = getGravitationalForce(astroMath.unit('10 kg'), astroMath.unit('10 kg'), astroMath.unit('25 um'));
    expect(unitToString(astroMath, gravForce)).toMatch(/10.67888\d+ N/);
  });
});
