import { DsvDataSource, DsvFileUris } from "./DsvDataSource.js";
import { RadarError } from "../Errors.js";
import { JSONDataSource } from "./JSONDataSource.js";
import { SingleDsvDataSource } from "./SingleDsvDataSource.js";
import { RadarConfig } from "../RadarPie/RadarContainer.js";
import { RecursivePartial } from "../utils.js";

type exampleBase = {
  type: "dsv" | "json" | "singleDsv";
  name: string;
  radarConfig?: RecursivePartial<RadarConfig>;
};

type DsvDataSourceExample = exampleBase & {
  type: "dsv";
  separator: string;
  fileUris: DsvFileUris;
};

type JSONDataSourceExample = exampleBase & {
  type: "json";
  fileUri: string;
};

type SingleDsvDataSourceExample = exampleBase & {
  type: "singleDsv";
  separator: string;
  fileUri: string;
};

export class Example {
  exampleIdx: number;

  readonly EXAMPLES: (JSONDataSourceExample | DsvDataSourceExample | SingleDsvDataSourceExample)[] = [
    {
      type: "json",
      name: "data validation example",
      fileUri: "exampleData/validationTestData.json",
    },

    { type: "json", name: "test example", fileUri: "exampleData/testData.json" },

    {
      type: "dsv",
      name: "Now/next/Later example 1",
      separator: ",",
      fileUris: {
        slices: "./exampleData/NowNextLater 1/NowNextLater 1 - slices.csv",
        subSlices: "./exampleData/NowNextLater 1/NowNextLater 1 - subSlices.csv",
        rings: "./exampleData/NowNextLater 1/NowNextLater 1 - rings.csv",
        items: "./exampleData/NowNextLater 1/NowNextLater 1 - items.csv",
      },
    },

    {
      type: "dsv",
      name: "Confidential example (not in repo)",
      separator: ",",
      fileUris: {
        slices: "./exampleData/Confidential/slices.csv",
        subSlices: "./exampleData/Confidential/subSlices.csv",
        rings: "./exampleData/Confidential/rings.csv",
        items: "./exampleData/Confidential/items.csv",
      },
      radarConfig: {
        pie: { minSubSliceAngle: 12 },
        ringLegend: { startAngle: -65, endAngle: 65 },
      },
    },

    {
      type: "singleDsv",
      name: "ThoughtWorks Technology Radar Vol 23",
      separator: ",",
      fileUri: "./exampleData/TW_TechRadar_Vol23.csv",

      radarConfig: {
        itemLegend: { pos: { x: 400, y: 30 } },
        ringLegend: { pos: { x: 400, y: 0 }, startAngle: 0, endAngle: 90 },
        pie: {
          minRingRadius: 150,
          innerRadius: 10,
          ringPadding: 2,
          sliceLabelPadding: 12,
          // TODO: check why we need to pass dummy color
          itemMarker: { size: 80, colorScheme: { categorical: ["#20c72e", "dummy_don_not_ask", "#ff4800"] } },
        },
      },
    },

    {
      type: "singleDsv",
      name: "Single Google sheet example",
      separator: ",",
      fileUri:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vSMgk767I1gWr1F1bmI2XMttvPa1TyXcdd910BSfQZjqIvOHA_aE_ESnAhftTmjnJ-KL5uwPr-LIRYJ/pub?output=csv",
    },
  ];

  constructor(exampleIdx: number) {
    if (exampleIdx >= this.EXAMPLES.length || exampleIdx < 0) throw new RadarError("Invalid exampleIdx: " + exampleIdx);
    this.exampleIdx = exampleIdx;
  }

  get name(): string {
    return this.EXAMPLES[this.exampleIdx].name;
  }

  get radarConfig() {
    return this.EXAMPLES[this.exampleIdx].radarConfig;
  }

  getDataSource() {
    const example = this.EXAMPLES[this.exampleIdx];

    switch (example.type) {
      case "json":
        return new JSONDataSource(example.fileUri);
      case "dsv":
        return new DsvDataSource(example.fileUris);
        break;
      case "singleDsv":
        return new SingleDsvDataSource(example.fileUri);
        break;
      default:
        throw new RadarError("Invalid example type for idx " + this.exampleIdx + " " + JSON.stringify(example));
    }
  }
}
