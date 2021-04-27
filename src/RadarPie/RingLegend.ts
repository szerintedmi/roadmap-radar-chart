import { create } from "d3-selection";
import { arc } from "d3-shape";

import { D3Element } from "../D3Element.js";
import { degToRad } from "../geometricUtils.js";
import { nestedAssign, RecursivePartial } from "../utils.js";
import { RingInfo } from "./RadarPie.js";

export type RingLegendConfig = {
  pos: { x: number; y: number };
  scale: number;
  startAngle: number;
  endAngle: number;
  bBoxPadding: number;
};

const DEFAULT_RING_LEGEND_CONFIG: RingLegendConfig = {
  // pos defaults set in RadarContainer!
  pos: {
    x: null,
    y: null,
  },
  scale: 0.5,
  startAngle: -45,
  endAngle: 45,
  bBoxPadding: 10,
};

export class RingLegend extends D3Element {
  rings: RingInfo[];
  config: RingLegendConfig;
  arcs: d3.DefaultArcObject[];
  arcGenerator: d3.Arc<any, d3.DefaultArcObject>;

  constructor(rings: RingInfo[], config?: RecursivePartial<RingLegendConfig>) {
    super();
    this.rings = rings;
    this.config = nestedAssign(DEFAULT_RING_LEGEND_CONFIG, config);

    this.arcGenerator = arc();

    this.arcs = this.rings.map((ring) => ({
      innerRadius: ring.innerRadius * this.config.scale,
      outerRadius: (ring.innerRadius + ring.radius) * this.config.scale,
      startAngle: degToRad(this.config.startAngle),
      endAngle: degToRad(this.config.endAngle),
    }));
  }

  getElement() {
    const legendGroup = create(this.namespace + "svg")
      .style("overflow", "visible")
      .datum(this.config)
      .classed("ring-legend-group", true)
      .attr("x", this.config.pos.x)
      .attr("y", this.config.pos.y);

    legendGroup
      .selectAll("path")
      .data(this.arcs)
      .join("path")
      .attr("id", (d, idx) => "radar-segment-arc-legend-" + idx)
      .classed("radar-segment-arc", true)
      .classed("radar-segment-arc-legend", true)
      .attr("d", this.arcGenerator)
      .attr("fill-opacity", (d, idx) => this.rings[idx].opacity);

    legendGroup
      .selectAll("text")
      .data(this.arcs)
      .join("text")

      .classed("ring-legend-text", true)

      .attr("dominant-baseline", "central")
      .attr("text-anchor", "middle")
      .attr("x", (d) => this.arcGenerator.centroid(d)[0])
      .attr("y", (d) => this.arcGenerator.centroid(d)[1])
      .text((d, idx) => this.rings[idx].label);

    return legendGroup;
  }
}
