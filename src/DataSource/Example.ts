import { DsvDataSource, DsvFileUris } from "./DsvDataSource";
import { RadarError } from "../Errors";
import { JSONDataSource } from "./JSONDataSource";
import { SingleDsvDataSource } from "./SingleDsvDataSource";
import { RadarConfig } from "../RadarPie/RadarContainer";

type exmapleBase = {
  type: "dsv" | "json" | "singleDsv";
  name: string;
  radarConfig?: Partial<RadarConfig>;
};

type DsvDataSourceExample = exmapleBase & {
  type: "dsv";
  separator: string;
  fileUris: DsvFileUris;
};

type JSONDataSourceExample = exmapleBase & {
  type: "json";
  fileUri: string;
};

type SingleDsvDataSourceExample = exmapleBase & {
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
        subSlices: "exampleData/NowNextLater 1/NowNextLater 1 - subSlices.csv",
        rings: "exampleData/NowNextLater 1/NowNextLater 1 - rings.csv",
        items: "exampleData/NowNextLater 1/NowNextLater 1 - items.csv",
      },
    },

    {
      type: "dsv",
      name: "Confidential example (not in repo)",
      separator: ",",
      fileUris: {
        slices: "./exampleData/Confidential/slices.csv",
        subSlices: "exampleData/Confidential/subSlices.csv",
        rings: "exampleData/Confidential/rings.csv",
        items: "exampleData/Confidential/items.csv",
      },
    },

    {
      type: "singleDsv",
      name: "ThoughtWorks Technology Radar Vol 23",
      separator: ",",
      fileUri: "./exampleData/TW_TechRadar_Vol23.csv",

      radarConfig: {
        legend: { pos: { x: 400, y: 0 } },
        pie: {
          innerRadius: 5,
          minSubSliceAngle: 360,
          minRingRadius: 50,
          ringPadding: 4,
          sliceDividerOutFlowLength: -245,
          sliceLabelPadding: 12,
          subSlicePadAngle: 4,
          itemMarker: { size: 80 },
        },
      },
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
