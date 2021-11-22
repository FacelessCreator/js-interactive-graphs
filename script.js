const TWO_ARRAYS_GRAPH = {
    nodes: {
        11: {},
        22: {},
        33: {},
        44: {},
        55: {},
        66: {},
        77: {},
        88: {},
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

var canvasElement = document.querySelector("canvas");

var graph = new InteractiveGraph(canvasElement);
graph.fillWithTwoArraysGraph(TWO_ARRAYS_GRAPH);

const SLOWMO_K = 1;
const RECOMMENDED_FPS = 60 * SLOWMO_K;
const RENDER_DELAY = 1 / RECOMMENDED_FPS; // seconds

function tick() {
    graph.physicsStep(RENDER_DELAY);
}

setInterval(tick, RENDER_DELAY*SLOWMO_K*1000);
