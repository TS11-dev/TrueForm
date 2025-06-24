import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { FormFile, ValidationResult, ValidationError, ValidationWarning } from '../types/FormTypes';
import { FormSchema } from './FormSchema';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Comprehensive validator for .form cognitive model files
 * Provides schema validation, reference checking, and logical consistency validation
 */
export class FormValidator {
  private ajv: Ajv;
  private schema: any;

  constructor() {
    this.ajv = new Ajv({ 
      allErrors: true,
      verbose: true,
      strict: false,
      allowUnionTypes: true
    });
    
    // Add format validators for date-time, etc.
    addFormats(this.ajv);
    
    this.schema = FormSchema;
    this.ajv.addSchema(this.schema, 'form-schema');
  }

  /**
   * Validates a .form file from filesystem
   */
  async validateFile(filePath: string): Promise<ValidationResult> {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const formData = JSON.parse(fileContent);
      return this.validate(formData);
    } catch (error) {
      return {
        valid: false,
        errors: [{
          type: 'schema',
          message: `Failed to parse file: ${error.message}`,
          severity: 'error',
          path: filePath
        }],
        warnings: [],
        metadata: {
          nodeCount: 0,
          relationCount: 0,
          entryPoints: [],
          exitPoints: []
        }
      };
    }
  }

  /**
   * Validates a parsed .form object
   */
  validate(formData: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Step 1: JSON Schema validation
    const schemaValid = this.ajv.validate(this.schema, formData);
    if (!schemaValid && this.ajv.errors) {
      errors.push(...this.convertAjvErrors(this.ajv.errors));
    }

    // If schema validation fails, return early
    if (!schemaValid) {
      return {
        valid: false,
        errors,
        warnings,
        metadata: this.extractBasicMetadata(formData)
      };
    }

    const form = formData as FormFile;

    // Step 2: Reference validation
    errors.push(...this.validateReferences(form));

    // Step 3: Logical consistency validation
    errors.push(...this.validateLogicalConsistency(form));

    // Step 4: Best practice warnings
    warnings.push(...this.generateWarnings(form));

    return {
      valid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings,
      metadata: this.extractMetadata(form)
    };
  }

  /**
   * Converts AJV validation errors to our error format
   */
  private convertAjvErrors(ajvErrors: ErrorObject[]): ValidationError[] {
    return ajvErrors.map(error => ({
      type: 'schema',
      message: `${error.instancePath || 'root'}: ${error.message}`,
      path: error.instancePath,
      severity: 'error' as const
    }));
  }

  /**
   * Validates that all node and relation references are valid
   */
  private validateReferences(form: FormFile): ValidationError[] {
    const errors: ValidationError[] = [];
    const nodeIds = new Set(form.nodes.map(node => node.id));

    // Check for duplicate node IDs
    const seenNodeIds = new Set<string>();
    form.nodes.forEach(node => {
      if (seenNodeIds.has(node.id)) {
        errors.push({
          type: 'reference',
          message: `Duplicate node ID: ${node.id}`,
          severity: 'error',
          nodeId: node.id
        });
      }
      seenNodeIds.add(node.id);
    });

    // Check for duplicate relation IDs
    const seenRelationIds = new Set<string>();
    form.relations.forEach(relation => {
      if (seenRelationIds.has(relation.id)) {
        errors.push({
          type: 'reference',
          message: `Duplicate relation ID: ${relation.id}`,
          severity: 'error',
          relationId: relation.id
        });
      }
      seenRelationIds.add(relation.id);
    });

    // Validate relation node references
    form.relations.forEach(relation => {
      if (!nodeIds.has(relation.source)) {
        errors.push({
          type: 'reference',
          message: `Relation ${relation.id} references non-existent source node: ${relation.source}`,
          severity: 'error',
          relationId: relation.id
        });
      }
      if (!nodeIds.has(relation.target)) {
        errors.push({
          type: 'reference',
          message: `Relation ${relation.id} references non-existent target node: ${relation.target}`,
          severity: 'error',
          relationId: relation.id
        });
      }
    });

    // Validate execution entry/exit points
    if (form.execution?.entry_points) {
      form.execution.entry_points.forEach(nodeId => {
        if (!nodeIds.has(nodeId)) {
          errors.push({
            type: 'reference',
            message: `Execution entry point references non-existent node: ${nodeId}`,
            severity: 'error'
          });
        }
      });
    }

    if (form.execution?.exit_points) {
      form.execution.exit_points.forEach(nodeId => {
        if (!nodeIds.has(nodeId)) {
          errors.push({
            type: 'reference',
            message: `Execution exit point references non-existent node: ${nodeId}`,
            severity: 'error'
          });
        }
      });
    }

    return errors;
  }

  /**
   * Validates logical consistency of the form structure
   */
  private validateLogicalConsistency(form: FormFile): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for cycles in dependency relations
    const cycles = this.detectCycles(form);
    cycles.forEach(cycle => {
      errors.push({
        type: 'cycle',
        message: `Circular dependency detected: ${cycle.join(' -> ')}`,
        severity: 'error'
      });
    });

    // Validate formula nodes have proper syntax
    form.nodes.forEach(node => {
      if (node.type === 'formula' && node.data.value) {
        const formulaErrors = this.validateFormulaSyntax(node.data.value, node.id);
        errors.push(...formulaErrors);
      }
    });

    // Validate condition nodes have proper operators
    form.relations.forEach(relation => {
      if (relation.conditions) {
        relation.conditions.forEach(condition => {
          if (!['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'contains'].includes(condition.operator)) {
            errors.push({
              type: 'logic',
              message: `Invalid condition operator: ${condition.operator}`,
              severity: 'error',
              relationId: relation.id
            });
          }
        });
      }
    });

    return errors;
  }

  /**
   * Detects cycles in the relation graph
   */
  private detectCycles(form: FormFile): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    // Build adjacency list for dependency-type relations
    const adjacencyList = new Map<string, string[]>();
    form.nodes.forEach(node => {
      adjacencyList.set(node.id, []);
    });

    form.relations.forEach(relation => {
      if (['depends_on', 'causes', 'triggers'].includes(relation.type)) {
        const targets = adjacencyList.get(relation.source) || [];
        targets.push(relation.target);
        adjacencyList.set(relation.source, targets);
      }
    });

    // DFS cycle detection
    const dfs = (nodeId: string): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          const cycle = path.slice(cycleStart);
          cycle.push(neighbor); // Complete the cycle
          cycles.push([...cycle]);
        }
      }

      recursionStack.delete(nodeId);
      path.pop();
    };

    form.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    });

    return cycles;
  }

  /**
   * Basic syntax validation for formula expressions
   */
  private validateFormulaSyntax(formula: string, nodeId: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for balanced parentheses
    let parenCount = 0;
    for (const char of formula) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) {
        errors.push({
          type: 'logic',
          message: `Unbalanced parentheses in formula`,
          severity: 'error',
          nodeId
        });
        break;
      }
    }
    if (parenCount !== 0) {
      errors.push({
        type: 'logic',
        message: `Unbalanced parentheses in formula`,
        severity: 'error',
        nodeId
      });
    }

    // Check for potentially dangerous functions
    const dangerousFunctions = ['eval', 'exec', 'import', 'require', 'process', 'fs'];
    dangerousFunctions.forEach(func => {
      if (formula.includes(func)) {
        errors.push({
          type: 'logic',
          message: `Potentially dangerous function '${func}' detected in formula`,
          severity: 'error',
          nodeId
        });
      }
    });

    return errors;
  }

  /**
   * Generates best practice warnings
   */
  private generateWarnings(form: FormFile): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for nodes with very low confidence
    form.nodes.forEach(node => {
      if (node.data.confidence !== undefined && node.data.confidence < 0.3) {
        warnings.push({
          type: 'best_practice',
          message: `Node ${node.id} has very low confidence (${node.data.confidence})`,
          suggestion: 'Consider reviewing the node logic or increasing confidence'
        });
      }
    });

    // Check for very long relation chains
    const maxChainLength = 10;
    const chains = this.findLongestChains(form);
    chains.forEach(chain => {
      if (chain.length > maxChainLength) {
        warnings.push({
          type: 'performance',
          message: `Long relation chain detected (${chain.length} nodes): ${chain.join(' -> ')}`,
          suggestion: 'Consider breaking down into smaller sub-graphs'
        });
      }
    });

    // Check for isolated nodes
    const connectedNodes = new Set<string>();
    form.relations.forEach(relation => {
      connectedNodes.add(relation.source);
      connectedNodes.add(relation.target);
    });

    form.nodes.forEach(node => {
      if (!connectedNodes.has(node.id)) {
        warnings.push({
          type: 'best_practice',
          message: `Node ${node.id} is isolated (no relations)`,
          suggestion: 'Consider connecting to other nodes or removing if unused'
        });
      }
    });

    return warnings;
  }

  /**
   * Finds the longest chains in the relation graph
   */
  private findLongestChains(form: FormFile): string[][] {
    const adjacencyList = new Map<string, string[]>();
    form.nodes.forEach(node => {
      adjacencyList.set(node.id, []);
    });

    form.relations.forEach(relation => {
      const targets = adjacencyList.get(relation.source) || [];
      targets.push(relation.target);
      adjacencyList.set(relation.source, targets);
    });

    const chains: string[][] = [];
    const visited = new Set<string>();

    const dfs = (nodeId: string, currentChain: string[]): void => {
      const newChain = [...currentChain, nodeId];
      const neighbors = adjacencyList.get(nodeId) || [];

      if (neighbors.length === 0) {
        // End of chain
        chains.push(newChain);
        return;
      }

      neighbors.forEach(neighbor => {
        if (!currentChain.includes(neighbor)) { // Avoid cycles
          dfs(neighbor, newChain);
        }
      });
    };

    form.nodes.forEach(node => {
      const incomingCount = form.relations.filter(r => r.target === node.id).length;
      if (incomingCount === 0) { // Start from nodes with no incoming relations
        dfs(node.id, []);
      }
    });

    return chains.sort((a, b) => b.length - a.length).slice(0, 5); // Top 5 longest
  }

  /**
   * Extracts metadata for validation result
   */
  private extractMetadata(form: FormFile) {
    return {
      nodeCount: form.nodes.length,
      relationCount: form.relations.length,
      entryPoints: form.execution?.entry_points || [],
      exitPoints: form.execution?.exit_points || []
    };
  }

  /**
   * Extracts basic metadata when full parsing fails
   */
  private extractBasicMetadata(data: any) {
    return {
      nodeCount: Array.isArray(data?.nodes) ? data.nodes.length : 0,
      relationCount: Array.isArray(data?.relations) ? data.relations.length : 0,
      entryPoints: [],
      exitPoints: []
    };
  }
}