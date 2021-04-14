import "./style.css";
import * as d3 from "d3";

import { DataImportError, InputDataValidationErrors } from "./Errors";
import { Example } from "./DataSource/Example";
import { RadarConfig, RadarContainer } from "./RadarPie/RadarContainer";
import { nestedAssign, RecursivePartial } from "./utils";
import { RadarDataSource } from "./DataSource/RadarDataSource";
import { SingleDsvDataSource } from "./DataSource/SingleDsvDataSource";

type RadarUrlParams = {
  radarDebugMode: boolean;
  exampleId: number;
  singleCsvUri: string;
};

const DEFAULT_EXAMPLE_ID = 2;

const CONTAINER_WIDTH = 900;
const CONTAINER_HEIGHT = 500;

const CONFIG: RecursivePartial<RadarConfig> = {
  // most formats can be adjusted in style.css
  // There are sensible defaults for the rest but you can customize it to your needs:
  container: {
    /////// for more padding within the SVG container
    // padding: 100,
  },
  pie: {
    /////// marker size and symbol
    // itemMarker: { size: 40, symbolType: d3.symbolCross },
    /////// Empty middle
    // innerRadius: 10,
    /////// space between rings
    // ringPadding: 5,
    /////// the smallest angle (even for empty sub-slices). Tip: use 360 for equal size sub slices
    // minSubSliceAngle: 12,
    /////// padding around slice and sub-slice labels
    // sliceLabelPadding: 8,
    // subSliceLabelPadding: 4,
  },
  itemLegend: {
    // position legend manually (center of svg: 0,0)
    // pos: { x: 400, y: 0 },
    /////// Increase spacing between legend items
    // itemSpacing: 25,
    /////// Increase padding around legend
    // bBoxPadding: 20,
  },
  ringLegend: {
    /////// position legend manually (center of svg: 0,0)
    // pos: { x: 400, y: 0 },
    /////// start and end angle of ring legend circles. 0 => noon, 90 = 3 o'clock
    // startAngle: 0,
    // endAngle: 90,
    /////// size of ring legend (1 = same as main pie)
    // scale: 0.3,
  },
};

const urlParams = parseUrlParams();
window.RADAR_DEBUG_MODE = urlParams.radarDebugMode;

const svg = d3
  .select("#myRadar-div")
  // .attr("padding-bottom", Math.round((100 * CONTAINER_HEIGHT) / CONTAINER_WIDTH) + "%") // might be needed for x-browser supp
  .append("svg")
  .classed("radar-svg-container", true)
  .attr("viewBox", `0 0 ${CONTAINER_WIDTH} ${CONTAINER_HEIGHT}`);

//////////////////////////////////////////////////////////////////////////
// Fetch data and create radar
let config: RecursivePartial<RadarConfig>;
let radarDs: RadarDataSource;

if (urlParams.singleCsvUri) {
  console.log(urlParams.singleCsvUri);
  radarDs = new SingleDsvDataSource(urlParams.singleCsvUri);
} else {
  const example = new Example(urlParams.exampleId);

  radarDs = example.getDataSource();
  config = nestedAssign(example.radarConfig, CONFIG);
}

const radarContainer = new RadarContainer(config);

radarContainer
  .fetchData(radarDs)
  .then(() => {
    return radarContainer.appendTo(svg);
  })

  .catch((error) => {
    let errorText: string;

    if (error instanceof InputDataValidationErrors) {
      // TODO: have some naming and generic source link in RadarDataSource so we can have more meaningful msgs
      errorText = `${error.errors.length} input data validation errors while fetching data\n ${
        error.message
      }\n${error.errors.join("\n")}`;
    } else if (error instanceof DataImportError) {
      errorText = "Radar content import failed.\n" + error;
    } else {
      errorText = error;
    }

    console.error(error);
    console.error(errorText);

    d3.select(".error-div")
      .append("p")
      .html("<pre>" + errorText + "</pre>");
  });

function parseUrlParams(): RadarUrlParams {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  let exampleId = parseInt(urlParams.get("ex"));
  if (isNaN(exampleId)) exampleId = DEFAULT_EXAMPLE_ID;

  const debugUrlParam = urlParams.get("debug");
  let radarDebugMode = false;
  switch (debugUrlParam) {
    case "true":
    case "1":
    case "on":
    case "yes":
      radarDebugMode = true;
      break;
    default:
      radarDebugMode = false;
  }

  const singleCsvUri = urlParams.get("csv");

  return { radarDebugMode, exampleId, singleCsvUri };
}
