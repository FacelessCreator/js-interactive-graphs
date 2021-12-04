// I HAVE NO IDEAS WHY WE CANNOT CREATE SVG ELEMENTS FROM NOTHING WITHOUT TROUBLESHOOTING; WE MUST CLONE THEM INSTEAD
const TEMPLATE_SVG_ELEMENT = document.querySelector("#templateSVG");
const TEMPLATE_ARROW_ELEMENT = document.querySelector("#templateArrow");

function createSVGArrow(svgElement) {
    var element = TEMPLATE_ARROW_ELEMENT.cloneNode();
    svgElement.appendChild(element);
    return element;
}

function setSVGArrowSize(element, size) {
    element.style.strokeWidth = size;
}