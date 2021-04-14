// JSDOM  Monkey patch
// Issue: these are not included in JSDOM https://github.com/jsdom/jsdom/issues/2128
// https://github.com/facebook/jest/issues/5379#issuecomment-360044161
// Couldn't make this more generic monkey patch work: https://github.com/chromaui/chromatic-cli/pull/52
class MockSVGElement extends HTMLElement {}
window.SVGPathElement = MockSVGElement as any;
window.SVGRectElement = MockSVGElement as any;
window.SVGCircleElement = MockSVGElement as any;
window.SVGEllipseElement = MockSVGElement as any;
window.SVGLineElement = MockSVGElement as any;
window.SVGPolylineElement = MockSVGElement as any;
window.SVGPolygonElement = MockSVGElement as any;
