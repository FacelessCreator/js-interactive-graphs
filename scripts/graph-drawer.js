
const DEFAULT_NODE_PARAMS_RENDERER = function(containerElement, params) {
    var text = JSON.stringify(params);
    containerElement.innerHTML = "<p>"+text+"</p>";
};

class GraphDrawer {

    static METERS_TO_PIXELS_K = 50;
    static NODE_ELEMENT_SIZE = 50; // in pixels

    static NODE_RANDOM_SPAWN_RANGE = 10;

    constructor(container, graph, nodeParamsRenderer=DEFAULT_NODE_PARAMS_RENDERER) {
        this.displayContainer = container;
        this.graph = graph;
        this.nodeParamsRenderer = nodeParamsRenderer;

        this.setupGraphData();
        this.setupCanvas();
        this.generateGraphCoords();
        this.createGraphElements();
        this.updateGraphElementsScale();
        this.updateGraphElementsCoords();
        this.updateGraphElementsParams();
        this.renderCanvas();

        this.setupDragging();
    }

    getNodeData(node) {
        return this.nodesData.get(node.id);
    }
    getNodeDataById(nodeId) {
        return this.nodesData.get(nodeId);
    }
    setupNodeData(node) {
        this.nodesData.set(node.id, {
            coords: null,
            element: null
        });
    }
    forEachNodeData(func) {
        this.nodesData.forEach(func);
    }

    setupGraphData() {
        this.nodesData = new Map();
        this.graph.forEachNode((node) => {
            this.setupNodeData(node);
        });
    }
    
    generateNodeCoords(node) { // WIP change function to something intellectual
        var x = (Math.random()-0.5)*GraphDrawer.NODE_RANDOM_SPAWN_RANGE;
        var y = (Math.random()-0.5)*GraphDrawer.NODE_RANDOM_SPAWN_RANGE;
        this.getNodeData(node).coords = createVector2D(x, y);
        return node;
    }
    generateGraphCoords() { // WIP change function to something intellectual
        this.graph.forEachNode((node) => {
            this.generateNodeCoords(node);
        });
    }

    createNodeElement(node) {
        var element = document.createElement("div");
        this.displayContainer.appendChild(element);
        var nodeData = this.getNodeData(node);
        nodeData.element = element;
        return element;
    }
    createGraphElements() {
        this.graph.forEachNode((node) => {
            this.createNodeElement(node);
        });
    }

    updateNodeElementScale(nodeData) {
        nodeData.element.style.height = 2*GraphDrawer.NODE_ELEMENT_SIZE + "px";
        nodeData.element.style.width = 2*GraphDrawer.NODE_ELEMENT_SIZE + "px";
    }
    updateGraphElementsScale() {
        this.forEachNodeData((nodeData) => {
            this.updateNodeElementScale(nodeData);
        });
    }

    updateNodeElementCoords(nodeData) { // see the difference between updateNodeCoords and updateNodeElementCoords
        nodeData.element.style.left = (nodeData.coords.x * GraphDrawer.METERS_TO_PIXELS_K + this.canvas.width * 0.5 - GraphDrawer.NODE_ELEMENT_SIZE) + "px";
        nodeData.element.style.top = (nodeData.coords.y * GraphDrawer.METERS_TO_PIXELS_K + this.canvas.height * 0.5 - GraphDrawer.NODE_ELEMENT_SIZE) + "px";
    }
    updateGraphElementsCoords() {
        this.forEachNodeData((nodeData) => {
            this.updateNodeElementCoords(nodeData);
        });
    }

    updateNodeElementParams(node) {
        var element = this.getNodeData(node).element;
        this.nodeParamsRenderer(element, node.params);
    }
    updateGraphElementsParams() {
        this.graph.forEachNode((node) => {
            this.updateNodeElementParams(node);
        });
    }

    updateNodeCoords(node) { // see the difference between updateNodeCoords and updateNodeElementCoords
        var nodeData = this.getNodeData(node);
        nodeData.coords.x = (nodeData.element.offsetLeft - this.canvas.width * 0.5 + GraphDrawer.NODE_ELEMENT_SIZE) / GraphDrawer.METERS_TO_PIXELS_K;
        nodeData.coords.y = (nodeData.element.offsetTop - this.canvas.height * 0.5 + GraphDrawer.NODE_ELEMENT_SIZE) / GraphDrawer.METERS_TO_PIXELS_K;
    }

    setupCanvas() {
        this.canvas = document.createElement("canvas");
        this.displayContainer.appendChild(this.canvas);
        this.canvas.width = this.displayContainer.offsetWidth;
        this.canvas.height = this.displayContainer.offsetHeight;
        this.ctx = this.canvas.getContext("2d");
    }

    renderCanvasArc(arc) {
        var nodeFromId = arc.nodeFrom.id;
        var nodeToId = arc.nodeTo.id;
        var nodeFromData = this.getNodeDataById(nodeFromId);
        var nodeToData = this.getNodeDataById(nodeToId);
        var fromX = nodeFromData.coords.x*GraphDrawer.METERS_TO_PIXELS_K + this.canvas.width * 0.5;
        var fromY = nodeFromData.coords.y*GraphDrawer.METERS_TO_PIXELS_K + this.canvas.height * 0.5;
        var toX = nodeToData.coords.x*GraphDrawer.METERS_TO_PIXELS_K + this.canvas.width * 0.5;
        var toY = nodeToData.coords.y*GraphDrawer.METERS_TO_PIXELS_K + this.canvas.height * 0.5;
        // arrow should be some smaller to point from node circle to node circle not point to point
        var deltaX = toX - fromX;
        var deltaY = toY - fromY;
        var angle = Math.atan2(deltaY, deltaX);
        fromX += GraphDrawer.NODE_ELEMENT_SIZE * Math.cos(angle);
        toX -= GraphDrawer.NODE_ELEMENT_SIZE * Math.cos(angle);
        fromY += GraphDrawer.NODE_ELEMENT_SIZE * Math.sin(angle);
        toY -= GraphDrawer.NODE_ELEMENT_SIZE * Math.sin(angle);
        drawCanvasArrow(this.ctx, fromX, fromY, toX, toY, GraphDrawer.NODE_ELEMENT_SIZE);
    }
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    renderCanvas() {
        this.clearCanvas();
        this.ctx.beginPath();
        this.graph.forEachNode((node) => {
            for (var arc of node.inArcs) {
                this.renderCanvasArc(arc);
            }
        });
        this.ctx.stroke();
    }

    setupDragging() {
        this.draggingNodeId = null;
    }
    startDragging(nodeId) {
        this.draggingNodeId = nodeId;
    }
    doDragging(newCoords) {
        if (this.draggingNodeId) {
            var element = this.getNodeDataById(this.draggingNodeId).element;
            element.style.left = newCoords.x;
            element.style.top = newCoords.y;
            var node = this.graph.getNode(this.draggingNodeId);
            this.updateNodeCoords(node);
            this.renderCanvas();
        }
    }
    stopDragging() {
        this.draggingNodeId = null;
    }

}
