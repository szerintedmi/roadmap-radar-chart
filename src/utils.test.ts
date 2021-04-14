import { scaleProportional } from "./utils";

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
});

describe("test calculateAnchorPlacement fx", () => {
  it.todo("should return anchors at noon angle");
  it.todo("should return anchors at 3 o'clock angle");
  it.todo("should return anchors at 6 o'clock angle");
  it.todo("should return anchors at 9 o'clock angle");
});
