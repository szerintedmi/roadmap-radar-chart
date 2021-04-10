import "./style.css";
import * as d3 from "d3";

import { DataImportError, InputDataValidationErrors } from "./Errors";
import { Example } from "./DataSource/Example";
import { RadarConfig, RadarContainer } from "./RadarPie/RadarContainer";

type RadarUrlParams = {
  radarDebugMode: boolean;
  exampleId: number;
};

const CONTAINER_WIDTH = 900;
const CONTAINER_HEIGHT = 500;

const CONFIG: Partial<RadarConfig> = {
  // most formats can be adjusted in style.css
  // There are sensible defaults for the rest but you can customize it to your needs:
  container: {
    /////// for more padding withing the SVG container
    // padding: 100,
  },
  pie: {
    // marker size and symbol
    // itemMarker: { size: 40, symbolType: d3.symbolCross },
    /////// Empty middle
    // innerRadius: 10,
    /////// space between rings
    // ringPadding: 5,
    /////// the smallest angle (even for empty sub-slices). Tip: use 360 for equal size sub sclices
    // minSubSliceAngle: 360,
    /////// padding between subSlices (in degrees)
    // subSlicePadAngle: 1,
    /////// padding around slice and sub-slice labels
    // sliceLabelPadding: 8,
    // subSliceLabelPadding: 4,
  },
  legend: {
    /////// Increase spacing between legend items
    // itemSpacing: 25,
    /////// Increase padding aroung legend
    // bBoxPadding: 20,
  },
};

const urlParams = parseUrlParams();
window.RADAR_DEBUG_MODE = urlParams.radarDebugMode;

const svg = d3
  .select("#myradar-div")
  // .attr("padding-bottom", Math.round((100 * CONTAINER_HEIGHT) / CONTAINER_WIDTH) + "%") // might be needed for x-browser supp
  .append("svg")
  .classed("radar-svg-container", true)
  .attr("viewBox", `0 0 ${CONTAINER_WIDTH} ${CONTAINER_HEIGHT}`);

//////////////////////////////////////////////////////////////////////////
// Fetch data and create radar
const example = new Example(urlParams.exampleId);
const radarDs = example.getDataSource();

const radarContainer = new RadarContainer(CONFIG);

radarContainer
  .fetchData(radarDs)
  .then(() => {
    return radarContainer.appendTo(svg);
  })

  .catch((error) => {
    let errorText: string;

    if (error instanceof InputDataValidationErrors) {
      errorText = `${error.errors.length} input data validation errors while fetching ${example.getExampleName()}\n ${
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
  if (!exampleId || typeof exampleId !== "number") exampleId = 1;

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

  return { radarDebugMode, exampleId };
}
