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
    Object.keys(source ? source : {}).forEach((sourcekey) => {
      if (
        Object.keys(source).find((targetkey) => targetkey === sourcekey) !== undefined &&
        typeof source[sourcekey] === "object" &&
        !Array.isArray(source[sourcekey])
      ) {
        target[sourcekey] = nestedAssign(target[sourcekey], source[sourcekey]);
      } else {
        target[sourcekey] = source[sourcekey];
      }
    });
  }
  return target;
}
