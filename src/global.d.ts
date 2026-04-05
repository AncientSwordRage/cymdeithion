type Enumerate<
  N extends number,
  Acc extends number[] = [],
> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>;

type Range<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;

interface Measures {
  time: 'seconds' | 'hours' | 'days';
  space: 'meters' | 'AU' | 'ly';
  mass: 'g' | 'kg' | 'm_sol' | 'm_earth';
}

interface PhysicalMeasure<T extends keyof Measures> {
  typeOfMeasure: T;
  unitName: Measures[T];
  amount: number;
}
