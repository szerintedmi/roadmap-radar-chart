export abstract class NameSpaced {
  namespace: string;
  constructor(namespace = "svg:") {
    this.namespace = namespace;
  }
}
// export type D3ElementSelection =
// | d3.Selection<SVGGElement, undefined, null, undefined>
// | d3.Selection<Element, undefined, null, undefined>
// | d3.Selection<Element, unknown, HTMLElement, any>;

export abstract class D3Element extends NameSpaced {
  abstract getElement(): d3.Selection<any, any, any, any>;
}
