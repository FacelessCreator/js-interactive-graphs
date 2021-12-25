
import {Vector} from '../vector/vector.js';
import {VersionsVisualGraph} from '../graph/graph.js';
import {createSVG, createSVGArrow, replaceSVGArrow, setSVGArrowSize, setSVGArrowColor} from '../svg/svg.js';
import { linkNodeElementToEvents as linkNodeElementToKeyMouseEvents, linkArrowElementToEvents as linkArrowElementToKeyMouseEvents, linkArcElementToEvents as linkArcElementToKeyMouseEvents, linkContainerToEvents as linkContainerToKeyMouseEvents } from './graph-frame-keymouse-events.js';

export class GraphFrameParamsRenderer {
    constructor() {

    }

    renderNodeParams(nodeElement, params) {
        var text = JSON.stringify(params);
        nodeElement.innerHTML = "<p>"+text+"</p>";
    }
    renderArcParams(arrowElement, params) {
        var text = JSON.stringify(params);
        arrowElement.innerHTML = "<p>"+text+"</p>";
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
    renderArcParamsEditor(arcElement, params, onDoneEventHandler, onCancelEventHandler) {
        arcElement.innerHTML = "";
        var textElement = document.createElement('input');
        textElement.type = 'text';
        textElement.value = JSON.stringify(params);
        arcElement.appendChild(textElement);
        textElement.focus();
        textElement.onkeyup = (event) => {
            const keyName = event.code;
            if (keyName == "Enter") {
                var paramsString = textElement.value;
                try {
                    var params = JSON.parse(paramsString);
                    onDoneEventHandler(params);
                } catch (error) {
                    arcElement.setColor('#FF0000');
                    setTimeout(() => {arcElement.setColor('#000000')}, 500);
                }
            } else if (keyName == "Escape") {
                onCancelEventHandler();
            }
        };
    }

}

export class TextGraphFrameParamsRenderer extends GraphFrameParamsRenderer {
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
    renderArcParams(arrowElement, params) {
        var text = params.text;
        if (text == undefined) {
            text = "";
        }
        arrowElement.innerHTML = "<p>"+text+"</p>";
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
    renderArcParamsEditor(arcElement, params, onDoneEventHandler, onCancelEventHandler) {
        arcElement.innerHTML = "";
        var textElement = document.createElement('input');
        textElement.type = 'text';
        var oldTextValue = params.text;
        if (oldTextValue == undefined) {
            oldTextValue = "";
        }
        textElement.value = oldTextValue;
        arcElement.appendChild(textElement);
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

export class GraphNodeElement extends HTMLElement {
    
    constructor() {
        super();
    }

    setCoords(x, y) {
        this.style.left = x + "px";
        this.style.top = y + "px";
    }

    setColor(color) {
        this.style.borderColor = color;
    }

}
customElements.define('graph-node', GraphNodeElement);

export class GraphArcElement extends HTMLElement {
    constructor() {
        super();
    }

    setCoords(x, y) {
        this.style.left = x + "px";
        this.style.top = y + "px";
    }

    setColor(color) {
        this.style.backgroundColor = color;
    }

}
customElements.define('graph-arc', GraphArcElement);

const METERS_TO_PIXELS_K = 50;
const ARROW_ELEMENT_SIZE = 15; // in pixels

export class GraphFrame extends HTMLElement {

    // PREPARATIONS

    constructor() { // the time when we can create only variables
        super();
        this.setupVariables();
    }

    connectedCallback() { // the time when we can create elements
        this.setupSVG();
        this.linkContainerToEvents(this);
    }

    setupVariables() {
        this.graph = new VersionsVisualGraph();
        this.paramsRenderer = new TextGraphFrameParamsRenderer();
        this.camera = {
            coords: new Vector(), // pixels
            zoom: 1
        };
        this.nodeElements = new Map();
        this.arcElements = new Map();
        this.arrowElements = new Map();
        // events
        // TODO more event packs
        this.linkContainerToEvents = linkContainerToKeyMouseEvents;
        this.linkNodeElementToEvents = linkNodeElementToKeyMouseEvents;
        this.linkArcElementToEvents = linkArcElementToKeyMouseEvents;
        this.linkArrowElementToEvents = linkArrowElementToKeyMouseEvents;
    }
    setupSVG() {
        this.svgElement = createSVG();
        this.appendChild(this.svgElement);
    }

    // ELEMENTS

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
    getArrowElement(arc) {
        return this.arrowElements.get(arc.id);
    }
    getArrowElementById(arcId) {
        return this.arrowElements.get(arcId);
    }

    createNodeElement(node) {
        var element = document.createElement('graph-node');
        this.appendChild(element);
        this.nodeElements.set(node.id, element);
        this.linkNodeElementToEvents(this, node);
        return element;
    }
    createArcElement(arc) {
        var element = document.createElement('graph-arc');
        this.appendChild(element);
        this.arcElements.set(arc.id, element);
        this.linkArcElementToEvents(this, arc);
        return element;
    }
    createArrowElement(arc) {
        var element = createSVGArrow();
        this.svgElement.appendChild(element);
        this.arrowElements.set(arc.id, element);
        this.linkArrowElementToEvents(this, arc);
        return element;
    }

    deleteArcElement(arcId) {
        this.getArcElementById(arcId).remove();
        this.arcElements.delete(arcId);
    }
    deleteArrowElement(arcId) {
        this.getArrowElementById(arcId).remove();
        this.arrowElements.delete(arcId);
    }
    deleteNodeElement(nodeId) {
        this.getNodeElementById(nodeId).remove();
        this.nodeElements.delete(nodeId);
    }

    paintNodeElement(node, color) {
        var element = this.getNodeElement(node);
        element.setColor(color);
    }
    paintArrowElement(arc, color) {
        var element = this.getArrowElement(arc);
        setSVGArrowColor(element, color);
    }

    updateNodeElementCoords(node) {
        var x = node.coords.x * (METERS_TO_PIXELS_K*this.camera.zoom) + this.offsetWidth * 0.5 - this.camera.coords.x;
        var y = node.coords.y * (METERS_TO_PIXELS_K*this.camera.zoom) + this.offsetHeight * 0.5 - this.camera.coords.y;
        this.getNodeElement(node).setCoords(x, y);
    }
    updateNodeElementSelection(node) {
        var color = "#000000";
        if (this.graph.isNodeSelected(node)) {
            color = "#0000FF";
        }
        this.paintNodeElement(node, color);
    }
    updateNodeElementParams(node) {
        var element = this.getNodeElement(node);
        this.paramsRenderer.renderNodeParams(element, node.params);
    }
    updateNodeElement(node) {
        this.updateNodeElementCoords(node);
        this.updateNodeElementSelection(node);
        this.updateNodeElementParams(node);
    }

    updateArrowElementScale(arc) {
        setSVGArrowSize(this.getArrowElement(arc), ARROW_ELEMENT_SIZE*this.camera.zoom)
    }
    updateArrowElementCoords(arc) {
        var startNodeElement = this.getNodeElement(arc.startNode);
        var endNodeElement = this.getNodeElement(arc.endNode);
        var fromPoint = new Vector(
            startNodeElement.offsetLeft,
            startNodeElement.offsetTop
        );
        var toPoint = new Vector(
            endNodeElement.offsetLeft,
            endNodeElement.offsetTop
        );
        var endNodeRadius = Math.sqrt(Math.pow(endNodeElement.offsetWidth, 2)+Math.pow(endNodeElement.offsetHeight, 2));
        var delta = toPoint.substruct(fromPoint).setLength(0.5).multiply(endNodeRadius);
        toPoint = toPoint.substruct(delta);
        var arrowElement = this.getArrowElement(arc);
        replaceSVGArrow(arrowElement, fromPoint, toPoint);
    }
    updateArrowElementSelection(arc) {
        var color = "#000000";
        if (this.graph.isArcSelected(arc)) {
            color = "#0000FF";
        }
        this.paintArrowElement(arc, color);
    }
    updateArrowElement(arc) {
        this.updateArrowElementScale(arc);
        this.updateArrowElementCoords(arc);
        this.updateArrowElementSelection(arc);
    }

    updateArcElementCoords(arc) {
        var startNodeElement = this.getNodeElement(arc.startNode);
        var endNodeElement = this.getNodeElement(arc.endNode);
        var fromPoint = new Vector(
            startNodeElement.offsetLeft,
            startNodeElement.offsetTop
        );
        var toPoint = new Vector(
            endNodeElement.offsetLeft,
            endNodeElement.offsetTop
        );
        var coords = toPoint.add(fromPoint).multiply(0.5);
        this.getArcElement(arc).setCoords(coords.x, coords.y);
    }
    updateArcElementParams(arc) {
        var element = this.getArcElement(arc);
        this.paramsRenderer.renderArcParams(element, arc.params);
    }
    updateArcElement(arc) {
        this.updateArcElementCoords(arc);
        this.updateArcElementParams(arc);
    }

    updateGraphElementsScale() {
        this.style.fontSize = this.camera.zoom + "em";
        this.graph.forEachArc((arc) => {
            this.updateArrowElementScale(arc);
        });
    }
    updateGraphElementsCoords() {
        this.graph.forEachNode((node) => {
            this.updateNodeElementCoords(node);
        });
        this.graph.forEachArc((arc) => {
            this.updateArcElementCoords(arc);
            this.updateArrowElementCoords(arc);
        });
    }
    updateGraphElementsParams() {
        this.graph.forEachNode((node) => {
            this.updateNodeElementParams(node);
        });
        this.graph.forEachArc((arc) => {
            this.updateArcElementParams(arc);
        });
    }
    
    updateArcConnectedToNodeElementsCoords(node) {
        this.graph.forEachNodeArc(node, (arc) => {
            this.updateArcElementCoords(arc);
            this.updateArrowElementCoords(arc);
        });
    }

    createNodeElementForExistingNode(node) {
        this.createNodeElement(node);
        this.updateNodeElement(node);
    }
    createArrowElementForExistingArc(arc) {
        this.createArrowElement(arc);
        this.updateArrowElement(arc);
    }
    createArcElementForExistingArc(arc) {
        this.createArcElement(arc);
        this.updateArcElement(arc);
    }

    // NODES DRAGGING

    dragSelectedNodes(deltaPixels) {
        var deltaCoords = deltaPixels.multiply(1 / (METERS_TO_PIXELS_K*this.camera.zoom));
        this.applyDraggingToSelectedNodes(deltaCoords);
    }
    applyDraggingToNode(node, deltaCoords) {
        node.coords = node.coords.add(deltaCoords);
        this.updateNodeElementCoords(node);
        this.updateArcConnectedToNodeElementsCoords(node);
    }
    applyDraggingToSelectedNodes(deltaCoords) {
        this.graph.forEachSelectedNode((node) => {
            this.applyDraggingToNode(node, deltaCoords);
        });
    }

    // CAMERA

    getCameraCoords() {
        return this.camera.coords;
    }
    setCameraCoords(coords) {
        this.camera.coords = coords;
        this.updateGraphElementsCoords();
    }

    getCameraZoom() {
        return this.camera.zoom;
    }
    setCameraZoom(zoom) {
        this.camera.zoom = zoom;
        this.updateGraphElementsCoords();
        this.updateGraphElementsScale();
    }

    // GRAPH INTERFACE SUPPORT

    createNode(params = {}, id=null, coords = new Vector()) {
        var node = this.graph.createNode(params, id, coords);
        this.createNodeElementForExistingNode(node);
        return node;
    }
    createArc(startNode, endNode, params = {}, id=null) {
        var arc = this.graph.createArc(startNode, endNode, params, id);
        this.createArrowElementForExistingArc(arc);
        this.createArcElementForExistingArc(arc);
        return arc;
    }

    deleteArc(arc) {
        this.deleteArcElement(arc.id);
        this.deleteArrowElement(arc.id);
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

    // SELECTION

    isNodeSelected(node) {
        return this.graph.selectedNodeIds.has(node.id);
    }
    selectNode(node) {
        this.graph.selectNode(node);
        this.updateNodeElementSelection(node);
    }
    deselectNode(node) {
        this.graph.deselectNode(node);
        this.updateNodeElementSelection(node);
    }
    changeNodeSelection(node) {
        this.graph.changeNodeSelection(node);
        this.updateNodeElementSelection(node);
    }

    isArcSelected(arc) {
        return this.graph.selectedArcIds.has(arc.id);
    }
    selectArc(arc) {
        this.graph.selectArc(arc);
        this.updateArrowElementSelection(arc);
    }
    deselectArc(arc) {
        this.graph.deselectArc(arc);
        this.updateArrowElementSelection(arc);
    }
    changeArcSelection(arc) {
        this.graph.changeArcSelection(arc);
        this.updateArrowElementSelection(arc);
    }

    deleteSelected() {
        this.graph.forEachSelectedArc((arc) => {
            this.deleteArc(arc);
        });
        this.graph.forEachSelectedNode((node) => {
            this.deleteNode(node);
        });
    }
    createNodeConnectedToSelectedNodes() {
        var nodeCoords = new Vector();
        if (this.graph.selectedNodeIds.size > 0) {
            this.graph.forEachSelectedNode((selectedNode) => {
                nodeCoords = nodeCoords.add(selectedNode.coords);
            });
            nodeCoords = nodeCoords.multiply(1 / this.graph.selectedNodeIds.size);   
        }
        if (this.graph.selectedNodeIds.size == 1) {
            var randomVector = new Vector(Math.random()-0.5, Math.random()-0.5);
            nodeCoords = nodeCoords.add(randomVector);
        } else if (this.graph.selectedNodeIds.size == 0) {
            nodeCoords = this.camera.coords.multiply(1 / (METERS_TO_PIXELS_K * this.camera.zoom));
        }
        var node = this.createNode({}, null, nodeCoords);
        this.graph.forEachSelectedNode((selectedNode) => {
            this.createArc(selectedNode, node);
        });
        return node;
    }
    connectSelectedNodes() {
        var arcs = [];
        var prevNode = null;
        this.graph.forEachSelectedNode((newNode) => {
            if (prevNode) {
                var arc = this.createArc(prevNode, newNode);
                arcs.push(arc);
            }
            prevNode = newNode;
        });
        return arcs;
    }
    reverseSelectedArcs() {
        this.graph.forEachSelectedArc((arc) => {
            this.graph.reverseArc(arc);
            this.updateArcElementCoords(arc);
            this.updateArrowElementCoords(arc);
        });
    }
    clearSelection() {
        var selectedNodeIds = new Set(this.graph.selectedNodeIds);
        var selectedArcIds = new Set(this.graph.selectedArcIds);
        this.graph.clearSelection();
        for (const id of selectedNodeIds) {
            var node = this.graph.getNode(id);
            this.updateNodeElementSelection(node);
        }
        for (const id of selectedArcIds) {
            var arc = this.graph.getArc(id);
            this.updateArrowElementSelection(arc);
        }
    }

    // EDITING

    editNode(node, eventNodeEditingDone, eventNodeEditingCancel) {
        this.editingMode = true;
        var nodeElement = this.getNodeElement(node);
        this.paramsRenderer.renderNodeParamsEditor(nodeElement, node.params, (params) => {
            delete this.editingMode;
            eventNodeEditingDone(this, node.id, params);
        },
        () => {
            delete this.editingMode;
            eventNodeEditingCancel(this, node.id);
        });
    }
    editArc(arc, eventArcEditingDone, eventArcEditingCancel) {
        this.editingMode = true;
        var arcElement = this.getArcElement(arc);
        this.paramsRenderer.renderArcParamsEditor(arcElement, arc.params, (params) => {
            delete this.editingMode;
            eventArcEditingDone(this, arc.id, params);
        },
        () => {
            delete this.editingMode;
            eventArcEditingCancel(this, arc.id);
        });
    }

    // VERSIONS

    applyVersionChangesToElements(changes) {
        // create new nodes
        for (var nodeId of changes.nodes) {
            var node = this.graph.getNode(nodeId);
            if (!this.nodeElements.has(nodeId) && node) {
                this.createNodeElementForExistingNode(node);
            }
        }
        // create new arcs
        for (var arcId of changes.arcs) {
            var arc = this.graph.getArc(arcId);
            if (!this.arrowElements.has(arcId) && arc) {
                this.createArrowElementForExistingArc(arc);
                this.createArcElementForExistingArc(arc);
            }
        }
        // update existing nodes
        for (var nodeId of changes.nodes) {
            var node = this.graph.getNode(nodeId);
            if (this.nodeElements.has(nodeId) && node) {
                this.updateNodeElement(node);
                this.updateArcConnectedToNodeElementsCoords(node);
            }
        }
        // update existing arcs
        for (var arcId of changes.arcs) {
            var arc = this.graph.getArc(arcId);
            if (this.arrowElements.has(arcId) && arc) {
                this.updateArrowElement(arc);
                this.updateArcElement(arc);
            }
        }
        // delete old arcs
        for (var arcId of changes.arcs) {
            var arc = this.graph.getArc(arcId);
            if (this.arrowElements.has(arcId) && !arc) {
                this.deleteArcElement(arcId);
                this.deleteArrowElement(arcId);
            }
        }
        // delete old nodes
        for (var nodeId of changes.nodes) {
            var node = this.graph.getNode(nodeId);
            if (this.nodeElements.has(nodeId) && !node) {
                this.deleteNodeElement(nodeId);
            }
        }
    }

    rollback() {
        if (this.graph.getBackupsCount() > 0) {
            var changes = this.graph.rollback();
            this.applyVersionChangesToElements(changes);
        }
    }
    update() {
        if (this.graph.getUpdatesCount() > 0) {
            var changes = this.graph.update();
            this.applyVersionChangesToElements(changes);
        }
    }

    saveChanges() {
        this.graph.createBackup();
        this.graph.forgetUpdates();
    }

    // IMPORT & EXPORT

    saveToJSON() {
        var json = this.graph.toJSON();
        return json;
    }

    loadFromJSON(json) {
        this.saveChanges();
        var changes = this.graph.fromJSON(json);
        this.applyVersionChangesToElements(changes);
    }

}

customElements.define('graph-frame', GraphFrame);
