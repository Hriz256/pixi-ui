import { IPointData } from 'pixi.js';

/**
 * Maths auxiliary functions
 */
export class UtilsMath {
  /**
   * Creates a new scalar with values linearly interpolated of "amount" between the start scalar and the end scalar.
   * @param start start value
   * @param end target value
   * @param amount amount to lerp between
   * @returns the lerped value
   */
  public static lerp(start: number, end: number, amount: number) {
    return start + (end - start) * amount;
  }

  /**
   * Returns the value itself if it's between min and max.
   * Returns min if the value is lower than min.
   * Returns max if the value is greater than max.
   * @param value the value to clmap
   * @param min the min value to clamp to
   * @param max the max value to clamp to
   * @returns the clamped value
   */
  public static clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Returns a random integer number between and min and max values
   * @param min min value of random
   * @param max max value of random
   * @returns random value
   */
  public static randomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Calculate the distance between two sets of coordinates (points).
   * @param first
   * @param second
   * @returns The distance between each point.
   */
  public static distanceBetweenPoints(first: IPointData, second: IPointData): number {
    const dx = second.x - first.x;
    const dy = second.y - first.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculates the angle between two points in radians (in range (-PI, PI])
   * @param first
   * @param second
   * @returns The distance between each point.
   */
  public static angleBetweenPoints(p1: IPointData, p2: IPointData) {
    const dy = p2.y - p1.y;
    const dx = p2.x - p1.x;
    const theta = Math.atan2(dy, dx);

    return theta;
  }

  public static round(num: number, decimalPlaces: number) {
    const p = 10 ** (decimalPlaces || 0);
    const n = num * p * (1 + Number.EPSILON);

    return Math.round(n) / p;
  }

  /**
   * Maps a number from one range to another.
   *
   * This function takes as input a number and two ranges (input and output range).
   * It maps the input number from the input range to the output range.
   * If the computed value falls outside the output range, it is clamped to fit within the range.
   *
   * @param {number} x The input number to map.
   * @param {number} minInput The lower bound of the input range.
   * @param {number} maxInput The upper bound of the input range.
   * @param {number} minOutput The lower bound of the output range.
   * @param {number} maxOutput The upper bound of the output range.
   * @returns {number} The input number mapped to the output range.
   */
  public static map(x: number, minInput: number, maxInput: number, minOutput: number, maxOutput: number): number {
    return UtilsMath.clamp((x - minInput) / (maxInput - minInput), 0, 1) * (maxOutput - minOutput) + minOutput;
  }
}
