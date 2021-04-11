import * as d3 from "d3";
import { RadarContentProcessed, RadarDataSource } from "../DataSource/RadarDataSource";
import { RadarError } from "../Errors";
import { arrangeLabels } from "./arrangeLabels";
import { ItemLegend, ItemLegendConfig } from "./ItemLegend";
import { RadarPie, RadarPieConfig } from "./RadarPie";

export type ContainerConfig = {
  width: number;
  height: number;
  center: { x: number; y: number };

  padding: number; // adjusting padding in css causing  auto scaling issues
};

export type RadarConfig = {
  container: Partial<ContainerConfig>;
  pie: Partial<RadarPieConfig>;
  legend: Partial<ItemLegendConfig>;
};

export const DEFAULT_CONTAINER_CONFIG: ContainerConfig = {
  width: 900,
  height: 500,
  center: { x: 450, y: 250 }, // transform svg center to this point (new 0,0)
  padding: 20, // adjusting padding in css causing  auto scaling issues
};

export class RadarContainer {
  config: Partial<RadarConfig>;

  radarPie: RadarPie;
  legend: ItemLegend;

  datasource: RadarDataSource;
  radarContent: RadarContentProcessed;

  constructor(config?: Partial<RadarConfig>) {
    this.config = config;

    this.config.container = Object.assign({}, DEFAULT_CONTAINER_CONFIG, this.config.container);
    const defaultLegend: Partial<ItemLegendConfig> = {
      pos: {
        x: (this.config.container.width / 8) * 5,
        y: (this.config.container.height / 8) * 2,
      },
    };
    this.config.legend = Object.assign({}, defaultLegend, this.config.legend);
  }

  public async fetchData(datasource: RadarDataSource) {
    this.datasource = datasource;

    await this.datasource.fetchData();
    this.radarContent = this.datasource.getRadarContent();

    return this.radarContent;
  }

  public async appendTo(svgElement: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>) {
    if (!this.datasource && !this.radarContent) throw new RadarError("Call fetchData before calling getElement");

    const radarContainerGroup = svgElement
      .append("g")
      .classed("radar-container-group", true)
      .attr("transform", `translate (${this.config.container.center.x} ${this.config.container.center.y})`);

    this.radarPie = new RadarPie(this.radarContent, this.config.pie);
    const radarPieEl = radarContainerGroup.append(() => this.radarPie.getElement().node());

    this.legend = new ItemLegend(this.radarContent.groups, this.radarPie.itemMarker, this.config.legend);

    radarContainerGroup.append(() => this.legend.getElement().node());

    await arrangeLabels(radarContainerGroup);

    RadarContainer.scaleToFit(
      radarContainerGroup,
      this.config.container.width,
      this.config.container.height,
      this.config.container.padding
    );

    return radarContainerGroup;
  }

  static scaleToFit(
    el: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
    newWidth: number,
    newHeight: number,
    padding: number
  ) {
    const node = el.node();
    const bb = node.getBBox();

    // center of element
    const cx = bb.x + bb.width / 2;
    const cy = bb.y + bb.height / 2;

    const scaleX = newWidth / (bb.width + padding * 2);
    const scaleY = newHeight / (bb.height + padding * 2);
    const scale = Math.min(scaleX, scaleY);
    // move to center
    const targetX = newWidth / 2;
    const targetY = newHeight / 2;

    // move its center to target x,y
    const transX = -cx * scale + targetX;
    const transY = -cy * scale + targetY;

    if (window.RADAR_DEBUG_MODE) {
      el.append("rect")
        .attr("x", bb.x - padding)
        .attr("y", bb.y - padding)
        .attr("width", bb.width + padding * 2)
        .attr("height", bb.height + padding * 2)
        .attr("fill", "none")
        .attr("stroke", "red");

      el.append("rect")
        .attr("x", bb.x)
        .attr("y", bb.y)
        .attr("width", bb.width)
        .attr("height", bb.height)
        .attr("fill", "none")
        .attr("stroke", "gray");

      console.log("svg container bbox", bb, "bb aspect ratio:", bb.width / bb.height);
      console.log("container size:", newWidth, newHeight, "aspect ratio:", newWidth / newHeight);
    }

    return el
      .transition()
      .duration(200)
      .attr("transform", "translate(" + transX + " " + transY + ")scale(" + scale + " " + scale + ")");
  }
}
