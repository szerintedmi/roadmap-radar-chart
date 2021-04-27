// JSDOM  Monkey patch
// Issue: SVG is not in implemented in JSDOM https://github.com/jsdom/jsdom/issues/2128
// We use svgdom to create a dom with svg implementation and patch global document + window with the SVG classes we use.
//
// https://github.com/facebook/jest/issues/5379#issuecomment-360044161
//  https://github.com/chromaui/chromatic-cli/pull/52

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore, https://github.com/svgdotjs/svgdom/issues/69
import { createSVGWindow } from "svgdom";
const window = createSVGWindow();

Object.defineProperty(global, "document", {
  value: window.document,
});

const svgElements = [
  "SVGElement",
  "SVGPathElement",
  "SVGRectElement",
  "SVGCircleElement",
  "SVGEllipseElement",
  "SVGLineElement",
  "SVGPolylineElement",
  "SVGPolygonElement",
];

svgElements.forEach((e) => {
  let value: any;
  if (window[e]) {
    value = window[e];
  } else {
    value = eval(`(class ${e} extends window.HTMLElement {})`);
    Object.defineProperty(window, e, {
      value,
      writable: true,
    });
  }

  Object.defineProperty(global, e, {
    value: window[e],
    writable: true,
  });
});

//// These are all (?) SVG elements but we don't need to patch them all
// const svgElements = [
//   "SVGAElement",
//   "SVGAltGlyphElement",
//   "SVGAngle",
//   "SVGAnimateColorElement",
//   "SVGAnimateElement",
//   "SVGAnimateMotionElement",
//   "SVGAnimateTransformElement",
//   "SVGAnimatedAngle",
//   "SVGAnimatedBoolean",
//   "SVGAnimatedEnumeration",
//   "SVGAnimatedInteger",
//   "SVGAnimatedLength",
//   "SVGAnimatedLengthList",
//   "SVGAnimatedNumber",
//   "SVGAnimatedNumberList",
//   "SVGAnimatedPoints",
//   "SVGAnimatedPreserveAspectRatio",
//   "SVGAnimatedRect",
//   "SVGAnimatedString",
//   "SVGAnimatedTransformList",
//   "SVGAnimationElement",
//   "SVGCircleElement",
//   "SVGClipPathElement",
//   "SVGComponentTransferFunctionElement",
//   "SVGCursorElement",
//   "SVGDefsElement",
//   "SVGDescElement",
//   "SVGDocument",
//   "SVGElement",
//   "SVGEllipseElement",
//   "SVGFEBlendElement",
//   "SVGFEColorMatrixElement",
//   "SVGFEComponentTransferElement",
//   "SVGFECompositeElement",
//   "SVGFEConvolveMatrixElement",
//   "SVGFEDiffuseLightingElement",
//   "SVGFEDisplacementMapElement",
//   "SVGFEDistantLightElement",
//   "SVGFEDropShadowElement",
//   "SVGFEFloodElement",
//   "SVGFEFuncAElement",
//   "SVGFEFuncBElement",
//   "SVGFEFuncGElement",
//   "SVGFEFuncRElement",
//   "SVGFEGaussianBlurElement",
//   "SVGFEImageElement",
//   "SVGFEMergeElement",
//   "SVGFEMergeNodeElement",
//   "SVGFEMorphologyElement",
//   "SVGFEOffsetElement",
//   "SVGFEPointLightElement",
//   "SVGFESpecularLightingElement",
//   "SVGFESpotLightElement",
//   "SVGFETileElement",
//   "SVGFETurbulenceElement",
//   "SVGFilterElement",
//   "SVGFilterPrimitiveStandardAttributes",
//   "SVGFontElement",
//   "SVGFontFaceElement",
//   "SVGFontFaceFormatElement",
//   "SVGFontFaceNameElement",
//   "SVGFontFaceSrcElement",
//   "SVGFontFaceUriElement",
//   "SVGForeignObjectElement",
//   "SVGGElement",
//   "SVGGlyphElement",
//   "SVGGradientElement",
//   "SVGGraphicsElement",
//   "SVGHKernElement",
//   "SVGImageElement",
//   "SVGLength",
//   "SVGLengthList",
//   "SVGLineElement",
//   "SVGLinearGradientElement",
//   "SVGMPathElement",
//   "SVGMaskElement",
//   "SVGMatrix",
//   "SVGMetadataElement",
//   "SVGMissingGlyphElement",
//   "SVGNumber",
//   "SVGNumberList",
//   "SVGPathElement",
//   "SVGPatternElement",
//   "SVGPoint",
//   "SVGPolylineElement",
//   "SVGPolygonElement",
//   "SVGPreserveAspectRatio",
//   "SVGRadialGradientElement",
//   "SVGRect",
//   "SVGRectElement",
//   "SVGSVGElement",
//   "SVGScriptElement",
//   "SVGSetElement",
//   "SVGStopElement",
//   "SVGStringList",
//   "SVGStylable",
//   "SVGStyleElement",
//   "SVGSwitchElement",
//   "SVGSymbolElement",
//   "SVGTRefElement",
//   "SVGTSpanElement",
//   "SVGTests",
//   "SVGTextContentElement",
//   "SVGTextElement",
//   "SVGTextPathElement",
//   "SVGTextPositioningElement",
//   "SVGTitleElement",
//   "SVGTransform",
//   "SVGTransformList",
//   "SVGTransformable",
//   "SVGURIReference",
//   "SVGUnitTypes",
//   "SVGUseElement",
//   "SVGVKernElement",
//   "SVGViewElement",
//   "SVGZoomAndPan",
// ];
