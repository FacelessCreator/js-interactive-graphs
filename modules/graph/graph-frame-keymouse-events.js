import { GraphFrame } from "./graph-frame.js";
import { Vector } from "../vector/vector.js";
import { downloadText, readTextFile } from "../file/file.js";

export function linkNodeElementToEvents(graphFrame, node) {
    var nodeElement = graphFrame.getNodeElement(node);
    nodeElement.addEventListener("mousedown", (e) => {eventNodeElementMouseDown(graphFrame, node.id, e)});
    nodeElement.addEventListener("mouseup", (e) => {eventNodeElementMouseUp(graphFrame, node.id, e)});
    nodeElement.addEventListener("dblclick", (e) => {eventNodeElementDoubleClick(graphFrame, node.id, e)});
}

export function linkArrowElementToEvents(graphFrame, arc) {
    var arrowElement = graphFrame.getArrowElement(arc);
    arrowElement.addEventListener("mousedown", (e) => {eventArrowElementMouseDown(graphFrame, arc.id, e)});
    arrowElement.addEventListener("mouseup", (e) => {eventArrowElementMouseUp(graphFrame, arc.id, e)}); 
    arrowElement.addEventListener("dblclick", (e) => {eventArrowElementDoubleClick(graphFrame, arc.id, e)});
}

export function linkArcElementToEvents(graphFrame, arc) {
    var arcElement = graphFrame.getArcElement(arc);
    arcElement.addEventListener("mousedown", (e) => {eventArrowElementMouseDown(graphFrame, arc.id, e)});
    arcElement.addEventListener("mouseup", (e) => {eventArrowElementMouseUp(graphFrame, arc.id, e)});
    arcElement.addEventListener("dblclick", (e) => {eventArrowElementDoubleClick(graphFrame, arc.id, e)});
}

export function linkContainerToEvents(graphFrame) {
    setupContainerVariables(graphFrame);
    setupContainerFocus(graphFrame);
    linkContainerToMouseEvents(graphFrame);
    linkContainerToKeyboardEvents(graphFrame);
    linkContainerToDragAndDropEvents(graphFrame);
}

function setupContainerVariables(graphFrame) {
    graphFrame.fileName = "graph.json";
}
function setupContainerFocus(graphFrame) {
    graphFrame.setAttribute("tabindex", 0); // this thing allows you to setup key events directly on object to incapsulate them
}
function linkContainerToMouseEvents(graphFrame) {
    graphFrame.addEventListener("mousedown", (e) => {eventContainerMouseDown(graphFrame, e)});
    graphFrame.addEventListener("mousemove", (e) => {eventContainerMouseMove(graphFrame, e)});
    graphFrame.addEventListener("mouseup", (e) => {eventContainerMouseUp(graphFrame, e)});
    graphFrame.addEventListener("wheel", (e) => {eventContainerWheel(graphFrame, e)});
}
function linkContainerToKeyboardEvents(graphFrame) {
    graphFrame.addEventListener("keyup", (e) => {eventKeyUp(graphFrame, e)});
    graphFrame.addEventListener("keydown", (e) => {eventKeyDown(graphFrame, e)});
}

// MOUSE EVENTS

function eventContainerMouseDown(graphFrame, event) {
    if (graphFrame.editingMode) {
        return;
    }
    event.preventDefault();
    graphFrame.focus();
}
function eventContainerMouseMove(graphFrame, event) {
    if (graphFrame.editingMode) {
        return;
    }
    event.preventDefault();
    if (graphFrame.isDragging) {
        var newPoint = new Vector(event.clientX, event.clientY);
        doDraggingNodes(graphFrame, newPoint);
    }
}
function eventContainerMouseUp(graphFrame, event) {
    if (graphFrame.editingMode) {
        return;
    }
    event.preventDefault();
    if (graphFrame.isDragging) {
        stopDraggingNodes(graphFrame);
    } else {
        if (event.shiftKey) {
            // TODO add something from selection box
        } else {
            graphFrame.clearSelection();
        }
    }
}

const WHEEL_CAMERA_ZOOM_K = -0.005; // zoom per deltaY

const WHEEL_CAMERA_MOVEMENT_K = 50; // pixels per deltaY

function eventContainerWheel(graphFrame, event) {
    if (graphFrame.editingMode || document.activeElement != graphFrame) {
        return;
    }
    event.preventDefault();
    var deltaY = event.deltaY;
    if (event.ctrlKey) {
        var zoom = graphFrame.getCameraZoom();
        var coords = graphFrame.getCameraCoords();
        var deltaZoom = deltaY * WHEEL_CAMERA_ZOOM_K;
        if (zoom + deltaZoom > 0) {
            zoom += deltaZoom;
            coords = coords.multiply(zoom / (zoom - deltaZoom));
        }
        graphFrame.setCameraZoom(zoom);
        graphFrame.setCameraCoords(coords);
    } else if (event.shiftKey) {
        var coords = graphFrame.getCameraCoords();
        var delta = new Vector(deltaY, 0);
        delta = delta.setLength(WHEEL_CAMERA_MOVEMENT_K);
        coords = coords.add(delta);
        graphFrame.setCameraCoords(coords);
    } else {
        var coords = graphFrame.getCameraCoords();
        var delta = new Vector(0, deltaY);
        delta = delta.setLength(WHEEL_CAMERA_MOVEMENT_K);
        coords = coords.add(delta);
        graphFrame.setCameraCoords(coords);
    }
}

function eventNodeElementMouseDown(graphFrame, nodeId, event) {
    if (graphFrame.editingMode) {
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    graphFrame.focus();
    var node = graphFrame.graph.getNode(nodeId);
    if (event.shiftKey) {
        graphFrame.changeNodeSelection(node);
    } else {
        if (graphFrame.isNodeSelected(node)) {
            // nothing
        } else {
            graphFrame.clearSelection();
            graphFrame.selectNode(node);
        }
    }
    var startPoint = new Vector(event.clientX, event.clientY);
    startDraggingNodes(graphFrame, startPoint);
}
function eventNodeElementMouseUp(graphFrame, nodeId, event) {
    if (graphFrame.editingMode) {
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    stopDraggingNodes(graphFrame);
}
function eventNodeElementDoubleClick(graphFrame, nodeId, event) {
    if (graphFrame.editingMode || event.shiftKey) {
        return;
    }
    var node = graphFrame.graph.getNode(nodeId);
    graphFrame.editNode(node, eventNodeEditingDone, eventNodeEditingCancel);
}

function eventNodeEditingDone(graphFrame, nodeId, params) {
    graphFrame.saveChanges();
    var node = graphFrame.graph.getNode(nodeId);
    node.params = params;
    graphFrame.updateNodeElementParams(node);
    graphFrame.focus();
}
function eventNodeEditingCancel(graphFrame, nodeId) {
    var node = graphFrame.graph.getNode(nodeId);
    graphFrame.updateNodeElementParams(node);
    graphFrame.focus();
}

function eventArrowElementMouseDown(graphFrame, arcId, event) {
    if (graphFrame.editingMode) {
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    graphFrame.focus();
    var arc = graphFrame.graph.getArc(arcId);
    if (event.shiftKey) {
        graphFrame.changeArcSelection(arc);
    } else {
        if (graphFrame.isArcSelected(arc)) {
            // nothing
        } else {
            graphFrame.clearSelection();
            graphFrame.selectArc(arc);
        }
    }
}
function eventArrowElementMouseUp(graphFrame, arcId, event) {
    if (graphFrame.editingMode) {
        return;
    }
    event.preventDefault();
    event.stopPropagation();
}
function eventArrowElementDoubleClick(graphFrame, arcId, event) {
    if (graphFrame.editingMode) {
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    var arc = graphFrame.graph.getArc(arcId);
    graphFrame.editArc(arc, eventArcEditingDone, eventArcEditingCancel);
}

function eventArcEditingDone(graphFrame, arcId, params) {
    graphFrame.saveChanges();
    var arc = graphFrame.graph.getArc(arcId);
    arc.params = params;
    graphFrame.updateArcElementParams(arc);
    graphFrame.focus();
}
function eventArcEditingCancel(graphFrame, arcId) {
    var arc = graphFrame.graph.getArc(arcId);
    graphFrame.updateArcElementParams(arc);
    graphFrame.focus();
}

// NODES DRAGGING

function startDraggingNodes(graphFrame, startPoint) {
    graphFrame.isDragging = true;
    graphFrame.draggingNodeLastPoint = startPoint;
}
function doDraggingNodes(graphFrame, newPoint) {
    if (!graphFrame.draggindNodeWasMoved) {
        graphFrame.saveChanges();
    }
    graphFrame.draggindNodeWasMoved = true;
    var deltaPixels = newPoint.substruct(graphFrame.draggingNodeLastPoint);
    graphFrame.draggingNodeLastPoint = newPoint;
    graphFrame.dragSelectedNodes(deltaPixels);
}
function stopDraggingNodes(graphFrame) {
    delete graphFrame.isDragging;
    delete graphFrame.draggindNodeWasMoved;
    delete graphFrame.draggingNodeLastPoint;
}

// KEYBOARD EVENTS

function eventKeyUp(graphFrame, event) {
    if (graphFrame.editingMode) {
        return;
    }
    const keyName = event.code;
    if (keyName == "Delete" || keyName == "Backspace") {
        graphFrame.saveChanges();
        graphFrame.deleteSelected();
    } else if (keyName == "KeyN") {
        graphFrame.saveChanges();
        graphFrame.createNodeConnectedToSelectedNodes();
    } else if (keyName == "Escape") {
        graphFrame.clearSelection();
    } else if (keyName == "KeyC") {
        graphFrame.saveChanges();
        graphFrame.connectSelectedNodes();
    } else if (keyName == "KeyR") {
        graphFrame.saveChanges();
        graphFrame.reverseSelectedArcs();
    } else if (keyName == "KeyZ" && event.ctrlKey) {
        graphFrame.rollback();
    } else if (keyName == "KeyY" && event.ctrlKey) {
        graphFrame.update();
    }
}

function eventKeyDown(graphFrame, event) {
    if (graphFrame.editingMode) {
        return;
    }
    const keyName = event.code;
    if (keyName == "KeyS" && event.ctrlKey) {
        event.preventDefault();
        var json = graphFrame.saveToJSON();
        downloadText(graphFrame.fileName, 'application/json', json);
    }
}

// DRAG & DROP

const DRAG_HOVER_CSS_CLASS = "drag-hover";

function linkContainerToDragAndDropEvents(graphFrame) {
    graphFrame.ondrop = (e) => {eventContainerDragDrop(graphFrame, e)};
    graphFrame.ondragenter = (e) => {eventContainerDragEnter(graphFrame, e)};
    graphFrame.ondragover = (e) => {eventContainerDragOver(graphFrame, e)};
    graphFrame.ondragleave = (e) => {eventContainerDragLeave(graphFrame, e)};
}

function eventContainerDragDrop(graphFrame, event) {
    event.stopPropagation();
    event.preventDefault();
    const file = event.dataTransfer.files[0]; // WARNING unsafe
    readTextFile(file, (text) => {
        graphFrame.loadFromJSON(text);
        graphFrame.fileName = file.name;
    });
    graphFrame.classList.remove(DRAG_HOVER_CSS_CLASS);
}

function eventContainerDragOver(graphFrame, event) { // seems useless but without it we cannot catch drop event at all
    event.stopPropagation();
    event.preventDefault();
}

function eventContainerDragEnter(graphFrame, event) {
    graphFrame.classList.add(DRAG_HOVER_CSS_CLASS);
}

function eventContainerDragLeave(graphFrame, event) {
    graphFrame.classList.remove(DRAG_HOVER_CSS_CLASS);
}

