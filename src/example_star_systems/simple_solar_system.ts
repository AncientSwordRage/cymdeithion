import type { StellarObject } from '../StellarTypes.d.ts';

export const simpleSolarSystem: StellarObject<'planet' | 'satellite' | 'star'>[] = [
  {
    name: 'Sol',
    description: 'Earth\'s Star',
    posParams: {
      semiMajorAxis: '0 AU',
      eccentricity: 0,
      period: '30 days',
      argPeriapsis: 0,
      inclination: 0,
      longitudeAscendingNode: 0,
    },
    intrinsicParams: { mass: '1 msol' },
    type: 'star',
  },
  {
    name: 'Earth',
    description: 'Here',
    posParams: {
      semiMajorAxis: '1 AU',
      eccentricity: 0.04,
      period: '365 days',
      argPeriapsis: 0,
      inclination: 10,
      longitudeAscendingNode: 0,
    },
    intrinsicParams: {
      mass: '5.976e24 kg',
      rotationPeriod: '1 day',
    },
    type: 'planet',
    satellites: [
      // fix values
      {
        name: 'Luna',
        description: 'Satellite',
        posParams: {
          semiMajorAxis: '1.54414e-6 AU',
          eccentricity: 0.01,
          period: '30 days',
          argPeriapsis: 0,
          inclination: 0,
          longitudeAscendingNode: 0,
        },
        intrinsicParams: { mass: '2.51e022 kg' },
        type: 'satellite',
      },
    ],
  },
];
