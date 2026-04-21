type StringUnits = `${number} ${string}`;

interface UnitLike { value: string | number; unit: string };

interface BaseParam {
  stringUnit: StringUnits | UnitLike;
  numberUnit: number;
  booleanParam: boolean;
  angleParam: Range<0, 180>;
  fullAngleParam: Range<0, 360>;
}

export type Param<K extends keyof BaseParam = keyof BaseParam> = {
  [P in K]: { type: P } & BaseParam[P]
}[K];

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
    // primitives unchanged
      : T extends number | boolean ? T
      // unit objects → number
        : T extends UnitLike ? number
        // everything else → unchanged
          : number;
/**
 * A stellar object
 */
export interface StellarObject {
  name: string;
  description?: string;
  type: 'star' | 'planet' | 'satellite';
  posParams: PositionParams;
  intrinsicParams: IntrinsicParams;
  referenceBody?: boolean;
  satellites?: (StellarObject & { type: 'satellite' })[];
}

export interface StandardisedStellarObject extends StellarObject {
  posParams: StandardiseParams<PositionParams>;
  intrinsicParams: StandardiseParams<IntrinsicParams>;
};
