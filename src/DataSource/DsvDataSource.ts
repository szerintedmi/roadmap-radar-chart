import { dsvFormat } from "d3-dsv";
import { DataImportError, RadarError } from "../Errors.js";
import { RadarDataSource, RadarInput, SliceInput } from "./RadarDataSource.js";

export type DsvFileUris = {
  slices: string;
  subSlices: string;
  rings: string;
  items: string;
};

/**
 *
 *
 * @export
 * @class DsvDataSource
 * @extends {RadarDataSource}
 */
export class DsvDataSource extends RadarDataSource {
  fileURIs: DsvFileUris;
  delimiter: string;

  constructor(fileURIs: DsvFileUris, delimiter = ",") {
    super();
    this.fileURIs = fileURIs;
    this.delimiter = delimiter;
  }

  async fetchData(): Promise<RadarInput> {
    try {
      const [_slices, _subSlices, _rings, _items] = await Promise.all([
        this.fetchCsvContent(this.fileURIs.slices),
        this.fetchCsvContent(this.fileURIs.subSlices),
        this.fetchCsvContent(this.fileURIs.rings),
        this.fetchCsvContent(this.fileURIs.items),
      ]);

      const inputData = ({
        slices: (_slices.map((slice) =>
          Object.assign(slice, { subSlices: _subSlices.filter((subSlice) => subSlice.sliceId == slice.id) })
        ) as unknown) as SliceInput,

        rings: _rings,

        items: _items,
      } as unknown) as RadarInput;

      this.setRadarContent(inputData);

      return inputData;
    } catch (error) {
      if (error instanceof RadarError) throw error;
      throw new DataImportError(error);
    }
  }

  async fetchCsvContent(uri: string) {
    const response = await fetch(uri);

    if (!response.ok) {
      throw "Can't get file: " + uri + "\nRequest status: " + response.status + " " + response.statusText;
    }
    const content = await response.text();

    const parsedContent = dsvFormat(",").parse(content);

    return parsedContent;
  }
}
