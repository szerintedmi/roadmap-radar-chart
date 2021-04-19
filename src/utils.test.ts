import { scaleProportional, calculateAnchorPlacement, nestedAssign } from "./utils";

describe("test scaleProportional fx", () => {
  it("should not change when items are already at total", () => {
    expect(scaleProportional([10, 20, 30], 60)).toEqual([10, 20, 30]);
  });

  it("should scale up ", () => {
    expect(scaleProportional([1, 7, 2], 100)).toEqual([10, 70, 20]);
  });

  it("should scale up with min value", () => {
    expect(scaleProportional([1, 9, 2], 100, 20)).toEqual([20, 60, 20]);
  });

  it("should scale down", () => {
    expect(scaleProportional([10, 70, 20], 10)).toEqual([1, 7, 2]);
  });

  it("should scale down with min value", () => {
    expect(scaleProportional([10, 90, 20], 10, 2)).toEqual([2, 6, 2]);
  });

  it("should scale down with minValue higher than targetTotal", () => {
    expect(scaleProportional([10, 90], 1, 2)).toEqual([0.5, 0.5]);
  });
});

describe("test calculateAnchorPlacement fx", () => {
  it("should return correct anchors close to noon angle", () => {
    expect(calculateAnchorPlacement((3 * Math.PI) / 180)).toEqual({ hAnchor: "middle", vAnchor: "alphabetic" });
  });

  it("should return correct anchors close to 3 o'clock angle", () => {
    expect(calculateAnchorPlacement((92 * Math.PI) / 180)).toEqual({ hAnchor: "start", vAnchor: "middle" });
  });

  it("should return correct anchors close to 6 o'clock angle", () => {
    expect(calculateAnchorPlacement((178 * Math.PI) / 180)).toEqual({ hAnchor: "middle", vAnchor: "text-before-edge" });
  });

  it("should return correct anchors close to 9 o'clock angle", () => {
    expect(calculateAnchorPlacement((272 * Math.PI) / 180)).toEqual({ hAnchor: "end", vAnchor: "middle" });
  });

  it("should return correct anchors when start and end angle provided", () => {
    expect(calculateAnchorPlacement((2 * Math.PI) / 180, (179 * Math.PI) / 180)).toEqual({
      hAnchor: "start",
      vAnchor: "middle",
    });
  });

  it("should return correct anchors when custom cutoffs provided", () => {
    expect(calculateAnchorPlacement((44 * Math.PI) / 180, (44 * Math.PI) / 180, { h: 45, v: 45 })).toEqual({
      hAnchor: "middle",
      vAnchor: "alphabetic",
    });
  });

  it("should throw for incorrect angels", () => {
    expect(() => calculateAnchorPlacement((360 * Math.PI) / 180 + 0.1)).toThrow(Error);
    expect(() => calculateAnchorPlacement((-0.1 * Math.PI) / 180)).toThrow(Error);
    expect(() => calculateAnchorPlacement(0, (360 * 2 * Math.PI) / 180 + 0.1)).toThrow(Error);
  });
});

describe("test nestedAssign fx", () => {
  it("should assign nested values keeping target properties", () => {
    expect(nestedAssign({ a: 1, b: { x: 2 } }, { b: { y: 3 } })).toEqual({ a: 1, b: { x: 2, y: 3 } });
    expect(nestedAssign({ a: 1, b: { x: 2 } }, { c: { y: 3 } })).toEqual({ a: 1, b: { x: 2 }, c: { y: 3 } });
    expect(
      nestedAssign(
        { l1_1: 1, l1_2: { l2_1: { l3_1: 2, l3_2: 3 }, l2_2: 4, l2_3: 5 } },
        { l1_2: { l2_1: { l3_1: 6 }, l2_2: 7 } }
      )
    ).toEqual({ l1_1: 1, l1_2: { l2_1: { l3_1: 6, l3_2: 3 }, l2_2: 7, l2_3: 5 } });
    expect(nestedAssign({ a: 1, b: { x: 2 } }, [3, "4"])).toEqual({ a: 1, b: { x: 2 }, 0: 3, 1: "4" });
  });

  it("should work with empty targets ", () => {
    expect(nestedAssign({}, { b: { x: 3 } })).toEqual({ b: { x: 3 } });
    expect(nestedAssign(null, { b: 3 })).toEqual({ b: 3 });
    expect(nestedAssign(undefined, { b: 3 })).toEqual({ b: 3 });
    expect(nestedAssign("", { b: 3 })).toEqual({ b: 3 });
    expect(nestedAssign([], { b: 3 })).toEqual({ b: 3 });
    expect(nestedAssign([1], { b: 3 })).toEqual({ 0: 1, b: 3 });
    expect(nestedAssign("x", { b: 3 })).toEqual({ 0: "x", b: 3 }); // should this rather throw?
  });

  it("should assign nested values overwriting existing target properties ", () => {
    expect(nestedAssign({ a: 1, b: { x: 2 } }, { b: { x: 3 } })).toEqual({ a: 1, b: { x: 3 } });
    expect(nestedAssign({ a: 1, b: { x: 2 } }, { b: undefined })).toEqual({ a: 1, b: undefined });
  });

  it("should return target if source is null/undefined/empty", () => {
    expect(nestedAssign({ a: 1, b: { x: 2 } }, undefined)).toEqual({ a: 1, b: { x: 2 } });
    expect(nestedAssign({ a: 1, b: { x: 2 } }, null)).toEqual({ a: 1, b: { x: 2 } });
    expect(nestedAssign({ a: 1, b: { x: 2 } }, {})).toEqual({ a: 1, b: { x: 2 } });
    expect(nestedAssign({ a: 1, b: { x: 2 } }, [])).toEqual({ a: 1, b: { x: 2 } });
  });

  it("should throw if trying to assign base types", () => {
    expect(() => nestedAssign({ a: 1, b: { x: 2 } }, "")).toThrow(Error);
    expect(() => nestedAssign({ a: 1, b: { x: 2 } }, 15)).toThrow(Error);
  });
});
