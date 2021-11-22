function createNode(params={}) {
    return {
        inArcs: [],
        outArcs: [],
        params: params,
    };
}

function createArc(nodeFrom, nodeTo, params={}) {
    return {
        nodeFrom: nodeFrom,
        nodeTo: nodeTo,
        params: params
    };
}

class Graph {
    constructor() {
        this.nodes = [];
    }

    createNode(params={}) {
        var node = createNode(params)
        this.nodes.push(node);
        return node;
    }
    createArc(nodeFrom, nodeTo, params={}) {
        var arc = createArc(nodeFrom, nodeTo, params);
        nodeFrom.outArcs.push(arc);
        nodeTo.inArcs.push(arc);
        return arc;
    }

    findArcBetweenNodes(nodeFrom, nodeTo) {
        for (var arc of nodeFrom.outArcs) {
            if (arc.nodeTo == nodeTo) {
                return arc;
            }
        }
        throw "no such element";
    }

    deleteArcFromNode(arc, node) {
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
        throw "no such element";
    }
    isolateNode(node) {
        for (var arc of node.inArcs) {
            this.deleteArcFromNode(arc, arc.nodeFrom);
        }
        for (var arc of node.outArcs) {
            this.deleteArcFromNode(arc, arc.nodeTo);
        }
        node.inArcs = [];
        node.outArcs = [];
    }
    deleteNode(node) {
        this.isolateNode(node);
        var pos = this.nodes.indexOf(node);
        if (pos >= 0) {
            this.nodes.splice(pos, 1);
            return;
        }
        throw "no such element";
    }

    clone() {
        var oldGraph = this;
        var newGraph = new Graph();
        var oldToNewNode = {};
        var arcsToCopy = [];
        for (var oldNode of oldGraph.nodes) {
            oldToNewNode[oldNode] = newGraph.createNode(oldNode.params);
            for (var oldArc of oldNode.inArcs) {
                arcsToCopy.push(oldArc);
            }
        }
        for (var oldArc of arcsToCopy) {
            var newNodeFrom = oldToNewNode[oldArc.nodeFrom];
            var newNodeTo = oldToNewNode[oldArc.nodeTo];
            newGraph.createArc(newNodeFrom, newNodeTo, oldArc.params);
        }
        return newGraph;
    }

    fillWithTwoArraysGraph(twoArraysGraph) {
        var nodesById = {};
        for (var nodeId in twoArraysGraph.nodes) {
            var nodeParams = twoArraysGraph.nodes[nodeId];
            nodeParams['id'] = nodeId;
            nodesById[nodeId] = this.createNode(nodeParams);
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
