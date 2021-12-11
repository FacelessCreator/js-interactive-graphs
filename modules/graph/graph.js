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

    toSerializableObject() {
        var jsonObject = {};
        jsonObject.id = this.id;
        jsonObject.params = Object.assign({}, this.params);
        jsonObject.inputArcs = [];
        jsonObject.outputArcs = [];
        for (var arc of this.inputArcs) {
            jsonObject.inputArcs.push(arc.id);
        }
        for (var arc of this.outputArcs) {
            jsonObject.outputArcs.push(arc.id);
        }
        return jsonObject;
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
        return this.startNode.id == anotherArc.startNode.id && this.endNode.id == anotherArc.endNode.id && this.compareParams(anotherArc);
    }  
    
    toSerializableObject() {
        var jsonObject = {};
        jsonObject.id = this.id;
        jsonObject.startNode = this.startNode.id;
        jsonObject.endNode = this.endNode.id;
        jsonObject.params = Object.assign({}, this.params);
        return jsonObject;
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
        var arcsToCopy = [];
        oldGraph.forEachNode((oldNode) => {
            newGraph.createNode(oldNode.params, oldNode.id);
            for (var oldArc of oldNode.inputArcs) {
                arcsToCopy.push(oldArc);
            }
        });
        for (var oldArc of arcsToCopy) {
            var newNodeFrom = newGraph.getNode(oldArc.startNode.id);
            var newNodeTo = newGraph.getNode(oldArc.endNode.id);
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

    clear() {
        this.forEachNode((node) => {
            this.deleteNode(node);
        });
        this.lastNodeId = 0;
        this.lastArcId = 0;
    }

    fromJSON(json) {
        var jsonObject = JSON.parse(json);
        this.clear();
        for (var serializableNode of jsonObject.nodes) {
            this.createNode(serializableNode.params, serializableNode.id);
        }
        for (var serializableArc of jsonObject.arcs) {
            var startNode = this.getNode(serializableArc.startNode);
            var endNode = this.getNode(serializableArc.endNode);
            this.createArc(startNode, endNode, serializableArc.params, serializableArc.id);
        }
    }

    toJSON() {
        var jsonObject = {
            nodes: [],
            arcs: []
        };
        this.forEachNode((node) => {
            var serializableNode = node.toSerializableObject();
            jsonObject.nodes.push(serializableNode);
        });
        this.forEachArc((arc) => {
            var serializableArc = arc.toSerializableObject();
            jsonObject.arcs.push(serializableArc);
        });
        var json = JSON.stringify(jsonObject);
        return json;
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

    toSerializableObject() {
        var jsonObject = super.toSerializableObject();
        jsonObject.coords = this.coords;
        return jsonObject;
    }
}

export class VisualGraphArc extends GraphArc {
    
    constructor(startNode, endNode, id, params={}) {
        super(startNode, endNode, id, params);
    }
    
    toSerializableObject() {
        var jsonObject = super.toSerializableObject();
        return jsonObject;
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
        var arcsToCopy = [];
        oldGraph.forEachNode((oldNode) => {
            newGraph.createNode(oldNode.params, oldNode.id, oldNode.coords);
            for (var oldArc of oldNode.inputArcs) {
                arcsToCopy.push(oldArc);
            }
        });
        for (var oldArc of arcsToCopy) {
            var newNodeFrom = newGraph.getNode(oldArc.startNode.id);
            var newNodeTo = newGraph.getNode(oldArc.endNode.id);
            newGraph.createArc(newNodeFrom, newNodeTo, oldArc.params, oldArc.id);
        }
        newGraph.lastNodeId = this.lastNodeId;
        newGraph.lastArcId = this.lastArcId;
        return newGraph;
    }

    fromJSON(json) {
        var jsonObject = JSON.parse(json);
        this.clear();
        for (var serializableNode of jsonObject.nodes) {
            this.createNode(serializableNode.params, serializableNode.id, Object.assign(new Vector(), serializableNode.coords));
        }
        for (var serializableArc of jsonObject.arcs) {
            var startNode = this.getNode(serializableArc.startNode);
            var endNode = this.getNode(serializableArc.endNode);
            this.createArc(startNode, endNode, serializableArc.params, serializableArc.id);
        }
    }

}

export class VersionsVisualGraph extends VisualGraph {
    
    static DEFAULT_MAX_BACKUPS_COUNT = 100;
    static DEFAULT_MAX_UPDATES_COUNT = 100;

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
    changeToVersion(version) {
        var changedNodeIds = new Set();
        var changedArcIds = new Set();
        for (const [id, differentNode] of version.nodes) {
            if (!this.nodes.has(id)) {
                changedNodeIds.add(id);
                this.createNode(differentNode.params, differentNode.id, differentNode.coords);
            } else if (!this.getNode(id).compare(differentNode)) {
                changedNodeIds.add(id);
                var node = this.getNode(id);
                node.params = Object.assign({}, differentNode.params);
                node.coords = differentNode.coords.clone();
            }
        }
        for (const id of this.nodes.keys()) {
            if (!version.nodes.has(id)) {
                changedNodeIds.add(id);
                var node = this.getNode(id);
                this.forEachNodeArc(node, (arc) => {
                    changedArcIds.add(arc.id);
                });
                this.deleteNode(node);
            }
        }
        for (const [id, differentArc] of version.arcs) {
            if (!this.arcs.has(id)) {
                changedArcIds.add(id);
                var startNode = this.getNode(differentArc.startNode.id);
                var endNode = this.getNode(differentArc.endNode.id);
                this.createArc(startNode, endNode, differentArc.params, differentArc.id);
            } else if (!this.getArc(id).compare(differentArc)) {
                changedArcIds.add(id);
                var arc = this.getArc(id);
                var startNode = this.getNode(differentArc.startNode.id);
                var endNode = this.getNode(differentArc.endNode.id);
                arc.startNode = startNode;
                arc.endNode = endNode;
                arc.params = Object.assign({}, differentArc.params);
            }
        }
        for (const id of this.arcs.keys()) {
            if (!version.arcs.has(id)) {
                changedArcIds.add(id);
                var arc = this.getArc(id);
                this.deleteArc(arc);
            }
        }
        return {nodes: changedNodeIds, arcs: changedArcIds};
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

    fromJSON(json) {
        var changedNodeIds = new Set();
        var changedArcIds = new Set();
        this.forEachNode((node) => {
            changedNodeIds.add(node.id);
        });
        this.forEachArc((arc) => {
            changedArcIds.add(arc.id);
        });
        super.fromJSON(json);
        this.forEachNode((node) => {
            changedNodeIds.add(node.id);
        });
        this.forEachArc((arc) => {
            changedArcIds.add(arc.id);
        });
        return {nodes: changedNodeIds, arcs: changedArcIds};
    }

}
