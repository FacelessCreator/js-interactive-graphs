import {Vector} from '../vector/vector.js';

export class GraphNode {
    constructor(id, params={}) {
        this.id = id;
        this.params = Object.assign({}, params);
        this.inputArcs = [];
        this.outputArcs = [];
    }

    compareParams(anotherNode) {
        return JSON.stringify(this.params) === JSON.stringify(anotherNode.params);
    }
    compare(anotherNode) {
        return this.compareParams(anotherNode);
    }
}

export class GraphArc {
    constructor(startNode, endNode, id, params={}) {
        this.startNode = startNode;
        this.endNode = endNode;
        this.id = id;
        this.params = Object.assign({}, params);
    }

    compareParams(anotherArc) {
        return JSON.stringify(this.params) === JSON.stringify(anotherArc.params);
    }
    compare(anotherArc) {
        return this.compareParams(anotherArc);
    }    
}

export class Graph {

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
        for (var arc of node.inputArcs) {
            func(arc);
        }
        for (var arc of node.outputArcs) {
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
        var node = new GraphNode(id, params);
        this.nodes.set(id,node);
        return node;
    }
    createArc(startNode, endNode, params={}, id=null) {
        if (!id) {
            id = ++this.lastArcId;
        } else {
            id = Number(id);
            this.lastArcId = Math.max(this.lastArcId, id);
        }
        var arc = new GraphArc(startNode, endNode, id, params);
        this.arcs.set(id, arc);
        startNode.outputArcs.push(arc);
        endNode.inputArcs.push(arc);
        return arc;
    }

    findArcBetweenNodes(startNode, endNode) {
        for (const [id, arc] of this.arcs) {
            if (arc.endNode == endNode && arc.startNode == startNode) {
                return arc;
            }
        }
        throw "no such element";
    }

    deleteArcFromNode(arc, node) { // LOCAL FUNCTION
        var inputPos = node.inputArcs.indexOf(arc);
        if (inputPos >= 0) {
            node.inputArcs.splice(inputPos, 1);
            return;
        }
        var outputPos = node.outputArcs.indexOf(arc);
        if (outputPos >= 0) {
            node.outputArcs.splice(outputPos, 1);
            return;
        }
        throw "no such element";
    }
    deleteArcBetweenNodes(startNode, endNode) {
        var arc = this.findArcBetweenNodes(startNode, endNode);
        this.deleteArcFromNode(arc, startNode);
        this.deleteArcFromNode(arc, endNode);
        this.arcs.delete(arc.id);
    }
    isolateNode(node) {
        for (var arc of node.inputArcs) {
            this.deleteArcFromNode(arc, arc.startNode);
            this.arcs.delete(arc.id);
        }
        for (var arc of node.outputArcs) {
            this.deleteArcFromNode(arc, arc.endNode);
            this.arcs.delete(arc.id);
        }
        node.inputArcs = [];
        node.outputArcs = [];
    }
    deleteNode(node) {
        this.isolateNode(node);
        this.nodes.delete(node.id);
    }
    deleteArc(arc) {
        this.deleteArcFromNode(arc, arc.startNode);
        this.deleteArcFromNode(arc, arc.endNode);
        this.arcs.delete(arc.id);
    }

    clone() {
        var oldGraph = this;
        var newGraph = new Graph();
        var oldToNewNode = {};
        var arcsToCopy = [];
        oldGraph.forEachNode((oldNode) => {
            oldToNewNode[oldNode] = newGraph.createNode(oldNode.params, oldNode.id);
            for (var oldArc of oldNode.inputArcs) {
                arcsToCopy.push(oldArc);
            }
        });
        for (var oldArc of arcsToCopy) {
            var newNodeFrom = oldToNewNode[oldArc.startNode];
            var newNodeTo = oldToNewNode[oldArc.endNode];
            newGraph.createArc(newNodeFrom, newNodeTo, oldArc.params, oldArc.id);
        }
        newGraph.lastNodeId = this.lastNodeId;
        newGraph.lastArcId = this.lastArcId;
        return newGraph;
    }

    reverseArc(arc) {
        var startNode = arc.startNode;
        var endNode = arc.endNode;
        this.deleteArcFromNode(arc, startNode);
        this.deleteArcFromNode(arc, endNode);
        arc.endNode = startNode;
        arc.startNode = endNode;
        startNode.inputArcs.push(arc);
        endNode.outputArcs.push(arc);
    }

}

export class VisualGraphNode extends GraphNode {
    
    constructor(id, params={}, coords=new Vector()) {
        super(id, params);
        this.coords = coords;
    }
    
    compare(anotherNode) {
        return super.compare(anotherNode) && this.coords.compare(anotherNode.coords);
    }
}

export class VisualGraphArc extends GraphArc {
    
    constructor(startNode, endNode, id, params={}) {
        super(startNode, endNode, id, params);
    }
    
}

export class VisualGraph extends Graph {

    constructor() {
        super();
    }

    createNode(params={}, id=null, coords=new Vector()) {
        if (!id) {
            id = ++this.lastNodeId;
        } else {
            id = Number(id);
            this.lastNodeId = Math.max(this.lastNodeId, id);
        }
        var node = new VisualGraphNode(id, params, coords);
        this.nodes.set(id, node);
        return node;
    }
    createArc(startNode, endNode, params={}, id=null) {
        if (!id) {
            id = ++this.lastArcId;
        } else {
            id = Number(id);
            this.lastArcId = Math.max(this.lastArcId, id);
        }
        var arc = new VisualGraphArc(startNode, endNode, id, params);
        this.arcs.set(id, arc);
        startNode.outputArcs.push(arc);
        endNode.inputArcs.push(arc);
        return arc;
    }

    clone() {
        var oldGraph = this;
        var newGraph = new VisualGraph();
        var oldToNewNode = {};
        var arcsToCopy = [];
        oldGraph.forEachNode((oldNode) => {
            oldToNewNode[oldNode] = newGraph.createNode(oldNode.params, oldNode.id, oldNode.coords);
            for (var oldArc of oldNode.inputArcs) {
                arcsToCopy.push(oldArc);
            }
        });
        for (var oldArc of arcsToCopy) {
            var newNodeFrom = oldToNewNode[oldArc.startNode];
            var newNodeTo = oldToNewNode[oldArc.endNode];
            newGraph.createArc(newNodeFrom, newNodeTo, oldArc.params, oldArc.id);
        }
        newGraph.lastNodeId = this.lastNodeId;
        newGraph.lastArcId = this.lastArcId;
        return newGraph;
    }

}

export class VersionsVisualGraph extends VisualGraph {
    
    static DEFAULT_MAX_BACKUPS_COUNT = 10;
    static DEFAULT_MAX_UPDATES_COUNT = 10;

    constructor() {
        super();
        this.backups = [];
        this.updates = [];
        this.maxBackupsCount = VersionsVisualGraph.DEFAULT_MAX_BACKUPS_COUNT;
        this.maxUpdatesCount = VersionsVisualGraph.DEFAULT_MAX_UPDATES_COUNT;
    }

    getBackupsCount() {
        return this.backups.length;
    }
    getUpdatesCount() {
        return this.updates.length;
    }

    createBackup() {
        var newBackup = this.clone();
        this.backups.push(newBackup);
        if (this.getBackupsCount() > this.maxBackupsCount) {
            this.backups.shift();
        }
    }
    createUpdate() {
        var newUpdate = this.clone();
        this.updates.push(newUpdate);
        if (this.getUpdatesCount() > this.maxUpdatesCount) {
            this.updates.shift();
        }
    }

    forgetBackups() {
        this.backups = [];
    }
    forgetUpdates() {
        this.updates = [];
    }

    // get ids of different arcs and nodes between this graph and another graph
    getDifferenceWithVersion(version) {
        var changedNodeIds = new Set();
        var changedArcIds = new Set();
        for (const [id, node] of version.nodes) {
            if (!this.nodes.has(id) || !this.getNode(id).compare(node)) {
                changedNodeIds.add(id);
            }
        }
        for (const id of this.nodes.keys()) {
            if (!version.nodes.has(id)) {
                changedNodeIds.add(id);
            }
        }
        for (const [id, arc] of version.arcs) {
            if (!this.arcs.has(id) || !this.getArc(id).compare(arc)) {
                changedArcIds.add(id);
            }
        }
        for (const id of this.arcs.keys()) {
            if (!version.arcs.has(id)) {
                changedArcIds.add(id);
            }
        }
        return {nodes: changedNodeIds, arcs: changedArcIds};
    }

    changeToVersion(version) {
        var changes = this.getDifferenceWithVersion(version);
        for (const id of changes.nodes) {
            if (!this.nodes.has(id)) {
                var differentNode = version.getNode(id);
                this.createNode(differentNode.params, differentNode.id, differentNode.coords);
            } else if (!version.nodes.has(id)) {
                var node = this.getNode(id);
                this.deleteNode(node);
            } else {
                var node = this.getNode(id);
                var differentNode = version.getNode(id);
                node.params = Object.assign({}, differentNode.params);
                node.coords = differentNode.coords.clone();
            }
        }
        for (const id of changes.arcs) {
            if (!this.arcs.has(id)) {
                var differentArc = version.getArc(id);
                var startNode = this.getNode(differentArc.startNode.id);
                var endNode = this.getNode(differentArc.endNode.id);
                this.createArc(startNode, endNode, differentArc.params, differentArc.id);
            } else if (!version.arcs.has(id)) {
                var arc = this.getArc(id);
                this.deleteArc(arc);
            } else {
                var arc = this.getArc(id);
                var differentArc = version.getArc(id);
                arc.params = Object.assign({}, differentArc.params);
            }
        }
        return changes;
    }

    rollback() {
        if (this.getBackupsCount() == 0) {
            throw "no backups left";
        }
        this.createUpdate();
        var backup = this.backups.pop();
        return this.changeToVersion(backup);
    }
    update() {
        if (this.getUpdatesCount() == 0) {
            throw "no updates left";
        }
        this.createBackup();
        var update = this.updates.pop();
        return this.changeToVersion(update);
    }

}