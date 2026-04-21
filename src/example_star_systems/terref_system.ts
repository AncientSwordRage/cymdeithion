import type { StellarObject } from '../StellarTypes.d.ts';

export const terrefStarSystem: StellarObject[] = [
  {
    name: 'Diioc',
    description: 'Largest Star',
    posParams: {
      semiMajorAxis: '0.366 AU',
      eccentricity: 0.04,
      period: '32 local days',
    },
    intrinsicParams: { mass: '1.2 m_sol' },
    type: 'star',
  },
  {
    name: 'Tiuuelo',
    description: 'Smallest Star',
    posParams: {
      semiMajorAxis: '0.26 AU',
      eccentricity: 0.04,
      period: '32 local days',
      isPairPhased: true,
    },
    intrinsicParams: { mass: '0.85 m_sol' },
    type: 'star',
  },
  {
    name: 'Terref',
    description: 'Homeworld',
    posParams: {
      semiMajorAxis: '1.660642 AU',
      eccentricity: 0.0113,
      period: '560 local days',
    },
    intrinsicParams: {
      mass: '1.09e025 kg',
      rotationPeriod: '1.3958 earth days',
    },
    referenceBody: true,
    type: 'planet',
    satellites: [
      {
        name: 'Ffwniiln',
        description: 'Satellite',
        posParams: {
          semiMajorAxis: '1.54414e-6 AU',
          eccentricity: 0.0564,
          period: '8 days',
        },
        intrinsicParams: { mass: '2.51e022 kg' },
        type: 'satellite',
      },
    ],
  },
];
