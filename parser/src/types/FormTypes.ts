/**
 * TypeScript type definitions for .form cognitive model files
 * Generated from the JSON schema specification
 */

// Core metadata interface
export interface FormMetadata {
  id: string;
  name: string;
  description?: string;
  version: string;
  created_at: string;
  updated_at: string;
  author?: string;
  tags?: string[];
  dependencies?: FormDependency[];
  extensions?: Record<string, any>;
}

export interface FormDependency {
  id: string;
  version: string;
}

// Node type definitions
export type NodeType = 'concept' | 'condition' | 'action' | 'event' | 'formula' | 'custom';
export type NodeState = 'active' | 'inactive' | 'pending' | 'completed' | 'failed';

export interface FormNode {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  data: NodeData;
  position?: Position;
  custom_type?: string;
  extensions?: Record<string, any>;
}

export interface NodeData {
  value?: any;
  confidence?: number;
  weight?: number;
  parameters?: Record<string, any>;
  state?: NodeState;
}

export interface Position {
  x: number;
  y: number;
}

// Relation type definitions
export type RelationType = 'causes' | 'triggers' | 'blocks' | 'contains' | 'depends_on' | 'influences' | 'custom';
export type ConditionOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';

export interface FormRelation {
  id: string;
  type: RelationType;
  source: string;
  target: string;
  label?: string;
  strength?: number;
  bidirectional?: boolean;
  conditions?: RelationCondition[];
  custom_type?: string;
  extensions?: Record<string, any>;
}

export interface RelationCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
}

// Execution configuration
export type ExecutionMode = 'sequential' | 'parallel' | 'adaptive';

export interface ExecutionConfig {
  entry_points?: string[];
  exit_points?: string[];
  max_iterations?: number;
  timeout?: number;
  mode?: ExecutionMode;
}

// Main form structure
export interface FormFile {
  metadata: FormMetadata;
  nodes: FormNode[];
  relations: FormRelation[];
  execution?: ExecutionConfig;
  extensions?: Record<string, any>;
}

// Internal representation types for execution
export interface FormGraph {
  metadata: FormMetadata;
  nodes: Map<string, FormNode>;
  relations: Map<string, FormRelation>;
  adjacencyList: Map<string, string[]>;
  reverseAdjacencyList: Map<string, string[]>;
  execution: ExecutionConfig;
  extensions: Record<string, any>;
}

// Validation result types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: {
    nodeCount: number;
    relationCount: number;
    entryPoints: string[];
    exitPoints: string[];
  };
}

export interface ValidationError {
  type: 'schema' | 'reference' | 'cycle' | 'logic';
  message: string;
  path?: string;
  severity: 'error' | 'warning';
  nodeId?: string;
  relationId?: string;
}

export interface ValidationWarning {
  type: 'performance' | 'best_practice' | 'compatibility';
  message: string;
  path?: string;
  suggestion?: string;
}

// Execution result types
export interface ExecutionResult {
  success: boolean;
  finalState: Map<string, any>;
  executionTrace: ExecutionStep[];
  metrics: ExecutionMetrics;
  errors?: ExecutionError[];
}

export interface ExecutionStep {
  stepNumber: number;
  nodeId: string;
  action: 'evaluate' | 'execute' | 'trigger' | 'complete';
  timestamp: number;
  inputState: any;
  outputState: any;
  duration: number;
}

export interface ExecutionMetrics {
  totalDuration: number;
  nodesExecuted: number;
  iterationsCompleted: number;
  memoryUsed: number;
  formulasEvaluated: number;
}

export interface ExecutionError {
  type: 'timeout' | 'infinite_loop' | 'formula_error' | 'condition_error' | 'extension_error';
  message: string;
  nodeId?: string;
  timestamp: number;
  stack?: string;
}

// Extension types
export interface ExtensionHook {
  type: 'pre_execute' | 'post_execute' | 'node_execute' | 'formula_evaluate';
  handler: (context: ExtensionContext) => Promise<any>;
}

export interface ExtensionContext {
  formGraph: FormGraph;
  currentNode?: FormNode;
  executionState: Map<string, any>;
  metadata: Record<string, any>;
}

// Formula evaluation types
export interface FormulaContext {
  variables: Record<string, any>;
  functions: Record<string, Function>;
  sandbox: {
    allowedFunctions: string[];
    timeoutMs: number;
    memoryLimitMb: number;
  };
}

export interface FormulaResult {
  value: any;
  success: boolean;
  error?: string;
  executionTime: number;
  memoryUsed: number;
}