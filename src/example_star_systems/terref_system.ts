import type { StellarObject } from '../StellarTypes.d.ts';

export const terrefStarSystem: StellarObject[] = [
  {
    name: 'Diioc',
    description: 'Largest Star',
    posParams: {
      semiMajorAxis: 0.366,
      eccentricity: 0.04,
      period: 32,
    },
    intrinsicParams: { mass: { amount: 1.2, typeOfMeasure: 'mass', unitName: 'm_sol' } },
    type: 'star',
  },
  {
    name: 'Tiuuelo',
    description: 'Smallest Star',
    posParams: {
      semiMajorAxis: 0.26,
      eccentricity: 0.04,
      period: 32,
      isPairPhased: true,
    },
    intrinsicParams: { mass: { amount: 0.85, typeOfMeasure: 'mass', unitName: 'm_sol' } },
    type: 'star',
  },
  {
    name: 'Terref',
    description: 'Homeworld',
    posParams: {
      semiMajorAxis: 1.660642,
      eccentricity: 0.0113,
      period: 560,
    },
    intrinsicParams: { mass: 1.09e025 },
    type: 'planet',
    satellites: [
      {
        name: 'Ffwniiln',
        description: 'Satellite',
        posParams: {
          semiMajorAxis: 1.54414e-6,
          eccentricity: 0.0564,
          period: 8,
        },
        intrinsicParams: { mass: 2.51e022 },
        type: 'satellite',
      },
    ],
  },
];
