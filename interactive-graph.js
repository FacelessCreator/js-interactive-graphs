function drawCanvasArrow(context, fromx, fromy, tox, toy, headlen) {
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
}

const DEFAULT_NODE_RENDERER = function(containerElement, params) {
    var text = JSON.stringify(params);
    //containerElement.innerHTML = "<p>"+text+"</p>";
};

function eventNodeElementMouseDown(event) {
    event.preventDefault();
    var nodeElement = event.target;
    nodeElement.setAttribute("eventType", event.type);
    nodeElement.onmousemove = eventNodeElementDrag;
}
function eventNodeElementMouseUp(event) {
    event.preventDefault();
    var nodeElement = event.target;
    nodeElement.setAttribute("eventType", event.type);
    nodeElement.onmousemove = null;
}
function eventNodeElementMouseLeave(event) {
    event.preventDefault();
    var nodeElement = event.target;
    nodeElement.setAttribute("eventType", event.type);
    nodeElement.onmousemove = null;
}
function eventNodeElementDrag(event) {
    event.preventDefault();
    var nodeElement = event.target;
    nodeElement.setAttribute("eventType", event.type);
    nodeElement.style.left = event.clientX - nodeElement.parentElement.offsetLeft - InteractiveGraph.DISPLAY_NODE_SIZE + "px";
    nodeElement.style.top = event.clientY - nodeElement.parentElement.offsetTop - InteractiveGraph.DISPLAY_NODE_SIZE + "px";
}

class InteractiveGraph extends PhysicalGraph {
    
    static METERS_TO_PIXELS_K = 50;

    static DISPLAY_NODE_SIZE = 50; // in pixels

    constructor(container, nodeRenderer=DEFAULT_NODE_RENDERER) {
        super();
        this.displayContainer = container;
        this.nodeRenderer = nodeRenderer;

        this.canvas = document.createElement("canvas");
        this.displayContainer.appendChild(this.canvas);
        this.canvas.width = this.displayContainer.offsetWidth;
        this.canvas.height = this.displayContainer.offsetHeight;
        this.ctx = this.canvas.getContext("2d");
    }

    createNodeElement(node) {
        node.element = document.createElement("div");
        node.element.style.height = 2*InteractiveGraph.DISPLAY_NODE_SIZE + "px";
        node.element.style.width = 2*InteractiveGraph.DISPLAY_NODE_SIZE + "px";
        node.element.onmousedown = eventNodeElementMouseDown;
        node.element.onmouseup = eventNodeElementMouseUp;
        node.element.onmouseleave = eventNodeElementMouseLeave;
        this.displayContainer.appendChild(node.element);
    }
    createNode(params={}) {
        var node = super.createNode(params);
        this.createNodeElement(node);
        this.nodeRenderer(node.element, node.params);
        return node;
    }

    deleteNode(node) {
        super.deleteNode(node);
        this.displayContainer.removeChild(node.element);
    }

    physicsStep(dt) {
        this.checkEvents();
        super.physicsStep(dt);
        this.render();
    }

    renderNode(node) {
        if (!node.physics.frozen) {
            node.element.style.left = node.physics.r.x*InteractiveGraph.METERS_TO_PIXELS_K + this.canvas.width * 0.5 - InteractiveGraph.DISPLAY_NODE_SIZE + "px";
            node.element.style.top = node.physics.r.y*InteractiveGraph.METERS_TO_PIXELS_K + this.canvas.height * 0.5 - InteractiveGraph.DISPLAY_NODE_SIZE + "px";
        }
    }
    renderArc(arc) {
        var nodeFrom = arc.nodeFrom;
        var nodeTo = arc.nodeTo;
        var fromX = nodeFrom.physics.r.x*InteractiveGraph.METERS_TO_PIXELS_K + this.canvas.width * 0.5;
        var fromY = nodeFrom.physics.r.y*InteractiveGraph.METERS_TO_PIXELS_K + this.canvas.height * 0.5;
        var toX = nodeTo.physics.r.x*InteractiveGraph.METERS_TO_PIXELS_K + this.canvas.width * 0.5;
        var toY = nodeTo.physics.r.y*InteractiveGraph.METERS_TO_PIXELS_K + this.canvas.height * 0.5;
        // arrow should be some smaller to point from node circle to node circle not point to point
        var deltaX = toX - fromX;
        var deltaY = toY - fromY;
        var angle = Math.atan2(deltaY, deltaX);
        fromX += InteractiveGraph.DISPLAY_NODE_SIZE * Math.cos(angle);
        toX -= InteractiveGraph.DISPLAY_NODE_SIZE * Math.cos(angle);
        fromY += InteractiveGraph.DISPLAY_NODE_SIZE * Math.sin(angle);
        toY -= InteractiveGraph.DISPLAY_NODE_SIZE * Math.sin(angle);
        drawCanvasArrow(this.ctx, fromX, fromY, toX, toY, InteractiveGraph.DISPLAY_NODE_SIZE);
    }
    renderClear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    render() {
        this.renderClear();
        this.ctx.beginPath();
        for (var node of this.nodes) {
            for (var arc of node.inArcs) {
                this.renderArc(arc);
            }
        }
        this.ctx.stroke();
        for (var node of this.nodes) {
            this.renderNode(node);
        }
    }

    applyNodeEventMouseDown(node) {
        node.physics.frozen = true;
    }
    applyNodeEventMouseUp(node) {
        node.physics.frozen = false;
    }
    applyNodeEventMouseLeave(node) {
        node.physics.frozen = false;
    }
    applyNodeEventMouseMove(node) {
        node.physics.r.x = (node.element.offsetLeft - this.canvas.width * 0.5 + InteractiveGraph.DISPLAY_NODE_SIZE) / InteractiveGraph.METERS_TO_PIXELS_K;
        node.physics.r.y = (node.element.offsetTop - this.canvas.height * 0.5 + InteractiveGraph.DISPLAY_NODE_SIZE) / InteractiveGraph.METERS_TO_PIXELS_K;
    }
    checkEvents() {
        for (var node of this.nodes) {
            var eventType = node.element.getAttribute("eventType");
            if (eventType == undefined) {
                continue;
            } else {
                if (eventType == "mousedown") {
                    this.applyNodeEventMouseDown(node);
                } else if (eventType == "mouseup") {
                    this.applyNodeEventMouseUp(node);
                } else if (eventType == "mouseleave") {
                    this.applyNodeEventMouseLeave(node);
                } else if (eventType == "mousemove") {
                    this.applyNodeEventMouseMove(node);
                }
                node.element.removeAttribute("eventType");
            }
        }
    }

}