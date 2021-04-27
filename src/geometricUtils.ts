// TODO:
//        - run polyfill from.babelrc?
//        - get rid of geometric lib or use it for everything here instead of d3?
//        - maybe get rid of AdaptiveLinearization lib, use d3.geo instead if it results smaller bundle
import SVGPath from "svgpath";
import AdaptiveLinearization from "adaptive-linearization";
import * as geometric from "geometric";
import { polygonArea, polygonContains } from "d3-polygon";

// new SVG interface polyfill required for SVGPathElement.getPathData()  https://svgwg.org/specs/paths/#InterfaceSVGPathData
import "path-data-polyfill";
import { RadarError } from "./Errors.js";

export type Point = [number, number];

export type PointDistance = {
  point: Point;
  distance: number;
};

export type BBox = {
  topLeft: Point;
  width: number;
  height: number;
  area: number;
  bBox: geometric.Polygon;
};

export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 *  Transforms a point in an SVG element to an other element's coordinate system
 *    incorporating existing transforms on the elements
 *
 * @export
 * @param {(SVGGraphicsElement | SVGSVGElement)} sourceElement
 * @param {(SVGGraphicsElement | SVGSVGElement)} targetElement
 * @param {{
 *     x: number;
 *     y: number;
 *   }} sourcePoint Coordinates in the sourceElement { x: number, y: number}
 * @returns
 */
export function transformElementPoint(
  sourceElement: SVGGraphicsElement | SVGSVGElement,
  targetElement: SVGGraphicsElement | SVGSVGElement,
  sourcePoint: {
    x: number;
    y: number;
  }
) {
  let pt = new DOMPoint(sourcePoint.x, sourcePoint.y);

  pt = pt.matrixTransform(targetElement.getScreenCTM().inverse().multiply(sourceElement.getScreenCTM()));

  return pt;
}

/**
 * Calculate BBox on elements not attached to svg element yet
 *      https://stackoverflow.com/questions/28282295/getbbox-of-svg-when-hidden
 *
 * @export
 * @param {SVGGraphicsElement} svgEl
 * @returns
 */
export function getSvgBBox(svgEl: SVGGraphicsElement) {
  if (document.contains(svgEl)) {
    return svgEl.getBBox();
  }
  const tempDiv = document.createElement("div");
  tempDiv.setAttribute("style", "position:absolute; visibility:hidden; width:0; height:0");
  document.body.appendChild(tempDiv);
  const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  tempDiv.appendChild(tempSvg);
  const tempEl = svgEl.cloneNode(true) as SVGGraphicsElement;
  tempSvg.appendChild(tempEl);
  const bb = tempEl.getBBox();
  document.body.removeChild(tempDiv);
  return bb;
}

export function getPolygonBBox(poly: geometric.Polygon): BBox {
  const bounds = geometric.polygonBounds(poly);
  const topLeftX = bounds[0][0];
  const topLeftY = bounds[0][1];
  const bottomRightX = bounds[1][0];
  const bottomRightY = bounds[1][1];
  const width = Math.abs(topLeftX - bottomRightX);
  const height = Math.abs(topLeftY - bottomRightY);

  const bBox = [...bounds, [bounds[1][0], bounds[0][1]], [bounds[0][0], bounds[1][1]]] as geometric.Polygon;

  return {
    topLeft: [topLeftX, topLeftY],
    bBox,
    width,
    height,
    area: width * height,
  };
}

export function getPointsDistance(a: Point, b: Point): number {
  const xDiff = a[0] - b[0];
  const yDiff = a[1] - b[1];

  return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
}

export function getClosestPointOnPath(pathString: string, point: Point): PointDistance {
  // const pathNode = d3
  //   .create("svg:path")
  //   .call((el) => el.attr("d", pathString))
  //   .node() as SVGPathElement; //  NewSVGPathElement is a workaround to make typing work with path-data-polyfill

  const pathNode = window.document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathNode.setAttributeNS(null, "d", pathString);

  const pathLength = pathNode.getTotalLength();
  let precision = (pathLength / pathNode.getPathData().length) * 0.125; // getPathData is new in SVG spec: see polyfill import
  let best: DOMPoint;
  let bestLength: number;
  let bestDistance = Infinity;

  // linear scan for coarse approximation
  for (let scan: DOMPoint, scanLength = 0, scanDistance: number; scanLength <= pathLength; scanLength += precision) {
    if ((scanDistance = distance2((scan = pathNode.getPointAtLength(scanLength)))) < bestDistance) {
      (best = scan), (bestLength = scanLength), (bestDistance = scanDistance);
    }
  }

  // binary search for precise estimate
  precision *= 0.5;
  while (precision > 0.5) {
    let before: DOMPoint,
      after: DOMPoint,
      beforeLength: number,
      afterLength: number,
      beforeDistance: number,
      afterDistance: number;
    if (
      (beforeLength = bestLength - precision) >= 0 &&
      (beforeDistance = distance2((before = pathNode.getPointAtLength(beforeLength)))) < bestDistance
    ) {
      (best = before), (bestLength = beforeLength), (bestDistance = beforeDistance);
    } else if (
      (afterLength = bestLength + precision) <= pathLength &&
      (afterDistance = distance2((after = pathNode.getPointAtLength(afterLength)))) < bestDistance
    ) {
      (best = after), (bestLength = afterLength), (bestDistance = afterDistance);
    } else {
      precision *= 0.5;
    }
  }

  const bestRet = { point: [best.x, best.y] as Point, distance: Math.sqrt(bestDistance) };

  return bestRet;

  function distance2(p) {
    const dx = p.x - point[0];
    const dy = p.y - point[1];
    return dx * dx + dy * dy;
  }
}

type AdaptiveLinearizationOptions = {
  /** Approximation scale: Higher is better quality  */
  approximationScale?: number; // default: 1

  /**  Limit to disregard the curve distance at */
  curve_distance_epsilon?: number; // default: 1e-30;

  /** Limit to disregard colinearity at */
  curveColinearityEpsilon?: number; // default:1e-30;

  /** Limit disregard angle tolerance */
  curveAngleToleranceEpsilon?: number; // default: 0.01;

  /** Angle tolerance, higher is better quality */
  angleTolerance?: number; // default:0.4;

  /** Hard recursion subdivision limit */
  recursionLimit?: number; // default:32;

  /** Limit for curve cusps: 0 = off (range: 0 to pi) */
  cuspLimit?: number; // default: 0;
};

/**
 * Converts an SVG path to points of a polygon.
 *
 * Converts all bezier curves into a series of lines based on an acceptable error value
 * (i.e. it will add more lines where the curve is curvier, and less lines if it's mostly straight ).
 *
 * Default  approximationScale: 0.1 (low quality, less lines). It can be overridden in options param
 *
 * More config options: https://github.com/fforw/adaptive-linearization#options
 *
 * @export
 * @param {string} SVGPathString
 * @param {AdaptiveLinearizationOptions} [options={ approximationScale: 0.1 }]
 * @returns {Point[]} Array of polygon points
 */
export function flattenSVGPath(
  SVGPathString: string,
  options: AdaptiveLinearizationOptions = { approximationScale: 0.2 }
): Point[] {
  const points: Point[] = [];

  const al = new AdaptiveLinearization((x1: number, y1: number, x2: number, y2: number) => {
    // if (points.length === 0) points.push([x1, y1]);
    points.push([x2, y2]);
  }, options);

  SVGPath(SVGPathString).unarc().abs().iterate(al.svgPathIterator);

  return points;
}

export function distributePointsWithinBoundary(boundaryPolygonPoints: Point[], pointsCount: number) {
  const POINT_DENSITY = 0.8; // higher: points  more spread out. lower: points denser towards polygon center
  const MAX_ITERATION_COUNT = 20; // give up if we can't enough points

  const points: Point[] = new Array(pointsCount);

  let bBox: BBox;
  try {
    bBox = getPolygonBBox(boundaryPolygonPoints);
  } catch (error) {
    const errorText =
      "WHOOPS. Can't get segment's bounding box.\n" +
      "Segment likely too small.\n" +
      "Try to adjust pie settings (eg. minSubSliceAngle)";

    console.error(errorText);
    console.log("polygonPoints:", boundaryPolygonPoints);

    throw new RadarError(errorText);
  }
  const area = Math.abs(polygonArea(boundaryPolygonPoints));
  const polygonPathString = pointsToPathString(boundaryPolygonPoints);

  const boxToPolyAreaRatio = bBox.area / area;

  let minPoints = Math.floor(boxToPolyAreaRatio * pointsCount * POINT_DENSITY);
  let pointsInside = spreadPoints(boundaryPolygonPoints, polygonPathString, bBox, minPoints);
  let iterationCount = 1;
  while (pointsInside.length < pointsCount && iterationCount < MAX_ITERATION_COUNT) {
    minPoints++;
    pointsInside = spreadPoints(boundaryPolygonPoints, polygonPathString, bBox, minPoints);
    iterationCount++;
  }

  if (pointsInside.length < pointsCount) {
    const errorText =
      "WHOOPS. Can't place all RadarItems in segment.\n" +
      "Too many items in one segment and/or segment too small." +
      "Try to adjust pie settings (eg. minSubSliceAngle)";

    console.error(errorText);
    console.error("iterationCount", iterationCount);
    console.error("bBox", bBox);
    console.error("Points to be placed", pointsCount, "minPoints", minPoints);
    console.error("points inside:", pointsInside.length);
    throw new RadarError(errorText);
  }

  pointsInside.sort(function (a, b) {
    // sort by distance from centroid
    return a.distance - b.distance;
  });

  for (let i = 0; i < pointsCount; i++) {
    points[i] = pointsInside[i].point;
  }

  return points;
}

export function pointsToPathString(points: Point[], closePath = true) {
  const closeChar = closePath ? " Z" : "";
  const pathString = "M" + points.map((point) => point.join(",")).join(" ") + closeChar;

  return pathString;
}

function spreadPoints(boundaryPolygonPoints: Point[], polygonPathString: string, bBox: BBox, minPoints: number) {
  const pointsInside: PointDistance[] = []; // [x, y, distance from centroid]
  const cols = Math.ceil(Math.sqrt((bBox.width * minPoints) / bBox.height));
  const rows = Math.ceil(Math.sqrt((bBox.height * minPoints) / bBox.width));
  const xSpacing = Math.floor(bBox.width / cols);
  const ySpacing = Math.floor(bBox.height / rows);
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const point: Point = [
        xSpacing / 2 + col * xSpacing + bBox.topLeft[0],
        ySpacing / 2 + row * ySpacing + bBox.topLeft[1],
      ];
      if (polygonContains(boundaryPolygonPoints, point)) {
        pointsInside.push({ point, distance: -getClosestPointOnPath(polygonPathString, point).distance });
      }
    }
  }
  return pointsInside;
}
