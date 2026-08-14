import { expect, it } from 'vitest';
import { getAstroMath } from './astroMath.ts';
import { describeMathJsValue, isSerializedUnit, unitToString } from './utils/mathjsUtils.ts';

const astroMath = getAstroMath();

const u = astroMath.unit('5 m');
const json = u.toJSON();

it('describeMathJsValue', () => {
  expect(describeMathJsValue(astroMath, u).isLiveUnit).toEqual(true);
  expect(describeMathJsValue(astroMath, json).isSerializedUnit).toEqual(true);
});
it('isSerializedUnit', () => {
  expect(isSerializedUnit(json)).toEqual(true);
});
it('unitToString', () => {
  expect(unitToString(astroMath, u)).toEqual('5 m');
  expect(unitToString(astroMath, json)).toEqual('5 m');
});
it('reference value check', () => {
  const dayRatio = astroMath.divide(astroMath.unit('1 day'), astroMath.unit('1 EarthDay'));
  expect(dayRatio).toBeCloseTo(1.3958, 4);
});
