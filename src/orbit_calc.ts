import type { OrbitalPosition } from './orbit.types.ts';
import type { StandardisedStellarObject } from './StellarTypes.d.ts';
import { groupBy, keyBy, partition, xorBy } from 'lodash-es';
import invariant from 'tiny-invariant';
import { getAstroMath } from './astroMath.ts';
import { degToRad, rounding } from './utils.ts';

const astroMath = getAstroMath();

// what units to use when making calculations
const semiMajorAxisUnit = 'AU';
const periodUnit = 'day';

const cartOrigin = {
  x: astroMath.unit(`0 ${semiMajorAxisUnit}`),
  y: astroMath.unit(`0 ${semiMajorAxisUnit}`),
  z: astroMath.unit(`0 ${semiMajorAxisUnit}`),
};

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

function getRadialDistance(semiMajorAxis: number, eccentricity: number, eccentricAnomaly: number) {
  const radialDistance = semiMajorAxis * (1 - eccentricity * Math.cos(eccentricAnomaly));
  return radialDistance;
}

/**
 * The cartesian Co-ordinates of the system
 * @param radialDistance current distance from barycentre
 * @param longitudeAscendingNode the point where the orbit of the object passes
 * through the plane of reference
 * @param inclination orbit tilt
 * @param argPeriapsis angle of periapsis
 * @param trueAnomaly angle around a Keplerian orbit, between the
 * periapsis and the current position, from the main focus of the ellipse
 * @returns The x, y, z co-ordinates from the center of the system
 */
function getCartPosition(
  radialDistance: number,
  longitudeAscendingNode: number,
  inclination: number,
  argPeriapsis: number,
  trueAnomaly: number,
) {
  const Ω = degToRad(longitudeAscendingNode);
  const i = degToRad(inclination);
  const ω = degToRad(argPeriapsis);
  const u = ω + trueAnomaly;
  return {
    x: radialDistance * (Math.cos(Ω) * Math.cos(u) - Math.sin(Ω) * Math.sin(u) * Math.cos(i)),
    y: radialDistance * (Math.sin(Ω) * Math.cos(u) + Math.cos(Ω) * Math.sin(u) * Math.cos(i)),
    z: radialDistance * (Math.sin(u) * Math.sin(i)),
  };
}
interface OrbitalShape {
  period: number;
  semiMajorAxis: number;
  eccentricity: number;
}
interface OrbitalOrientation {
  longitudeAscendingNode: number;
  inclination: number;
  argPeriapsis: number;
}
/**
 * Gets the instantaneous position of the stellar object in orbit, as well as
 * the name and day this is for
 * @param name The name of the stellar object
 * @param stepOfOrbit The temporal instance in the orbit
 * @param shape shape of the orbit
 * @param shape.period The total time taken to complete one orbit
 * @param shape.semiMajorAxis Half the length of the largest axis of the ellipses
 * orbit
 * @param shape.eccentricity How elliptical the orbit is, from 0 to 1
 * @param orientation orientation params
 * @param orientation.longitudeAscendingNode the point where the orbit of the object passes
 * through the plane of reference
 * @param orientation.inclination orbit tilt
 * @param orientation.argPeriapsis angle of periapsis
 * @param options options for calculation
 * @param options.barycentre the base x, y co-ord for the oject, e.g. for
 * satellites
 * @param options.isPairPhased if this object is out of phase with a partner
 * object
 * @returns details of the orbital positions
 * @example getOrbitalPosition('moon', 15, 0.01, 0.01, 30, { barycentre: 1, 0 })
 * // returns { name: 'moon', stepOfOrbit: 15, x: 1, y: 0.01, phi: 90 }
 */
function getOrbitalPosition(
  name: string,
  stepOfOrbit: number,
  {
    period,
    semiMajorAxis,
    eccentricity,
  }: OrbitalShape,
  {
    longitudeAscendingNode = 0,
    inclination = 0,
    argPeriapsis = 0,
  }: OrbitalOrientation,
  {
    barycentre = cartOrigin,
    isPairPhased = false,
  },
) {
  const decimalPlaces = 5;
  const meanAnomaly = getMeanAnomaly(
    stepOfOrbit,
    period,
    isPairPhased ? period / 2 : 0,
  );
  const eccentricAnomaly = getEccentricAnomaly(
    eccentricity,
    meanAnomaly,
    decimalPlaces,
  );
  const radialDistance = getRadialDistance(semiMajorAxis, eccentricity, eccentricAnomaly);
  const trueAnomaly = getTrueAnomaly(eccentricity, eccentricAnomaly, decimalPlaces);

  const { x, y, z } = getCartPosition(
    radialDistance,
    longitudeAscendingNode,
    inclination,
    argPeriapsis,
    trueAnomaly,
  );
  return {
    name,
    stepOfOrbit,
    period: astroMath.unit(period, periodUnit),
    revolutions: Math.trunc(stepOfOrbit / period),
    ...{
      x: astroMath.add(astroMath.unit(x, semiMajorAxisUnit), barycentre.x),
      y: astroMath.add(astroMath.unit(y, semiMajorAxisUnit), barycentre.y),
      z: astroMath.add(astroMath.unit(z, semiMajorAxisUnit), barycentre?.z),
    },
    phi: astroMath.unit(trueAnomaly, 'degrees'),
  } as OrbitalPosition;
}

/**
 * Wrapper for @see{getOrbitalPosition}
 * @returns orbital positions keyed by `stepOfOrbit`
 */
function getOrbitalPositions(
  name: string,
  {
    period,
    semiMajorAxis,
    eccentricity,
  }: OrbitalShape,
  {
    longitudeAscendingNode = 0,
    inclination = 0,
    argPeriapsis = 0,
  }: OrbitalOrientation,
  {
    barycentre = cartOrigin,
    isPairPhased = false,
  },
) {
  const orbitalPositions = Array.from(
    Array.from({ length: period }).keys(),
    stepOfOrbit =>
      getOrbitalPosition(name, stepOfOrbit, {
        semiMajorAxis,
        eccentricity,
        period,
      }, {
        longitudeAscendingNode,
        inclination,
        argPeriapsis,
      }, {
        barycentre,
        isPairPhased,
      }),
  );
  return keyBy(orbitalPositions, 'stepOfOrbit') as Record<string, OrbitalPosition>;
}

/**
 * Gets the position of the satellite around the host planet, using the planet's
 * positions keyed by stepOfOrbit.
 *
 * Regardless of which has the longer period, it calculates the full orbit
 *
 * @param name
 * @param satelliteOrbitalShape
 * @param satelliteOrbitalOrientation
 * @param planetPositions
 * @returns satellite positions keyed by day of orbit
 */
function getSatellitePositions(
  name: string,
  satelliteOrbitalShape: OrbitalShape,
  satelliteOrbitalOrientation: OrbitalOrientation,
  planetPositions: ReturnType<typeof getOrbitalPositions>,
) {
  const allPlanetSteps = Object.keys(planetPositions);
  // if planet orbit is longer, we should track the moons positions along that orbit
  const fullOrbitalPeriod = Math.max(satelliteOrbitalShape.period, allPlanetSteps.length);
  const orbitalPositions = Array.from(
    Array.from({ length: fullOrbitalPeriod }).keys(),
    (stepOfOrbit) => {
      // if the moons orbit is longer, we should mod the current day so when
      // the planet completes an orbit the correct positions are still used
      const planetPositionAtStep = (stepOfOrbit % allPlanetSteps.length).toFixed(0);
      invariant(
        planetPositionAtStep in planetPositions,
        `key '${planetPositionAtStep}' (${stepOfOrbit} % ${allPlanetSteps.length}) not found in position dictionary`,
      );
      // need better handling, as 'planetPositionAtStep' should always be in 'planetPositions'
      const { x, y, z } = planetPositions[planetPositionAtStep] ?? {};
      invariant(
        x !== undefined && y !== undefined && z !== undefined,
        'x, y and z must be defined',
      );
      return getOrbitalPosition(
        name,
        stepOfOrbit,
        satelliteOrbitalShape,
        satelliteOrbitalOrientation,
        { barycentre: { x, y, z } },
      );
    },
  );
  return keyBy(orbitalPositions, 'stepOfOrbit') as Record<string, OrbitalPosition>;
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
    const {
      semiMajorAxis,
      eccentricity,
      period,
      argPeriapsis = 0,
      inclination = 0,
      longitudeAscendingNode = 0,
      isPairPhased = false,
    } = params;
    // TODO allow conversion for higher precision
    const periodInDays = period.toNumber(periodUnit);
    const smaInMetres = semiMajorAxis.toNumber(semiMajorAxisUnit);
    const orbitalShape = { semiMajorAxis: smaInMetres, eccentricity, period: periodInDays };
    const orbitalOrientation = { argPeriapsis, inclination, longitudeAscendingNode };
    const orbitalPositions = getOrbitalPositions(
      name,
      orbitalShape,
      orbitalOrientation,
      { isPairPhased },
    );
    const satellitePos = satellites.map(({ name, posParams: params }) => {
      const {
        semiMajorAxis,
        eccentricity,
        period,
        argPeriapsis = 0,
        inclination = 0,
        longitudeAscendingNode = 0,
      } = params;
      const periodInDays = period.toNumber(periodUnit);
      const smaInMetres = semiMajorAxis.toNumber(semiMajorAxisUnit);
      const orbitalShape = { semiMajorAxis: smaInMetres, eccentricity, period: periodInDays };
      const orbitalOrientation = { argPeriapsis, inclination, longitudeAscendingNode };
      return getSatellitePositions(
        name,
        orbitalShape,
        orbitalOrientation,
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
    'stepOfOrbit',
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
      return correctedMissingObject ? [{ ...correctedMissingObject, stepOfOrbit: stepNumber, revolutions: Math.trunc(stepNumber / periodAsNumber) }] : [];
    });
    return { ...memo, [currentStep]: [...correctedMissingObjects, ...currentObjects] };
  }, Object.fromEntries(completeSet));
  return fullOrbits;
}
