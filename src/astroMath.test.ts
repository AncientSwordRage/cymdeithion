/* eslint-disable no-console */
import launch_mathjs from './astroMath.ts';
import { describeMathJsValue, isSerializedUnit, unitToString } from './mathjsUtils.ts';

const astroMath = launch_mathjs();

const u = astroMath.unit('5 m');
const json = u.toJSON();

console.log('[live unit]', describeMathJsValue(astroMath, u));
console.log('[serialized unit]', describeMathJsValue(astroMath, json));
console.log('[serialized unit check]', isSerializedUnit(json));
console.log('[live string]', unitToString(astroMath, u));
console.log('[serialized string]', unitToString(astroMath, json));
