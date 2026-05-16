import type { AstroUnit } from './astroMath.ts';
import type { OrbitalPosition } from './orbit.types.ts';
import type { StandardisedStellarObject } from './StellarTypes.d.ts';
import { groupBy, keyBy, partition, xorBy } from 'lodash-es';
import { getAstroMath } from './astroMath.ts';
import { rounding } from './utils.ts';

const astroMath = getAstroMath();

// what units to use when making calculations
const semiMajorAxisUnit = 'AU';
const periodUnit = 'days';

const cartOrigin = { x: astroMath.unit(`0 ${semiMajorAxisUnit}`), y: astroMath.unit(`0 ${semiMajorAxisUnit}`) };

/**
 * "In celestial mechanics, the mean anomaly is the fraction of an elliptical
 * orbit's period that has elapsed since the orbiting body passed periapsis,
 * expressed as an angle ..."
 * @param time The current unit of time elapses during the full orbit
 * @param period The total time taken to complete one orbit
 * @param offset Number of 'time unit' to offset the calculation by
 * @returns How far through the orbit the stellar object is
 */
function getMeanAnomaly(time: number, period: number, offset: number) {
  const pi = Math.PI;
  // const k = pi/180.0;
  const meanMotion = (2 * pi) / period;
  return meanMotion * ((time + offset) % period);
}

/**
 * "An angular parameter that defines the position of a body that is moving
 * along an elliptic Kepler orbit, the angle measured at the center of the
 * ellipse between the orbit's periapsis and the current position."
 * @param eccentricity How elliptical the orbit it, from 0 to 1
 * @param meanAnomaly The fraction of the ellipse orbit that has elapsed since
 * periapsis
 * @param decimalPlaces How accurate to make the iterative calculation
 * @returns the angle from the center of the ellipse between the orbit's
 * periapsis and the current position.
 */
function getEccentricAnomaly(
  eccentricity: number,
  meanAnomaly: number,
  decimalPlaces: number,
) {
  const pi = Math.PI;
  const k = pi / 180.0;
  const maxIter = 30;
  let currentIteration = 0;
  const delta = 10 ** -decimalPlaces;
  let updatedMeanAnomaly = meanAnomaly / 360.0;
  updatedMeanAnomaly
    = 2.0 * pi * (updatedMeanAnomaly - Math.floor(updatedMeanAnomaly));

  let updatedEccAnomaly = eccentricity < 0.8 ? updatedMeanAnomaly : pi;
  let updatedTrueAnomaly
    = updatedEccAnomaly
      - eccentricity * Math.sin(updatedMeanAnomaly)
      - updatedMeanAnomaly;

  while (Math.abs(updatedTrueAnomaly) > delta && currentIteration < maxIter) {
    updatedEccAnomaly
      = updatedEccAnomaly
        - updatedTrueAnomaly / (1.0 - eccentricity * Math.cos(updatedEccAnomaly));
    updatedTrueAnomaly
      = updatedEccAnomaly
        - eccentricity * Math.sin(updatedEccAnomaly)
        - updatedMeanAnomaly;
    currentIteration += 1;
  }
  updatedEccAnomaly = updatedEccAnomaly / k;
  return rounding(updatedEccAnomaly, decimalPlaces);
}

/**
 * "It is the angle between the direction of periapsis and the current position
 * of the body, as seen from the main focus of the ellipse (the point around
 * which the object orbits)."
 * @param eccentricity How elliptical the orbit is, from 0 to 1
 * @param eccentricAnomaly The angle from the center of the ellipse between the orbit's
 * periapsis and the current position
 * @param decimalPlaces how many decimal places to round this number to
 * @returns Angle between the direction of periapsis and the current position
 */
function getTrueAnomaly(
  eccentricity: number,
  eccentricAnomaly: number,
  decimalPlaces: number,
) {
  const k = Math.PI / 180.0;
  const S = Math.sin(eccentricAnomaly);
  const C = Math.cos(eccentricAnomaly);
  const fak = Math.sqrt(1.0 - eccentricity * eccentricity);
  const phi = Math.atan2(fak * S, C - eccentricity) / k;
  return rounding(phi, decimalPlaces);
}

/**
 * The cartesian co-ordinates
 * @param semiMajorAxis Half the length of the largest axis of the ellipses orbit
 * @param eccentricity How elliptical the orbit is, from 0 to 1
 * @param eccentricAnomaly The angle from the center of the ellipse between the orbit's
 * periapsis and the current position.
 * @returns The x, y co-ordinates from the center of the system
 */
function getCartPosition(
  semiMajorAxis: number,
  eccentricity: number,
  eccentricAnomaly: number,
) {
  const S = Math.sin(eccentricAnomaly);
  const C = Math.cos(eccentricAnomaly);
  const x = semiMajorAxis * (C - eccentricity);
  const y = semiMajorAxis * Math.sqrt(1.0 - eccentricity * eccentricity) * S;
  return { x, y };
}

/**
 * Gets the instantaneous position of the stellar object in orbit, as well as
 * the name and day this is for
 * @param name The name of the stellar object
 * @param dayOfOrbit The temporal instance in the orbit
 * @param semiMajorAxis Half the length of the largest axis of the ellipses
 * orbit
 * @param eccentricity How elliptical the orbit is, from 0 to 1
 * @param period The total time taken to complete one orbit
 * @param options optional params
 * @param options.barycentre the base x, y co-ord for the oject, e.g. for satellites
 * @param options.isPairPhased if this object is out of phase with a partner object
 * @returns details of the orbital positions
 * @example getOrbitalPosition('moon', 15, 0.01, 0.01, 30, { barycentre: 1, 0 })
 * // returns
 * { name: 'moon', dayOfOrbit: 15, x: 1, y: 0.01, phi: 90 }
 */
function getOrbitalPosition(
  name: string,
  dayOfOrbit: number,
  semiMajorAxis: number,
  eccentricity: number,
  period: number,
  { barycentre = cartOrigin, isPairPhased = false },
) {
  const decimalPlaces = 5;
  const meanAnomaly = getMeanAnomaly(
    dayOfOrbit,
    period,
    isPairPhased ? period / 2 : 0,
  );
  const eccentricAnomaly = getEccentricAnomaly(
    eccentricity,
    meanAnomaly,
    decimalPlaces,
  );
  const { x, y } = getCartPosition(
    semiMajorAxis,
    eccentricity,
    eccentricAnomaly,
  );
  return {
    name,
    stepOfOrbit: dayOfOrbit,
    period: astroMath.unit(period, periodUnit),
    revolutions: Math.trunc(dayOfOrbit / period),
    ...{
      x: astroMath.add(astroMath.unit(x, semiMajorAxisUnit), barycentre.x),
      y: astroMath.add(astroMath.unit(y, semiMajorAxisUnit), barycentre.y),
    },
    phi: astroMath.unit(getTrueAnomaly(eccentricity, eccentricAnomaly, decimalPlaces), 'degrees'),
  } as OrbitalPosition;
}

/**
 * Wrapper for @see{getOrbitalPosition}
 * @returns orbital positions keyed by `dayOfOrbit`
 */
function getOrbitalPositions(
  name: string,
  semiMajorAxis: AstroUnit,
  eccentricity: number,
  period: AstroUnit,
  { barycentre = cartOrigin, isPairPhased = false },
) {
  // TODO allow conversion for higher precision
  const periodInDays = period.toNumber(periodUnit);
  const smaInMetres = semiMajorAxis.toNumber(semiMajorAxisUnit);
  const orbitalPositions = Array.from(
    Array.from({ length: periodInDays }).keys(),
    eachDay =>
      getOrbitalPosition(name, eachDay, smaInMetres, eccentricity, periodInDays, {
        barycentre,
        isPairPhased,
      }),
  );
  return keyBy(orbitalPositions, 'dayOfOrbit') as Record<string, OrbitalPosition>;
}

/**
 * Gets the position of the satellite around the host planet, using the planet's
 * positions keyed by dayOfOrbit.
 *
 * Regardless of which has the longer period, it calculates the full orbit
 *
 * @param name
 * @param semiMajorAxis
 * @param eccentricity
 * @param period
 * @param planetPositions
 * @returns satellite positions keyed by day of orbit
 */
function getSatellitePositions(
  name: string,
  semiMajorAxis: number,
  eccentricity: number,
  period: number,
  planetPositions: ReturnType<typeof getOrbitalPositions>,
) {
  const allPlanetDays = Object.keys(planetPositions);
  // if planet orbit is longer, we should track the moons positions along that orbit
  const fullOrbitalPeriod = Math.max(period, allPlanetDays.length);
  const orbitalPositions = Array.from(
    Array.from({ length: fullOrbitalPeriod }).keys(),
    (eachDay) => {
      // if the moons orbit is longer, we should mod the current day so when
      // the planet completes an orbit the correct positions are still used
      const planetPositionDay = (eachDay % allPlanetDays.length).toFixed(0);
      if (!planetPositions[planetPositionDay]) {
        throw new Error(
          `key '${planetPositionDay}' (${eachDay} % ${allPlanetDays.length}) not found in position dictionary`,
        );
      }
      // need better handling, as 'planetPositionDay' should always be in 'planetPositions'
      const { x, y } = planetPositions[planetPositionDay];
      return getOrbitalPosition(
        name,
        eachDay,
        semiMajorAxis,
        eccentricity,
        period,
        { barycentre: { x, y } },
      );
    },
  );
  return keyBy(orbitalPositions, 'dayOfOrbit') as Record<string, OrbitalPosition>;
}

/**
 * Iterates through all the stellar objects in the star system, calculating
 * their location along one orbital period.
 *
 * Combines positions of all satellites with their host planet, so the satellite
 * @returns An array of all position data points for the star system
 */
function getAllPositions(starSystem: StandardisedStellarObject<'planet' | 'satellite' | 'star'>[]) {
  return starSystem.flatMap((stellarObject) => {
    const { satellites = [], name, posParams: params } = stellarObject;
    const { semiMajorAxis, eccentricity, period, isPairPhased } = params;

    const orbitalPositions = getOrbitalPositions(
      name,
      semiMajorAxis,
      eccentricity,
      period,
      { isPairPhased },
    );
    // console.log(stellarObject)
    const satellitePos = satellites.map(({ name, posParams: params }) => {
      const { semiMajorAxis, eccentricity, period } = params;
      const periodInDays = period.toNumber(periodUnit);
      const smaInMetres = semiMajorAxis.toNumber(semiMajorAxisUnit);
      return getSatellitePositions(
        name,
        smaInMetres,
        eccentricity,
        periodInDays,
        orbitalPositions,
      );
    });
    const combinedPositions = [orbitalPositions, ...satellitePos];
    return combinedPositions;
  });
}

/**
 *
 * @returns Object keyed by the day in the orbit, with the values as the orbital
 * data for each planet.
 */
export function getFullOrbits(starSystem: StandardisedStellarObject<'planet' | 'satellite' | 'star'>[]) {
  const stellarObjectByDay = groupBy(
    getAllPositions(starSystem).flatMap(positions => Object.values(positions)),
    'dayOfOrbit',
  );

  const stellarObjectEntries = Object.entries(stellarObjectByDay);
  const lengthOrbitsCount = stellarObjectEntries.at(0)?.at(1)?.length;
  const [completeSet, incompleteSet] = partition(stellarObjectEntries, ([, stellarObjects]) => stellarObjects.length === lengthOrbitsCount);

  const fullOrbits = incompleteSet.reduce((memo, [currentStep, currentObjects]) => {
    const stepNumber = Number.parseInt(currentStep);
    const previousObjects = memo?.[stepNumber - 1];
    if (!previousObjects)
      throw new Error(`No previous day found for ${stepNumber - 1}`);
    const missingObjects = xorBy(previousObjects, currentObjects, 'name');
    const correctedMissingObjects = missingObjects.flatMap((stellarObj) => {
      const periodAsNumber = stellarObj.period.toNumber(periodUnit);
      const modulusStepNumber = stepNumber % periodAsNumber;
      const correctedMissingObject = memo[modulusStepNumber]?.find(eachObject => eachObject.name === stellarObj.name);
      return correctedMissingObject ? [{ ...correctedMissingObject, dayOfOrbit: stepNumber, revolutions: Math.trunc(stepNumber / periodAsNumber) }] : [];
    });
    return { ...memo, [currentStep]: [...correctedMissingObjects, ...currentObjects] };
  }, Object.fromEntries(completeSet));
  return fullOrbits;
}
