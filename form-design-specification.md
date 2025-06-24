# .form Cognitive Model Design Specification

## Overview

The .form file format is designed to be a universal language for encoding, storing, and executing cognitive models that enable AI agents to reason, learn, and make decisions. The format prioritizes human readability, machine interpretability, and extensibility while maintaining semantic richness.

## Core Design Principles

### 1. **Semantic Clarity**
- Each node and relation has explicit type semantics
- Clear distinction between data, behavior, and structure
- Human-readable labels alongside machine-processable IDs

### 2. **Extensibility by Design**
- Custom node types and relation types supported
- Extension fields at multiple levels (global, node, relation)
- Dependency system for modular composition

### 3. **AI-First Architecture**
- Confidence scores and weights for probabilistic reasoning
- State management for execution tracking
- Rich metadata for learning and adaptation

### 4. **Version Control Integration**
- Semantic versioning embedded in metadata
- Dependency tracking for model composition
- Timestamp tracking for evolution analysis

## Node Type System

### Core Node Types

#### **Concept**
- Represents knowledge, beliefs, or static information
- Examples: user preferences, domain knowledge, learned patterns
- Typically persistent and slowly changing

#### **Condition** 
- Represents logical tests or decision points
- Evaluates to true/false based on current state
- Can have complex evaluation logic in parameters

#### **Action**
- Represents executable operations or behaviors
- Can modify state, trigger external systems, or generate outputs
- Includes success/failure state tracking

#### **Event**
- Represents triggers, signals, or state changes
- Can be external inputs or internal state transitions
- Often serve as execution entry points

#### **Formula**
- Represents computational logic or mathematical relationships
- Enables complex calculations and transformations
- Supports variable references and mathematical expressions

#### **Custom**
- Extensible node type for domain-specific requirements
- Uses `custom_type` field for specific semantics
- Allows innovation without schema changes

## Relation Type System

### Core Relation Types

#### **causes**
- Strong causal relationship where source directly produces target
- High confidence, typically deterministic
- Example: "rain causes wet ground"

#### **triggers**
- Activation relationship where source initiates target
- Often conditional, may have timing components
- Example: "alarm triggers wake up action"

#### **blocks**
- Inhibitory relationship where source prevents target
- Negative influence, conflict resolution
- Example: "low battery blocks high-performance mode"

#### **contains**
- Compositional relationship for hierarchical structures
- Parent-child or ownership semantics
- Often bidirectional for navigation

#### **depends_on**
- Dependency relationship for execution ordering
- Target requires source to complete first
- Critical for workflow sequencing

#### **influences**
- Soft influence relationship with variable strength
- Probabilistic effect, not deterministic
- Example: "user mood influences activity preference"

## Data Architecture

### Node Data Structure
```json
{
  "value": "Primary content or state",
  "confidence": 0.85,
  "weight": 0.9,
  "parameters": {
    "type_specific": "configuration"
  },
  "state": "active"
}
```

#### **Value Field**
- Flexible type: primitive, object, array
- Stores the primary content or state of the node
- Type interpretation depends on node type

#### **Confidence Score**
- Float between 0-1 representing certainty
- Enables probabilistic reasoning
- Can be updated through learning

#### **Weight**
- Importance factor in reasoning calculations
- Allows priority-based decision making
- Tunable for different problem domains

#### **Parameters**
- Type-specific configuration object
- Extensible without schema changes
- Enables rich behavioral specification

#### **State**
- Execution state tracking
- Standard states: active, inactive, pending, completed, failed
- Enables workflow management and debugging

### Relation Conditions
```json
{
  "conditions": [
    {
      "field": "data.value",
      "operator": "eq", 
      "value": true
    }
  ]
}
```

Enables conditional relation activation based on node state, allowing complex logical dependencies.

## Execution Model

### Entry and Exit Points
- **Entry Points**: Where reasoning/execution begins
- **Exit Points**: Where execution should terminate
- Enables partial execution and focused reasoning

### Execution Modes
- **Sequential**: One step at a time, ordered execution
- **Parallel**: Multiple paths simultaneously 
- **Adaptive**: Dynamic strategy based on current state

### Safety Constraints
- **Max Iterations**: Prevents infinite loops
- **Timeout**: Bounds execution time
- **State Validation**: Ensures consistency

## Extensibility Architecture

### Three-Level Extension System

#### **Global Extensions** (`metadata.extensions`)
- File-level custom metadata
- Domain-specific categorization
- Processing hints for tools

#### **Node Extensions** (`node.extensions`)
- Custom node behaviors
- Tool-specific metadata
- Visualization preferences

#### **Relation Extensions** (`relation.extensions`)
- Custom relation semantics
- Strength modifiers
- Temporal constraints

### Custom Types
- `custom_type` field for new semantics
- Backward compatibility maintained
- Gradual adoption of new types

## Version Control Strategy

### Semantic Versioning
- **Major.Minor.Patch** format
- Major: Breaking changes to schema
- Minor: New features, backward compatible
- Patch: Bug fixes, clarifications

### Dependency Management
```json
{
  "dependencies": [
    {
      "id": "base_knowledge",
      "version": "2.1.0"
    }
  ]
}
```

Enables modular composition and reuse of cognitive models.

## AI Integration Considerations

### Learning Support
- Confidence scores enable uncertainty quantification
- Weight adjustment allows adaptive importance
- State tracking enables learning from execution

### Multi-Agent Coordination
- Node ownership through metadata
- Communication channels via relations
- Shared state through common .form files

### Reasoning Patterns
- Forward chaining: Follow `causes` and `triggers`
- Backward chaining: Trace `depends_on` relations
- Constraint satisfaction: Check conditions and blocks

## Implementation Guidelines

### Parser Requirements
1. **Schema Validation**: Strict adherence to JSON schema
2. **Reference Resolution**: Validate node/relation ID references
3. **Cycle Detection**: Identify potential infinite loops
4. **Type Checking**: Ensure data types match node semantics

### Executor Requirements
1. **State Management**: Track node states throughout execution
2. **Condition Evaluation**: Process complex conditional logic
3. **Parallel Execution**: Handle concurrent reasoning paths
4. **Error Recovery**: Graceful handling of failures

### Editor Requirements
1. **Visual Layout**: Automatic graph positioning
2. **Type Assistance**: Context-aware node/relation suggestions
3. **Validation**: Real-time schema and semantic checking
4. **Export**: Clean JSON generation with proper formatting

## Security and Validation

### Input Sanitization
- Validate all JSON against schema
- Sanitize user inputs in data fields
- Prevent code injection in formula nodes

### Execution Boundaries
- Sandbox formula evaluation
- Limit resource consumption
- Prevent unauthorized external access

### Access Control
- Author attribution for accountability
- Read/write permissions on .form files
- Audit trail for modifications

## Future Evolution

### Planned Extensions
- **Temporal Relations**: Time-based constraints and delays
- **Probabilistic Nodes**: Built-in uncertainty modeling
- **Learning Metadata**: Automatic adaptation tracking
- **Performance Metrics**: Execution profiling and optimization

### Migration Strategy
- Backward compatibility for minor versions
- Migration tools for major version upgrades
- Deprecation warnings for obsolete features

This design specification ensures that .form files can serve as a robust foundation for cognitive computing platforms while remaining flexible enough to evolve with advancing AI capabilities.