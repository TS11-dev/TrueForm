// Types for .form file structure based on the schema

export type NodeType = 'concept' | 'condition' | 'action' | 'event' | 'formula' | 'custom';
export type RelationType = 'causes' | 'triggers' | 'blocks' | 'contains' | 'depends_on' | 'influences' | 'custom';
export type NodeState = 'active' | 'inactive' | 'pending' | 'completed' | 'failed';
export type ExecutionMode = 'sequential' | 'parallel' | 'adaptive';

export interface Position {
  x: number;
  y: number;
}

export interface Condition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: any;
}

export interface Dependency {
  id: string;
  version: string;
}

export interface FormMetadata {
  id: string;
  name: string;
  description?: string;
  version: string;
  created_at: string;
  updated_at: string;
  author?: string;
  tags?: string[];
  dependencies?: Dependency[];
  extensions?: Record<string, any>;
}

export interface NodeData {
  value?: any;
  confidence?: number;
  weight?: number;
  parameters?: Record<string, any>;
  state?: NodeState;
}

export interface FormNode {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  data?: NodeData;
  position?: Position;
  custom_type?: string;
  extensions?: Record<string, any>;
}

export interface FormRelation {
  id: string;
  type: RelationType;
  source: string;
  target: string;
  label?: string;
  strength?: number;
  bidirectional?: boolean;
  conditions?: Condition[];
  custom_type?: string;
  extensions?: Record<string, any>;
}

export interface ExecutionConfig {
  entry_points?: string[];
  exit_points?: string[];
  max_iterations?: number;
  timeout?: number;
  mode?: ExecutionMode;
}

export interface FormFile {
  metadata: FormMetadata;
  nodes: FormNode[];
  relations: FormRelation[];
  execution?: ExecutionConfig;
  extensions?: Record<string, any>;
}

// API response types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

export interface CompilationResult {
  success: boolean;
  compiled_form?: FormFile;
  errors?: string[];
  warnings?: string[];
  execution_plan?: ExecutionStep[];
}

export interface ExecutionStep {
  step: number;
  node_id: string;
  action: string;
  dependencies: string[];
  estimated_duration?: number;
}

export interface ExecutionResult {
  success: boolean;
  execution_id: string;
  steps: ExecutionTrace[];
  final_state: Record<string, any>;
  metrics: ExecutionMetrics;
  errors?: string[];
}

export interface ExecutionTrace {
  step: number;
  timestamp: string;
  node_id: string;
  action: string;
  input: any;
  output: any;
  duration: number;
  status: 'started' | 'completed' | 'failed' | 'skipped';
}

export interface ExecutionMetrics {
  total_duration: number;
  nodes_executed: number;
  nodes_skipped: number;
  nodes_failed: number;
  memory_usage?: number;
  cpu_usage?: number;
}

// UI state types
export interface EditorState {
  currentForm: FormFile | null;
  isDirty: boolean;
  isValidating: boolean;
  validationResult: ValidationResult | null;
  selectedNodes: string[];
  selectedRelations: string[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface LibraryState {
  forms: FormFile[];
  searchQuery: string;
  filters: {
    tags: string[];
    author: string;
    dateRange: [Date | null, Date | null];
  };
  sortBy: 'name' | 'created_at' | 'updated_at';
  sortOrder: 'asc' | 'desc';
}

export interface ExecutionState {
  isExecuting: boolean;
  currentExecution: ExecutionResult | null;
  executionHistory: ExecutionResult[];
  parameters: Record<string, any>;
  mode: ExecutionMode;
}
