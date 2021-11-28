
class KeyMouseGraphDrawer extends GraphDrawer {
    
    constructor(container, graph, nodeParamsRenderer=DEFAULT_NODE_PARAMS_RENDERER) {
        super(container, graph, nodeParamsRenderer);
        this.linkGraphElementsToListeners();
        this.linkContainterToListeners();
    }

    linkContainterToListeners() {
        this.displayContainer.addEventListener("mousedown", (e) => {this.eventCanvasMouseDown(this, e)}); // WIP antipattern? madness?
        this.displayContainer.addEventListener("mousemove", (e) => {this.eventCanvasMouseMove(this, e)}); // WIP antipattern? madness?
        this.displayContainer.addEventListener("mouseup", (e) => {this.eventCanvasMouseUp(this, e)}); // WIP antipattern? madness?
    }

    linkNodeElementToListeners(node) {
        var nodeElement = this.getNodeData(node).element;
        nodeElement.addEventListener("mousedown", (e) => {this.eventNodeElementMouseDown(this, node.id, e)}); // WIP antipattern? madness?
        //nodeElement.addEventListener("mouseup", (e) => {this.eventNodeElementMouseUp(this, node.id, e)}); // WIP antipattern? madness?
    }
    linkGraphElementsToListeners() {
        this.graph.forEachNode((node) => {
            this.linkNodeElementToListeners(node);
        });
    }

    eventCanvasMouseDown(drawer, event) {
        event.preventDefault();

    }
    eventCanvasMouseMove(drawer, event) {
        event.preventDefault();

        if (drawer.draggingNodeId) {
            drawer.doDragging(createVector2D(event.clientX, event.clientY));
        }
    }
    eventCanvasMouseUp(drawer, event) {
        event.preventDefault();

        drawer.stopDragging();
    }

    eventNodeElementMouseDown(drawer, nodeId, event) {
        event.preventDefault();
        event.stopPropagation();

        drawer.startDragging(nodeId, createVector2D(event.clientX, event.clientY));
    }
    eventNodeElementMouseUp(drawer, nodeId, event) {
        event.preventDefault();
        event.stopPropagation();

        drawer.stopDragging();
    }

}
