import type { StellarObject } from './StellarTypes.js';

export const isReferenceBody = (
  value: StellarObject<'planet' | 'satellite' | 'star'>,
): value is StellarObject<'planet' | 'satellite' | 'star'> & { referenceBody: boolean } => value?.referenceBody ?? false;
