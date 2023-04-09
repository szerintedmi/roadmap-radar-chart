
function init(csvfile) {
  const inputData = d3.csv(csvfile).then(data => {
    const uniqueSlices = [...new Set(data.map((it) => it.slice))].map((slice) => ({ id: slice }));
    const items = data.map((it, idx) => ({
      id: idx + "_" + it.label,
      label: it.label,
      sliceId: it.slice,
      subSliceId: it.subSlice ? it.slice + "/" + it.subSlice : it.slice + "/",
      ringId: it.ring,
      groupName: it.group,
      description: it.description,
    }));
    const rings = [...new Set(data.map((it) => it.ring))].map(
      (ring) =>
        Object.assign({}, { id: ring, itemCount: items.filter((rIt) => rIt.ringId === ring).length })
    );
    const slices = uniqueSlices.map((slice) => {
      const uniqueSubSlicesNames = [
        ...new Set(data.filter((item) => "subSlice" in item && item.slice === slice.id).map((it) => it.subSlice)),
      ];

      const subSlices = uniqueSubSlicesNames.map((subSliceName) => ({
        id: slice.id + "/" + subSliceName,
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
    const _groups = [...new Set(items.map((it) => it.groupName))];
    const groups = _groups.map(
      (groupName, idx) => ({
        id: groupName,
        itemCount: items.filter((rIt) => rIt.groupName === groupName).length,
      })
    );
    // extract all subSlices from under slices input (slices.subSlices[]) & calculate itemCount for each subSlice
    const subSlices = slices
      .filter((slice) => Array.isArray(slice.subSlices))
      .map((slice) =>
        slice.subSlices.map((subSlice) =>
          Object.assign({}, subSlice, {
            sliceId: slice.id,
            itemCount: items.filter((rIt) => rIt.subSliceId === subSlice.id).length,
          })
        )
      )
      .reduce((a, b) => a.concat(b), []);
    const slices2 = slices.map((slice) => {
      const subSlices = Array.isArray(slice.subSlices)
        ? slice.subSlices.map((subSliceInput, subSliceIdx) => {
            const segments = rings.map((ring, idx) => {
              const filtered = items.filter(
                (it) => it.subSliceId === subSliceInput.id && it.ringId == ring.id
              );

              const segment = Object.assign({}, subSliceInput, {
                ringId: ring.id,
                ringLevel: idx,
                items: filtered,
              });

              return segment;
            });

            const subSlice = Object.assign({}, subSliceInput, {
              sliceId: slice.id,
              idxInSlice: subSliceIdx,
              isDummy: slice.id + "/" === subSliceInput.id, // TODO: do it nicer, mark it when we create the dummy subSlice
              segments,
            });

            return subSlice;
          })
        : [];

      return Object.assign({}, slice, {
        itemCount: items.filter((rIt) => rIt.sliceId === slice.id).length,
        subSlices,
      });
    });
    const inputData = {
      items, // radarItems
      slices: slices2,
      subSlices,
      rings,
      groups,
    };
    return inputData;
  });
  return inputData;
}
