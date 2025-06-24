import { FormValidator } from './validation/FormValidator';
import { FormCompiler } from './compiler/FormCompiler';
import { 
  FormFile, 
  FormGraph, 
  ValidationResult, 
  ExecutionResult,
  ExecutionConfig
} from './types/FormTypes';
import * as fs from 'fs';

/**
 * High-level API for the .form cognitive platform
 * Provides unified interface for validation, compilation, and execution
 */
export class FormPlatform {
  private validator: FormValidator;
  private compiler: FormCompiler;
  private loadedGraphs: Map<string, FormGraph>;

  constructor() {
    this.validator = new FormValidator();
    this.compiler = new FormCompiler();
    this.loadedGraphs = new Map();
  }

  /**
   * Loads and validates a .form file from filesystem
   */
  async loadFile(filePath: string): Promise<{ 
    valid: boolean; 
    form?: FormFile; 
    graph?: FormGraph; 
    validation: ValidationResult 
  }> {
    try {
      // Validate first
      const validation = await this.validator.validateFile(filePath);
      
      if (!validation.valid) {
        return { valid: false, validation };
      }

      // Load and parse
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const form = JSON.parse(fileContent) as FormFile;

      // Compile to graph
      const graph = this.compiler.compile(form);
      
      // Cache for later use
      this.loadedGraphs.set(form.metadata.id, graph);

      return { valid: true, form, graph, validation };
    } catch (error) {
      return {
        valid: false,
        validation: {
          valid: false,
          errors: [{
            type: 'schema',
            message: `Failed to load file: ${error.message}`,
            severity: 'error'
          }],
          warnings: [],
          metadata: { nodeCount: 0, relationCount: 0, entryPoints: [], exitPoints: [] }
        }
      };
    }
  }

  /**
   * Validates a .form object directly
   */
  validateForm(form: any): ValidationResult {
    return this.validator.validate(form);
  }

  /**
   * Compiles a validated .form object to internal representation
   */
  compileForm(form: FormFile, optimizationMode: 'speed' | 'memory' | 'balanced' = 'balanced'): FormGraph {
    const graph = this.compiler.compile(form);
    return this.compiler.optimizeForExecution(graph, optimizationMode);
  }

  /**
   * Gets a cached compiled graph by form ID
   */
  getGraph(formId: string): FormGraph | undefined {
    return this.loadedGraphs.get(formId);
  }

  /**
   * Lists all loaded form IDs
   */
  getLoadedForms(): string[] {
    return Array.from(this.loadedGraphs.keys());
  }

  /**
   * Saves a compiled graph to filesystem
   */
  saveGraph(graph: FormGraph, outputPath: string): void {
    fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2));
  }

  /**
   * Creates a new empty .form template
   */
  createTemplate(id: string, name: string, author?: string): FormFile {
    const timestamp = new Date().toISOString();
    
    return {
      metadata: {
        id,
        name,
        version: '1.0.0',
        created_at: timestamp,
        updated_at: timestamp,
        author: author || 'Unknown',
        tags: [],
        dependencies: []
      },
      nodes: [],
      relations: [],
      execution: {
        max_iterations: 1000,
        timeout: 30000,
        mode: 'adaptive'
      }
    };
  }

  /**
   * Validates multiple .form files in batch
   */
  async batchValidate(filePaths: string[]): Promise<Array<{
    file: string;
    result: ValidationResult;
  }>> {
    const results = [];
    
    for (const filePath of filePaths) {
      const result = await this.validator.validateFile(filePath);
      results.push({ file: filePath, result });
    }
    
    return results;
  }

  /**
   * Analyzes a .form file and returns insights
   */
  analyzeForm(form: FormFile): {
    complexity: 'low' | 'medium' | 'high';
    nodeTypeDistribution: Record<string, number>;
    relationTypeDistribution: Record<string, number>;
    potentialIssues: string[];
    recommendations: string[];
  } {
    const graph = this.compiler.compile(form);
    const complexity = graph.extensions.compilation.complexity;
    
    // Determine complexity level
    let complexityLevel: 'low' | 'medium' | 'high' = 'low';
    if (complexity.maxDepth > 10 || complexity.avgBranching > 3 || form.nodes.length > 50) {
      complexityLevel = 'high';
    } else if (complexity.maxDepth > 5 || complexity.avgBranching > 2 || form.nodes.length > 20) {
      complexityLevel = 'medium';
    }

    // Calculate distributions
    const nodeTypeDistribution = form.nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const relationTypeDistribution = form.relations.reduce((acc, relation) => {
      acc[relation.type] = (acc[relation.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Identify potential issues
    const potentialIssues: string[] = [];
    const recommendations: string[] = [];

    if (complexity.cycleCount > 0) {
      potentialIssues.push(`${complexity.cycleCount} potential cycles detected`);
      recommendations.push('Review cyclic dependencies to prevent infinite loops');
    }

    if (complexity.maxDepth > 15) {
      potentialIssues.push('Very deep graph structure detected');
      recommendations.push('Consider breaking down into smaller sub-graphs');
    }

    const formulaNodes = form.nodes.filter(n => n.type === 'formula').length;
    if (formulaNodes > 10) {
      potentialIssues.push('High number of formula nodes');
      recommendations.push('Consider pre-computing some formulas or using cached results');
    }

    const isolatedNodes = this.findIsolatedNodes(form);
    if (isolatedNodes.length > 0) {
      potentialIssues.push(`${isolatedNodes.length} isolated nodes found`);
      recommendations.push('Connect isolated nodes or remove if unused');
    }

    if (!form.execution?.entry_points || form.execution.entry_points.length === 0) {
      recommendations.push('Consider explicitly defining entry points for better control');
    }

    return {
      complexity: complexityLevel,
      nodeTypeDistribution,
      relationTypeDistribution,
      potentialIssues,
      recommendations
    };
  }

  /**
   * Finds nodes with no incoming or outgoing relations
   */
  private findIsolatedNodes(form: FormFile): string[] {
    const connectedNodes = new Set<string>();
    
    form.relations.forEach(relation => {
      connectedNodes.add(relation.source);
      connectedNodes.add(relation.target);
    });

    return form.nodes
      .filter(node => !connectedNodes.has(node.id))
      .map(node => node.id);
  }

  /**
   * Validates dependencies between multiple .form files
   */
  validateDependencies(forms: FormFile[]): {
    valid: boolean;
    missingDependencies: Array<{ formId: string; missingDep: string }>;
    circularDependencies: string[][];
  } {
    const formMap = new Map(forms.map(form => [form.metadata.id, form]));
    const missingDependencies: Array<{ formId: string; missingDep: string }> = [];
    const circularDependencies: string[][] = [];

    // Check for missing dependencies
    forms.forEach(form => {
      form.metadata.dependencies?.forEach(dep => {
        if (!formMap.has(dep.id)) {
          missingDependencies.push({ 
            formId: form.metadata.id, 
            missingDep: dep.id 
          });
        }
      });
    });

    // Check for circular dependencies (simplified)
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const checkCircular = (formId: string, path: string[]): void => {
      if (recursionStack.has(formId)) {
        const cycleStart = path.indexOf(formId);
        circularDependencies.push([...path.slice(cycleStart), formId]);
        return;
      }

      if (visited.has(formId)) return;

      visited.add(formId);
      recursionStack.add(formId);

      const form = formMap.get(formId);
      form?.metadata.dependencies?.forEach(dep => {
        checkCircular(dep.id, [...path, formId]);
      });

      recursionStack.delete(formId);
    };

    forms.forEach(form => {
      if (!visited.has(form.metadata.id)) {
        checkCircular(form.metadata.id, []);
      }
    });

    return {
      valid: missingDependencies.length === 0 && circularDependencies.length === 0,
      missingDependencies,
      circularDependencies
    };
  }

  /**
   * Generates a summary report for a .form file
   */
  generateReport(form: FormFile): string {
    const analysis = this.analyzeForm(form);
    const validation = this.validateForm(form);

    let report = `# .form Analysis Report\n\n`;
    report += `**File:** ${form.metadata.name} (${form.metadata.id})\n`;
    report += `**Version:** ${form.metadata.version}\n`;
    report += `**Author:** ${form.metadata.author}\n`;
    report += `**Created:** ${form.metadata.created_at}\n\n`;

    report += `## Validation Status\n`;
    report += validation.valid ? `✅ **Valid**\n` : `❌ **Invalid**\n`;
    
    if (!validation.valid) {
      report += `\n### Errors\n`;
      validation.errors.forEach(error => {
        report += `- ${error.message}\n`;
      });
    }

    if (validation.warnings.length > 0) {
      report += `\n### Warnings\n`;
      validation.warnings.forEach(warning => {
        report += `- ${warning.message}\n`;
      });
    }

    report += `\n## Structure Overview\n`;
    report += `- **Nodes:** ${form.nodes.length}\n`;
    report += `- **Relations:** ${form.relations.length}\n`;
    report += `- **Complexity:** ${analysis.complexity}\n\n`;

    report += `### Node Types\n`;
    Object.entries(analysis.nodeTypeDistribution).forEach(([type, count]) => {
      report += `- ${type}: ${count}\n`;
    });

    report += `\n### Relation Types\n`;
    Object.entries(analysis.relationTypeDistribution).forEach(([type, count]) => {
      report += `- ${type}: ${count}\n`;
    });

    if (analysis.potentialIssues.length > 0) {
      report += `\n## Potential Issues\n`;
      analysis.potentialIssues.forEach(issue => {
        report += `- ⚠️ ${issue}\n`;
      });
    }

    if (analysis.recommendations.length > 0) {
      report += `\n## Recommendations\n`;
      analysis.recommendations.forEach(rec => {
        report += `- 💡 ${rec}\n`;
      });
    }

    return report;
  }
}