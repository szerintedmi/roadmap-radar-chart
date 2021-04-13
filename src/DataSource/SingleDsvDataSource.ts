import { dsvFormat } from "d3";
import { DataImportError, RadarError } from "../Errors";
import { RadarDataSource, RadarInput, RadarItemInput, RingInput, SliceInput, SubSliceInput } from "./RadarDataSource";

type singleDSVInputRecord = {
  slice: string;
  subSlice?: string;
  ring: string;
  group: string;
  label: string;
  description?: string;
};

export class SingleDsvDataSource extends RadarDataSource {
  fileURI: string;
  delimiter: string;

  constructor(fileURI: string, delimiter: string = ",") {
    super();
    this.fileURI = fileURI;
    this.delimiter = delimiter;
  }

  async fetchData(): Promise<RadarInput> {
    try {
      const _items = ((await this.fetchCsvContent(this.fileURI)) as unknown) as singleDSVInputRecord[];

      const uniqueSlices = [...new Set(_items.map((it) => it.slice))].map((slice) => ({ id: slice }));

      const rings: RingInput[] = [...new Set(_items.map((it) => it.ring))].map((ring) => ({
        id: ring,
      }));

      const items: RadarItemInput[] = _items.map((it, idx) => ({
        id: idx + "_" + it.label,
        label: it.label,
        sliceId: it.slice,
        subSliceId: it.slice + it.subSlice,
        ringId: it.ring,
        groupName: it.group,
        description: it.description,
      }));

      const slices: SliceInput[] = uniqueSlices.map((slice) => {
        const uniqueSubSlicesNames = [
          ...new Set(_items.filter((item) => item.slice === slice.id).map((it) => it.subSlice)),
        ];

        const subSlices: SubSliceInput[] = uniqueSubSlicesNames.map((subSliceName) => ({
          id: slice.id + subSliceName,
          label: subSliceName,
        }));

        return Object.assign(
          {},
          {
            id: slice.id,
            subSlices,
          }
        );
      });

      const inputData: RadarInput = {
        slices,
        rings,
        items,
      };

      console.log("inputData", inputData);
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
