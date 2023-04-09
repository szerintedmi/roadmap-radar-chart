import { RadarError } from "./Errors.js";
import { transformElementPoint } from "./geometricUtils.js";
import { rectForceCollide } from "./rectForceCollide.js";

export function arrangeLabels(containerEl) {
  return new Promise((resolve) => {
    // const containerEl
    if (!document.contains(containerEl.node())) {
      throw new RadarError("Element must be attached to DOM before calling arrangeLabels");
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Calculate bounding boxes, create rects and bind data
    const elementsToArrange = containerEl.selectAll(".label, .item-legend-group, .ring-legend-group");

    elementsToArrange.each((d, i, g) => {
      const el = d3.select(g[i]);
      const elNode = el.node();

      const bBox = elNode.getBBox();

      let padding;

      if ("labelData" in d) {
        padding = d.labelData.bBoxPadding;
      } else if ("bBoxPadding" in d) {
        padding = d.bBoxPadding;
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
      const transformedBBoxCenter = transformElementPoint(
        // we need to pick an element within the svg container element otherwise FireFox getScreeCTM doesn't work
        //    https://bugzilla.mozilla.org/show_bug.cgi?id=849203#c5
        el.select("text").node(),
        containerEl.node(),
        bBoxCenter
      );

      const svgBBoxTopLeft = { x: parseFloat(el.attr("x")), y: parseFloat(el.attr("y")) };

      const labelBoxedData = {
        x: transformedBBoxCenter.x,
        y: transformedBBoxCenter.y,
        width: paddedBBox.width,
        height: paddedBBox.height,
        origBBox: paddedBBox,
        containerTopLeftOffset: {
          x: transformedBBoxCenter.x - svgBBoxTopLeft.x,
          y: transformedBBoxCenter.y - svgBBoxTopLeft.y,
        },

        isSubLabel: el.classed("subSlice-label"),
        isAnchor: false,
      };

      el.datum(labelBoxedData);
      const insertedEl = el.classed("item-legend-group") || el.classed("ring-legend-group")
        ? el.insert("rect", "g").classed("legend-bBox", true)
        : el
            .insert("rect", "text")
            .classed("subSlice-label-bBox", el.classed("subSlice-label"))
            .classed("slice-label-bBox", el.classed("slice-label"));

      insertedEl
        .classed("label-bBox", true)
        .attr("width", labelBoxedData.origBBox.width)
        .attr("height", labelBoxedData.origBBox.height)
        .attr("x", labelBoxedData.origBBox.x)
        .attr("y", labelBoxedData.origBBox.y);
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Setup simulation.
    const containerBBox = containerEl.node().getBBox();
    const labelBBoxesSelection = containerEl.selectAll(".label, .item-legend-group, .ring-legend-group");
    const bBoxes = labelBBoxesSelection.data();
    const labelAnchorPoints = bBoxes.map((d) => {
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

    const simulation = d3.forceSimulation(simNodes)
      .alphaDecay(0.2)
      .force("link", d3.forceLink(simLinks).distance(0).strength(1))
      .force(
        "collide",
        isolate(rectForceCollide(), (d) => !d.isAnchor)
      )
      .force(
        "forceXRight",
        isolate(
          d3.forceX(containerBBox.x + containerBBox.width).strength(0.1),
          (d) => d.x > 0 && !d.isAnchor && !d.isSubLabel
        )
      )
      .force(
        "forceXLeft",
        isolate(
          d3.forceX(containerBBox.x).strength(0.1),
          (d) => d.x < 0 && !d.isAnchor && !d.isSubLabel
        )
      );

    function isolate(force, filter) {
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
      containerEl.dispatch("labelsArranged", { bubbles: true, detail: { iteration: tickCount }, cancelable: true });
      resolve(containerEl);
    }
  });
}

/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
// for debugging
/////////////////////////////////////////////////////////////////////////
function addDebugGroup(el, simNodes) {
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

function updateDebugElements(el) {
  el.selectAll(".label-debug-point-anchor")
    .attr("cx", (d) => d.x - d.containerTopLeftOffset.x)
    .attr("cy", (d) => d.y - d.containerTopLeftOffset.y);
}
