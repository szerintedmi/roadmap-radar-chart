import * as d3 from "d3";
import { D3Element } from "../D3Element";
import { degToRad } from "../geometricUtils";
import { RingInfo } from "./RadarPie";

export type RingLegendConfig = {
  pos: { x: number; y: number };
  scale: number;
  startAngle: number;
  endAngle: number;
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
};

export class RingLegend extends D3Element {
  rings: RingInfo[];
  config: RingLegendConfig;
  arcs: d3.DefaultArcObject[];
  arcGenerator: d3.Arc<any, d3.DefaultArcObject>;

  constructor(rings: RingInfo[], config?: Partial<RingLegendConfig>) {
    super();
    this.rings = rings;
    this.config = Object.assign({}, DEFAULT_RING_LEGEND_CONFIG, config);

    this.arcGenerator = d3.arc();

    this.arcs = this.rings.map((ring) => ({
      innerRadius: ring.innerRadius * this.config.scale,
      outerRadius: (ring.innerRadius + ring.radius) * this.config.scale,
      startAngle: degToRad(this.config.startAngle),
      endAngle: degToRad(this.config.endAngle),
    }));
  }

  getElement() {
    const legendGroup = d3
      .create(this.namespace + "svg")
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

      .attr("alignment-baseline", "mathematical")
      .attr("text-anchor", "middle")
      .attr("x", (d) => this.arcGenerator.centroid(d)[0])
      .attr("y", (d) => this.arcGenerator.centroid(d)[1])
      .text((d, idx) => this.rings[idx].label);

    return legendGroup;
  }
}
