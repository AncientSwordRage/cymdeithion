/**
 * A stellar object
 */
export interface StellarObject {
  name: string;
  description?: string;
  type: 'star' | 'planet' | 'satellite';
  posParams: {
    semiMajorAxis: number | PhysicalMeasure<'space'>;
    eccentricity: number;
    period: number | PhysicalMeasure<'time'>;
    isPairPhased?: boolean;
    inclination?: Range<0, 180>;
    argPeriapsis?: Range<0, 180>;
    longitudeAscendingNode?: Range<0, 180>;
  };
  intrinsicParams: {
    luminosity?: number;
    albedo?: number;
    mass: number | PhysicalMeasure<'mass'>;
  };
  satellites?: (StellarObject & { type: 'satellite' })[];
}
