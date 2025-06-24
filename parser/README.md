# .form Cognitive Platform Parser

A comprehensive TypeScript parser and compiler for `.form` cognitive model files, enabling structured AI reasoning and decision-making workflows.

## Features

- **Schema Validation**: Comprehensive JSON schema validation with detailed error reporting
- **Graph Compilation**: Optimized internal representation for efficient execution
- **CLI Tools**: Command-line interface for validation, compilation, and analysis
- **Library API**: High-level programmatic interface for integration
- **Analysis Tools**: Complexity analysis, dependency checking, and optimization recommendations
- **Extensibility**: Support for custom node types, relations, and extensions
- **Security**: Sandboxed formula evaluation with configurable policies

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd parser

# Install dependencies
npm install

# Build the project
npm run build
```

## Quick Start

### CLI Usage

```bash
# Validate .form files
npm run validate ../example-decision-workflow.form

# Compile a .form file
npm run compile ../example-decision-workflow.form --output compiled.json --stats

# Analyze a .form file
npm run info ../example-decision-workflow.form --graph

# Test example files
npm run examples
```

### Library Usage

```typescript
import { FormPlatform } from 'form-cognitive-platform';

const platform = new FormPlatform();

// Load and validate a .form file
const result = await platform.loadFile('path/to/model.form');
if (result.valid) {
  console.log('Form is valid!');
  
  // Analyze the form
  const analysis = platform.analyzeForm(result.form);
  console.log(`Complexity: ${analysis.complexity}`);
  
  // Generate a report
  const report = platform.generateReport(result.form);
  console.log(report);
}
```

## .form File Format

The `.form` format enables encoding cognitive models with nodes and relations:

### Basic Structure

```json
{
  "metadata": {
    "id": "my_cognitive_model",
    "name": "My Cognitive Model",
    "version": "1.0.0",
    "created_at": "2025-06-24T17:46:12Z",
    "updated_at": "2025-06-24T17:46:12Z",
    "author": "Your Name"
  },
  "nodes": [
    {
      "id": "input_node",
      "type": "event",
      "label": "Input Event",
      "data": {
        "value": null,
        "confidence": 1.0,
        "weight": 1.0,
        "state": "active"
      }
    }
  ],
  "relations": [
    {
      "id": "input_triggers_analysis",
      "type": "triggers",
      "source": "input_node",
      "target": "analysis_node",
      "strength": 0.9
    }
  ],
  "execution": {
    "entry_points": ["input_node"],
    "max_iterations": 1000,
    "timeout": 30000,
    "mode": "adaptive"
  }
}
```

### Node Types

- **concept**: Knowledge, beliefs, or static information
- **condition**: Logical tests or decision points
- **action**: Executable operations or behaviors
- **event**: Triggers, signals, or state changes
- **formula**: Computational logic or mathematical relationships
- **custom**: Extensible node type for domain-specific requirements

### Relation Types

- **causes**: Strong causal relationship (A directly produces B)
- **triggers**: Activation relationship (A initiates B)
- **blocks**: Inhibitory relationship (A prevents B)
- **contains**: Compositional relationship (A contains B)
- **depends_on**: Dependency relationship (B requires A)
- **influences**: Soft influence (A affects B probabilistically)
- **custom**: Extensible relation type

## CLI Commands

### `validate`

Validates .form files against the schema:

```bash
npm run validate <files...> [options]

Options:
  -v, --verbose     Show detailed validation output
  -w, --warnings    Show warnings in addition to errors
  --json           Output results in JSON format
```

### `compile`

Compiles .form files to optimized internal representation:

```bash
npm run compile <file> [options]

Options:
  -o, --output <file>     Output file for compiled graph
  --optimize <mode>       Optimization mode: speed, memory, balanced
  --stats                 Show compilation statistics
```

### `info`

Shows detailed information about .form files:

```bash
npm run info <file> [options]

Options:
  --graph                 Show graph structure analysis
  --dependencies          Show dependency analysis
```

### `examples`

Validates all example .form files:

```bash
npm run examples [options]

Options:
  --path <dir>           Path to examples directory
```

## API Reference

### FormPlatform

Main API class for working with .form files:

```typescript
class FormPlatform {
  // Load and validate a .form file
  async loadFile(filePath: string): Promise<LoadResult>
  
  // Validate a .form object
  validateForm(form: any): ValidationResult
  
  // Compile a .form to internal representation
  compileForm(form: FormFile, mode?: OptimizationMode): FormGraph
  
  // Analyze a .form file
  analyzeForm(form: FormFile): AnalysisResult
  
  // Generate a markdown report
  generateReport(form: FormFile): string
  
  // Create a new .form template
  createTemplate(id: string, name: string, author?: string): FormFile
  
  // Batch validate multiple files
  async batchValidate(filePaths: string[]): Promise<BatchResult[]>
}
```

### ValidationResult

Result of .form validation:

```typescript
interface ValidationResult {
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
```

### AnalysisResult

Result of .form analysis:

```typescript
interface AnalysisResult {
  complexity: 'low' | 'medium' | 'high';
  nodeTypeDistribution: Record<string, number>;
  relationTypeDistribution: Record<string, number>;
  potentialIssues: string[];
  recommendations: string[];
}
```

## Extension System

The .form format supports extensions at multiple levels:

### Global Extensions

```json
{
  "extensions": {
    "custom_feature": {
      "enabled": true,
      "config": "value"
    }
  }
}
```

### Node Extensions

```json
{
  "nodes": [{
    "id": "example",
    "type": "custom",
    "extensions": {
      "temporal": {
        "type": "periodic_check",
        "interval_ms": 30000
      }
    }
  }]
}
```

### Relation Extensions

```json
{
  "relations": [{
    "id": "example",
    "type": "custom",
    "extensions": {
      "strength_modifiers": {
        "time_decay": 0.1
      }
    }
  }]
}
```

## Security Features

### Formula Sandboxing

Formula nodes are executed in a restricted sandbox:

```json
{
  "nodes": [{
    "type": "formula",
    "data": {
      "value": "math.sqrt(input_value * 2)"
    },
    "extensions": {
      "sandbox": {
        "allowed_functions": ["math.sqrt", "math.pow"],
        "timeout_ms": 1000,
        "memory_limit_mb": 10
      }
    }
  }]
}
```

### Validation Security

- Input sanitization prevents code injection
- Function whitelisting for formula evaluation
- Timeout and memory limits prevent resource exhaustion
- Reference validation prevents invalid node/relation references

## Development

### Building

```bash
npm run build          # Compile TypeScript to JavaScript
npm run dev            # Run in development mode with hot reload
```

### Testing

```bash
npm test               # Run test suite
npm run test:examples  # Test against example files
```

### Development Scripts

```bash
npm run watch          # Watch for changes and rebuild
npm run validate       # Validate specific files
npm run compile        # Compile specific files
```

## Architecture

### Components

- **FormValidator**: JSON schema validation and consistency checking
- **FormCompiler**: Compilation to optimized internal representation
- **FormPlatform**: High-level API for common operations
- **CLI**: Command-line interface for batch operations

### Data Flow

1. **Input**: .form JSON file
2. **Validation**: Schema validation + reference checking
3. **Compilation**: Internal graph representation
4. **Optimization**: Speed/memory/balanced optimizations
5. **Analysis**: Complexity analysis and recommendations

### Internal Representation

Compiled .form files become `FormGraph` objects with:

- **Node Map**: O(1) node lookups by ID
- **Relation Map**: O(1) relation lookups by ID  
- **Adjacency Lists**: Efficient graph traversal
- **Execution Config**: Entry/exit points and constraints
- **Extensions**: Custom functionality and metadata

## Examples

See the parent directory for comprehensive .form examples:

- `example-decision-workflow.form` - Basic decision making
- `example-multi-agent-collaboration.form` - Agent coordination
- `example-adaptive-learning.form` - Learning and adaptation
- `example-constraint-solver.form` - Constraint satisfaction
- `example-hierarchical-composition.form` - Modular architecture
- `example-computational-reasoning.form` - Mathematical modeling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details