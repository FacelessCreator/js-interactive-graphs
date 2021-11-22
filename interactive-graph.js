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

const DEFAULT_NODE_RENDERER = function(containerElement, node) {
    var text = JSON.stringify(node.params);
    containerElement.innerHTML = "<p>"+text+"</p>";
};

class InteractiveGraph extends PhysicalGraph {
    
    static METERS_TO_PIXELS_K = 50;

    static DISPLAY_NODE_SIZE = 50; // in pixels

    constructor(canvasElement) {
        super();
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext("2d");
    }

    renderNodeParams(node) {
        this.ctx.font = Math.round(InteractiveGraph.DISPLAY_NODE_SIZE*0.5)+'px serif';
        var x = node.physics.r.x*InteractiveGraph.METERS_TO_PIXELS_K - InteractiveGraph.DISPLAY_NODE_SIZE*0.5 + this.canvas.width * 0.5;
        var y = node.physics.r.y*InteractiveGraph.METERS_TO_PIXELS_K + InteractiveGraph.DISPLAY_NODE_SIZE*0.25 + this.canvas.height * 0.5;
        var text = JSON.stringify(node.params);
        this.ctx.fillText(text, x, y);
    }
    renderNode(node) {
        this.ctx.stroke();
        // node
        this.ctx.beginPath();
        var x = node.physics.r.x*InteractiveGraph.METERS_TO_PIXELS_K + this.canvas.width * 0.5;
        var y = node.physics.r.y*InteractiveGraph.METERS_TO_PIXELS_K + this.canvas.height * 0.5;
        this.ctx.arc(x, y, InteractiveGraph.DISPLAY_NODE_SIZE, 0, Math.PI * 2, true);
        this.ctx.stroke();
        // id
        this.renderNodeParams(node);
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
        for (var node of this.nodes) {
            for (var arc of node.inArcs) {
                this.renderArc(arc);
            }
        }
        for (var node of this.nodes) {
            this.renderNode(node);
        }
    }    

    physicsStep(dt) {
        super.physicsStep(dt);
        this.render();
    }

}