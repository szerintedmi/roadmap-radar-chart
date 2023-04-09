export class NameSpaced {
  constructor(namespace = "svg:") {
    this.namespace = namespace;
  }
}

export class D3Element extends NameSpaced {
  getElement() {
    throw new Error("Method 'getElement()' must be implemented.");
  }
}
