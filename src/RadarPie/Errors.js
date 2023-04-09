export class RadarError extends Error {
  constructor(message) {
    super(message);
    this.name = RadarError.name;
    Object.setPrototypeOf(this, RadarError.prototype);
  }
}

export class DataImportError extends RadarError {
  constructor(message) {
    super(message);
    this.name = DataImportError.name;
    Object.setPrototypeOf(this, DataImportError.prototype);
  }
}

export class InputDataValidationErrors extends RadarError {
  constructor(errors, message) {
    super(message);
    this.errors = errors;
    this.name = InputDataValidationErrors.name;
    Object.setPrototypeOf(this, InputDataValidationErrors.prototype);
  }
}
