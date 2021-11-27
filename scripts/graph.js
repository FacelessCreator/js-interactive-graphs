function createNode(id, params={}) {
    return {
        id: id,
        inArcs: [],
        outArcs: [],
        params: params,
    };
}

function createArc(nodeFrom, nodeTo, id, params={}) {
    return {
        id: id,
        nodeFrom: nodeFrom,
        nodeTo: nodeTo,
        params: params
    };
}

class Graph {

    constructor() {
        this.lastNodeId = 0;
        this.nodes = new Map();
        this.lastArcId = 0;
        this.arcs = new Map();
    }

    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }
    getArc(arcId) {
        return this.arcs.get(arcId);
    }
    forEachNode(func) {
        this.nodes.forEach(func);
    }
    forEachArc(func) {
        this.arcs.forEach(func);
    }
    forEachNodeArc(node, func) {
        for (var arc of node.inArcs) {
            func(arc);
        }
        for (var arc of node.outArcs) {
            func(arc);
        }
    }

    createNode(params={}, id=null) {
        if (!id) {
            id = ++this.lastNodeId;
        } else {
            id = Number(id);
            this.lastNodeId = Math.max(this.lastNodeId, id);
        }
        var node = createNode(id, params);
        this.nodes.set(id,node);
        return node;
    }
    createArc(nodeFrom, nodeTo, params={}, id=null) {
        if (!id) {
            id = ++this.lastArcId;
        } else {
            id = Number(id);
            this.lastArcId = Math.max(this.lastArcId, id);
        }
        var arc = createArc(nodeFrom, nodeTo, id, params);
        this.arcs.set(id, arc);
        nodeFrom.outArcs.push(arc);
        nodeTo.inArcs.push(arc);
        return arc;
    }

    findArcBetweenNodes(nodeFrom, nodeTo) {
        for (const [id, arc] of this.arcs) {
            if (arc.nodeTo == nodeTo) {
                return arc;
            }
        }
        throw "no such element";
    }

    deleteArcFromNode(arc, node) { // LOCAL FUNCTION
        var inPos = node.inArcs.indexOf(arc);
        if (inPos >= 0) {
            node.inArcs.splice(inPos, 1);
            return;
        }
        var outPos = node.outArcs.indexOf(arc);
        if (outPos >= 0) {
            node.outArcs.splice(outPos, 1);
            return;
        }
        throw "no such element";
    }
    deleteArc(nodeFrom, nodeTo) {
        var arc = this.findArcBetweenNodes(nodeFrom, nodeTo);
        this.deleteArcFromNode(arc, nodeFrom);
        this.deleteArcFromNode(arc, nodeTo);
        this.arcs.delete(arc.id);
    }
    isolateNode(node) {
        for (var arc of node.inArcs) {
            this.deleteArcFromNode(arc, arc.nodeFrom);
            this.arcs.delete(arc.id);
        }
        for (var arc of node.outArcs) {
            this.deleteArcFromNode(arc, arc.nodeTo);
            this.arcs.delete(arc.id);
        }
        node.inArcs = [];
        node.outArcs = [];
    }
    deleteNode(node) {
        this.isolateNode(node);
        this.nodes.delete(node.id);
    }

    clone() {
        var oldGraph = this;
        var newGraph = new Graph();
        var oldToNewNode = {};
        var arcsToCopy = [];
        oldGraph.forEachNode((oldNode) => {
            oldToNewNode[oldNode] = newGraph.createNode(oldNode.params, oldNode.id);
            for (var oldArc of oldNode.inArcs) {
                arcsToCopy.push(oldArc);
            }
        });
        for (var oldArc of arcsToCopy) {
            var newNodeFrom = oldToNewNode[oldArc.nodeFrom];
            var newNodeTo = oldToNewNode[oldArc.nodeTo];
            newGraph.createArc(newNodeFrom, newNodeTo, oldArc.params, oldArc.id);
        }
        return newGraph;
    }

    fillWithTwoArraysGraph(twoArraysGraph) {
        var nodesById = {};
        for (var nodeId in twoArraysGraph.nodes) {
            var nodeParams = twoArraysGraph.nodes[nodeId];
            nodesById[nodeId] = this.createNode(nodeParams, nodeId);
        }
        for (var arcAsIdPair of twoArraysGraph.arcs) {
            var nodeFromId = arcAsIdPair[0];
            var nodeToId = arcAsIdPair[1];
            var nodeFrom = nodesById[nodeFromId];
            var nodeTo = nodesById[nodeToId];
            this.createArc(nodeFrom, nodeTo);
        }
    }

}
