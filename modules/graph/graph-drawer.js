
import {Vector} from '../vector/vector.js';
import {VersionsVisualGraph} from '../graph/graph.js';
import {createSVG, setSVGSize, createSVGArrow, replaceSVGArrow, setSVGArrowSize, setSVGArrowColor} from '../svg/svg.js';
import {downloadText, readTextFile} from '../file/file.js';

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
    renderNodeParamsEditor(nodeElement, params, onDoneEventHandler, onCancelEventHandler) {
        nodeElement.innerHTML = "";
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
                onCancelEventHandler();
            }
        };
    }

}

class TextGraphDrawerParamsRenderer extends GraphDrawerParamsRenderer {
    constructor() {
        super();
    }

    renderNodeParams(nodeElement, params) {
        var text = params.text;
        if (text == undefined) {
            text = "";
        }
        nodeElement.innerHTML = "<p>"+text+"</p>";
    }
    renderArcParams(arcElement, params) {
        var text = params.text;
        if (text == undefined) {
            text = "";
        }
        arcElement.innerHTML = "<p>"+text+"</p>";
    }
    renderNodeParamsEditor(nodeElement, params, onDoneEventHandler, onCancelEventHandler) {
        nodeElement.innerHTML = "";
        var textElement = document.createElement('input');
        textElement.type = 'text';
        var oldTextValue = params.text;
        if (oldTextValue == undefined) {
            oldTextValue = "";
        }
        textElement.value = oldTextValue;
        nodeElement.appendChild(textElement);
        textElement.focus();
        textElement.onkeyup = (event) => {
            const keyName = event.code;
            if (keyName == "Enter") {
                var textValue = textElement.value;
                var params = {text: textValue};
                onDoneEventHandler(params);
            } else if (keyName == "Escape") {
                onCancelEventHandler();
            }
        };
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

        this.setupDraggingNode();
        this.setupSelection();

        this.linkGraphElementsToListeners();
        this.linkContainterToListeners();

        this.setupDragging();
    }

    setupVariables() {
        this.graph = new VersionsVisualGraph();
        this.paramsRenderer = new TextGraphDrawerParamsRenderer(); //new GraphDrawerParamsRenderer();
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
        },
        () => {
            this.eventNodeEditingCancel(this, node.id);
        });
    }

    setupDraggingNode() {
        this.draggingNodeId = null;
    }
    startDraggingNode(nodeId, startPoint) {
        this.draggingNodeId = nodeId;
        this.draggingNodeLastPoint = startPoint;
    }
    doDraggingNode(newPoint) {
        if (!this.draggindNodeWasMoved) {
            this.saveChanges();
        }
        this.draggindNodeWasMoved = true;
        var node = this.graph.getNode(this.draggingNodeId);
        var deltaPixels = newPoint.substruct(this.draggingNodeLastPoint);
        var deltaCoords = deltaPixels.multiply(1 / (GraphDrawer.METERS_TO_PIXELS_K*this.camera.zoom));
        node.coords = node.coords.add(deltaCoords);
        this.draggingNodeLastPoint = newPoint;
        this.updateNodeElementCoords(node);
        this.updateArcConnectedToNodeElementsCoords(node);
    }
    stopDraggingNode() {
        this.draggingNodeId = null;
        delete this.draggindNodeWasMoved;
        delete this.draggingNodeLastPoint;
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
        this.selectedNodeIds = new Set();
        this.selectedArcIds = new Set();
    }
    selectNode(node) {
        this.selectedNodeIds.add(node.id);
        this.paintNode(node, '#0000FF');
    }
    deselectNode(node) {
        this.selectedNodeIds.delete(node.id);
        this.paintNode(node, '#000000');
    }
    changeNodeSelection(node) {
        if (this.selectedNodeIds.has(node.id)) {
            this.deselectNode(node);
        } else {
            this.selectNode(node);
        }
    }
    forEachSelectedNode(func) {
        for(var id of this.selectedNodeIds) {
            var node = this.graph.getNode(id);
            func(node);
        }
    }
    selectArc(arc) {
        this.selectedArcIds.add(arc.id);
        this.paintArc(arc, '#0000FF');
    }
    deselectArc(arc) {
        this.selectedArcIds.delete(arc.id);
        this.paintArc(arc, '#000000');
    }
    changeArcSelection(arc) {
        if (this.selectedArcIds.has(arc.id)) {
            this.deselectArc(arc);
        } else {
            this.selectArc(arc);
        }
    }
    forEachSelectedArc(func) {
        for(var id of this.selectedArcIds) {
            var arc = this.graph.getArc(id);
            func(arc);
        }
    }
    clearSelection() {
        this.forEachSelectedNode((node) => {
            this.deselectNode(node);
        });
        this.forEachSelectedArc((arc) => {
            this.deselectArc(arc);
        });
    }
    removeNonExistentNodesFromSelection() {
        for (var id of this.selectedNodeIds) {
            if (!this.graph.getNode(id)) {
                this.selectedNodeIds.delete(id);
            }
        }
    }
    removeNonExistentArcsFromSelection() {
        for (var id of this.selectedArcIds) {
            if (!this.graph.getArc(id)) {
                this.selectedArcIds.delete(id);
            }
        }
    }

    deleteArcElement(arcId) {
        this.getArcElementById(arcId).remove();
        this.arcElements.delete(arcId);
    }
    deleteNodeElement(nodeId) {
        this.getNodeElementById(nodeId).remove();
        this.nodeElements.delete(nodeId);
    }

    deleteArc(arc) {
        this.deleteArcElement(arc.id);
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
        this.deleteNodeElement(node.id);
        this.graph.deleteNode(node);
    }

    deleteSelected() {
        this.forEachSelectedArc((arc) => {
            this.deleteArc(arc);
        });
        this.forEachSelectedNode((node) => {
            this.deleteNode(node);
        });
        this.selectedArcIds.clear();
        this.selectedNodeIds.clear();
    }

    createNode(params = {}, coords = new Vector()) {
        var node = this.graph.createNode(params);
        node.coords = coords;
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
        var nodeCoords = new Vector();
        if (this.selectedNodeIds.size > 0) {
            this.forEachSelectedNode((selectedNode) => {
                nodeCoords = nodeCoords.add(selectedNode.coords);
            });
            nodeCoords = nodeCoords.multiply(1 / this.selectedNodeIds.size);   
        }
        if (this.selectedNodeIds.size == 1) {
            var randomVector = new Vector(Math.random()-0.5, Math.random()-0.5);
            randomVector = randomVector.multiply(GraphDrawer.NODE_ELEMENT_WIDTH / GraphDrawer.METERS_TO_PIXELS_K);
            nodeCoords = nodeCoords.add(randomVector);
        } else if (this.selectedNodeIds.size == 0) {
            nodeCoords = this.camera.coords.multiply(1 / GraphDrawer.METERS_TO_PIXELS_K);
        }
        var node = this.createNode({}, nodeCoords);
        this.forEachSelectedNode((selectedNode) => {
            this.createArc(selectedNode, node);
        });
        return node;
    }

    connectSelectedNodes() {
        var arcs = [];
        var prevNode = null;
        this.forEachSelectedNode((newNode) => {
            if (prevNode) {
                var arc = this.createArc(prevNode, newNode);
                arcs.push(arc);
            }
            prevNode = newNode;
        });
        return arcs;
    }

    reverseSelectedArcs() {
        this.forEachSelectedArc((arc) => {
            this.graph.reverseArc(arc);
            this.updateArcElementCoords(arc);
        });
    }

    linkContainterToListeners() {
        this.addEventListener("mousedown", (e) => {this.eventContainerMouseDown(this, e)}); // WIP WARNING antipattern? madness?
        this.addEventListener("mousemove", (e) => {this.eventContainerMouseMove(this, e)}); // WIP WARNING antipattern? madness?
        this.addEventListener("mouseup", (e) => {this.eventContainerMouseUp(this, e)}); // WIP WARNING antipattern? madness?
        this.addEventListener("wheel", (e) => {this.eventContainerWheel(this, e)}); // WIP WARNING antipattern? madness?
        document.addEventListener("keyup", (e) => {this.eventKeyUp(this, e)}); // WIP WARNING singleton
        document.addEventListener("keydown", (e) => {this.eventKeyDown(this, e)}); // WIP WARNING singleton
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
            drawer.doDraggingNode(new Vector(event.clientX, event.clientY));
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
            drawer.stopDraggingNode();
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
        drawer.startDraggingNode(nodeId, new Vector(event.clientX, event.clientY));
    }
    eventNodeElementMouseUp(drawer, nodeId, event) {
        if (drawer.editingMode) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (!drawer.draggindNodeWasMoved) {
            var node = drawer.graph.getNode(nodeId);
            drawer.changeNodeSelection(node);
        }
        if (drawer.draggingNodeId) {
            drawer.stopDraggingNode();
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
        drawer.saveChanges();
        delete drawer.editingMode;
        var node = drawer.graph.getNode(nodeId);
        node.params = params;
        this.updateNodeElementParams(node);
    }
    eventNodeEditingCancel(drawer, nodeId) {
        delete drawer.editingMode;
        var node = drawer.graph.getNode(nodeId);
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
            drawer.saveChanges();
            drawer.deleteSelected();
        } else if (GraphDrawer.CREATE_NODE_KEYCODES.has(keyName)) {
            drawer.saveChanges();
            var node = drawer.createNodeConnectedToSelectedNodes();
            drawer.linkNodeElementToListeners(node);
            drawer.graph.forEachNodeArc(node, (arc) => { // WIP WARNING levels of abstraction mixing 
                drawer.linkArcElementToListeners(arc);
            });
        } else if (GraphDrawer.CANCEL_KEYCODES.has(keyName)) {
            drawer.clearSelection();
        } else if (GraphDrawer.CONNECT_KEYCODES.has(keyName)) {
            if (drawer.selectedNodeIds.size >= 2) {
                drawer.saveChanges();
                var arcs = drawer.connectSelectedNodes();
                for (var arc of arcs) {
                    drawer.linkArcElementToListeners(arc);
                }
            }
        } else if (GraphDrawer.REVERSE_ARC_KEYCODES.has(keyName)) {
            drawer.saveChanges();
            drawer.reverseSelectedArcs();
        } else if (keyName == "KeyZ" && event.ctrlKey) {
            drawer.rollback();
        } else if (keyName == "KeyY" && event.ctrlKey) {
            drawer.update();
        }
    }

    eventKeyDown(drawer, event) {
        if (drawer.editingMode) {
            return;
        }
        const keyName = event.code;
        if (keyName == "KeyS" && event.ctrlKey) {
            event.preventDefault();
            drawer.saveToJSON();
        }
    }

    updateGraphChangedElements(changes) {
        // create new nodes
        for (var nodeId of changes.nodes) {
            var node = this.graph.getNode(nodeId);
            if (!this.nodeElements.has(nodeId) && node) {
                this.createNodeElement(node);
                this.updateNodeElementCoords(node);
                this.updateNodeElementScale(node);
                this.updateNodeElementParams(node);
                this.linkNodeElementToListeners(node);
            }
        }
        // create new arcs
        for (var arcId of changes.arcs) {
            var arc = this.graph.getArc(arcId);
            if (!this.arcElements.has(arcId) && arc) {
                this.createArcElement(arc);
                this.updateArcElementCoords(arc);
                this.updateArcElementScale(arc);
                this.updateArcElementParams(arc);
                this.linkArcElementToListeners(arc);
            }
        }
        // update existing nodes
        for (var nodeId of changes.nodes) {
            var node = this.graph.getNode(nodeId);
            if (this.nodeElements.has(nodeId) && node) {
                this.updateNodeElementCoords(node);
                this.updateNodeElementParams(node);
                this.updateArcConnectedToNodeElementsCoords(node);
            }
        }
        // update existing arcs
        for (var arcId of changes.arcs) {
            var arc = this.graph.getArc(arcId);
            if (this.arcElements.has(arcId) && arc) {
                this.updateArcElementParams(arc);
                this.updateArcElementCoords(arc);
            }
        }
        // delete old arcs
        for (var arcId of changes.arcs) {
            var arc = this.graph.getArc(arcId);
            if (this.arcElements.has(arcId) && !arc) {
                this.deleteArcElement(arcId);
            }
        }
        // delete old nodes
        for (var nodeId of changes.nodes) {
            var node = this.graph.getNode(nodeId);
            if (this.nodeElements.has(nodeId) && !node) {
                this.deleteNodeElement(nodeId);
            }
        }
        // update selection
        this.removeNonExistentNodesFromSelection();
        this.removeNonExistentArcsFromSelection();
    }

    rollback() {
        if (this.graph.getBackupsCount() > 0) {
            var changes = this.graph.rollback();
            this.updateGraphChangedElements(changes);
        }
    }
    update() {
        if (this.graph.getUpdatesCount() > 0) {
            var changes = this.graph.update();
            this.updateGraphChangedElements(changes);
        }
    }

    saveChanges() {
        this.graph.createBackup();
        this.graph.forgetUpdates();
    }

    saveToJSON() {
        var json = this.graph.toJSON();
        downloadText('graph.json', 'application/json', json);
    }

    loadFromJSON(json) {
        this.saveChanges();
        var changes = this.graph.fromJSON(json);
        this.updateGraphChangedElements(changes);
    }

    setupDragging() {
        this.ondrop = (e) => {this.eventDragDrop(this, e)};
        this.ondragenter = (e) => {this.eventDragEnter(this, e)};
        this.ondragover = (e) => {this.eventDragOver(this, e)};
        this.ondragleave = (e) => {this.eventDragLeave(this, e)};
    }

    eventDragDrop(drawer, event) {
        event.stopPropagation();
        event.preventDefault();
        const file = event.dataTransfer.files[0]; // WARNING unsafe
        readTextFile(file, (text) => {
            drawer.loadFromJSON(text);
        });
        drawer.classList.remove("drag-hover");
    }

    eventDragOver(drawer, event) { // seems useless but without it we cannot catch drop event at all
        event.stopPropagation();
        event.preventDefault();
    }

    eventDragEnter(drawer, event) {
        drawer.classList.add("drag-hover");
    }

    eventDragLeave(drawer, event) {
        drawer.classList.remove("drag-hover");
    }

}

customElements.define('graph-drawer', GraphDrawer);
