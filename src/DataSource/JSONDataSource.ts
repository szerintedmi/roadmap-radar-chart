import { DataImportError } from "../Errors";
import { RadarDataSource, RadarInput } from "./RadarDataSource";

// Useful tool to cleanse manually created JSONs: https://jsonformatter.curiousconcept.com/#

export class JSONDataSource extends RadarDataSource {
  jsonFileURI: string;

  constructor(jsonFileURI: string) {
    super();
    this.jsonFileURI = jsonFileURI;
  }

  async fetchData(): Promise<RadarInput> {
    let inputData: any;
    try {
      const response = await fetch(this.jsonFileURI);

      if (!response.ok) {
        throw (
          "Can't load json from\n" + response.url + "\nRequest status: " + response.status + " " + response.statusText
        );
      }
      inputData = await response.json();
    } catch (error) {
      throw new DataImportError(error);
    }

    this.setRadarContent(inputData);
    return inputData;
  }
}
