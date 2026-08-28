import type { StellarObject } from './StellarTypes.js';

export function isReferenceBody(value: StellarObject<'planet' | 'satellite' | 'star'>): value is StellarObject<'planet' | 'satellite' | 'star'> & { referenceBody: boolean } {
  return value?.referenceBody ?? false;
}
