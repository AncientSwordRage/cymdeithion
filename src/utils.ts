import { M_EARTH_KG, M_SOL_KG } from './constants.ts';

/**
 * Utility function to do rounding.
 * In the future this might be replaced by a native function.
 * @param val the numerical value to round
 * @param places how many decimal places to round it to
 * @returns the rounded number
 */
export function rounding(val: number, places: number) {
  return Math.round(val * 10 ** places) / 10 ** places;
}

const defaultMeasures: { [UnitType in keyof Measures]: Measures[UnitType] } = {
  time: 'days',
  space: 'AU',
  mass: 'kg',
};

type ConversionRate = {
  [UnitType in keyof Measures]: {
    [UnitName in Measures[UnitType]]: {
      [Key in Measures[UnitType]]: number;
    };
  };
};

const conversionRate: ConversionRate = {
  time: {
    days: {
      days: 1,
      hours: 24,
      seconds: 24 * 60 * 60,
    },
    hours: {
      hours: 1,
      days: 1 / 24,
      seconds: 60 * 60,
    },
    seconds: {
      seconds: 1,
      days: 1 / (24 * 60 * 60),
      hours: 1 / (60 * 60),
    },
  },
  space: {
    AU: {
      AU: 1,
      ly: 1 / 63240.87,
      meters: 1.495979e11,
    },
    ly: {
      ly: 1,
      AU: 63240.87,
      meters: 9.4607e15,
    },
    meters: {
      meters: 1,
      AU: 1 / 1.495979e11,
      ly: 1 / 9.4607e15,
    },
  },
  mass: {
    g: {
      kg: 1000,
      g: 1,
      m_earth: M_EARTH_KG * 1000,
      m_sol: M_SOL_KG * 1000,
    },
    kg: {
      kg: 1,
      g: 1 / 1000,
      m_earth: 1 / M_EARTH_KG,
      m_sol: 1 / M_SOL_KG,
    },
    m_earth: {
      kg: M_EARTH_KG,
      g: M_EARTH_KG / 1000,
      m_earth: 1,
      m_sol: M_EARTH_KG / M_SOL_KG,
    },
    m_sol: {
      kg: M_SOL_KG,
      g: M_SOL_KG / 1000,
      m_earth: M_SOL_KG / M_EARTH_KG,
      m_sol: 1,
    },
  },
};

export function physicalMeasureToUnit<T extends keyof Measures>(
  physicalMeasure: PhysicalMeasure<T>,
  unit: Measures[T],
) {
  const { typeOfMeasure, unitName, amount } = physicalMeasure;
  const unitConversionRate = conversionRate[typeOfMeasure][unitName][unit];
  return unitConversionRate * amount;
}
export function physicalMeasureToDefault<T extends keyof Measures>(
  physicalMeasure: number | PhysicalMeasure<T> | undefined,
) {
  return physicalMeasure !== undefined && typeof physicalMeasure !== 'number'
    ? physicalMeasureToUnit(
        physicalMeasure,
        defaultMeasures[physicalMeasure.typeOfMeasure],
      )
    : physicalMeasure;
}
