import { FormFile, FormGraph } from '../types/FormTypes';
/**
 * Compiles validated .form files into optimized internal representation
 * for efficient execution and reasoning
 */
export declare class FormCompiler {
    /**
     * Compiles a validated FormFile into FormGraph internal representation
     */
    compile(formFile: FormFile): FormGraph;
    /**
     * Builds forward and reverse adjacency lists for efficient graph traversal
     */
    private buildAdjacencyLists;
    /**
     * Infers entry points by finding nodes with no incoming dependencies
     */
    private inferEntryPoints;
    /**
     * Infers exit points by finding nodes with no outgoing dependencies
     */
    private inferExitPoints;
    /**
     * Calculates complexity metrics for the compiled graph
     */
    private calculateComplexity;
    /**
     * Calculates maximum depth of the graph using BFS
     */
    private calculateMaxDepth;
    /**
     * Estimates cycle count using a simplified approach
     */
    private estimateCycleCount;
    /**
     * Optimizes the compiled graph for specific execution patterns
     */
    optimizeForExecution(graph: FormGraph, mode?: 'speed' | 'memory' | 'balanced'): FormGraph;
    /**
     * Speed optimizations: pre-compute frequently accessed data
     */
    private optimizeForSpeed;
    /**
     * Memory optimizations: reduce redundant data storage
     */
    private optimizeForMemory;
    /**
     * Balanced optimizations: compromise between speed and memory
     */
    private optimizeBalanced;
}
//# sourceMappingURL=FormCompiler.d.ts.map