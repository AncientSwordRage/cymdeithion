export interface OrbitalPosition {
  name: string;
  dayOfOrbit: number;
  period: number;
  revolutions?: number;
  x: number;
  y: number;
  z?: number;
  phi: number;
}
