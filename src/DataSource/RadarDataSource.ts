import { InputDataValidationErrors, RadarError } from "../Errors";

///////////////////////////////////////////////////////////////////////////////
// Input Data format, see more on RadarDataSource class docu
///////////////////////////////////////////////////////////////////////////////
export type ItemBase = { id: string; label?: string; description?: string };

export type RadarItemInput = ItemBase & {
  subSliceId: string;
  ringId: string;
  groupName: string;
};

type SubSliceInput = ItemBase;
type RingInput = ItemBase;
export type SliceInput = ItemBase & { subSlices: [SubSliceInput, ...SubSliceInput[]] };

export type RadarInput = {
  slices: [SliceInput, ...SliceInput[]];
  rings: [RingInput, ...RingInput[]];
  items: RadarItemInput[];
};

type Cleansable = SliceInput | SubSliceInput | RingInput | RadarItemInput;

///////////////////////////////////////////////////////////////////////////////
// RadarContent: processed from RadarInput. Radar will be built from this
///////////////////////////////////////////////////////////////////////////////

export type RadarItemProcessed = RadarItemInput & { sliceId: string; ringLabel: string };

export type CatInfo = ItemBase & {
  itemCount: number;
};

export type SegmentProcessed = { ringId: string; ringLevel: number; items: RadarItemProcessed[] };
export type SubSliceProcessed = ItemBase & { segments: SegmentProcessed[] };

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
 *             { id: "unique_subslice_id", label: "optional, id will be used if empty/missing", description: "optional" },
 *           ],
 *         },
 *       ],
 *       rings: [{ id: "unique_ring_id", label: "optional, id will be used if empty/missing", description: "optional" }],
 *       items: [
 *         {
 *           id: "unique_item_id",
 *           label: "optional, id will be used if empty/missing",
 *           description: "optional",
 *           subSliceId: "<id_of_subslice_this_item_belongs_to>",
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

  setRadarContent(radarInput: RadarInput): this {
    this.radarInput = radarInput;

    // set description to empty string if missing + set id to label if id is missing or vica versa
    radarInput.slices.forEach((slice) => {
      RadarDataSource.cleanse(slice);
      if (slice.subSlices && Array.isArray(slice.subSlices)) {
        slice.subSlices.forEach((subSlice) => RadarDataSource.cleanse(subSlice));
      }
    });
    radarInput.rings.forEach((ring) => RadarDataSource.cleanse(ring));
    radarInput.items.forEach((item) => RadarDataSource.cleanse(item));

    // extract all subSlices from under slices input (slices.subSlices[]) & calculate itemCount for each subSlice
    const subSlices = radarInput.slices
      .filter((slice) => Array.isArray(slice.subSlices))
      .map((slice) =>
        slice.subSlices.map((subSlice) =>
          Object.assign({}, subSlice, {
            sliceId: slice.id,
            itemCount: radarInput.items.filter((rIt) => rIt.subSliceId === subSlice.id).length,
          })
        )
      )
      .reduce((a, b) => a.concat(b), []);

    // fill in slice id for every item from InputData based on subSliceId
    const radarItems: RadarItemProcessed[] = radarInput.items.map((inputItem) => {
      const subSlice = subSlices.find((subSlice) => subSlice.id === inputItem.subSliceId);
      const ring = radarInput.rings.find((ring) => ring.id === inputItem.ringId);
      const ringLabel = ring && ring.label ? ring.label : "";
      return Object.assign({}, inputItem, { ringLabel, sliceId: subSlice ? subSlice.sliceId : null });
    });

    // populate slices: subSlices, segments and calculate itemCount for each slice
    const slices: SliceProcessed[] = radarInput.slices.map((slice) => {
      const subSlices: SubSliceProcessed[] = Array.isArray(slice.subSlices)
        ? slice.subSlices.map((subSliceInput) => {
            const segments: SegmentProcessed[] = radarInput.rings.map((ring, idx) => {
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

            const subSlice: SubSliceProcessed = Object.assign({}, subSliceInput, { segments });

            return subSlice;
          })
        : [];

      return Object.assign({}, slice, {
        itemCount: radarItems.filter((rIt) => rIt.sliceId === slice.id).length,
        subSlices,
      });
    });

    // calculate itemCount for each ring
    const rings: CatInfo[] = radarInput.rings.map(
      (ring): CatInfo =>
        Object.assign({}, ring, { itemCount: radarInput.items.filter((rIt) => rIt.ringId === ring.id).length })
    );

    // extract unique group names and calculate itemCount for each
    const _groups = [...new Set(radarInput.items.map((it) => it.groupName))];
    const groups: CatInfo[] = _groups.map(
      (groupName, idx): CatInfo => ({
        id: groupName,
        itemCount: radarInput.items.filter((rIt) => rIt.groupName === groupName).length,
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
        .map((it) => "Slice without subslice. sliceId: " + it.id)
    );

    errors.push(...this.checkIfUnique(radarContent.slices).map((id) => "Non unique sliceId: " + id));
    errors.push(...this.checkIfUnique(radarContent.subSlices).map((id) => "Non unique subSliceId: " + id));
    errors.push(...this.checkIfUnique(radarContent.rings).map((id) => "Non unique ringId: " + id));
    errors.push(...this.checkIfUnique(radarContent.items).map((id) => "Non unique itemId: " + id));

    errors.push(
      ...radarContent.items.reduce((err, it) => {
        if (radarContent.subSlices.findIndex((e) => e.id == it.subSliceId) < 0) {
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
    const unqueIds = [...new Set(items.map((it) => it.id))];
    const nonUnique = unqueIds.filter((uniq) => items.filter((it) => it.id === uniq).length > 1);
    return nonUnique;
  }
}
