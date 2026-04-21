import type { FactoryFunction, FactoryFunctionMap } from 'mathjs';
import type { StellarObject } from './StellarTypes.js';
import { addDependencies, create, createUnitDependencies, crossDependencies, dotDependencies, formatDependencies, matrixDependencies, multiplyDependencies, normDependencies, subtractDependencies, transposeDependencies, unitDependencies } from 'mathjs';
import { M_EARTH_KG, M_MOON_KG, M_SOL_KG } from './constants.ts';

const mathJsImports = { addDependencies, create, createUnitDependencies, crossDependencies, dotDependencies, formatDependencies, matrixDependencies, multiplyDependencies, normDependencies, subtractDependencies, transposeDependencies, unitDependencies } as Record<string, FactoryFunctionMap | FactoryFunction<any>>;
const math = create(mathJsImports);

export default function launch_mathjs(referenceBody: undefined | (StellarObject & { referenceBody: boolean })) {
  const referenceBodyUnits = referenceBody !== undefined
    ? {
        day: {
          definition: referenceBody.intrinsicParams.rotationPeriod as string ?? '1 day',
          aliases: [`${referenceBody.name} day`, 'local days'],
        },
      }
    : {};
  math.createUnit({
    'AU': {
      definition: '1.495979e11 m',
      aliases: ['Astronomical Unit', 'A.U.'],
    },
    'ly': {
      definition: '1.9.4607e15 m',
      aliases: ['light year'],
    },
    'solar mass': {
      definition: `${M_SOL_KG} kg`,
      aliases: ['M Sol', 'm_sol'],
    },
    'earth mass': {
      definition: `${M_EARTH_KG} kg`,
      aliases: ['M Earth', 'm_earth'],
    },
    'lunar mass': {
      definition: `${M_MOON_KG} kg`,
      aliases: ['M moon', 'm_moon'],
    },
    'earth day': {
      definition: '86400 s',
    },
    ...referenceBodyUnits,
  }, {
    override: true,
  });
  return math;
}
