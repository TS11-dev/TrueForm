/**
 * JSON Schema definition for .form cognitive model files
 * Used by AJV validator for comprehensive validation
 */
export declare const FormSchema: {
    readonly $schema: "http://json-schema.org/draft-07/schema#";
    readonly title: ".form Cognitive Model Schema";
    readonly description: "Schema for .form files - structured cognitive models for AI reasoning";
    readonly type: "object";
    readonly required: readonly ["metadata", "nodes", "relations"];
    readonly properties: {
        readonly metadata: {
            readonly type: "object";
            readonly required: readonly ["id", "name", "version", "created_at", "updated_at"];
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly pattern: "^[a-zA-Z0-9_-]+$";
                    readonly description: "Unique identifier for this .form file";
                };
                readonly name: {
                    readonly type: "string";
                    readonly description: "Human-readable name of the cognitive model";
                };
                readonly description: {
                    readonly type: "string";
                    readonly description: "Optional description of the model's purpose";
                };
                readonly version: {
                    readonly type: "string";
                    readonly pattern: "^\\d+\\.\\d+\\.\\d+$";
                    readonly description: "Semantic version (e.g., 1.0.0)";
                };
                readonly created_at: {
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly description: "ISO 8601 timestamp of creation";
                };
                readonly updated_at: {
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly description: "ISO 8601 timestamp of last update";
                };
                readonly author: {
                    readonly type: "string";
                    readonly description: "Creator of this cognitive model";
                };
                readonly tags: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly description: "Categorization tags";
                };
                readonly dependencies: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly required: readonly ["id", "version"];
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly version: {
                                readonly type: "string";
                            };
                        };
                        readonly additionalProperties: false;
                    };
                    readonly description: "Other .form files this model depends on";
                };
                readonly extensions: {
                    readonly type: "object";
                    readonly description: "Custom metadata fields for extensibility";
                };
            };
            readonly additionalProperties: false;
        };
        readonly nodes: {
            readonly type: "array";
            readonly minItems: 1;
            readonly items: {
                readonly type: "object";
                readonly required: readonly ["id", "type", "label"];
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                        readonly pattern: "^[a-zA-Z0-9_-]+$";
                        readonly description: "Unique node identifier within this .form";
                    };
                    readonly type: {
                        readonly type: "string";
                        readonly enum: readonly ["concept", "condition", "action", "event", "formula", "custom"];
                        readonly description: "Node type defining its cognitive role";
                    };
                    readonly label: {
                        readonly type: "string";
                        readonly description: "Human-readable node name";
                    };
                    readonly description: {
                        readonly type: "string";
                        readonly description: "Detailed description of the node";
                    };
                    readonly data: {
                        readonly type: "object";
                        readonly description: "Type-specific data payload";
                        readonly properties: {
                            readonly value: {
                                readonly description: "Primary value or content";
                            };
                            readonly confidence: {
                                readonly type: "number";
                                readonly minimum: 0;
                                readonly maximum: 1;
                                readonly description: "Confidence score for this node";
                            };
                            readonly weight: {
                                readonly type: "number";
                                readonly description: "Importance weight in reasoning";
                            };
                            readonly parameters: {
                                readonly type: "object";
                                readonly description: "Type-specific parameters";
                            };
                            readonly state: {
                                readonly type: "string";
                                readonly enum: readonly ["active", "inactive", "pending", "completed", "failed"];
                                readonly default: "active";
                                readonly description: "Current execution state";
                            };
                        };
                        readonly additionalProperties: false;
                    };
                    readonly position: {
                        readonly type: "object";
                        readonly properties: {
                            readonly x: {
                                readonly type: "number";
                            };
                            readonly y: {
                                readonly type: "number";
                            };
                        };
                        readonly required: readonly ["x", "y"];
                        readonly additionalProperties: false;
                        readonly description: "Visual positioning for graph layout";
                    };
                    readonly custom_type: {
                        readonly type: "string";
                        readonly description: "Custom node type when type='custom'";
                    };
                    readonly extensions: {
                        readonly type: "object";
                        readonly description: "Custom node fields for extensibility";
                    };
                };
                readonly additionalProperties: false;
            };
        };
        readonly relations: {
            readonly type: "array";
            readonly items: {
                readonly type: "object";
                readonly required: readonly ["id", "type", "source", "target"];
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                        readonly pattern: "^[a-zA-Z0-9_-]+$";
                        readonly description: "Unique relation identifier";
                    };
                    readonly type: {
                        readonly type: "string";
                        readonly enum: readonly ["causes", "triggers", "blocks", "contains", "depends_on", "influences", "custom"];
                        readonly description: "Relation type defining semantic connection";
                    };
                    readonly source: {
                        readonly type: "string";
                        readonly description: "Source node ID";
                    };
                    readonly target: {
                        readonly type: "string";
                        readonly description: "Target node ID";
                    };
                    readonly label: {
                        readonly type: "string";
                        readonly description: "Human-readable relation description";
                    };
                    readonly strength: {
                        readonly type: "number";
                        readonly minimum: 0;
                        readonly maximum: 1;
                        readonly description: "Strength of the relation (0-1)";
                    };
                    readonly bidirectional: {
                        readonly type: "boolean";
                        readonly default: false;
                        readonly description: "Whether relation works in both directions";
                    };
                    readonly conditions: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly required: readonly ["field", "operator", "value"];
                            readonly properties: {
                                readonly field: {
                                    readonly type: "string";
                                    readonly description: "Field path to evaluate";
                                };
                                readonly operator: {
                                    readonly type: "string";
                                    readonly enum: readonly ["eq", "neq", "gt", "lt", "gte", "lte", "contains"];
                                    readonly description: "Comparison operator";
                                };
                                readonly value: {
                                    readonly description: "Comparison value";
                                };
                            };
                            readonly additionalProperties: false;
                        };
                        readonly description: "Conditions that must be met for relation to activate";
                    };
                    readonly custom_type: {
                        readonly type: "string";
                        readonly description: "Custom relation type when type='custom'";
                    };
                    readonly extensions: {
                        readonly type: "object";
                        readonly description: "Custom relation fields for extensibility";
                    };
                };
                readonly additionalProperties: false;
            };
        };
        readonly execution: {
            readonly type: "object";
            readonly description: "Execution configuration and constraints";
            readonly properties: {
                readonly entry_points: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly description: "Node IDs where execution can begin";
                };
                readonly exit_points: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly description: "Node IDs where execution should terminate";
                };
                readonly max_iterations: {
                    readonly type: "integer";
                    readonly minimum: 1;
                    readonly default: 1000;
                    readonly description: "Maximum reasoning iterations to prevent infinite loops";
                };
                readonly timeout: {
                    readonly type: "integer";
                    readonly minimum: 1;
                    readonly description: "Execution timeout in milliseconds";
                };
                readonly mode: {
                    readonly type: "string";
                    readonly enum: readonly ["sequential", "parallel", "adaptive"];
                    readonly default: "adaptive";
                    readonly description: "Execution strategy";
                };
            };
            readonly additionalProperties: false;
        };
        readonly extensions: {
            readonly type: "object";
            readonly description: "Global extensions for custom functionality";
        };
    };
    readonly additionalProperties: false;
};
//# sourceMappingURL=FormSchema.d.ts.map