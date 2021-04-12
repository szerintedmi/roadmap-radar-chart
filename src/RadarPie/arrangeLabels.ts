import * as d3 from "d3";
import { Force } from "d3";
import { RadarError } from "../Errors";
import { transfromElementPoint } from "../geometricUtils";
import { ItemLegendConfig } from "./ItemLegend";
import { Slice, SubSlice } from "./RadarPie";
import { rectForceCollide } from "./rectForceCollide";

export interface BBoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
}

interface LabelBoxedData {
  x: number; // box center coordinates required by force Collide
  y: number;
  width: number;
  height: number;
  origBBox: BBoxRect;
  isSubLabel: boolean;
  containerTopLeftOffset: { x: number; y: number };
  isAnchor: false;
}

interface AnchorData {
  x: number;
  y: number;
  fx: number;
  fy: number;
  containerTopLeftOffset: { x: number; y: number };
  isAnchor: true;
}

export function arrangeLabels(
  containerEl: d3.Selection<any, any, any, any>
): Promise<d3.Selection<any, any, any, any>> {
  return new Promise((resolve) => {
    // const containerEl
    if (!document.contains(containerEl.node())) {
      throw new RadarError("Element must be attached to DOM before calling arrangeLabels");
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Calculate bounding boxes, create rects and bind data
    const elementsToArrange: d3.Selection<
      SVGGraphicsElement,
      Slice | SubSlice | ItemLegendConfig,
      any,
      any
    > = containerEl.selectAll(".label, .item-legend-group, .ring-legend-group");

    elementsToArrange.each((d, i, g) => {
      const el = d3.select(g[i]);
      const elNode = el.node();

      const bBox = elNode.getBBox();

      let padding: number;

      let label: string;
      if ("labelData" in d) {
        padding = d.labelData.bBoxPadding;
        label = d.label;
      } else if ("bBoxPadding" in d) {
        padding = d.bBoxPadding;
        label = "";
      } else {
        throw new RadarError("Invalid element data in arrangeLabels:\n" + JSON.stringify(d));
      }

      const paddedBBox = {
        x: bBox.x - padding,
        y: bBox.y - padding,
        width: bBox.width + padding * 2,
        height: bBox.height + padding * 2,
        padding,
      };

      const bBoxCenter = { x: bBox.x + paddedBBox.width / 2 - padding, y: bBox.y + paddedBBox.height / 2 - padding };
      const transformedbBoxCenter = transfromElementPoint(elNode, containerEl.node(), bBoxCenter);

      const svgbBoxTopLeft = { x: parseFloat(el.attr("x")), y: parseFloat(el.attr("y")) };

      const labelBoxedData: LabelBoxedData = {
        x: transformedbBoxCenter.x,
        y: transformedbBoxCenter.y,
        width: paddedBBox.width,
        height: paddedBBox.height,
        origBBox: paddedBBox,
        containerTopLeftOffset: {
          x: transformedbBoxCenter.x - svgbBoxTopLeft.x,
          y: transformedbBoxCenter.y - svgbBoxTopLeft.y,
        },

        isSubLabel: el.classed("subslice-label"),
        isAnchor: false,
      };

      el.datum(labelBoxedData);
      const insertedEl =
        el.classed("item-legend-group") || el.classed("ring-legend-group")
          ? el.insert("rect", "g").classed("legend-bbox", true)
          : el
              .insert("rect", "text")
              .classed("subslice-label-bbox", el.classed("subslice-label"))
              .classed("slice-label-bbox", el.classed("slice-label"));

      insertedEl

        .classed("label-bbox", true)
        .attr("width", labelBoxedData.origBBox.width)
        .attr("height", labelBoxedData.origBBox.height)
        .attr("x", labelBoxedData.origBBox.x)
        .attr("y", labelBoxedData.origBBox.y);
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Setup simulation.
    const containerBBox = containerEl.node().getBBox();
    const labelBBoxesSelection = containerEl.selectAll(".label, .item-legend-group, .ring-legend-group");
    const bBoxes = labelBBoxesSelection.data() as LabelBoxedData[];
    const labelAnchorPoints: AnchorData[] = (labelBBoxesSelection.data() as LabelBoxedData[]).map((d) => {
      return {
        x: d.x, // We will set up forces to pull the bBoxes
        y: d.y,
        fx: d.x,
        fy: d.y,
        containerTopLeftOffset: { ...d.containerTopLeftOffset },
        isAnchor: true,
      };
    });

    const simNodes = [...bBoxes, ...labelAnchorPoints];

    const simLinks = bBoxes.map((node, idx) => ({ source: idx, target: idx + bBoxes.length }));

    const simulation = d3
      .forceSimulation(simNodes)
      .alphaDecay(0.2)
      .force("link", d3.forceLink(simLinks).distance(0).strength(1))
      .force(
        "collide",
        isolate(rectForceCollide(), (d) => !d.isAnchor)
      )
      .force(
        "forceYRight",
        isolate(
          d3.forceX(containerBBox.x + containerBBox.width).strength(0.1),
          (d) => d.x > 0 && !d.isAnchor && !(d as LabelBoxedData).isSubLabel
        )
      )
      .force(
        "forceYLeft",
        isolate(
          d3.forceX(containerBBox.x).strength(0.1),
          (d) => d.x < 0 && !d.isAnchor && !(d as LabelBoxedData).isSubLabel
        )
      );

    function isolate(
      force: Force<LabelBoxedData | AnchorData, any>,
      filter: (node: LabelBoxedData | AnchorData) => boolean
    ) {
      const initialize = force.initialize;
      force.initialize = () => initialize.call(force, simNodes.filter(filter));
      return force;
    }

    simulation.on("tick", onTick);
    simulation.on("end", onEnd);

    const labelsSelection = containerEl.selectAll(".label, .item-legend-group, .ring-legend-group").data(bBoxes);

    if (window.RADAR_DEBUG_MODE) addDebugGroup(containerEl, simNodes);

    let tickCount = 0;
    function onTick() {
      tickCount++;

      labelsSelection
        .attr("x", (d) => d.x - d.containerTopLeftOffset.x)
        .attr("y", (d) => d.y - d.containerTopLeftOffset.y);

      if (window.RADAR_DEBUG_MODE) updateDebugElements(containerEl);
    }

    function onEnd() {
      resolve(containerEl);
      console.log("Label arrangment finished after", tickCount, "iterations");
    }
  });
}

/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
// for debugging
/////////////////////////////////////////////////////////////////////////
function addDebugGroup(el: d3.Selection<any, any, any, any>, simNodes: (LabelBoxedData | AnchorData)[]) {
  const debugGroup = el.append("g").classed("label-debug-group", true);

  debugGroup
    .selectAll(".label-debug-point-anchor")
    .data(simNodes)
    .join("circle")
    .classed("label-debug-point-anchor", true)
    .attr("r", 2)
    .attr("opacity", 0.7)
    .attr("fill", (d) => (d.isAnchor ? "none" : "green"))
    .attr("stroke", (d) => (d.isAnchor ? "red" : "green"))
    .attr("cx", (d) => d.x - d.containerTopLeftOffset.x)
    .attr("cy", (d) => d.y - d.containerTopLeftOffset.y);
}

function updateDebugElements(el: d3.Selection<any, any, any, any>) {
  (el.selectAll(".label-debug-point-anchor") as d3.Selection<any, LabelBoxedData | AnchorData, any, any>)
    .attr("cx", (d) => d.x - d.containerTopLeftOffset.x)
    .attr("cy", (d) => d.y - d.containerTopLeftOffset.y);
}
