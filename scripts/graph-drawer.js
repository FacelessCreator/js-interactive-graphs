
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
        this.setupSelection();
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
        var element = createSVGArrow(this.svgElement);
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
        nodeData.element.style.height = 2 * (GraphDrawer.NODE_ELEMENT_SIZE * this.camera.zoom) + "px";
        nodeData.element.style.width = 2 * (GraphDrawer.NODE_ELEMENT_SIZE * this.camera.zoom) + "px";
    }
    updateArcElementScale(arcData) {
        setSVGArrowSize(arcData.element, 0.1 * GraphDrawer.NODE_ELEMENT_SIZE * this.camera.zoom)
    }
    updateGraphElementsScale() {
        this.forEachNodeData((nodeData) => {
            this.updateNodeElementScale(nodeData);
        });
        this.forEachArcData((arcData) => {
            this.updateArcElementScale(arcData);
        });
    }

    updateNodeElementCoords(nodeData) { // see the difference between updateNodeCoords and updateNodeElementCoords
        nodeData.element.style.left = (nodeData.coords.x * (GraphDrawer.NODE_ELEMENT_SIZE * this.camera.zoom) + this.displayContainer.offsetWidth * 0.5 - (GraphDrawer.NODE_ELEMENT_SIZE * this.camera.zoom) - this.camera.coords.x) + "px";
        nodeData.element.style.top = (nodeData.coords.y * (GraphDrawer.NODE_ELEMENT_SIZE * this.camera.zoom) + this.displayContainer.offsetHeight * 0.5 - (GraphDrawer.NODE_ELEMENT_SIZE * this.camera.zoom) - this.camera.coords.y) + "px";
    }
    updateArcElementCoords(arc) {
        var nodeFromElement = this.getNodeData(arc.nodeFrom).element;
        var nodeToElement = this.getNodeData(arc.nodeTo).element;
        var fromX = nodeFromElement.offsetLeft + (GraphDrawer.NODE_ELEMENT_SIZE * this.camera.zoom);
        var fromY = nodeFromElement.offsetTop + (GraphDrawer.NODE_ELEMENT_SIZE * this.camera.zoom);
        var toX = nodeToElement.offsetLeft + (GraphDrawer.NODE_ELEMENT_SIZE * this.camera.zoom);
        var toY = nodeToElement.offsetTop + (GraphDrawer.NODE_ELEMENT_SIZE * this.camera.zoom);
        // arrow should be some smaller to point from node circle to node circle not point to point
        var deltaX = toX - fromX;
        var deltaY = toY - fromY;
        var angle = Math.atan2(deltaY, deltaX);
        fromX += (GraphDrawer.NODE_ELEMENT_SIZE * this.camera.zoom) * Math.cos(angle);
        toX -= (GraphDrawer.NODE_ELEMENT_SIZE * this.camera.zoom) * Math.cos(angle);
        fromY += (GraphDrawer.NODE_ELEMENT_SIZE * this.camera.zoom) * Math.sin(angle);
        toY -= (GraphDrawer.NODE_ELEMENT_SIZE * this.camera.zoom) * Math.sin(angle);
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

    setupDragging() {
        this.draggingNodeId = null;
    }
    startDragging(nodeId, startPoint) {
        this.draggingNodeId = nodeId;
        this.draggingLastPoint = startPoint;
    }
    doDragging(newPoint) {
        this.draggindWasMoved = true;
        var node = this.graph.getNode(this.draggingNodeId);
        var nodeData = this.getNodeDataById(this.draggingNodeId);
        var deltaPixels = substructVectors(newPoint, this.draggingLastPoint);
        var deltaCoords = multiplyVector(deltaPixels, 1 / (GraphDrawer.METERS_TO_PIXELS_K * this.camera.zoom));
        nodeData.coords = addVectors(nodeData.coords, deltaCoords);
        this.draggingLastPoint = newPoint;
        this.updateNodeElementCoords(nodeData);
        this.updateArcConnectedToNodeElementsCoords(node);
    }
    stopDragging() {
        this.draggingNodeId = null;
        delete this.draggindWasMoved;
        delete this.draggingLastPoint;
    }

    setupCameraMovement() {
        this.isCameraMoving = false;
    }
    startCameraMovement(startPoint) {
        this.isCameraMoving = true;
        this.cameraMovementLastPoint = startPoint;
    }
    doCameraMovement(newPoint) {
        var deltaCoords = substructVectors(newPoint, this.cameraMovementLastPoint);
        this.cameraMovementLastPoint = newPoint;
        this.camera.coords = substructVectors(this.camera.coords, deltaCoords); // see: we substruct, not add deltaVector!
        this.updateGraphElementsCoords();
    }
    stopCameraMovement() {
        this.isCameraMoving = false;
        delete this.cameraMovementLastPoint;
    }

    zoomCamera(deltaZoom) {
        this.camera.zoom += deltaZoom;
        this.updateGraphElementsCoords();
        this.updateGraphElementsScale();
    }

    setupSelection() {
        this.selectedNodes = new Set();
        this.selectedArcs = new Set();
    }
    selectNode(node) {
        this.selectedNodes.add(node);
        var element = this.getNodeData(node).element;
        element.classList.add("Selected");
    }
    deselectNode(node) {
        this.selectedNodes.delete(node);
        var element = this.getNodeData(node).element;
        element.classList.remove("Selected");
    }
    changeNodeSelection(node) {
        if (this.selectedNodes.has(node)) {
            this.deselectNode(node);
        } else {
            this.selectNode(node);
        }
    }
    selectArc(arc) {
        this.selectedArcs.add(arc);
        var element = this.getArcData(arc).element;
        element.classList.add("Selected");
    }
    deselectArc(arc) {
        this.selectedArcs.delete(arc);
        var element = this.getArcData(arc).element;
        element.classList.remove("Selected");
    }
    changeArcSelection(arc) {
        if (this.selectedArcs.has(arc)) {
            this.deselectArc(arc);
        } else {
            this.selectArc(arc);
        }
    }
    clearSelection() {
        for (var node of this.selectedNodes) {
            this.deselectNode(node);
        }
        for (var arc of this.selectedArcs) {
            this.deselectArc(arc);
        }
    }

    deleteArc(arc) {
        var arcData = this.getArcData(arc);
        arcData.element.remove();
        this.arcsData.delete(arc.id);
        this.graph.deleteArc(arc);
    }
    deleteNode(node) {
        var arcsToDelete = [];
        this.graph.forEachNodeArc(node, (arc) => {
            arcsToDelete.push(arc);
        });
        for (var arc of arcsToDelete) {
            this.deleteArc(arc);
        }
        var nodeData = this.getNodeData(node);
        nodeData.element.remove();
        this.nodesData.delete(node.id);
        this.graph.deleteNode(node);
    }

    deleteSelected() {
        this.selectedArcs.forEach((arc) => {
            this.deleteArc(arc);
        });
        this.selectedNodes.forEach((node) => {
            this.deleteNode(node);
        });
        this.selectedNodes = new Set();
        this.selectedArcs = new Set();
    }

}
