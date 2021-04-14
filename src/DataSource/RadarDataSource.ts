import { InputDataValidationErrors, RadarError } from "../Errors";

///////////////////////////////////////////////////////////////////////////////
// Input Data format, see more explanation on RadarDataSource class
///////////////////////////////////////////////////////////////////////////////
export type ItemBase = { id: string; label?: string; description?: string };

type RadarItemInputWithSubSlice = ItemBase & {
  subSliceId: string;
  ringId: string;
  groupName: string;
};

type RadarItemInputWithSlice = ItemBase & {
  sliceId: string;
  ringId: string;
  groupName: string;
};

export type RadarItemInput = RadarItemInputWithSubSlice | RadarItemInputWithSlice;

export type SubSliceInput = ItemBase;
export type RingInput = ItemBase;
export type SliceInput = ItemBase & { subSlices: SubSliceInput[] };

export type RadarInput = {
  slices: SliceInput[];
  rings: RingInput[];
  items: RadarItemInput[];
};

type Cleansable = SliceInput | SubSliceInput | RingInput | RadarItemInput;

///////////////////////////////////////////////////////////////////////////////
// RadarContent: processed from RadarInput. Radar will be built from this
///////////////////////////////////////////////////////////////////////////////

export type RadarItemProcessed = RadarItemInputWithSubSlice & { sliceId: string; ringLabel: string };

export type CatInfo = ItemBase & {
  itemCount: number;
};

export type SegmentProcessed = { ringId: string; ringLevel: number; items: RadarItemProcessed[] };
export type SubSliceProcessed = ItemBase & { sliceId: string; isDummy: boolean; segments: SegmentProcessed[] };

export type SliceProcessed = CatInfo & { subSlices: SubSliceProcessed[] };
export type CatInfoSubSlice = CatInfo & { sliceId: string };

export type RadarContentProcessed = {
  items: RadarItemProcessed[];
  slices: SliceProcessed[];
  subSlices: CatInfoSubSlice[];
  rings: CatInfo[];
  groups: CatInfo[];
};

/**
 * All input source classes should extend this class
 *
 * Input data format - each RadarDataSource impl should return data in RadarInput format from fetchData(s)
 * Order of data is preserved (i.e. slices, subSlices and rings are displayed in the order in InputData)
 *     const inputExample: RadarInput = {
 *       slices: [
 *         {
 *           id: "unique_slice_id",
 *           label: "optional, id will be used if empty/missing",
 *           description: "optional",
 *           subSlices: [
 *             { id: "unique_subSlice_id", label: "optional, id will be used if empty/missing", description: "optional" },
 *           ],
 *         },
 *       ],
 *       rings: [{ id: "unique_ring_id", label: "optional, id will be used if empty/missing", description: "optional" }],
 *       items: [
 *         {
 *           id: "unique_item_id",
 *           label: "optional, id will be used if empty/missing",
 *           description: "optional",
 *           subSliceId: "<id_of_subSlice_this_item_belongs_to>",
 *           ringId: "<id_of_ring_this_item_belongs_to",
 *           groupName: "<name_of_group_this_item_belongs_to>",
 *         },
 *       ],
 *     };
 * @export
 * @abstract
 * @class RadarDataSource
 */
export abstract class RadarDataSource {
  radarInput: RadarInput;
  radarContent: RadarContentProcessed;

  abstract fetchData(): Promise<RadarInput>;

  setRadarContent(radarInput: Readonly<RadarInput>): this {
    this.radarInput = { ...radarInput };

    // set description to empty string if missing + set id to label if id is missing or vice versa
    this.radarInput.slices.forEach((slice) => {
      RadarDataSource.cleanse(slice);
      if (slice.subSlices && Array.isArray(slice.subSlices)) {
        slice.subSlices.forEach((subSlice) => RadarDataSource.cleanse(subSlice));
        // we handle empty subSlices later
      }
    });
    this.radarInput.rings.forEach((ring) => RadarDataSource.cleanse(ring));
    this.radarInput.items.forEach((item) => RadarDataSource.cleanse(item));

    // add a dummy subSlice to slices for every slice without any subSlice
    this.radarInput.slices
      .filter((slice) => !slice.subSlices || !Array.isArray(slice.subSlices) || slice.subSlices.length === 0)
      .forEach((sliceWithoutSubSlice) => {
        sliceWithoutSubSlice.subSlices = [{ id: sliceWithoutSubSlice.id + "/" }];
      });

    // fill in slice id or subSliceId for every item
    const radarItems: RadarItemProcessed[] = this.radarInput.items.map((inputItem) => {
      let sliceId: string;
      let subSliceId: string;
      if ("subSliceId" in inputItem && inputItem.subSliceId) {
        const slice = this.radarInput.slices.find((slice) =>
          slice.subSlices.some((subSlice) => subSlice.id === inputItem.subSliceId)
        );

        if (slice) sliceId = slice.id; // validator will catch those without slice

        subSliceId = inputItem.subSliceId;
      } else if ("sliceId" in inputItem) {
        // subSliceId is optional , use sliceId from item to refer to the dummy subSlice created in slice
        sliceId = inputItem.sliceId;
        subSliceId = inputItem.sliceId + "/";
      } else {
        // TODO: test if we need to throw here or it will be caught by validateRadarContent()
      }

      const ring = this.radarInput.rings.find((ring) => ring.id === inputItem.ringId);
      const ringLabel = ring && ring.label ? ring.label : "";
      return Object.assign({}, inputItem, { ringLabel, sliceId, subSliceId });
    });

    // extract all subSlices from under slices input (slices.subSlices[]) & calculate itemCount for each subSlice
    const subSlices: CatInfoSubSlice[] = this.radarInput.slices
      .filter((slice) => Array.isArray(slice.subSlices))
      .map((slice) =>
        slice.subSlices.map((subSlice) =>
          Object.assign({}, subSlice, {
            sliceId: slice.id,
            itemCount: radarItems.filter((rIt) => rIt.subSliceId === subSlice.id).length,
          })
        )
      )
      .reduce((a, b) => a.concat(b), []);

    // populate slices: subSlices, segments and calculate itemCount for each slice
    const slices: SliceProcessed[] = this.radarInput.slices.map((slice) => {
      const subSlices: SubSliceProcessed[] = Array.isArray(slice.subSlices)
        ? slice.subSlices.map((subSliceInput) => {
            const segments: SegmentProcessed[] = this.radarInput.rings.map((ring, idx) => {
              const items: RadarItemProcessed[] = radarItems.filter(
                (it) => it.subSliceId === subSliceInput.id && it.ringId == ring.id
              );

              const segment: SegmentProcessed = Object.assign({}, subSliceInput, {
                ringId: ring.id,
                ringLevel: idx,
                items,
              });

              return segment;
            });

            const subSlice: SubSliceProcessed = Object.assign({}, subSliceInput, {
              sliceId: slice.id,
              isDummy: slice.id + "/" === subSliceInput.id, // TODO: do it nicer, mark it when we create the dummy subSlice
              segments,
            });

            return subSlice;
          })
        : [];

      return Object.assign({}, slice, {
        itemCount: radarItems.filter((rIt) => rIt.sliceId === slice.id).length,
        subSlices,
      });
    });

    // calculate itemCount for each ring
    const rings: CatInfo[] = this.radarInput.rings.map(
      (ring): CatInfo =>
        Object.assign({}, ring, { itemCount: this.radarInput.items.filter((rIt) => rIt.ringId === ring.id).length })
    );

    // extract unique group names and calculate itemCount for each
    const _groups = [...new Set(this.radarInput.items.map((it) => it.groupName))];
    const groups: CatInfo[] = _groups.map(
      (groupName, idx): CatInfo => ({
        id: groupName,
        itemCount: this.radarInput.items.filter((rIt) => rIt.groupName === groupName).length,
      })
    );

    const radarContent: RadarContentProcessed = {
      items: radarItems,
      slices,
      subSlices,
      rings,
      groups,
    };

    console.log("radarContentProcessed\n", radarContent);
    this.validateRadarContent(radarContent);

    this.radarContent = radarContent;

    return this;
  }

  public getRadarContent(): RadarContentProcessed {
    if (!this.radarContent) {
      throw new RadarError("call setRadarContent(InputData) first");
    }
    return this.radarContent;
  }

  static cleanse(item: Cleansable) {
    if (!item.id || item.id === "") item.id = item.label;
    else if (!item.label || item.label === "") item.label = item.id;

    if (!item.description) item.description = "";

    return item;
  }

  validateRadarContent(radarContent: RadarContentProcessed): InputDataValidationErrors | null {
    const errors: string[] = [];

    errors.push(
      ...radarContent.slices
        .filter((it) => !it.subSlices || !Array.isArray(it.subSlices) || it.subSlices.length === 0)
        .map((it) => "Slice without subSlice. sliceId: " + it.id)
    );

    errors.push(...this.checkIfUnique(radarContent.slices).map((id) => "Non unique sliceId: " + id));
    errors.push(
      ...this.checkIfUnique(radarContent.subSlices.filter((subSlice) => subSlice.id)).map(
        (id) => "Non unique subSliceId: " + id
      )
    );
    errors.push(...this.checkIfUnique(radarContent.rings).map((id) => "Non unique ringId: " + id));
    errors.push(...this.checkIfUnique(radarContent.items).map((id) => "Non unique itemId: " + id));

    errors.push(
      ...radarContent.items.reduce((err, it) => {
        if (radarContent.slices.findIndex((e) => e.id == it.sliceId) < 0) {
          err.push("slice " + it.sliceId + " doesn't exist for itemId: " + it.id);
        }

        if (it.subSliceId && radarContent.subSlices.findIndex((e) => e.id == it.subSliceId) < 0) {
          err.push("subSlice doesn't exist for itemId: " + it.id);
        }

        if (radarContent.rings.findIndex((e) => e.id == it.ringId) < 0) {
          err.push("ring doesn't exist for itemId: " + it.id);
        }

        return err;
      }, [])
    );

    if (errors.length > 0) {
      throw new InputDataValidationErrors(errors, "Error(s) while parsing Radar input data:");
    }
    return null;
  }

  checkIfUnique(items: ItemBase[]) {
    const uniqueIds = [...new Set(items.map((it) => it.id))];
    const nonUnique = uniqueIds.filter((uniq) => items.filter((it) => it.id === uniq).length > 1);
    return nonUnique;
  }
}
