import {VersionsVisualGraph} from '../graph/graph.js';

var graph = new VersionsVisualGraph();

graph.createBackup();
var appleNode = graph.createNode({'name':'apple'});
graph.createBackup();
var alexNode = graph.createNode({'name': 'Alex'});
graph.createBackup();
graph.createArc(alexNode, appleNode, {'action': 'eats'});
graph.createBackup();
alexNode.params['age'] = 19;

console.log(graph);
console.log(graph.rollback());
console.log(graph.rollback());
console.log(graph);
console.log(graph.update());
console.log(graph);


import {Vector} from '../vector/vector.js';
import {createSVG, setSVGSize, createSVGArrow, replaceSVGArrow, setSVGArrowSize, setSVGArrowColor} from '../svg/svg.js';

var svgElement = createSVG();
setSVGSize(svgElement, 500, 400);
var arrowElement = createSVGArrow();
replaceSVGArrow(arrowElement, new Vector(0,0), new Vector(100,200));
setSVGArrowSize(arrowElement, 10);
setSVGArrowColor(arrowElement, '#000000');

svgElement.appendChild(arrowElement);
document.body.appendChild(svgElement);
