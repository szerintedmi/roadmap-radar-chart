declare global {
  interface Window {
    RADAR_DEBUG_MODE: boolean;
  }
}

// Adding this exports the declaration file which Typescript/CRA can now pickup:
export {};
