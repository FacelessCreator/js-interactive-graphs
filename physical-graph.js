function createVector2D(x=0, y=0) {
    return {
        x: x,
        y: y
    };
}

function getVectorLength(vect) {
    return Math.sqrt(vect.x*vect.x+vect.y*vect.y);
}

function setVectorLength(vect, newLength) {
    var oldLength = getVectorLength(vect);
    return {
        x: vect.x * newLength / oldLength,
        y: vect.y * newLength / oldLength
    };
}

class PhysicalGraph extends Graph {
    
    static NODE_PUSH_RADIUS = 1.5;
    static NODE_PUSH_K = 10;
    static MAX_PUSH_V = 5;

    static ARC_PULL_RADIUS = 10;
    static ARC_PULL_K = 3;

    static NODE_SPAWN_RANGE = 10;

    constructor() {
        super();
    }

    createNode(params={}) {
        var node = super.createNode(params);
        var x = (Math.random()-0.5)*PhysicalGraph.NODE_SPAWN_RANGE;
        var y = (Math.random()-0.5)*PhysicalGraph.NODE_SPAWN_RANGE;
        node['physics'] = {
            r: createVector2D(x, y),
            v: createVector2D()
        };
        return node;
    }

    getVectorBetweenNodes(nodeFrom, nodeTo) {
        return createVector2D(nodeTo.physics.r.x-nodeFrom.physics.r.x, nodeTo.physics.r.y-nodeFrom.physics.r.y);
    }

    forgetNodeVelocity(node) {
        node.physics.v.x = 0;
        node.physics.v.y = 0;
    }
    pushNodes(nodeA, nodeB) {
        var distanceVector = this.getVectorBetweenNodes(nodeA, nodeB);
        var distance = getVectorLength(distanceVector);
        if (distance < PhysicalGraph.NODE_PUSH_RADIUS*2) {
            var pushVector;
            if (distance == 0) { // stupid situation; fixing
                pushVector = createVector2D(PhysicalGraph.NODE_PUSH_K*(Math.random()-0.5), PhysicalGraph.NODE_PUSH_K*(Math.random()-0.5));
            } else {
                pushVector = createVector2D(PhysicalGraph.NODE_PUSH_K/distanceVector.x, PhysicalGraph.NODE_PUSH_K/distanceVector.y);
                if (getVectorLength(pushVector) > PhysicalGraph.MAX_PUSH_V) {
                    pushVector = setVectorLength(pushVector, PhysicalGraph.MAX_PUSH_V);
                }
            }
            nodeA.physics.v.x -= pushVector.x;
            nodeA.physics.v.y -= pushVector.y;
            nodeB.physics.v.x += pushVector.x;
            nodeB.physics.v.y += pushVector.y;
        }
    }
    pullNodes(nodeA, nodeB) {
        var distanceVector = this.getVectorBetweenNodes(nodeA, nodeB);
        var distance = getVectorLength(distanceVector);
        if (distance > PhysicalGraph.ARC_PULL_RADIUS) {
            var pullVector = createVector2D(PhysicalGraph.ARC_PULL_K * distanceVector.x, PhysicalGraph.ARC_PULL_K * distanceVector.y);
            nodeA.physics.v.x += pullVector.x;
            nodeA.physics.v.y += pullVector.y;
            nodeB.physics.v.x -= pullVector.x;
            nodeB.physics.v.y -= pullVector.y;
        }
    }
    moveNode(node, dt) {
        node.physics.r.x += node.physics.v.x * dt;
        node.physics.r.y += node.physics.v.y * dt;
    }
    physicsStep(dt) {
        for (var node of this.nodes) {
            this.forgetNodeVelocity(node);
        }
        for (var i = 0; i < this.nodes.length; ++i) {
            // push unique pairs
            var nodeA = this.nodes[i];
            for (var j = 0; j < i; ++j) {
                var nodeB = this.nodes[j];
                this.pushNodes(nodeA, nodeB);
            }
            // pull unique linked pairs
            for (var arc of nodeA.inArcs) {
                var nodeB = arc.nodeFrom;
                this.pullNodes(nodeA, nodeB);
            }
        }
        for (var node of this.nodes) {
            this.moveNode(node, dt);
        }
    }

}