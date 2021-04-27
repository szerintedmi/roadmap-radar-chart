// TODO:
//     - make padding size params (SYMBOL_BOUND_RADIUS) dependent on marker size
//   *  - generic container polygon offsetting (padding / shrinking )
//             instead of tampering with arc params):  polygon-offset package buggy. what else?
import { create } from "d3-selection";
import { arc } from "d3-shape";
import { D3Element } from "../D3Element.js";

import { distributePointsWithinBoundary, flattenSVGPath, Point } from "../geometricUtils.js";
import { ItemMarker } from "./ItemMarker.js";
import { RingInfo, Segment } from "./RadarPie.js";

const SYMBOL_BOUND_RADIUS = 6;
const PADDING_ANGLE = (3 * Math.PI) / 180;
const PAD_INNER_RADIUS = SYMBOL_BOUND_RADIUS;
const PAD_OUTER_RADIUS = -SYMBOL_BOUND_RADIUS;

export class RadarSegment extends D3Element {
  segment: Segment;
  ringRadius: number;

  itemMarker: ItemMarker;

  arcCentroid: Point;
  opacity: number;

  //   arcCentroid: Point;
  arcPathString: string;
  itemBoundaryPolygonPoints: Point[];

  constructor(segment: Readonly<Segment>, rings: Readonly<RingInfo[]>) {
    super();
    this.segment = segment;

    this.opacity = rings[this.segment.ringLevel].opacity;

    const arcGenerator = arc();
    this.arcPathString = arcGenerator(this.segment.arcParams);
    this.arcCentroid = arcGenerator.centroid(this.segment.arcParams);

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Distribute items within segment arc
    //    Boundary withing segment arc to place items within
    this.itemBoundaryPolygonPoints = RadarSegment.getItemBoundaryArc(
      this.segment.arcParams,
      PADDING_ANGLE,
      PAD_INNER_RADIUS,
      PAD_OUTER_RADIUS
    );

    if (this.segment.items.length === 1) {
      this.segment.items[0].x = this.arcCentroid[0];
      this.segment.items[0].y = this.arcCentroid[1];
    } else if (this.segment.items.length > 0) {
      distributePointsWithinBoundary(this.itemBoundaryPolygonPoints, segment.items.length).forEach((p: Point, idx) => {
        this.segment.items[idx].x = p[0];
        this.segment.items[idx].y = p[1];
      });
    }
  } // constructor end

  getElement() {
    const segmentGroup = create(this.namespace + "g")
      .classed("radar-segment-group", true)
      .classed("radar-segment-group-level-" + this.segment.ringLevel, true);

    segmentGroup
      .append("path")
      .classed("radar-segment-arc", true)
      .classed("radar-segment-arc-main", true)
      .attr("d", this.arcPathString)
      .attr("fill-opacity", this.opacity);

    if (window.RADAR_DEBUG_MODE) segmentGroup.append(() => this.getDebugElement().node());

    return segmentGroup;
  }

  static getItemBoundaryArc(
    arcParams: d3.DefaultArcObject,
    paddingAngle: number,
    padInnerRadius: number,
    padOuterRadius: number
  ) {
    const arcGenerator = arc();

    const arcPathString = arcGenerator(arcParams);
    const paddedArcParams = {
      ...arcParams,
      padAngle: arcParams.padAngle + paddingAngle,
      innerRadius: arcParams.innerRadius + padInnerRadius,
      outerRadius: arcParams.outerRadius + padOuterRadius,
    };

    const containingArcPathString = arcGenerator(paddedArcParams);
    const containerPolygonPoints = flattenSVGPath(containingArcPathString);

    return containerPolygonPoints;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////
  // Debug displays
  ////////////////////////////////////////////////////////////////////////////////////////////////
  getDebugElement() {
    const debugGroup = create(this.namespace + "g").classed("radar-segment-debug", true);

    // item dots
    debugGroup
      .selectAll("circle")
      .data(this.segment.items)
      .enter()
      .append("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 1)
      .attr("fill", "red");

    // Number of items
    debugGroup
      .append("text")
      .text(this.segment.items.length)
      .attr("font-size", "12px")
      .attr("transform", `translate(${this.arcCentroid[0]} ${this.arcCentroid[1]})`)
      .style("text-anchor", "middle");

    // Items boundary
    const itemBoundaryPolygonString = this.itemBoundaryPolygonPoints.map((d) => d.join(",")).join(" ");
    debugGroup
      .append("polygon")
      .attr("points", itemBoundaryPolygonString)
      .attr("fill", "yellow")
      .attr("fill-opacity", 0.4)
      .attr("stroke", "red")
      .attr("stroke-opacity", 0.5);

    // Segment arc center
    debugGroup
      .append("circle")
      .attr("cx", this.arcCentroid[0])
      .attr("cy", this.arcCentroid[1])
      .attr("r", 2)
      .attr("opacity", 0.5)
      .attr("fill", "orange");

    return debugGroup;
  }
}
