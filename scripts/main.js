const TWO_ARRAYS_GRAPH = {
    nodes: {
        11: {},
        22: {"m": "1 kg"},
        33: {},
        44: {},
        55: {"name": "Great idea"},
        66: {"m": "152 g"},
        77: {},
        88: {"type": "Apple"},
        99: {},
    },
    arcs: [
        [11, 22],
        [22, 33],
        [33, 55],
        [44, 55],
        [55, 11],
        [55, 33],
        [66, 22],
        [22, 77],
    ]
};

var graphContainerElement = document.querySelector(".GraphContainer");

var graph = new Graph();
graph.fillWithTwoArraysGraph(TWO_ARRAYS_GRAPH);
var graphDrawer = new KeyMouseGraphDrawer(graphContainerElement, graph);

const SLOWMO_K = 1;
const RECOMMENDED_FPS = 60 * SLOWMO_K;
const RENDER_DELAY = 1 / RECOMMENDED_FPS; // seconds

function tick() {
    //graph.physicsStep(RENDER_DELAY);
}

setInterval(tick, RENDER_DELAY*SLOWMO_K*1000);
