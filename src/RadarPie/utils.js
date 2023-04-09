import { degToRad } from "./geometricUtils.js";

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
export function nestedAssign(_target, source) {
  if (!Array.isArray(source) && typeof source !== "object" && source !== undefined)
    throw new Error("nestedAssign received an invalid source type: " + typeof source);

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
 *
 * @export
 * @param {number[]} items
 * @param {number} targetTotal
 * @param {number} [targetMinValue=0]
 * @returns
 */
export function scaleProportional(items, targetTotal, targetMinValue = 0) {
  const PRECISION = 10000;
  const itemsSum = items.reduce((a, b) => a + b, 0);
  const scaled = items.map((r, i, a) => (targetTotal * r) / itemsSum);

  const scaledMin = scaled.map((i) => Math.max(i, targetMinValue));
  const scaledMinSum = scaledMin.reduce((a, b) => a + b, 0);
  const addedSum = scaledMinSum - targetTotal;

  const aboveMinSum = scaled.filter((i) => i > targetMinValue).reduce((a, b) => a + b, 0);
  const adjustmentRatio = addedSum / aboveMinSum;

  let scaledMinAdjusted = scaledMin.map((it) =>
    it <= targetMinValue ? it : Math.max(it - it * adjustmentRatio, targetMinValue)
  );

  const adjustedSum = scaledMinAdjusted.reduce((a, b) => a + b);

  if (Math.round(adjustedSum * PRECISION) > Math.round(targetTotal * PRECISION)) {
    scaledMinAdjusted = scaleProportional(scaledMinAdjusted, targetTotal);
  }

  return scaledMinAdjusted;
}
/**
 *  Calculate label horizontal and vertical anchor position placement based on which part of a circle is the label
 *   If both startOrMidAngle and endAngle provided it calculates the middle of the angles.
 *   If only startOrMidAngle provided it uses it as the middle angle.
 *
 * @export
 * @param {number} startOrMidAngle in rads
 * @param {number} [endAngle] in rads
 * @param {{h: number; v: number}} [cutOffDegree={ h: 7, v: 45 }] cutoff values are in degrees
 *                                 h: from which angle switch b/w middle and start/end
 *                              horizontal anchor placement at the top/bottom of the circle
 *                          v: from which angle switch b/w baseline / hanging / middle at the right/left of the circle
 * @returns {TextPlacement}
 */
export function calculateAnchorPlacement(startOrMidAngle, endAngle, cutOffDegree = { h: 7, v: 45 }) {
  let rads;
  if (!endAngle) rads = startOrMidAngle;
  else rads = (endAngle - startOrMidAngle) / 2 + startOrMidAngle;
  if (rads > degToRad(360) || rads < 0) throw new Error("Invalid rads for calculateAnchorPlacement: " + rads);
  const anchor = {};
  // circle top section
  if (rads > degToRad(360 - cutOffDegree.h) || rads < degToRad(cutOffDegree.h)) anchor.hAnchor = "middle";
  // bottom section
  else if (rads > degToRad(180 - cutOffDegree.h) && rads < degToRad(180 + cutOffDegree.h)) anchor.hAnchor = "middle";
  // right section
  else if (rads >= degToRad(cutOffDegree.h) && rads <= degToRad(180 - cutOffDegree.h)) anchor.hAnchor = "start";
  // left section
  else if (rads >= degToRad(180 + cutOffDegree.h) && rads <= degToRad(360 - cutOffDegree.h)) anchor.hAnchor = "end";
  // circle top section
  if (rads > degToRad(360 - cutOffDegree.v) || rads < degToRad(cutOffDegree.v)) anchor.vAnchor = "alphabetic";
  // bottom section
  else if (rads > degToRad(180 - cutOffDegree.v) && rads < degToRad(180 + cutOffDegree.v))
    anchor.vAnchor = "text-before-edge";
  // right section
  else if (rads >= degToRad(cutOffDegree.v) && rads <= degToRad(180 - cutOffDegree.v)) anchor.vAnchor = "middle";
  // left section
  else if (rads >= degToRad(180 + cutOffDegree.v) && rads <= degToRad(360 - cutOffDegree.v))
    anchor.vAnchor = "middle";
  return anchor;
}
