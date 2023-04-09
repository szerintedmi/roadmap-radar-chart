import { NameSpaced } from "./D3Element.js";
import { nestedAssign } from "./utils.js";

// used to create itemMarker object when no itemMarker provided in constructor
export const DEFAULT_ITEM_MARKER_CONFIG = {
  size: 80,
  symbolType: d3.symbolTriangle,
  colorScheme: {
    // when no. of groups is less
    categorical: [...d3.schemeCategory10], // schemeSet1 schemeTableau10 schemePaired etc: https://github.com/d3/d3-scale-chromatic#categorical
    // when no. of groups is more than available in the categorical scheme
    diverging: d3.interpolateTurbo, //  interpolateTurbo interpolateWarm interpolateRainbow interpolateSinebow https://github.com/d3/d3-scale-chromatic#diverging
  },
  toolTipOpacity: 0.9,
};

export class ItemMarker extends NameSpaced {
  constructor(groups, config) {
    super();
    this.groups = groups;

    this.config = nestedAssign(DEFAULT_ITEM_MARKER_CONFIG, config);
    this.symbol = d3.symbol().type(this.config.symbolType).size(this.config.size);


    // Fill Colors of markers per group.
    if (this.groups.length <= this.config.colorScheme.categorical.length) {
      //   when we have enough categorical
      this.groupColorScale = d3.scaleOrdinal([0, this.groups.length], this.config.colorScheme.categorical);
    } else {
      // otherwise interpolation to diverging scale
      this.groupColorScale = d3.scaleSequential([0, this.groups.length], this.config.colorScheme.diverging);
    }
  }

  getElement(group) {
    let groupIdx, groupName;
    if (typeof group === "string") {
      groupName = group;
      groupIdx = this.groups.findIndex((it) => it.id === group);
    } else {
      groupName = this.groups[group].id;
      groupIdx = group;
    }

    const el = d3.create(this.namespace + "path")
      .attr("d", this.symbol)
      .classed("radar-item-symbol", true)
      .classed("radar-item-symbol-group-" + groupIdx, true)
      .attr("fill", this.groupColorScale(groupIdx));

    return el;
  }

  getMultipleElements(items) {
    // TODO: this group is redundant is svg structure, remove it.
    const markersGroup = d3.create(this.namespace + "g").classed("item-markers", true);
    const toolTipEl = d3.select("#myRadar-tooltip");

    markersGroup
      .selectAll("g")
      .data(items)
      .enter()
      .append((d) => this.getElement(d.groupName).node())
      .attr("transform", (d) => `translate(${d.x},${d.y})`)

      ////////////////////////////////////////////////////////
      // Tooltip
      .on("mouseover", (event, d) => {
        // toolTipEl.html(`<p>${d.groupName} ${d.sliceId} ${d.subSliceId} ${d.ringId} ${d.id}</p> <p>${d.label}</p>`);
        toolTipEl.html(
          `<span class="item-tooltip-label">${d.label}</span>` +
            `<span class="item-tooltip-group">${d.groupName}</span>` +
            `<span class="item-tooltip-ring">${d.ringId}</span>` +
            `<span class="item-tooltip-description"> ${d.description} </span>`
        );
        // .render();
        // console.log("window", window.innerWidth, toolTipEl.node().getBoundingClientRect());
        toolTipEl
          .style("left", event.x + 10 + "px")
          .style("top", event.y - 28 + "px")
          .style("--selected-group-color", this.groupColorScale(this.groups.findIndex((it) => it.id === d.groupName)))
          .transition()
          .duration(200)
          .style("opacity", this.config.toolTipOpacity)
          .style("visibility", "visible");
      })
      .on("mouseleave", (e, d) => {
        toolTipEl.transition().duration(200).style("opacity", 0).transition().delay(200).style("visibility", "hidden");
      });

    return markersGroup;
  }
}
