# RadarChart

A radar chart to generate an overview of your roadmap or tech radar.

[Live demo](https://radarchart.netlify.app/?ex=2)

![Now/Next/Later example](docs/exampleImages/NowNextLater1.png)

- Arranges your high level grouping (e.g. your goals), sub grouping (eg. your outcomes) and your timescale (eg. Now/Next/Later or Q1/Q2/Q3/Q4) into a Pie chart
- Distributes items (e.g. initiatives) on the generated Pie.
- Generates tooltips
- Data from CSV or JSON. Get in touch if you need a different source for your use case (eg. Trello, Google Spreadsheet, Jira)
- Highly customizable:
  - colors, fonts etc. via [style.css](src/stlye.css)
  - layout and item markers via RadarConfig. See examples in [index.ts](src/index.ts)

_Documentation is coming..._

## More Examples

### Q1 / Q2 / Q3 / Q4

_Coming..._

### Tooltips

Tooltip layout is configurable in [style.css](src/stlye.css)

<img src="docs/exampleImages/toolTipExample.png" alt="Tooltip example" width="300"/>

### Tech radar

_Coming..._

## Layout customizations

_Coming..._

### Sub-slice arrangement

### Sub-slice padding

### Ring padding

### Slice seperator line configuration

## Usage in your code

For more details (eg. `RadarConfig` tips, error handling etc.) see [index.ts](src/index.ts)

```ts
import "./style.css";
import * as d3 from "d3";
import { DataImportError, InputDataValidationErrors } from "./Errors";

const svg = d3
  .select("#myradar-div")
  .append("svg")
  .classed("radar-svg-container", true)
  .attr("viewBox", `0 0 ${CONTAINER_WIDTH} ${CONTAINER_HEIGHT}`);

//////////////////////////////////////////////////////////////////////////
// Setup datasource - replace with your own
const radarDs = new DsvDataSource({
  slices: "./exampleData/NowNextLater 1/NowNextLater 1 - slices.csv",
  subSlices: "exampleData/NowNextLater 1/NowNextLater 1 - subSlices.csv",
  rings: "exampleData/NowNextLater 1/NowNextLater 1 - rings.csv",
  items: "exampleData/NowNextLater 1/NowNextLater 1 - items.csv",
});

//////////////////////////////////////////////////////////////////////////
// Creating the chart with defualt configs.
//      Customize it by passing a RadarConfig object
const radarContainer = new RadarContainer();

//////////////////////////////////////////////////////////////////////////
// Fetch data and append it to svg
radarContainer.fetchData(radarDs).then(() => {
  radarContainer.appendTo(svg);
});
```

## Licence

This project is licensed under the GNU Affero General Public License v3.0 license - see the [LICENSE](LICENSE) file for details.
