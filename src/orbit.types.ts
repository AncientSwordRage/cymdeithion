import type { AstroUnit } from './astroMath.ts';

export interface OrbitalPosition {
  name: string;
  stepOfOrbit: number;
  period: AstroUnit;
  revolutions?: number;
  x: AstroUnit;
  y: AstroUnit;
  z?: AstroUnit;
  phi: AstroUnit;
}
