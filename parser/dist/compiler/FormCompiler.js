"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormCompiler = void 0;
const lodash_1 = require("lodash");
/**
 * Compiles validated .form files into optimized internal representation
 * for efficient execution and reasoning
 */
class FormCompiler {
    /**
     * Compiles a validated FormFile into FormGraph internal representation
     */
    compile(formFile) {
        // Create deep copy to avoid modifying original
        const form = (0, lodash_1.cloneDeep)(formFile);
        // Build node map for O(1) lookups
        const nodes = new Map();
        form.nodes.forEach(node => {
            // Initialize default values
            if (!node.data.confidence)
                node.data.confidence = 1.0;
            if (!node.data.weight)
                node.data.weight = 1.0;
            if (!node.data.state)
                node.data.state = 'active';
            nodes.set(node.id, node);
        });
        // Build relation map for O(1) lookups
        const relations = new Map();
        form.relations.forEach(relation => {
            // Initialize default values
            if (relation.strength === undefined)
                relation.strength = 1.0;
            if (relation.bidirectional === undefined)
                relation.bidirectional = false;
            relations.set(relation.id, relation);
        });
        // Build adjacency lists for efficient graph traversal
        const { adjacencyList, reverseAdjacencyList } = this.buildAdjacencyLists(form.relations);
        // Process execution configuration
        const execution = {
            entry_points: form.execution?.entry_points || this.inferEntryPoints(form.nodes, reverseAdjacencyList),
            exit_points: form.execution?.exit_points || this.inferExitPoints(form.nodes, adjacencyList),
            max_iterations: form.execution?.max_iterations || 1000,
            timeout: form.execution?.timeout || 30000,
            mode: form.execution?.mode || 'adaptive'
        };
        // Merge extensions
        const extensions = {
            ...form.extensions,
            compilation: {
                timestamp: new Date().toISOString(),
                nodeCount: nodes.size,
                relationCount: relations.size,
                complexity: this.calculateComplexity(adjacencyList)
            }
        };
        return {
            metadata: form.metadata,
            nodes,
            relations,
            adjacencyList,
            reverseAdjacencyList,
            execution,
            extensions
        };
    }
    /**
     * Builds forward and reverse adjacency lists for efficient graph traversal
     */
    buildAdjacencyLists(relations) {
        const adjacencyList = new Map();
        const reverseAdjacencyList = new Map();
        relations.forEach(relation => {
            // Forward adjacency (source -> target)
            if (!adjacencyList.has(relation.source)) {
                adjacencyList.set(relation.source, []);
            }
            adjacencyList.get(relation.source).push(relation.target);
            // Reverse adjacency (target <- source)
            if (!reverseAdjacencyList.has(relation.target)) {
                reverseAdjacencyList.set(relation.target, []);
            }
            reverseAdjacencyList.get(relation.target).push(relation.source);
            // Handle bidirectional relations
            if (relation.bidirectional) {
                // Add reverse direction to forward adjacency
                if (!adjacencyList.has(relation.target)) {
                    adjacencyList.set(relation.target, []);
                }
                adjacencyList.get(relation.target).push(relation.source);
                // Add reverse direction to reverse adjacency
                if (!reverseAdjacencyList.has(relation.source)) {
                    reverseAdjacencyList.set(relation.source, []);
                }
                reverseAdjacencyList.get(relation.source).push(relation.target);
            }
        });
        return { adjacencyList, reverseAdjacencyList };
    }
    /**
     * Infers entry points by finding nodes with no incoming dependencies
     */
    inferEntryPoints(nodes, reverseAdjacencyList) {
        const entryPoints = [];
        nodes.forEach(node => {
            const incomingNodes = reverseAdjacencyList.get(node.id) || [];
            // Node is an entry point if:
            // 1. It has no incoming relations, OR
            // 2. It's an event type (natural entry points), OR
            // 3. It's explicitly marked as active
            if (incomingNodes.length === 0 ||
                node.type === 'event' ||
                node.data.state === 'active') {
                entryPoints.push(node.id);
            }
        });
        // If no entry points found, use the first node as fallback
        if (entryPoints.length === 0 && nodes.length > 0) {
            entryPoints.push(nodes[0].id);
        }
        return entryPoints;
    }
    /**
     * Infers exit points by finding nodes with no outgoing dependencies
     */
    inferExitPoints(nodes, adjacencyList) {
        const exitPoints = [];
        nodes.forEach(node => {
            const outgoingNodes = adjacencyList.get(node.id) || [];
            // Node is an exit point if:
            // 1. It has no outgoing relations, OR
            // 2. It's an action type that produces final output
            if (outgoingNodes.length === 0 ||
                (node.type === 'action' && outgoingNodes.length <= 1)) {
                exitPoints.push(node.id);
            }
        });
        return exitPoints;
    }
    /**
     * Calculates complexity metrics for the compiled graph
     */
    calculateComplexity(adjacencyList) {
        // Calculate maximum depth using BFS
        const maxDepth = this.calculateMaxDepth(adjacencyList);
        // Calculate average branching factor
        const branchingFactors = Array.from(adjacencyList.values()).map(targets => targets.length);
        const avgBranching = branchingFactors.length > 0
            ? branchingFactors.reduce((sum, factor) => sum + factor, 0) / branchingFactors.length
            : 0;
        // Estimate cycle count (simplified)
        const cycleCount = this.estimateCycleCount(adjacencyList);
        return { maxDepth, avgBranching, cycleCount };
    }
    /**
     * Calculates maximum depth of the graph using BFS
     */
    calculateMaxDepth(adjacencyList) {
        let maxDepth = 0;
        const visited = new Set();
        const bfs = (startNode) => {
            const queue = [{ nodeId: startNode, depth: 0 }];
            let localMaxDepth = 0;
            const localVisited = new Set();
            while (queue.length > 0) {
                const { nodeId, depth } = queue.shift();
                if (localVisited.has(nodeId))
                    continue;
                localVisited.add(nodeId);
                localMaxDepth = Math.max(localMaxDepth, depth);
                const neighbors = adjacencyList.get(nodeId) || [];
                neighbors.forEach(neighbor => {
                    if (!localVisited.has(neighbor)) {
                        queue.push({ nodeId: neighbor, depth: depth + 1 });
                    }
                });
            }
            return localMaxDepth;
        };
        // Try BFS from each unvisited node to handle disconnected components
        adjacencyList.forEach((_, nodeId) => {
            if (!visited.has(nodeId)) {
                const depth = bfs(nodeId);
                maxDepth = Math.max(maxDepth, depth);
                visited.add(nodeId);
            }
        });
        return maxDepth;
    }
    /**
     * Estimates cycle count using a simplified approach
     */
    estimateCycleCount(adjacencyList) {
        let cycleCount = 0;
        const visited = new Set();
        const recursionStack = new Set();
        const dfs = (nodeId) => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            const neighbors = adjacencyList.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    dfs(neighbor);
                }
                else if (recursionStack.has(neighbor)) {
                    cycleCount++;
                }
            }
            recursionStack.delete(nodeId);
        };
        adjacencyList.forEach((_, nodeId) => {
            if (!visited.has(nodeId)) {
                dfs(nodeId);
            }
        });
        return cycleCount;
    }
    /**
     * Optimizes the compiled graph for specific execution patterns
     */
    optimizeForExecution(graph, mode = 'balanced') {
        const optimizedGraph = (0, lodash_1.cloneDeep)(graph);
        switch (mode) {
            case 'speed':
                this.optimizeForSpeed(optimizedGraph);
                break;
            case 'memory':
                this.optimizeForMemory(optimizedGraph);
                break;
            case 'balanced':
                this.optimizeBalanced(optimizedGraph);
                break;
        }
        return optimizedGraph;
    }
    /**
     * Speed optimizations: pre-compute frequently accessed data
     */
    optimizeForSpeed(graph) {
        // Pre-sort adjacency lists by relation strength
        graph.adjacencyList.forEach((targets, sourceId) => {
            const targetData = targets.map(targetId => {
                const relation = Array.from(graph.relations.values())
                    .find(r => r.source === sourceId && r.target === targetId);
                return { targetId, strength: relation?.strength || 1.0 };
            });
            targetData.sort((a, b) => b.strength - a.strength);
            graph.adjacencyList.set(sourceId, targetData.map(t => t.targetId));
        });
        // Add optimization metadata
        graph.extensions.optimization = {
            type: 'speed',
            applied: true,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Memory optimizations: reduce redundant data storage
     */
    optimizeForMemory(graph) {
        // Remove optional fields with default values to save memory
        graph.nodes.forEach(node => {
            if (node.data.confidence === 1.0)
                delete node.data.confidence;
            if (node.data.weight === 1.0)
                delete node.data.weight;
            if (node.data.state === 'active')
                delete node.data.state;
        });
        graph.relations.forEach(relation => {
            if (relation.strength === 1.0)
                delete relation.strength;
            if (relation.bidirectional === false)
                delete relation.bidirectional;
        });
        // Add optimization metadata
        graph.extensions.optimization = {
            type: 'memory',
            applied: true,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * Balanced optimizations: compromise between speed and memory
     */
    optimizeBalanced(graph) {
        // Apply selective optimizations
        this.optimizeForSpeed(graph);
        // Keep only essential default values
        graph.nodes.forEach(node => {
            if (node.data.confidence === 1.0 &&
                node.type !== 'condition' &&
                node.type !== 'formula') {
                delete node.data.confidence;
            }
        });
        // Update optimization metadata
        graph.extensions.optimization = {
            type: 'balanced',
            applied: true,
            timestamp: new Date().toISOString()
        };
    }
}
exports.FormCompiler = FormCompiler;
//# sourceMappingURL=FormCompiler.js.map