
const DEFS_XML = '<svg id="svgDefinitions" width="0" height="0" hidden><defs><marker id="arrowMarker" markerWidth="13" markerHeight="13" refX="9.5" refY="6" orient="auto"><path d="M8,4 L8,8 L10,6 L8,4" /></marker></defs></svg>';

function setupDefinitions() {
    var template = document.createElement('template');
    template.innerHTML = DEFS_XML;
    var defsSVGELement = template.content.firstChild;
    document.body.appendChild(defsSVGELement);
}

setupDefinitions();

export function createSVG() {
    var element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    //setSVGArrowColor(element, '#000000');
    //setSVGArrowSize(element, 1);
    return element;
}
// DEPRECATED ?
export function setSVGSize(svgElement, width, height) {
    svgElement.setAttribute('width', width);
    svgElement.setAttribute('height', height);
}

export function createSVGArrow() {
    var lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lineElement.setAttribute('marker-end', 'url(#arrowMarker)');
    setSVGArrowColor(lineElement, '#000000');
    return lineElement;
}
export function replaceSVGArrow(element, start, end) {
    element.setAttribute('x1', start.x);
    element.setAttribute('y1', start.y);
    element.setAttribute('x2', end.x);
    element.setAttribute('y2', end.y);
}
export function setSVGArrowSize(element, size) {
    element.setAttribute('stroke-width', size);
}
export function setSVGArrowColor(element, color) {
    element.setAttribute('stroke', color);
}


