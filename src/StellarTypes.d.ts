type StringUnits = `${number} ${string}`;

interface UnitLike { value: string | number; unit: string };

interface BaseParam {
  stringUnit: StringUnits | UnitLike;
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
  // `${number} ${string}` → number
  = T extends `${number} ${string}` ? number
  // plain string → string (unchanged)
    : T extends string ? string
    // number unchanged
      : T extends number ? number
        : T extends boolean ? boolean
        // unit objects → number
          : T extends UnitLike ? number
          // everything else → unchanged
            : never;
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
