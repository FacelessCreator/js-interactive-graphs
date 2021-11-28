
const DEFAULT_NODE_PARAMS_RENDERER = function(containerElement, params) {
    var text = JSON.stringify(params);
    containerElement.innerHTML = "<p>"+text+"</p>";
};

class GraphDrawer {

    static METERS_TO_PIXELS_K = 50;
    static NODE_ELEMENT_SIZE = 50; // in pixels

    static NODE_RANDOM_SPAWN_RANGE = 10;

    constructor(container, graph, nodeParamsRenderer=DEFAULT_NODE_PARAMS_RENDERER) {
        this.setupVariables(container, graph, nodeParamsRenderer=DEFAULT_NODE_PARAMS_RENDERER);
        this.generateGraphCoords();
        this.setupSVG();
        this.createGraphElements();
        this.updateGraphElementsScale();
        this.updateGraphElementsCoords();
        this.updateGraphElementsParams();

        this.setupDragging();
    }

    getNodeData(node) {
        return this.nodesData.get(node.id);
    }
    getNodeDataById(nodeId) {
        return this.nodesData.get(nodeId);
    }
    getArcData(arc) {
        return this.arcsData.get(arc.id);
    }
    getArcDataById(arcId) {
        return this.arcsData.get(arcId);
    }

    setupVariables(container, graph, nodeParamsRenderer) {
        this.displayContainer = container;
        this.graph = graph;
        this.nodeParamsRenderer = nodeParamsRenderer;
        this.camera = {
            coords: createVector2D(0, 0), // pixels
            zoom: 1
        };
        this.setupGraphData();
    }
    setupNodeData(node) {
        this.nodesData.set(node.id, {
            coords: null,
            element: null
        });
    }
    setupArcData(arc) {
        this.arcsData.set(arc.id, {
            element: null
        });
    }
    setupGraphData() {
        this.nodesData = new Map();
        this.graph.forEachNode((node) => {
            this.setupNodeData(node);
        });
        this.arcsData = new Map();
        this.graph.forEachArc((arc) => {
            this.setupArcData(arc);
        });
    }

    setupSVG() {
        this.svgElement = TEMPLATE_SVG_ELEMENT.cloneNode();
        this.displayContainer.appendChild(this.svgElement);
        this.svgElement.width.baseVal.value = this.displayContainer.offsetWidth;
        this.svgElement.height.baseVal.value = this.displayContainer.offsetHeight;
    }

    forEachNodeData(func) {
        this.nodesData.forEach(func);
    }
    forEachArcData(func) {
        this.arcsData.forEach(func);
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
    createArcElement(arc) {
        var element = createArrow(this.svgElement);
        var arcData = this.getArcData(arc);
        arcData.element = element;
        return element;
    }
    createGraphElements() {
        this.graph.forEachNode((node) => {
            this.createNodeElement(node);
        });
        this.graph.forEachArc((arc) => {
            this.createArcElement(arc);
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
        nodeData.element.style.left = (nodeData.coords.x * GraphDrawer.METERS_TO_PIXELS_K + this.displayContainer.offsetWidth * 0.5 - GraphDrawer.NODE_ELEMENT_SIZE - this.camera.coords.x) + "px";
        nodeData.element.style.top = (nodeData.coords.y * GraphDrawer.METERS_TO_PIXELS_K + this.displayContainer.offsetHeight * 0.5 - GraphDrawer.NODE_ELEMENT_SIZE - this.camera.coords.y) + "px";
    }
    updateArcElementCoords(arc) {
        var nodeFromElement = this.getNodeData(arc.nodeFrom).element;
        var nodeToElement = this.getNodeData(arc.nodeTo).element;
        var fromX = nodeFromElement.offsetLeft + GraphDrawer.NODE_ELEMENT_SIZE;
        var fromY = nodeFromElement.offsetTop + GraphDrawer.NODE_ELEMENT_SIZE;
        var toX = nodeToElement.offsetLeft + GraphDrawer.NODE_ELEMENT_SIZE;
        var toY = nodeToElement.offsetTop + GraphDrawer.NODE_ELEMENT_SIZE;
        // arrow should be some smaller to point from node circle to node circle not point to point
        var deltaX = toX - fromX;
        var deltaY = toY - fromY;
        var angle = Math.atan2(deltaY, deltaX);
        fromX += GraphDrawer.NODE_ELEMENT_SIZE * Math.cos(angle);
        toX -= GraphDrawer.NODE_ELEMENT_SIZE * Math.cos(angle);
        fromY += GraphDrawer.NODE_ELEMENT_SIZE * Math.sin(angle);
        toY -= GraphDrawer.NODE_ELEMENT_SIZE * Math.sin(angle);
        var arcElement = this.getArcData(arc).element;
        arcElement.setAttribute('x1', fromX);
        arcElement.setAttribute('y1', fromY);
        arcElement.setAttribute('x2', toX);
        arcElement.setAttribute('y2', toY);
    }
    updateGraphElementsCoords() {
        this.forEachNodeData((nodeData) => {
            this.updateNodeElementCoords(nodeData);
        });
        this.graph.forEachArc((arc) => {
            this.updateArcElementCoords(arc);
        });
    }
    updateArcConnectedToNodeElementsCoords(node) {
        this.graph.forEachNodeArc(node, (arc) => {
            this.updateArcElementCoords(arc);
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

    // DEPRECATED
    // see the difference between updateNodeCoords and updateNodeElementCoords
    /*updateNodeCoords(node) {
        var nodeData = this.getNodeData(node);
        nodeData.coords.x = (nodeData.element.offsetLeft - this.svgElement.width * 0.5 + GraphDrawer.NODE_ELEMENT_SIZE) / GraphDrawer.METERS_TO_PIXELS_K;
        nodeData.coords.y = (nodeData.element.offsetTop - this.svgElement.height * 0.5 + GraphDrawer.NODE_ELEMENT_SIZE) / GraphDrawer.METERS_TO_PIXELS_K;
    }*/

    setupDragging() {
        this.draggingNodeId = null;
    }
    startDragging(nodeId, startPoint) {
        this.draggingNodeId = nodeId;
        this.draggingLastPoint = startPoint;
    }
    doDragging(newPoint) {
        var node = this.graph.getNode(this.draggingNodeId);
        var nodeData = this.getNodeDataById(this.draggingNodeId);
        var deltaPixels = substructVectors(newPoint, this.draggingLastPoint);
        var deltaCoords = multiplyVector(deltaPixels, 1 / GraphDrawer.METERS_TO_PIXELS_K);
        nodeData.coords = addVectors(nodeData.coords, deltaCoords);
        this.draggingLastPoint = newPoint;
        this.updateNodeElementCoords(nodeData);
        this.updateArcConnectedToNodeElementsCoords(node);
    }
    stopDragging() {
        this.draggingNodeId = null;
        delete this.draggingLastPoint;
    }

    setupCameraMovement() {
        this.isCameraMoving = false;
    }
    startCameraMovement(startPoint) {
        this.isCameraMoving = true;
        this.cameraMovementLastPoint = startPoint;
    }
    doCameraMovement(newPoint, newZoom) {
        var deltaCoords = substructVectors(newPoint, this.cameraMovementLastPoint);
        this.cameraMovementLastPoint = newPoint;
        this.camera.coords = substructVectors(this.camera.coords, deltaCoords); // see: we substruct, not add deltaVector!
        this.updateGraphElementsCoords();
    }
    stopCameraMovement() {
        this.isCameraMoving = false;
        delete this.cameraMovementLastPoint;
    }

}
