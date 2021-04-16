declare global {
  interface Window {
    RADAR_DEBUG_MODE: boolean;
  }

  // Extend SVGPathElement with stuff added by path-data-polyfill
  interface SVGPathDataSettings {
    normalize: boolean;
  }

  interface SVGPathSegment {
    type: string; // DOMString
    values: number[];
  }

  interface SVGPathElement {
    getPathData(settings?: SVGPathDataSettings): SVGPathSegment[];
    setPathData(pathData: SVGPathSegment[]): void;
  }
}

// Adding this exports the declaration file which Typescript/CRA can now pickup:
export {};
