import launch_mathjs from './astroMath.ts';

const astroMath = launch_mathjs();

const u = astroMath.unit('5 m');
console.log({
  ctor: u?.constructor?.name,
  proto: Object.getPrototypeOf(u)?.constructor?.name,
  hasFormatUnits: typeof (u as any)?.formatUnits,
  hasToJSON: typeof (u as any)?.toJSON,
  raw: u,
  json: u?.toJSON(),
});
