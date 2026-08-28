import type { MathJsInstance, Unit } from 'mathjs';

interface UnitJson {
  mathjs?: 'Unit';
  value: unknown;
  unit: string;
  fixPrefix?: boolean;
}

export function isSerializedUnit(value: unknown): value is UnitJson {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<UnitJson> & Record<string, unknown>;
  return candidate.mathjs === 'Unit' && typeof candidate.unit === 'string' && 'value' in candidate;
}

export function isLiveUnit(math: MathJsInstance, value: unknown): value is Unit {
  return typeof math.isUnit === 'function' && math.isUnit(value);
}

export function unitToString(math: MathJsInstance, value: unknown, unit?: string): string | null {
  if (isSerializedUnit(value)) {
    const formattedUnitString = `${String(value.value)} ${value.unit}`.trim();
    if (unit !== undefined && unit !== value.unit) {
      const liveUnit = math.unit(formattedUnitString);
      return liveUnit.to(unit).toString();
    }
    return formattedUnitString;
  }

  if (isLiveUnit(math, value)) {
    return (unit !== undefined ? value.to(unit) : value).toString();
  }

  if (typeof value === 'object' && value !== null) {
    const candidate = value as { toString?: () => string; constructor?: { name?: string } };
    if (candidate.constructor?.name === 'Unit' && typeof candidate.toString === 'function') {
      return candidate.toString();
    }
  }

  return null;
}

export function describeMathJsValue(math: MathJsInstance, value: unknown) {
  const candidate = value as {
    constructor?: { name?: string };
    toJSON?: () => unknown;
    toString?: () => string;
    format?: (options?: unknown) => string;
    formatUnits?: () => string;
  } | null;

  return {
    type: typeof value,
    constructor: candidate?.constructor?.name ?? null,
    hasToString: typeof candidate?.toString === 'function',
    hasToJSON: typeof candidate?.toJSON === 'function',
    hasFormat: typeof candidate?.format === 'function',
    hasFormatUnits: typeof candidate?.formatUnits === 'function',
    isLiveUnit: isLiveUnit(math, value),
    isSerializedUnit: isSerializedUnit(value),
    keys: typeof value === 'object' && value !== null ? Object.keys(value as Record<string, unknown>) : null,
    preview: unitToString(math, value),
    json: typeof candidate?.toJSON === 'function' ? candidate.toJSON() : null,
  };
}
