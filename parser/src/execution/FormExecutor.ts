import { 
  FormGraph, 
  FormNode, 
  FormRelation, 
  ExecutionResult, 
  ExecutionStep, 
  ExecutionMetrics, 
  ExecutionError,
  ExecutionConfig,
  FormulaContext,
  FormulaResult,
  NodeState
} from '../types/FormTypes';

/**
 * Core execution engine for .form cognitive workflows
 * Supports sequential, parallel, and adaptive execution modes
 */
export class FormExecutor {
  private executionState: Map<string, any>;
  private executionTrace: ExecutionStep[];
  private errors: ExecutionError[];
  private startTime: number;
  private currentIteration: number;
  private formulaEvaluator: FormulaEvaluator;

  constructor() {
    this.executionState = new Map();
    this.executionTrace = [];
    this.errors = [];
    this.startTime = 0;
    this.currentIteration = 0;
    this.formulaEvaluator = new FormulaEvaluator();
  }

  /**
   * Execute a compiled form graph with given inputs and configuration
   */
  async execute(
    graph: FormGraph, 
    inputs: Record<string, any> = {},
    config?: Partial<ExecutionConfig>
  ): Promise<ExecutionResult> {
    // Initialize execution state
    this.initializeExecution(graph, inputs, config);

    try {
      // Choose execution strategy based on mode
      const mode = config?.mode || graph.execution.mode || 'adaptive';
      
      switch (mode) {
        case 'sequential':
          await this.executeSequential(graph);
          break;
        case 'parallel':
          await this.executeParallel(graph);
          break;
        case 'adaptive':
          await this.executeAdaptive(graph);
          break;
        default:
          throw new Error(`Unknown execution mode: ${mode}`);
      }

      return this.buildExecutionResult(true);
    } catch (error) {
      this.addError('execution_error', error.message, Date.now());
      return this.buildExecutionResult(false);
    }
  }

  /**
   * Initialize execution state with inputs and reset tracking variables
   */
  private initializeExecution(
    graph: FormGraph, 
    inputs: Record<string, any>,
    config?: Partial<ExecutionConfig>
  ): void {
    this.startTime = Date.now();
    this.currentIteration = 0;
    this.executionState.clear();
    this.executionTrace = [];
    this.errors = [];

    // Set initial state from inputs
    Object.entries(inputs).forEach(([nodeId, value]) => {
      this.executionState.set(nodeId, value);
      this.addExecutionStep(nodeId, 'evaluate', value, value, 0);
    });

    // Initialize all nodes to their default states
    graph.nodes.forEach((node, nodeId) => {
      if (!this.executionState.has(nodeId)) {
        const initialValue = this.getInitialNodeValue(node);
        this.executionState.set(nodeId, initialValue);
      }
    });
  }

  /**
   * Sequential execution: processes nodes one by one in dependency order
   */
  private async executeSequential(graph: FormGraph): Promise<void> {
    const maxIterations = graph.execution.max_iterations || 1000;
    const timeout = graph.execution.timeout || 30000;
    const startTime = Date.now();

    let hasChanges = true;
    
    while (hasChanges && this.currentIteration < maxIterations) {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error(`Execution timeout after ${timeout}ms`);
      }

      hasChanges = false;
      this.currentIteration++;

      // Process nodes in topological order when possible
      const processingOrder = this.getProcessingOrder(graph);
      
      for (const nodeId of processingOrder) {
        const node = graph.nodes.get(nodeId);
        if (!node) continue;

        const stepStartTime = Date.now();
        const previousValue = this.executionState.get(nodeId);
        
        try {
          const newValue = await this.evaluateNode(node, graph);
          const stepDuration = Date.now() - stepStartTime;

          if (!this.valuesEqual(previousValue, newValue)) {
            this.executionState.set(nodeId, newValue);
            this.addExecutionStep(nodeId, 'execute', previousValue, newValue, stepDuration);
            hasChanges = true;

            // Update node state
            this.updateNodeState(node, 'completed');
          }
        } catch (error) {
          this.addError('node_execution', error.message, Date.now(), nodeId);
          this.updateNodeState(node, 'failed');
        }
      }
    }

    if (this.currentIteration >= maxIterations) {
      throw new Error(`Maximum iterations (${maxIterations}) exceeded`);
    }
  }

  /**
   * Parallel execution: processes independent nodes concurrently
   */
  private async executeParallel(graph: FormGraph): Promise<void> {
    const maxIterations = graph.execution.max_iterations || 1000;
    const timeout = graph.execution.timeout || 30000;
    const startTime = Date.now();

    let hasChanges = true;
    
    while (hasChanges && this.currentIteration < maxIterations) {
      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error(`Execution timeout after ${timeout}ms`);
      }

      hasChanges = false;
      this.currentIteration++;

      // Group nodes by dependency level for parallel processing
      const dependencyLevels = this.groupNodesByDependencyLevel(graph);
      
      for (const levelNodes of dependencyLevels) {
        // Process nodes at the same dependency level in parallel
        const promises = levelNodes.map(async (nodeId) => {
          const node = graph.nodes.get(nodeId);
          if (!node) return { nodeId, success: false, value: null };

          const stepStartTime = Date.now();
          const previousValue = this.executionState.get(nodeId);
          
          try {
            const newValue = await this.evaluateNode(node, graph);
            const stepDuration = Date.now() - stepStartTime;
            
            return {
              nodeId,
              success: true,
              previousValue,
              newValue,
              stepDuration,
              hasChange: !this.valuesEqual(previousValue, newValue)
            };
          } catch (error) {
            this.addError('node_execution', error.message, Date.now(), nodeId);
            this.updateNodeState(node, 'failed');
            return { nodeId, success: false, error };
          }
        });

        // Wait for all nodes at this level to complete
        const results = await Promise.all(promises);
        
        // Apply results and track changes
        results.forEach(result => {
          if (result.success && result.hasChange) {
            this.executionState.set(result.nodeId, result.newValue);
            this.addExecutionStep(
              result.nodeId, 
              'execute', 
              result.previousValue, 
              result.newValue, 
              result.stepDuration
            );
            hasChanges = true;

            const node = graph.nodes.get(result.nodeId);
            if (node) this.updateNodeState(node, 'completed');
          }
        });
      }
    }

    if (this.currentIteration >= maxIterations) {
      throw new Error(`Maximum iterations (${maxIterations}) exceeded`);
    }
  }

  /**
   * Adaptive execution: intelligently chooses between sequential and parallel
   * based on graph structure and current state
   */
  private async executeAdaptive(graph: FormGraph): Promise<void> {
    const complexity = graph.extensions?.compilation?.complexity;
    const nodeCount = graph.nodes.size;
    
    // Use heuristics to choose execution strategy
    if (nodeCount < 10 || (complexity?.avgBranching || 0) < 2) {
      // Small or linear graphs: use sequential
      await this.executeSequential(graph);
    } else if ((complexity?.cycleCount || 0) === 0 && nodeCount > 20) {
      // Large acyclic graphs: use parallel
      await this.executeParallel(graph);
    } else {
      // Complex graphs with cycles: use hybrid approach
      await this.executeHybrid(graph);
    }
  }

  /**
   * Hybrid execution: combines sequential and parallel strategies
   */
  private async executeHybrid(graph: FormGraph): Promise<void> {
    const maxIterations = graph.execution.max_iterations || 1000;
    const timeout = graph.execution.timeout || 30000;
    const startTime = Date.now();

    let hasChanges = true;
    
    while (hasChanges && this.currentIteration < maxIterations) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Execution timeout after ${timeout}ms`);
      }

      hasChanges = false;
      this.currentIteration++;

      // Identify strongly connected components for cycle handling
      const components = this.findStronglyConnectedComponents(graph);
      
      for (const component of components) {
        if (component.length === 1) {
          // Single node: process normally
          const nodeId = component[0];
          hasChanges = await this.processNode(nodeId, graph) || hasChanges;
        } else {
          // Cycle: use iterative sequential processing
          hasChanges = await this.processCycle(component, graph) || hasChanges;
        }
      }
    }

    if (this.currentIteration >= maxIterations) {
      throw new Error(`Maximum iterations (${maxIterations}) exceeded`);
    }
  }

  /**
   * Evaluate a single node based on its type and current state
   */
  private async evaluateNode(node: FormNode, graph: FormGraph): Promise<any> {
    const currentValue = this.executionState.get(node.id);
    
    switch (node.type) {
      case 'concept':
        return this.evaluateConcept(node, graph);
      
      case 'condition':
        return this.evaluateCondition(node, graph);
      
      case 'action':
        return this.evaluateAction(node, graph);
      
      case 'event':
        return this.evaluateEvent(node, graph);
      
      case 'formula':
        return this.evaluateFormula(node, graph);
      
      case 'custom':
        return this.evaluateCustomNode(node, graph);
      
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Evaluate concept nodes (knowledge/belief nodes)
   */
  private evaluateConcept(node: FormNode, graph: FormGraph): any {
    // Concepts typically aggregate input from related nodes
    const incomingNodes = graph.reverseAdjacencyList.get(node.id) || [];
    
    if (incomingNodes.length === 0) {
      // No inputs: use node's data value or maintain current state
      return node.data.value !== undefined ? node.data.value : this.executionState.get(node.id);
    }

    // Weighted aggregation of incoming values
    let totalWeight = 0;
    let weightedSum = 0;
    
    incomingNodes.forEach(sourceId => {
      const relation = this.findRelation(graph, sourceId, node.id);
      const sourceValue = this.executionState.get(sourceId);
      const weight = relation?.strength || 1.0;
      
      if (typeof sourceValue === 'number') {
        weightedSum += sourceValue * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? weightedSum / totalWeight : this.executionState.get(node.id);
  }

  /**
   * Evaluate condition nodes (logical tests)
   */
  private evaluateCondition(node: FormNode, graph: FormGraph): boolean {
    const parameters = node.data.parameters || {};
    
    // Check if condition has explicit logic
    if (parameters.logic) {
      return this.evaluateLogicExpression(parameters.logic, graph);
    }

    // Default: check if any incoming dependencies are true
    const incomingNodes = graph.reverseAdjacencyList.get(node.id) || [];
    
    if (incomingNodes.length === 0) {
      return Boolean(node.data.value);
    }

    // Evaluate based on relation conditions
    return incomingNodes.some(sourceId => {
      const relation = this.findRelation(graph, sourceId, node.id);
      const sourceValue = this.executionState.get(sourceId);
      
      if (relation?.conditions) {
        return this.evaluateRelationConditions(relation.conditions, sourceValue);
      }
      
      return Boolean(sourceValue);
    });
  }

  /**
   * Evaluate action nodes (executable operations)
   */
  private evaluateAction(node: FormNode, graph: FormGraph): any {
    const parameters = node.data.parameters || {};
    
    // Check prerequisites
    const incomingNodes = graph.reverseAdjacencyList.get(node.id) || [];
    const prerequisitesMet = incomingNodes.every(sourceId => {
      const sourceValue = this.executionState.get(sourceId);
      return Boolean(sourceValue);
    });

    if (!prerequisitesMet) {
      return this.executionState.get(node.id); // Don't execute if prerequisites not met
    }

    // Execute action based on parameters
    if (parameters.operation) {
      return this.executeOperation(parameters.operation, parameters, graph);
    }

    // Default: mark as executed
    return true;
  }

  /**
   * Evaluate event nodes (triggers/signals)
   */
  private evaluateEvent(node: FormNode, graph: FormGraph): any {
    const parameters = node.data.parameters || {};
    
    // Events can be time-based or state-based triggers
    if (parameters.triggerType === 'time') {
      return this.evaluateTimeTrigger(parameters);
    } else if (parameters.triggerType === 'state') {
      return this.evaluateStateTrigger(parameters, graph);
    }

    // Default: maintain current state unless explicitly triggered
    return this.executionState.get(node.id);
  }

  /**
   * Evaluate formula nodes (computational expressions)
   */
  private async evaluateFormula(node: FormNode, graph: FormGraph): Promise<any> {
    const parameters = node.data.parameters || {};
    const formula = parameters.expression || parameters.formula;
    
    if (!formula) {
      throw new Error(`Formula node ${node.id} missing expression`);
    }

    // Prepare formula context with current state
    const context: FormulaContext = {
      variables: this.buildVariableContext(node, graph),
      functions: this.getBuiltinFunctions(),
      sandbox: {
        allowedFunctions: parameters.allowedFunctions || [],
        timeoutMs: parameters.timeout || 5000,
        memoryLimitMb: parameters.memoryLimit || 10
      }
    };

    const result = await this.formulaEvaluator.evaluate(formula, context);
    
    if (!result.success) {
      throw new Error(`Formula evaluation failed: ${result.error}`);
    }

    return result.value;
  }

  /**
   * Evaluate custom node types through extension system
   */
  private evaluateCustomNode(node: FormNode, graph: FormGraph): any {
    const customType = node.custom_type || 'unknown';
    
    // Look for custom evaluators in extensions
    const extensions = graph.extensions || {};
    const customEvaluators = extensions.customEvaluators || {};
    
    if (customEvaluators[customType]) {
      return customEvaluators[customType](node, graph, this.executionState);
    }

    // Default: maintain current state
    return this.executionState.get(node.id);
  }

  /**
   * Helper methods for execution support
   */
  
  private getInitialNodeValue(node: FormNode): any {
    if (node.data.value !== undefined) {
      return node.data.value;
    }
    
    switch (node.type) {
      case 'concept': return 0;
      case 'condition': return false;
      case 'action': return false;
      case 'event': return false;
      case 'formula': return null;
      default: return null;
    }
  }

  private getProcessingOrder(graph: FormGraph): string[] {
    // Simple topological sort for processing order
    const visited = new Set<string>();
    const result: string[] = [];
    
    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const dependencies = graph.reverseAdjacencyList.get(nodeId) || [];
      dependencies.forEach(depId => dfs(depId));
      
      result.push(nodeId);
    };
    
    graph.nodes.forEach((_, nodeId) => dfs(nodeId));
    return result;
  }

  private groupNodesByDependencyLevel(graph: FormGraph): string[][] {
    const levels: string[][] = [];
    const visited = new Set<string>();
    
    // Find nodes with no dependencies (level 0)
    const level0 = Array.from(graph.nodes.keys()).filter(nodeId => 
      !graph.reverseAdjacencyList.has(nodeId) || 
      (graph.reverseAdjacencyList.get(nodeId) || []).length === 0
    );
    
    if (level0.length > 0) {
      levels.push(level0);
      level0.forEach(nodeId => visited.add(nodeId));
    }
    
    // Build subsequent levels
    let currentLevel = 0;
    while (visited.size < graph.nodes.size && currentLevel < 100) {
      const nextLevel: string[] = [];
      
      graph.nodes.forEach((_, nodeId) => {
        if (visited.has(nodeId)) return;
        
        const dependencies = graph.reverseAdjacencyList.get(nodeId) || [];
        const allDepsSatisfied = dependencies.every(depId => visited.has(depId));
        
        if (allDepsSatisfied) {
          nextLevel.push(nodeId);
        }
      });
      
      if (nextLevel.length > 0) {
        levels.push(nextLevel);
        nextLevel.forEach(nodeId => visited.add(nodeId));
      }
      
      currentLevel++;
    }
    
    return levels;
  }

  private async processNode(nodeId: string, graph: FormGraph): Promise<boolean> {
    const node = graph.nodes.get(nodeId);
    if (!node) return false;

    const stepStartTime = Date.now();
    const previousValue = this.executionState.get(nodeId);
    
    try {
      const newValue = await this.evaluateNode(node, graph);
      const stepDuration = Date.now() - stepStartTime;
      
      if (!this.valuesEqual(previousValue, newValue)) {
        this.executionState.set(nodeId, newValue);
        this.addExecutionStep(nodeId, 'execute', previousValue, newValue, stepDuration);
        this.updateNodeState(node, 'completed');
        return true;
      }
    } catch (error) {
      this.addError('node_execution', error.message, Date.now(), nodeId);
      this.updateNodeState(node, 'failed');
    }
    
    return false;
  }

  private async processCycle(nodeIds: string[], graph: FormGraph): Promise<boolean> {
    let hasChanges = false;
    const maxCycleIterations = 10;
    
    for (let i = 0; i < maxCycleIterations; i++) {
      let cycleChanges = false;
      
      for (const nodeId of nodeIds) {
        const changed = await this.processNode(nodeId, graph);
        cycleChanges = cycleChanges || changed;
      }
      
      hasChanges = hasChanges || cycleChanges;
      
      if (!cycleChanges) break; // Converged
    }
    
    return hasChanges;
  }

  private findStronglyConnectedComponents(graph: FormGraph): string[][] {
    // Simplified SCC detection - returns each node as its own component for now
    // In production, implement Tarjan's or Kosaraju's algorithm
    return Array.from(graph.nodes.keys()).map(nodeId => [nodeId]);
  }

  private findRelation(graph: FormGraph, sourceId: string, targetId: string): FormRelation | undefined {
    return Array.from(graph.relations.values()).find(r => 
      r.source === sourceId && r.target === targetId
    );
  }

  private evaluateLogicExpression(logic: string, graph: FormGraph): boolean {
    // Simple logic evaluation - in production, use a proper expression parser
    try {
      // Replace node references with actual values
      let expression = logic;
      graph.nodes.forEach((_, nodeId) => {
        const value = this.executionState.get(nodeId);
        expression = expression.replace(new RegExp(`\\b${nodeId}\\b`, 'g'), String(Boolean(value)));
      });
      
      // Basic safety check and evaluation
      if (!/^[true|false|&|\||!|\(|\)\s]+$/.test(expression)) {
        throw new Error('Invalid logic expression');
      }
      
      return new Function(`return ${expression}`)();
    } catch (error) {
      return false;
    }
  }

  private evaluateRelationConditions(conditions: any[], value: any): boolean {
    return conditions.every(condition => {
      switch (condition.operator) {
        case 'eq': return value === condition.value;
        case 'neq': return value !== condition.value;
        case 'gt': return value > condition.value;
        case 'lt': return value < condition.value;
        case 'gte': return value >= condition.value;
        case 'lte': return value <= condition.value;
        case 'contains': return String(value).includes(String(condition.value));
        default: return false;
      }
    });
  }

  private executeOperation(operation: string, parameters: any, graph: FormGraph): any {
    // Basic operation execution - extend as needed
    switch (operation) {
      case 'sum':
        return this.sumInputs(parameters, graph);
      case 'multiply':
        return this.multiplyInputs(parameters, graph);
      case 'transform':
        return this.transformValue(parameters);
      default:
        return true;
    }
  }

  private sumInputs(parameters: any, graph: FormGraph): number {
    const inputs = parameters.inputs || [];
    return inputs.reduce((sum: number, nodeId: string) => {
      const value = this.executionState.get(nodeId);
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }

  private multiplyInputs(parameters: any, graph: FormGraph): number {
    const inputs = parameters.inputs || [];
    return inputs.reduce((product: number, nodeId: string) => {
      const value = this.executionState.get(nodeId);
      return product * (typeof value === 'number' ? value : 1);
    }, 1);
  }

  private transformValue(parameters: any): any {
    const transform = parameters.transform;
    const input = parameters.input;
    
    // Simple transformations
    switch (transform) {
      case 'negate': return !input;
      case 'double': return input * 2;
      case 'increment': return input + 1;
      default: return input;
    }
  }

  private evaluateTimeTrigger(parameters: any): boolean {
    const interval = parameters.interval || 1000;
    const lastTrigger = parameters.lastTrigger || 0;
    const now = Date.now();
    
    return (now - lastTrigger) >= interval;
  }

  private evaluateStateTrigger(parameters: any, graph: FormGraph): boolean {
    const watchedNode = parameters.watchedNode;
    const triggerValue = parameters.triggerValue;
    
    if (!watchedNode) return false;
    
    const currentValue = this.executionState.get(watchedNode);
    return currentValue === triggerValue;
  }

  private buildVariableContext(node: FormNode, graph: FormGraph): Record<string, any> {
    const context: Record<string, any> = {};
    
    // Add current node state
    context[node.id] = this.executionState.get(node.id);
    
    // Add dependency values
    const dependencies = graph.reverseAdjacencyList.get(node.id) || [];
    dependencies.forEach(depId => {
      context[depId] = this.executionState.get(depId);
    });
    
    return context;
  }

  private getBuiltinFunctions(): Record<string, Function> {
    return {
      Math: Math,
      abs: Math.abs,
      max: Math.max,
      min: Math.min,
      sqrt: Math.sqrt,
      pow: Math.pow,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      log: Math.log,
      exp: Math.exp,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round
    };
  }

  private valuesEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a === 'object' && a !== null && b !== null) {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    return false;
  }

  private updateNodeState(node: FormNode, state: NodeState): void {
    node.data.state = state;
  }

  private addExecutionStep(
    nodeId: string, 
    action: 'evaluate' | 'execute' | 'trigger' | 'complete',
    inputState: any, 
    outputState: any, 
    duration: number
  ): void {
    this.executionTrace.push({
      stepNumber: this.executionTrace.length + 1,
      nodeId,
      action,
      timestamp: Date.now(),
      inputState,
      outputState,
      duration
    });
  }

  private addError(
    type: 'timeout' | 'infinite_loop' | 'formula_error' | 'condition_error' | 'extension_error' | 'execution_error' | 'node_execution',
    message: string,
    timestamp: number,
    nodeId?: string
  ): void {
    this.errors.push({
      type: type as any,
      message,
      nodeId,
      timestamp
    });
  }

  private buildExecutionResult(success: boolean): ExecutionResult {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    const metrics: ExecutionMetrics = {
      totalDuration,
      nodesExecuted: new Set(this.executionTrace.map(step => step.nodeId)).size,
      iterationsCompleted: this.currentIteration,
      memoryUsed: this.estimateMemoryUsage(),
      formulasEvaluated: this.executionTrace.filter(step => step.action === 'evaluate').length
    };

    return {
      success,
      finalState: new Map(this.executionState),
      executionTrace: [...this.executionTrace],
      metrics,
      errors: success ? undefined : [...this.errors]
    };
  }

  private estimateMemoryUsage(): number {
    // Rough memory estimation in bytes
    let size = 0;
    this.executionState.forEach((value, key) => {
      size += key.length * 2; // String keys
      size += JSON.stringify(value).length * 2; // Values
    });
    return size;
  }
}

/**
 * Formula evaluator with sandboxing for secure expression evaluation
 */
class FormulaEvaluator {
  async evaluate(expression: string, context: FormulaContext): Promise<FormulaResult> {
    const startTime = Date.now();
    let memoryUsed = 0;
    
    try {
      // Create sandboxed evaluation context
      const sandboxedContext = this.createSandbox(context);
      
      // Simple expression evaluation (in production, use a proper parser like mathjs)
      const result = this.evaluateExpression(expression, sandboxedContext);
      
      const executionTime = Date.now() - startTime;
      memoryUsed = JSON.stringify(result).length * 2;
      
      // Check limits
      if (executionTime > context.sandbox.timeoutMs) {
        throw new Error(`Formula execution timeout: ${executionTime}ms > ${context.sandbox.timeoutMs}ms`);
      }
      
      if (memoryUsed > context.sandbox.memoryLimitMb * 1024 * 1024) {
        throw new Error(`Formula memory limit exceeded: ${memoryUsed} bytes`);
      }
      
      return {
        value: result,
        success: true,
        executionTime,
        memoryUsed
      };
    } catch (error) {
      return {
        value: null,
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        memoryUsed
      };
    }
  }

  private createSandbox(context: FormulaContext): any {
    // Create a restricted context for formula evaluation
    return {
      ...context.variables,
      ...context.functions,
      // Add built-in safe functions
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      String,
      Number,
      Boolean,
      Array,
      Object
    };
  }

  private evaluateExpression(expression: string, context: any): any {
    // Security check - only allow safe expressions
    const safePattern = /^[a-zA-Z0-9_\s\+\-\*\/\(\)\.\,\[\]]+$/;
    if (!safePattern.test(expression)) {
      throw new Error('Unsafe expression detected');
    }
    
    // Create function with restricted scope
    const keys = Object.keys(context);
    const values = keys.map(key => context[key]);
    
    try {
      const func = new Function(...keys, `return ${expression}`);
      return func(...values);
    } catch (error) {
      throw new Error(`Expression evaluation failed: ${error.message}`);
    }
  }
}
