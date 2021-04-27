import { create, select } from "d3-selection";
import { scaleSequential, scaleOrdinal } from "d3-scale";
import { interpolateTurbo, schemeSet1 } from "d3-scale-chromatic";
import { symbol, symbolTriangle } from "d3-shape";
import { NameSpaced } from "../D3Element.js";
import { CatInfo } from "../DataSource/RadarDataSource.js";
import { nestedAssign } from "../utils.js";
import { RadarItem } from "./RadarPie.js";

export type ItemMarkerConfig = {
  size: number;
  symbolType: d3.SymbolType;
  colorScheme: {
    categorical: readonly string[]; // used when items less than categories https://github.com/d3/d3-scale-chromatic#categorical
    diverging: (t: number) => string; // used when items more than categories  https://github.com/d3/d3-scale-chromatic#diverging
  };
  toolTipOpacity: number;
};

type ColorScaleFunc = d3.ScaleSequential<string, never> | d3.ScaleOrdinal<number, string, never>;

// used to create itemMarker object when no itemMarker provided in constructor
export const DEFAULT_ITEM_MARKER_CONFIG: ItemMarkerConfig = {
  size: 80,
  symbolType: symbolTriangle,
  colorScheme: {
    // when no. of groups is less
    categorical: [...schemeSet1], // schemeSet1 schemeTableau10 schemePaired etc: https://github.com/d3/d3-scale-chromatic#categorical
    // when no. of groups is more than available in the categorical scheme
    diverging: interpolateTurbo, //  interpolateTurbo interpolateWarm interpolateRainbow interpolateSinebow https://github.com/d3/d3-scale-chromatic#diverging
  },
  toolTipOpacity: 0.9,
};

export class ItemMarker extends NameSpaced {
  readonly groups: CatInfo[];
  config: ItemMarkerConfig;
  symbol: d3.Symbol<any, any>;
  groupColorScale: ColorScaleFunc;

  constructor(groups: CatInfo[], config?: Partial<ItemMarkerConfig>) {
    super();
    this.groups = groups;

    this.config = nestedAssign(DEFAULT_ITEM_MARKER_CONFIG, config);

    this.symbol = symbol().type(this.config.symbolType).size(this.config.size);

    // Fill Colors of markers per group.
    if (this.groups.length <= this.config.colorScheme.categorical.length) {
      //   when we have enough categorical
      this.groupColorScale = scaleOrdinal([0, this.groups.length], this.config.colorScheme.categorical);
    } else {
      // otherwise interpolation to diverging scale
      this.groupColorScale = scaleSequential([0, this.groups.length], this.config.colorScheme.diverging);
    }
  }

  public getElement(groupName: string): d3.Selection<Element, undefined, null, undefined>;
  public getElement(groupIdx: number): d3.Selection<Element, undefined, null, undefined>;
  public getElement(group: number | string) {
    let groupIdx: number, groupName: string;
    if (typeof group === "string") {
      groupName = group;
      groupIdx = this.groups.findIndex((it) => it.id === group);
    } else {
      groupName = this.groups[group].id;
      groupIdx = group;
    }

    const el = create(this.namespace + "path")
      .attr("d", this.symbol)
      .classed("radar-item-symbol", true)
      .classed("radar-item-symbol-group-" + groupIdx, true)
      .attr("fill", this.groupColorScale(groupIdx));

    return el;
  }

  public getMultipleElements(items: RadarItem[]) {
    // TODO: this group is redundant is svg structure, remove it.
    const markersGroup = create(this.namespace + "g").classed("item-markers", true);

    const toolTipEl = select("#myRadar-tooltip");

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
            `<span class="item-tooltip-ring">${d.ringLabel}</span>` +
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
