export class RadarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = RadarError.name;
    Object.setPrototypeOf(this, RadarError.prototype);
  }
}

export class DataImportError extends RadarError {
  constructor(message: string) {
    super(message);
    this.name = DataImportError.name;
    Object.setPrototypeOf(this, DataImportError.prototype);
  }
}

export class InputDataValidationErrors extends RadarError {
  errors: string[];
  constructor(errors: string[], message: string) {
    super(message);
    this.errors = errors;
    this.name = InputDataValidationErrors.name;
    Object.setPrototypeOf(this, InputDataValidationErrors.prototype);
  }
}
