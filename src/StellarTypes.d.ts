import type { AstroUnit } from './astroMath.ts';

type StringUnits = `${number} ${string}`;

interface UnitObject { value: string | number; unit: string };

type UnitLike = StringUnits | UnitObject;

interface BaseParam {
  stringUnit: UnitLike;
  numberUnit: number;
  booleanParam: boolean;
  angleParam: Range<0, 180>;
  fullAngleParam: Range<0, 360>;
}

interface PositionParams {
  semiMajorAxis: BaseParam['stringUnit'];
  eccentricity: BaseParam['numberUnit'];
  period: BaseParam['stringUnit'];
  isPairPhased?: BaseParam['booleanParam'];
  inclination?: BaseParam['angleParam'];
  argPeriapsis?: BaseParam['fullAngleParam'];
  longitudeAscendingNode?: BaseParam['fullAngleParam'];
}

interface IntrinsicParams {
  luminosity?: BaseParam['numberUnit'];
  albedo?: BaseParam['numberUnit'];
  mass: BaseParam['stringUnit'];
  rotationPeriod?: BaseParam['stringUnit'];
  radius?: BaseParam['stringUnit'];
}

type Transform<T>
  // Can be converted to AstroUnit
  = T extends UnitLike ? AstroUnit
  // everything else (non-physics) passes through
    : T;
/**
 * A stellar object
 */
export interface StellarObject<T extends 'star' | 'planet' | 'satellite'> {
  name: string;
  description?: string;
  type: T;
  posParams: PositionParams;
  intrinsicParams: IntrinsicParams;
  referenceBody?: boolean;
  satellites?: (StellarObject<'satellite'>)[];
}

export interface StandardisedStellarObject<T extends 'star' | 'planet' | 'satellite'> extends StellarObject<T> {
  posParams: { [Property in keyof PositionParams]: Transform<PositionParams[Property]> };
  intrinsicParams: { [Property in keyof IntrinsicParams]: Transform<IntrinsicParams[Property]> };
  satellites?: (StandardisedStellarObject<'satellite'>)[];
};
