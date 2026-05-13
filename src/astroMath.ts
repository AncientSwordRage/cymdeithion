import type { FactoryFunction, FactoryFunctionMap, UnitDefinition } from 'mathjs';
import type { StellarObject } from './StellarTypes.js';
import {
  addDependencies,
  create,
  createUnitDependencies,
  crossDependencies,
  divideDependencies,
  dotDependencies,
  formatDependencies,
  gravitationConstantDependencies,
  matrixDependencies,
  multiplyDependencies,
  normDependencies,
  subtractDependencies,
  transposeDependencies,
  typedDependencies,
  unitDependencies,
} from 'mathjs';
import { M_EARTH_KG, M_MOON_KG, M_SOL_KG } from './constants.ts';

const mathJsImports = {
  addDependencies,
  createUnitDependencies,
  crossDependencies,
  divideDependencies,
  dotDependencies,
  formatDependencies,
  matrixDependencies,
  multiplyDependencies,
  normDependencies,
  subtractDependencies,
  transposeDependencies,
  typedDependencies,
  unitDependencies,
  gravitationConstantDependencies,
} as Record<string, FactoryFunctionMap | FactoryFunction<any>>;
const math = create(mathJsImports);

type ReferenceBody = (StellarObject<'star' | 'planet' | 'satellite'> & {
  referenceBody: boolean;
});

export default function launch_mathjs(referenceBody?: undefined | ReferenceBody) {
  const referenceBodyUnits = referenceBody !== undefined
    ? {
        day: {
          definition: referenceBody.intrinsicParams.rotationPeriod as string ?? '1 day',
          aliases: [`${referenceBody.name}Day`, 'LocalDays'],
        },
      } as Record<string, UnitDefinition>
    : {};
  math.createUnit({
    AU: {
      definition: '1.495979e11 m',
      aliases: ['AstronomicalUnit'],
    },
    ly: {
      definition: '1.94607e15 m',
      aliases: ['lightyear'],
    },
    MSol: {
      definition: `${M_SOL_KG} kg`,
      aliases: ['SolarMass', 'msol'],
    },
    MEarth: {
      definition: `${M_EARTH_KG} kg`,
      aliases: ['EarthMass', 'mearth'],
    },
    MLunar: {
      definition: `${M_MOON_KG} kg`,
      aliases: ['LunarMass', 'mmoon'],
    },
    EarthDay: {
      definition: '86400 s',
      aliases: ['EarthDays'],
    },
  }, {
    override: true,
  });
  if (referenceBody) {
    math.createUnit(referenceBodyUnits, {
      override: true,
    });
  }
  return math;
}

export type AstroUnit = ReturnType<ReturnType<typeof launch_mathjs>['unit']>[number];
