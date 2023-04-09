import { D3Element } from "./D3Element.js";
import { nestedAssign } from "./utils.js";

const DEFAULT_ITEM_LEGEND_CONFIG = {
  // pos defaults set in RadarContainer!
  pos: {
    x: null,
    y: null,
  },
  itemSpacing: 18,
  bBoxPadding: 10,
};

export class ItemLegend extends D3Element {
  constructor(groups, itemMarker, config) {
    super();
    this.groups = groups;
    this.itemMarker = itemMarker;
    this.config = nestedAssign(DEFAULT_ITEM_LEGEND_CONFIG, config);
  }

  getElement() {
    const legendGroup = d3.create(this.namespace + "svg")
      .style("overflow", "visible")
      .datum(this.config)
      .classed("item-legend-group", true)
      .attr("x", this.config.pos.x)
      .attr("y", this.config.pos.y);

    legendGroup
      .append("g")
      .classed("item-legend-markers-group", true)
      .selectAll("g")
      .data(this.groups)
      .enter()
      .append((d) => this.itemMarker.getElement(d.id).node())
      .classed("item-legend-symbols", true)
      .attr("transform", (d, i) => `translate(0, ${i * this.config.itemSpacing + this.config.itemSpacing / 2})`);

    // Add one marker in the legend for each name.
    legendGroup
      .append("g")
      .classed("item-legend-texts-group", true)
      .selectAll("g")
      .data(this.groups)
      .enter()
      .append("text")
      .text((d) => d.id)
      .classed("item-legend-item-text", true)
      .attr("x", this.config.itemSpacing)
      .attr("y", (d, i) => i * this.config.itemSpacing + this.config.itemSpacing / 2)
      .attr("text-anchor", "left")
      .style("dominant-baseline", "middle");

    // legendGroup.attr("transform", `translate (${this.config.pos.x} ${this.config.pos.y})`);

    return legendGroup;
  }
}
