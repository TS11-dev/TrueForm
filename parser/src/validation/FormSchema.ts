/**
 * JSON Schema definition for .form cognitive model files
 * Used by AJV validator for comprehensive validation
 */

export const FormSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: ".form Cognitive Model Schema",
  description: "Schema for .form files - structured cognitive models for AI reasoning",
  type: "object",
  required: ["metadata", "nodes", "relations"],
  properties: {
    metadata: {
      type: "object",
      required: ["id", "name", "version", "created_at", "updated_at"],
      properties: {
        id: {
          type: "string",
          pattern: "^[a-zA-Z0-9_-]+$",
          description: "Unique identifier for this .form file"
        },
        name: {
          type: "string",
          description: "Human-readable name of the cognitive model"
        },
        description: {
          type: "string",
          description: "Optional description of the model's purpose"
        },
        version: {
          type: "string",
          pattern: "^\\d+\\.\\d+\\.\\d+$",
          description: "Semantic version (e.g., 1.0.0)"
        },
        created_at: {
          type: "string",
          format: "date-time",
          description: "ISO 8601 timestamp of creation"
        },
        updated_at: {
          type: "string",
          format: "date-time",
          description: "ISO 8601 timestamp of last update"
        },
        author: {
          type: "string",
          description: "Creator of this cognitive model"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Categorization tags"
        },
        dependencies: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "version"],
            properties: {
              id: { type: "string" },
              version: { type: "string" }
            },
            additionalProperties: false
          },
          description: "Other .form files this model depends on"
        },
        extensions: {
          type: "object",
          description: "Custom metadata fields for extensibility"
        }
      },
      additionalProperties: false
    },
    nodes: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["id", "type", "label"],
        properties: {
          id: {
            type: "string",
            pattern: "^[a-zA-Z0-9_-]+$",
            description: "Unique node identifier within this .form"
          },
          type: {
            type: "string",
            enum: ["concept", "condition", "action", "event", "formula", "custom"],
            description: "Node type defining its cognitive role"
          },
          label: {
            type: "string",
            description: "Human-readable node name"
          },
          description: {
            type: "string",
            description: "Detailed description of the node"
          },
          data: {
            type: "object",
            description: "Type-specific data payload",
            properties: {
              value: {
                description: "Primary value or content"
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
                description: "Confidence score for this node"
              },
              weight: {
                type: "number",
                description: "Importance weight in reasoning"
              },
              parameters: {
                type: "object",
                description: "Type-specific parameters"
              },
              state: {
                type: "string",
                enum: ["active", "inactive", "pending", "completed", "failed"],
                default: "active",
                description: "Current execution state"
              }
            },
            additionalProperties: false
          },
          position: {
            type: "object",
            properties: {
              x: { type: "number" },
              y: { type: "number" }
            },
            required: ["x", "y"],
            additionalProperties: false,
            description: "Visual positioning for graph layout"
          },
          custom_type: {
            type: "string",
            description: "Custom node type when type='custom'"
          },
          extensions: {
            type: "object",
            description: "Custom node fields for extensibility"
          }
        },
        additionalProperties: false
      }
    },
    relations: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "type", "source", "target"],
        properties: {
          id: {
            type: "string",
            pattern: "^[a-zA-Z0-9_-]+$",
            description: "Unique relation identifier"
          },
          type: {
            type: "string",
            enum: ["causes", "triggers", "blocks", "contains", "depends_on", "influences", "custom"],
            description: "Relation type defining semantic connection"
          },
          source: {
            type: "string",
            description: "Source node ID"
          },
          target: {
            type: "string",
            description: "Target node ID"
          },
          label: {
            type: "string",
            description: "Human-readable relation description"
          },
          strength: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "Strength of the relation (0-1)"
          },
          bidirectional: {
            type: "boolean",
            default: false,
            description: "Whether relation works in both directions"
          },
          conditions: {
            type: "array",
            items: {
              type: "object",
              required: ["field", "operator", "value"],
              properties: {
                field: { 
                  type: "string",
                  description: "Field path to evaluate"
                },
                operator: { 
                  type: "string", 
                  enum: ["eq", "neq", "gt", "lt", "gte", "lte", "contains"],
                  description: "Comparison operator"
                },
                value: { 
                  description: "Comparison value"
                }
              },
              additionalProperties: false
            },
            description: "Conditions that must be met for relation to activate"
          },
          custom_type: {
            type: "string",
            description: "Custom relation type when type='custom'"
          },
          extensions: {
            type: "object",
            description: "Custom relation fields for extensibility"
          }
        },
        additionalProperties: false
      }
    },
    execution: {
      type: "object",
      description: "Execution configuration and constraints",
      properties: {
        entry_points: {
          type: "array",
          items: { type: "string" },
          description: "Node IDs where execution can begin"
        },
        exit_points: {
          type: "array",
          items: { type: "string" },
          description: "Node IDs where execution should terminate"
        },
        max_iterations: {
          type: "integer",
          minimum: 1,
          default: 1000,
          description: "Maximum reasoning iterations to prevent infinite loops"
        },
        timeout: {
          type: "integer",
          minimum: 1,
          description: "Execution timeout in milliseconds"
        },
        mode: {
          type: "string",
          enum: ["sequential", "parallel", "adaptive"],
          default: "adaptive",
          description: "Execution strategy"
        }
      },
      additionalProperties: false
    },
    extensions: {
      type: "object",
      description: "Global extensions for custom functionality"
    }
  },
  additionalProperties: false
} as const;