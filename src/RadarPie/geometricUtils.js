import { RadarError } from "./Errors.js";

export function degToRad(degrees) {
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
export function transformElementPoint(sourceElement, targetElement, sourcePoint) {
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
export function getSvgBBox(svgEl) {
  if (document.contains(svgEl)) {
    return svgEl.getBBox();
  }
  const tempDiv = document.createElement("div");
  tempDiv.setAttribute("style", "position:absolute; visibility:hidden; width:0; height:0");
  document.body.appendChild(tempDiv);
  const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  tempDiv.appendChild(tempSvg);
  const tempEl = svgEl.cloneNode(true);
  tempSvg.appendChild(tempEl);
  const bb = tempEl.getBBox();
  document.body.removeChild(tempDiv);
  return bb;
}

export function getBoundingBox(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  points.forEach(point => {
    const [x, y] = point;

    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });

  return [[minX, minY], [maxX, maxY]]
}

export function getPolygonBBox(poly) {
  const bounds = getBoundingBox(poly);
  const bottomLeftX = bounds[0][0];
  const bottomLeftY = bounds[0][1];
  const topRightX = bounds[1][0];
  const topRightY = bounds[1][1];
  const width = Math.abs(topRightX - bottomLeftX);
  const height = Math.abs(topRightY - bottomLeftY);

  return {
    bottomLeft: [bottomLeftX, bottomLeftY],
    width,
    height,
    area: width * height,
  };
}

export function getPointsDistance(a, b) {
  const xDiff = a[0] - b[0];
  const yDiff = a[1] - b[1];

  return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
}

export function getClosestPointOnPath(pathString, point) {
  const pathNode = window.document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathNode.setAttributeNS(null, "d", pathString);

  const pathLength = pathNode.getTotalLength();
  // let precision = (pathLength / pathNode.getPathData().length) * 0.125; // getPathData is new in SVG spec: see polyfill import
  let precision = (pathLength / 3) * 0.125; // getPathData fails
  let best;
  let bestLength;
  let bestDistance = Infinity;

  // linear scan for coarse approximation
  for (let scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
    if ((scanDistance = distance2((scan = pathNode.getPointAtLength(scanLength)))) < bestDistance) {
      (best = scan), (bestLength = scanLength), (bestDistance = scanDistance);
    }
  }

  // binary search for precise estimate
  precision *= 0.5;
  while (precision > 0.5) {
    let before, after, beforeDistance, afterDistance;
    let beforeLength = bestLength - precision;
    let afterLength = bestLength + precision;

    if (
      beforeLength >= 0 &&
      (beforeDistance = distance2((before = pathNode.getPointAtLength(beforeLength)))) < bestDistance
    ) {
      (best = before), (bestLength = beforeLength), (bestDistance = beforeDistance);
    } else if (
      afterLength <= pathLength &&
      (afterDistance = distance2((after = pathNode.getPointAtLength(afterLength)))) < bestDistance
    ) {
      (best = after), (bestLength = afterLength), (bestDistance = afterDistance);
    } else {
      precision *= 0.5;
    }
  }

  const bestRet = { point: [best.x, best.y], distance: Math.sqrt(bestDistance) };

  return bestRet;

  function distance2(p) {
    const dx = p.x - point[0];
    const dy = p.y - point[1];
    return dx * dx + dy * dy;
  }
}

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
export function flattenSVGPath(SVGPathString, options = { approximationScale: 0.2 }) {
  const points = [];

  const al = new AdaptiveLinearization((x1, y1, x2, y2) => {
    // if (points.length === 0) points.push([x1, y1]);
    points.push([x2, y2]);
  }, options);

  SVGPath(SVGPathString).unarc().abs().iterate(al.svgPathIterator);

  return points;
}

export function distributePointsWithinBoundary(boundaryPolygonPoints, pointsCount) {
  const POINT_DENSITY = 0.8; // higher: points  more spread out. lower: points denser towards polygon center
  const MAX_ITERATION_COUNT = 20; // give up if we can't enough points

  const points = new Array(pointsCount);

  let bBox;
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
  const area = Math.abs(d3.polygonArea(boundaryPolygonPoints));
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

export function pointsToPathString(points, closePath = true) {
  const closeChar = closePath ? " Z" : "";
  const pathString = "M" + points.map((point) => point.join(",")).join(" ") + closeChar;

  return pathString;
}

export function spreadPoints(boundaryPolygonPoints, polygonPathString, bBox, minPoints) {
  const pointsInside = []; // [x, y, distance from centroid]
  const cols = Math.ceil(Math.sqrt((bBox.width * minPoints) / bBox.height));
  const rows = Math.ceil(Math.sqrt((bBox.height * minPoints) / bBox.width));
  const xSpacing = Math.floor(bBox.width / cols);
  const ySpacing = Math.floor(bBox.height / rows);
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const point = [
        xSpacing / 2 + col * xSpacing + bBox.bottomLeft[0],
        ySpacing / 2 + row * ySpacing + bBox.bottomLeft[1],
      ];
      if (d3.polygonContains(boundaryPolygonPoints, point)) {
        pointsInside.push({ point, distance: -getClosestPointOnPath(polygonPathString, point).distance });
      }
    }
  }
  return pointsInside;
}
