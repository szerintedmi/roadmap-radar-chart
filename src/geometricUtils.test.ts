import { distributePointsWithinBoundary, flattenSVGPath } from "./geometricUtils";

// For visual check / generate points: https://stackblitz.com/edit/curve-linearizaton?file=index.ts
describe("test flattenSVGPath fx", () => {
  it("should flatten a single line", () => {
    expect(flattenSVGPath("M 10,10 L 100,100")).toStrictEqual([
      [10, 10],
      [100, 100],
    ]);
  });

  it("should flatten a cubic Bézier curve", () => {
    expect(flattenSVGPath("M 100,200 C 100,300 300,200 300,300", { approximationScale: 0.01 })).toStrictEqual([
      [100, 200],
      [100.390625, 208.984375],
      [104.78515625, 223.33984375],
      [112.98828125, 233.88671875],
      [124.4140625, 241.2109375],
      [162.5, 250],
      [237.5, 250],
      [275.5859375, 258.7890625],
      [287.01171875, 266.11328125],
      [295.21484375, 276.66015625],
      [299.609375, 291.015625],
      [300, 300],
    ]);
  });
});

// For visual check / generate points: https://stackblitz.com/edit/distribute-points?file=index.ts
describe("test distributePointsWithinBoundary fx", () => {
  it("should distribute points in a curved polygon", () => {
    const curvePathString = "M 100,200 C 100,300 300,200 100,100 Z";
    const polyPoints = flattenSVGPath(curvePathString, {
      approximationScale: 0.01,
    });

    expect(distributePointsWithinBoundary(polyPoints, 10)).toStrictEqual([
      [143.5, 198],
      [143.5, 170],
      [172.5, 198],
      [143.5, 226],
      [114.5, 142],
      [114.5, 198],
      [114.5, 170],
      [143.5, 142],
      [172.5, 170],
      [114.5, 226],
    ]);
  });
});
