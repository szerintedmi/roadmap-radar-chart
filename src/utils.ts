import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript";

// https://stackoverflow.com/questions/47914536/use-partial-in-nested-property-with-typescript
export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

/**
 * Recursively assigns properties form source object to target object.
 *  eg: nestedAssign( { a: 1, b: { x: 1}}, { b: {y:1} } )
 *        returns: { { a: 1, b: { x: 1, y: 1} } }
 *  TODO: fine tune return value typing, eg. source could extend target type
 *
 * @export
 * @template T
 * @template S
 * @param {T} _target
 * @param {S} source
 * @returns {T}
 */
export function nestedAssign<T extends Object, S extends Object>(_target: T, source: S): T {
  const target = Object.assign({}, _target);
  if (source) {
    Object.keys(source ? source : {}).forEach((sourceKey) => {
      if (
        Object.keys(source).find((targetKey) => targetKey === sourceKey) !== undefined &&
        typeof source[sourceKey] === "object" &&
        !Array.isArray(source[sourceKey])
      ) {
        target[sourceKey] = nestedAssign(target[sourceKey], source[sourceKey]);
      } else {
        target[sourceKey] = source[sourceKey];
      }
    });
  }
  return target;
}

/**
 * Proportionally scales an array of numbers so total of the items will be equal to the provided target total value.
 *   NB: If a minValue is provided then the proportion of those items will higher in the result than the input
 *
 * @export
 * @param {number[]} items
 * @param {number} targetTotal
 * @param {number} [minValue=0]
 * @param {number} [iterationCt=0]
 * @returns
 */
export function scaleProportional(items: number[], targetTotal: number, minValue: number = 0, iterationCt: number = 0) {
  const RECURSION_LIMIT = 3;

  const itemsSum = items.reduce((a, b) => a + b, 0);
  const scaled = items.map((r, i, a) => (targetTotal * r) / itemsSum);

  const scaledMin = scaled.map((i) => Math.max(i, minValue));
  const scaledMinSum = scaledMin.reduce((a, b) => a + b, 0);
  const addedSum = scaledMinSum - targetTotal;

  const aboveMinSum = scaled.filter((i) => i > minValue).reduce((a, b) => a + b, 0);
  const adjustmentRatio = addedSum / aboveMinSum;

  let scaledMinAdjusted = scaledMin.map((it) => (it <= minValue ? it : Math.max(it - it * adjustmentRatio, minValue)));

  const adjustedSum = scaledMinAdjusted.reduce((a, b) => a + b);

  if (adjustedSum > targetTotal && iterationCt < RECURSION_LIMIT) {
    iterationCt++;
    scaledMinAdjusted = scaleProportional(scaledMinAdjusted, targetTotal, minValue, iterationCt);
  }

  return scaledMinAdjusted;
}
