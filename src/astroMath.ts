import type { FactoryFunction, FactoryFunctionMap, MathJsInstance, UnitDefinition } from 'mathjs';
import type { StellarObject } from './StellarTypes.js';
import {
  addDependencies,
  create,
  createUnitDependencies,
  crossDependencies,
  divideDependencies,
  dotDependencies,
  dotDivideDependencies,
  dotMultiplyDependencies,
  dotPowDependencies,
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
import invariant from 'tiny-invariant';
import { isReferenceBody } from './bodyGuards.ts';
import { M_EARTH_KG, M_MOON_KG, M_SOL_KG } from './constants.ts';
import { terrefStarSystem } from './example_star_systems/terref_system.ts';

const mathJsImports = {
  addDependencies,
  createUnitDependencies,
  crossDependencies,
  divideDependencies,
  dotDependencies,
  dotDivideDependencies,
  dotMultiplyDependencies,
  dotPowDependencies,
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

export type AstroUnit = ReturnType<ReturnType<typeof launch_mathjs>['unit']>[number];

let astroMath: MathJsInstance | null = null;

export function getAstroMath() {
  invariant(astroMath !== null, 'astroMath no initiated yet');
  return astroMath;
}

const realEarthDay: Record<string, UnitDefinition> = {
  day: { definition: '86400 s', aliases: ['LocalDays'] },
};

function buildDayUnit(referenceBody: undefined | ReferenceBody): Record<string, UnitDefinition> {
  if (referenceBody === undefined) {
    return realEarthDay;
  }
  const { rotationPeriod } = referenceBody.intrinsicParams;
  if (rotationPeriod === undefined) {
    // failsafe
    return realEarthDay;
  }
  const definition = typeof rotationPeriod === 'string'
    ? rotationPeriod
    : `${rotationPeriod.value} ${rotationPeriod.unit}`;
  return {
    day: {
      definition,
      aliases: [`${referenceBody.name}Day`, 'LocalDays'],
    },
  };
}

function launch_mathjs(referenceBody?: undefined | ReferenceBody) {
  invariant(
    referenceBody === undefined || referenceBody.intrinsicParams.rotationPeriod !== undefined,
    'Reference Body missing rotation period',
  );
  const dayUnit = buildDayUnit(referenceBody);
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
  math.createUnit(dayUnit, {
    override: true,
  });
  return math;
}

export function setReferenceSystem(referenceBody: undefined | ReferenceBody) {
  astroMath = launch_mathjs(referenceBody);
  return astroMath;
}

// configure specific units etc
astroMath = launch_mathjs(terrefStarSystem.find(isReferenceBody));
