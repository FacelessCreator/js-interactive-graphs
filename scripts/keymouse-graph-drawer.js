
class KeyMouseGraphDrawer extends GraphDrawer {
    
    constructor(container, graph, nodeParamsRenderer=DEFAULT_NODE_PARAMS_RENDERER) {
        super(container, graph, nodeParamsRenderer);
        this.linkGraphElementsToListeners();
        this.linkContainterToListeners();
    }

    linkContainterToListeners() {
        this.displayContainer.addEventListener("mousedown", (e) => {this.eventContainerMouseDown(this, e)}); // WIP antipattern? madness?
        this.displayContainer.addEventListener("mousemove", (e) => {this.eventContainerMouseMove(this, e)}); // WIP antipattern? madness?
        this.displayContainer.addEventListener("mouseup", (e) => {this.eventContainerMouseUp(this, e)}); // WIP antipattern? madness?
        this.displayContainer.addEventListener("wheel", (e) => {this.eventContainerWheel(this, e)}); // WIP antipattern? madness?
    }

    linkNodeElementToListeners(node) {
        var nodeElement = this.getNodeData(node).element;
        nodeElement.addEventListener("mousedown", (e) => {this.eventNodeElementMouseDown(this, node.id, e)}); // WIP antipattern? madness?
    }
    linkGraphElementsToListeners() {
        this.graph.forEachNode((node) => {
            this.linkNodeElementToListeners(node);
        });
    }

    eventContainerMouseDown(drawer, event) {
        event.preventDefault();

        drawer.startCameraMovement(createVector2D(event.clientX, event.clientY));
    }
    eventContainerMouseMove(drawer, event) {
        event.preventDefault();

        if (drawer.draggingNodeId) {
            drawer.doDragging(createVector2D(event.clientX, event.clientY));
        } else if (drawer.isCameraMoving) {
            drawer.doCameraMovement(createVector2D(event.clientX, event.clientY), 1); // WIP add zoom change
        }
    }
    eventContainerMouseUp(drawer, event) {
        event.preventDefault();

        if (drawer.draggingNodeId) {
            drawer.stopDragging();
        } else if (drawer.isCameraMoving) {
            drawer.stopCameraMovement();
        }
    }

    static WHEEL_ZOOM_K = -0.001;

    eventContainerWheel(drawer, event) {
        event.preventDefault();
        drawer.zoomCamera(event.deltaY * KeyMouseGraphDrawer.WHEEL_ZOOM_K);
    }

    eventNodeElementMouseDown(drawer, nodeId, event) {
        event.preventDefault();
        event.stopPropagation();

        drawer.startDragging(nodeId, createVector2D(event.clientX, event.clientY));
    }

}
