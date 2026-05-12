import type { Unit } from 'mathjs';

interface UnitJson {
  mathjs?: 'Unit';
  value: unknown;
  unit: string;
  fixPrefix?: boolean;
}

interface MathJsInstanceLike {
  isUnit?: (value: unknown) => boolean;
}

export function isSerializedUnit(value: unknown): value is UnitJson {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<UnitJson> & Record<string, unknown>;
  return candidate.mathjs === 'Unit' && typeof candidate.unit === 'string' && 'value' in candidate;
}

export function isLiveUnit(math: MathJsInstanceLike, value: unknown): value is Unit {
  return typeof math.isUnit === 'function' && math.isUnit(value);
}

export function unitToString(math: MathJsInstanceLike, value: unknown): string | null {
  if (isSerializedUnit(value)) {
    return `${String(value.value)} ${value.unit}`.trim();
  }

  if (isLiveUnit(math, value)) {
    return value.toString();
  }

  if (typeof value === 'object' && value !== null) {
    const candidate = value as { toString?: () => string; constructor?: { name?: string } };
    if (candidate.constructor?.name === 'Unit' && typeof candidate.toString === 'function') {
      return candidate.toString();
    }
  }

  return null;
}

export function describeMathJsValue(math: MathJsInstanceLike, value: unknown) {
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
