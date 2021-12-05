
import {Vector} from '../vector/vector.js';
import {VersionsVisualGraph} from '../graph/graph.js';
import {createSVG, setSVGSize, createSVGArrow, replaceSVGArrow, setSVGArrowSize, setSVGArrowColor} from '../svg/svg.js';

class GraphDrawerParamsRenderer {
    constructor() {

    }

    renderNodeParams(nodeElement, params) {
        var text = JSON.stringify(params);
        nodeElement.innerHTML = "<p>"+text+"</p>";
    }
    renderArcParams(arcElement, params) {
        var text = JSON.stringify(params);
        arcElement.innerHTML = "<p>"+text+"</p>";
    }
    renderNodeParamsEditor(nodeElement, params, onDoneEventHandler) {
        nodeElement.innerHTML = "";
        var oldParams = params;
        var textElement = document.createElement('input');
        textElement.type = 'text';
        textElement.value = JSON.stringify(params);
        nodeElement.appendChild(textElement);
        textElement.focus();
        textElement.onkeyup = (event) => {
            const keyName = event.code;
            if (keyName == "Enter") {
                var paramsString = textElement.value;
                try {
                    var params = JSON.parse(paramsString);
                    onDoneEventHandler(params);
                } catch (error) {
                    nodeElement.setColor('#FF0000');
                    setTimeout(() => {nodeElement.setColor('#000000')}, 500);
                }
            } else if (keyName == "Escape") {
                onDoneEventHandler(oldParams);
            }
        };
    }

}

class GraphDrawerNodesPlacer {
    constructor() {

    }

    placeNode(node) {
        node.coords = new Vector();
    }
    placeGraphNodes(graph) {
        graph.forEachNode((node) => {
            this.placeNode(node);
        });
    }
}

class GraphDrawerNodeElement extends HTMLElement {
    
    constructor() {
        super();
    }

    setSize(width, height) {
        this.style.width = width + "px";
        this.style.height = height + "px";
        this.style.borderWidth = Math.min(width, height) * 0.04 + "px";
    }

    setCoords(x, y) {
        this.style.left = x + "px";
        this.style.top = y + "px";
    }

    setColor(color) {
        this.style.borderColor = color;
    }

}

customElements.define('graph-node', GraphDrawerNodeElement);

export class GraphDrawer extends HTMLElement {

    static METERS_TO_PIXELS_K = 50;
    static NODE_ELEMENT_WIDTH = 80; // in pixels
    static NODE_ELEMENT_HEIGHT = 50; // in pixels
    static ARC_ELEMENT_SIZE = 15; // in pixels

    constructor() {
        super();
        this.setupVariables();
        this.setupSVG();

        this.setupDragging();
        this.setupSelection();

        this.linkGraphElementsToListeners();
        this.linkContainterToListeners();
    }

    setupVariables() {
        this.graph = new VersionsVisualGraph();
        this.paramsRenderer = new GraphDrawerParamsRenderer();
        this.nodesPlacer = new GraphDrawerNodesPlacer();
        this.camera = {
            coords: new Vector(), // pixels
            zoom: 1
        };
        this.nodeElements = new Map();
        this.arcElements = new Map();
    }
    setupSVG() {
        this.svgElement = createSVG();
        this.appendChild(this.svgElement);
        setSVGSize(this.svgElement, this.offsetWidth, this.offsetHeight);
    }

    getNodeElement(node) {
        return this.nodeElements.get(node.id);
    }
    getNodeElementById(nodeId) {
        return this.nodeElements.get(nodeId);
    }
    getArcElement(arc) {
        return this.arcElements.get(arc.id);
    }
    getArcElementById(arcId) {
        return this.arcElements.get(arcId);
    }

    createNodeElement(node) {
        var element = document.createElement('graph-node');
        this.appendChild(element);
        this.nodeElements.set(node.id, element);
        return element;
    }
    createArcElement(arc) {
        var element = createSVGArrow();
        this.svgElement.appendChild(element);
        this.arcElements.set(arc.id, element);
        return element;
    }

    updateNodeElementScale(node) {
        var width = 2*(GraphDrawer.NODE_ELEMENT_WIDTH * this.camera.zoom);
        var height = 2*(GraphDrawer.NODE_ELEMENT_HEIGHT * this.camera.zoom);
        this.getNodeElement(node).setSize(width, height);
    }
    updateArcElementScale(arc) {
        setSVGArrowSize(this.getArcElement(arc), GraphDrawer.ARC_ELEMENT_SIZE*this.camera.zoom)
    }
    updateGraphElementsScale() {
        this.graph.forEachNode((node) => {
            this.updateNodeElementScale(node);
        });
        this.graph.forEachArc((arc) => {
            this.updateArcElementScale(arc);
        });
    }

    updateNodeElementCoords(node) {
        var x = node.coords.x * (GraphDrawer.METERS_TO_PIXELS_K*this.camera.zoom) + this.offsetWidth * 0.5 - (GraphDrawer.NODE_ELEMENT_WIDTH*this.camera.zoom) - this.camera.coords.x;
        var y = node.coords.y * (GraphDrawer.METERS_TO_PIXELS_K*this.camera.zoom) + this.offsetHeight * 0.5 - (GraphDrawer.NODE_ELEMENT_HEIGHT*this.camera.zoom) - this.camera.coords.y;
        this.getNodeElement(node).setCoords(x, y);
    }
    updateArcElementCoords(arc) {
        var startNodeElement = this.getNodeElement(arc.startNode);
        var endNodeElement = this.getNodeElement(arc.endNode);
        var fromPoint = new Vector(
            startNodeElement.offsetLeft + (GraphDrawer.NODE_ELEMENT_WIDTH*this.camera.zoom),
            startNodeElement.offsetTop + (GraphDrawer.NODE_ELEMENT_HEIGHT*this.camera.zoom)
        );
        var toPoint = new Vector(
            endNodeElement.offsetLeft + (GraphDrawer.NODE_ELEMENT_WIDTH*this.camera.zoom),
            endNodeElement.offsetTop + (GraphDrawer.NODE_ELEMENT_HEIGHT*this.camera.zoom)
        );
        // arrow should be some smaller to point from node border to node border not point to point
        var delta = toPoint.substruct(fromPoint);
        var angle = delta.getAngle();
        var nodeRadius = Math.sqrt(GraphDrawer.NODE_ELEMENT_HEIGHT*GraphDrawer.NODE_ELEMENT_HEIGHT+GraphDrawer.NODE_ELEMENT_WIDTH*GraphDrawer.NODE_ELEMENT_WIDTH) * this.camera.zoom;
        fromPoint.x += nodeRadius * Math.cos(angle);
        toPoint.x -= nodeRadius * Math.cos(angle);
        fromPoint.y += nodeRadius * Math.sin(angle);
        toPoint.y -= nodeRadius * Math.sin(angle);
        /*if (deltaX > 0) {
            fromPoint.x += GraphDrawer.NODE_ELEMENT_WIDTH*this.camera.zoom;
            toPoint.x -= GraphDrawer.NODE_ELEMENT_WIDTH*this.camera.zoom;
        } else {
            fromPoint.x -= GraphDrawer.NODE_ELEMENT_WIDTH*this.camera.zoom;
            toPoint.x += GraphDrawer.NODE_ELEMENT_WIDTH*this.camera.zoom;
        }
        if (deltaY > 0) {
            fromPoint.y += GraphDrawer.NODE_ELEMENT_HEIGHT*this.camera.zoom;
            toPoint.y -= GraphDrawer.NODE_ELEMENT_HEIGHT*this.camera.zoom;
        } else {
            fromPoint.y -= GraphDrawer.NODE_ELEMENT_HEIGHT*this.camera.zoom;
            toPoint.y += GraphDrawer.NODE_ELEMENT_HEIGHT*this.camera.zoom;
        }*/
        var arcElement = this.getArcElement(arc);
        replaceSVGArrow(arcElement, fromPoint, toPoint);
    }
    updateGraphElementsCoords() {
        this.graph.forEachNode((node) => {
            this.updateNodeElementCoords(node);
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
        var element = this.getNodeElement(node);
        this.paramsRenderer.renderNodeParams(element, node.params);
    }
    updateArcElementParams(arc) {
        var element = this.getArcElement(arc);
        this.paramsRenderer.renderArcParams(element, arc.params);
    }
    updateGraphElementsParams() {
        this.graph.forEachNode((node) => {
            this.updateNodeElementParams(node);
        });
        this.graph.forEachArc((arc) => {
            this.updateArcElementParams(arc);
        });
    }

    updateNodeElementParamsEdit(node) {
        var nodeElement = this.getNodeElement(node);
        this.paramsRenderer.renderNodeParamsEditor(nodeElement, node.params, (params) => {
            this.eventNodeEditingDone(this, node.id, params);
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
        var deltaPixels = newPoint.substruct(this.draggingLastPoint);
        var deltaCoords = deltaPixels.multiply(1 / (GraphDrawer.METERS_TO_PIXELS_K*this.camera.zoom));
        node.coords = node.coords.add(deltaCoords);
        this.draggingLastPoint = newPoint;
        this.updateNodeElementCoords(node);
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
        this.cameraWasMoved = true;
        var deltaCoords = newPoint.substruct(this.cameraMovementLastPoint);
        this.cameraMovementLastPoint = newPoint;
        this.camera.coords = this.camera.coords.substruct(deltaCoords); // see: we substruct, not add deltaVector!
        this.updateGraphElementsCoords();
    }
    stopCameraMovement() {
        this.isCameraMoving = false;
        delete this.cameraMovementLastPoint;
        delete this.cameraWasMoved;
    }

    zoomCamera(deltaZoom) {
        this.camera.zoom += deltaZoom;
        if (this.camera.zoom <= 0) {
            this.camera.zoom -= deltaZoom;
        }
        this.updateGraphElementsCoords();
        this.updateGraphElementsScale();
    }

    paintNode(node, color) {
        this.getNodeElement(node).setColor(color);
    }
    paintArc(arc, color) {
        setSVGArrowColor(this.getArcElement(arc), color);
    }

    setupSelection() {
        this.selectedNodes = new Set();
        this.selectedArcs = new Set();
    }
    selectNode(node) {
        this.selectedNodes.add(node);
        this.paintNode(node, '#0000FF');
    }
    deselectNode(node) {
        this.selectedNodes.delete(node);
        this.paintNode(node, '#000000');
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
        this.paintArc(arc, '#0000FF');
    }
    deselectArc(arc) {
        this.selectedArcs.delete(arc);
        this.paintArc(arc, '#000000');
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
        this.getArcElement(arc).remove();
        this.arcElements.delete(arc.id);
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
        this.getNodeElement(node).remove();
        this.nodeElements.delete(node.id);
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

    createNode(params = {}) {
        var node = this.graph.createNode(params);
        this.nodesPlacer.placeNode(node);
        this.createNodeElement(node);
        this.updateNodeElementParams(node);
        this.updateNodeElementScale(node);
        this.updateNodeElementCoords(node);
        return node;
    }
    createArc(startNode, endNode, params = {}) {
        var arc = this.graph.createArc(startNode, endNode, params);
        this.createArcElement(arc);
        this.paintArc(arc, '#000000');
        this.updateArcElementScale(arc);
        this.updateArcElementCoords(arc);
        return arc;
    }

    createNodeConnectedToSelectedNodes() {
        var node = this.createNode();
        for (var selectedNode of this.selectedNodes) {
            this.createArc(selectedNode, node);
        }
        return node;
    }

    connectSelectedNodes() {
        var nodes = this.selectedNodes.values();
        var arcs = [];
        var prevNode = null;
        for (var newNode of nodes) {
            if (prevNode) {
                var arc = this.createArc(prevNode, newNode);
                arcs.push(arc);
            }
            prevNode = newNode;
        }
        return arcs;
    }

    reverseSelectedArcs() {
        for (var arc of this.selectedArcs) {
            this.graph.reverseArc(arc);
            this.updateArcElementCoords(arc);
        }
    }

    linkContainterToListeners() {
        this.addEventListener("mousedown", (e) => {this.eventContainerMouseDown(this, e)}); // WIP WARNING antipattern? madness?
        this.addEventListener("mousemove", (e) => {this.eventContainerMouseMove(this, e)}); // WIP WARNING antipattern? madness?
        this.addEventListener("mouseup", (e) => {this.eventContainerMouseUp(this, e)}); // WIP WARNING antipattern? madness?
        this.addEventListener("wheel", (e) => {this.eventContainerWheel(this, e)}); // WIP WARNING antipattern? madness?
        document.addEventListener("keyup", (e) => {this.eventKeyUp(this, e)}); // WIP WARNING singleton
    }

    linkNodeElementToListeners(node) {
        var nodeElement = this.getNodeElement(node);
        nodeElement.addEventListener("mousedown", (e) => {this.eventNodeElementMouseDown(this, node.id, e)}); // WIP WARNING antipattern? madness?
        nodeElement.addEventListener("mouseup", (e) => {this.eventNodeElementMouseUp(this, node.id, e)}); // WIP WARNING antipattern? madness?
        nodeElement.addEventListener("dblclick", (e) => {this.eventNodeElementDoubleClick(this, node.id, e)}); // WIP WARNING antipattern? madness?
    }
    linkArcElementToListeners(arc) {
        var arcElement = this.getArcElement(arc);
        arcElement.addEventListener("mousedown", (e) => {this.eventArcElementMouseDown(this, arc.id, e)}); // WIP WARNING antipattern? madness?
        arcElement.addEventListener("mouseup", (e) => {this.eventArcElementMouseUp(this, arc.id, e)}); // WIP WARNING antipattern? madness?
    }
    linkGraphElementsToListeners() {
        this.graph.forEachNode((node) => {
            this.linkNodeElementToListeners(node);
        });
        this.graph.forEachArc((arc) => {
            this.linkArcElementToListeners(arc);
        });
    }

    eventContainerMouseDown(drawer, event) {
        if (drawer.editingMode) {
            return;
        }
        event.preventDefault();
        drawer.startCameraMovement(new Vector(event.clientX, event.clientY));
    }
    eventContainerMouseMove(drawer, event) {
        if (drawer.editingMode) {
            return;
        }
        event.preventDefault();
        if (drawer.draggingNodeId) {
            drawer.doDragging(new Vector(event.clientX, event.clientY));
        } else if (drawer.isCameraMoving) {
            drawer.doCameraMovement(new Vector(event.clientX, event.clientY), 1);
        }
    }
    eventContainerMouseUp(drawer, event) {
        if (drawer.editingMode) {
            return;
        }
        event.preventDefault();
        if (!this.cameraWasMoved) {
            drawer.clearSelection();
        }
        if (drawer.draggingNodeId) {
            drawer.stopDragging();
        } else if (drawer.isCameraMoving) {
            drawer.stopCameraMovement();
        }
    }

    static WHEEL_ZOOM_K = -0.001;

    eventContainerWheel(drawer, event) {
        if (drawer.editingMode) {
            return;
        }
        event.preventDefault();
        drawer.zoomCamera(event.deltaY * GraphDrawer.WHEEL_ZOOM_K);
    }

    eventNodeElementMouseDown(drawer, nodeId, event) {
        if (drawer.editingMode) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        drawer.startDragging(nodeId, new Vector(event.clientX, event.clientY));
    }
    eventNodeElementMouseUp(drawer, nodeId, event) {
        if (drawer.editingMode) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (!drawer.draggindWasMoved) {
            var node = drawer.graph.getNode(nodeId);
            drawer.changeNodeSelection(node);
        }
        if (drawer.draggingNodeId) {
            drawer.stopDragging();
        }
    }
    eventNodeElementDoubleClick(drawer, nodeId, event) {
        if (drawer.editingMode) {
            return;
        }
        drawer.editingMode = true;
        var node = drawer.graph.getNode(nodeId);
        drawer.updateNodeElementParamsEdit(node);
    }

    eventNodeEditingDone(drawer, nodeId, params) {
        delete drawer.editingMode;
        var node = drawer.graph.getNode(nodeId);
        node.params = params;
        this.updateNodeElementParams(node);
    }

    eventArcElementMouseDown(drawer, arcId, event) {
        if (drawer.editingMode) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
    }
    eventArcElementMouseUp(drawer, arcId, event) {
        if (drawer.editingMode) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        var arc = drawer.graph.getArc(arcId);
        drawer.changeArcSelection(arc);
    }

    static DELETE_KEYCODES = new Set(["Delete", "Backspace"]);
    static CREATE_NODE_KEYCODES = new Set(["KeyN"]);
    static CANCEL_KEYCODES = new Set(["Escape"]);
    static CONNECT_KEYCODES = new Set(["KeyC"]);
    static REVERSE_ARC_KEYCODES = new Set(["KeyR"]);

    eventKeyUp(drawer, event) {
        if (drawer.editingMode) {
            return;
        }
        const keyName = event.code;
        if (GraphDrawer.DELETE_KEYCODES.has(keyName)) {
            drawer.deleteSelected();
        } else if (GraphDrawer.CREATE_NODE_KEYCODES.has(keyName)) {
            var node = drawer.createNodeConnectedToSelectedNodes();
            drawer.linkNodeElementToListeners(node);
            drawer.graph.forEachNodeArc(node, (arc) => { // WIP WARNING levels of abstraction mixing 
                drawer.linkArcElementToListeners(arc);
            });
        } else if (GraphDrawer.CANCEL_KEYCODES.has(keyName)) {
            drawer.clearSelection();
        } else if (GraphDrawer.CONNECT_KEYCODES.has(keyName)) {
            if (drawer.selectedNodes.size >= 2) {
                var arcs = drawer.connectSelectedNodes();
                for (var arc of arcs) {
                    drawer.linkArcElementToListeners(arc);
                }
            }
        } else  if (GraphDrawer.REVERSE_ARC_KEYCODES.has(keyName)) {
            drawer.reverseSelectedArcs();
        }
    }

}

customElements.define('graph-drawer', GraphDrawer);
