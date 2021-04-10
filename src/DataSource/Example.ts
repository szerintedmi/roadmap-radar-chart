import { DsvDataSource, DsvFileUris } from "./DsvDataSource";
import { RadarError } from "../Errors";
import { JSONDataSource } from "./JSONDataSource";

type DsvDataSourceExample = {
  type: "dsv";
  name: string;
  separator: string;
  fileUris: DsvFileUris;
};

type JSONDataSourceExample = {
  type: "json";
  name: string;
  fileUri: string;
};

export class Example {
  exampleIdx: number;

  readonly EXAMPLES: (JSONDataSourceExample | DsvDataSourceExample)[] = [
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
  ];

  constructor(exampleIdx: number) {
    if (exampleIdx >= this.EXAMPLES.length || exampleIdx < 0) throw new RadarError("Invalid exampleIdx: " + exampleIdx);
    this.exampleIdx = exampleIdx;
  }

  public getExampleName(): string {
    return this.EXAMPLES[this.exampleIdx].name;
  }
  getDataSource() {
    const example = this.EXAMPLES[this.exampleIdx];

    switch (example.type) {
      case "json":
        return new JSONDataSource(example.fileUri);
      case "dsv":
        return new DsvDataSource(example.fileUris);
        break;

      default:
        throw new RadarError("Invalid example type for idx " + this.exampleIdx + " " + JSON.stringify(example));
    }
  }
}
