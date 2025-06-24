"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormPlatform = void 0;
const FormValidator_1 = require("./validation/FormValidator");
const FormCompiler_1 = require("./compiler/FormCompiler");
const fs = __importStar(require("fs"));
/**
 * High-level API for the .form cognitive platform
 * Provides unified interface for validation, compilation, and execution
 */
class FormPlatform {
    constructor() {
        this.validator = new FormValidator_1.FormValidator();
        this.compiler = new FormCompiler_1.FormCompiler();
        this.loadedGraphs = new Map();
    }
    /**
     * Loads and validates a .form file from filesystem
     */
    async loadFile(filePath) {
        try {
            // Validate first
            const validation = await this.validator.validateFile(filePath);
            if (!validation.valid) {
                return { valid: false, validation };
            }
            // Load and parse
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const form = JSON.parse(fileContent);
            // Compile to graph
            const graph = this.compiler.compile(form);
            // Cache for later use
            this.loadedGraphs.set(form.metadata.id, graph);
            return { valid: true, form, graph, validation };
        }
        catch (error) {
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
    validateForm(form) {
        return this.validator.validate(form);
    }
    /**
     * Compiles a validated .form object to internal representation
     */
    compileForm(form, optimizationMode = 'balanced') {
        const graph = this.compiler.compile(form);
        return this.compiler.optimizeForExecution(graph, optimizationMode);
    }
    /**
     * Gets a cached compiled graph by form ID
     */
    getGraph(formId) {
        return this.loadedGraphs.get(formId);
    }
    /**
     * Lists all loaded form IDs
     */
    getLoadedForms() {
        return Array.from(this.loadedGraphs.keys());
    }
    /**
     * Saves a compiled graph to filesystem
     */
    saveGraph(graph, outputPath) {
        fs.writeFileSync(outputPath, JSON.stringify(graph, null, 2));
    }
    /**
     * Creates a new empty .form template
     */
    createTemplate(id, name, author) {
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
    async batchValidate(filePaths) {
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
    analyzeForm(form) {
        const graph = this.compiler.compile(form);
        const complexity = graph.extensions.compilation.complexity;
        // Determine complexity level
        let complexityLevel = 'low';
        if (complexity.maxDepth > 10 || complexity.avgBranching > 3 || form.nodes.length > 50) {
            complexityLevel = 'high';
        }
        else if (complexity.maxDepth > 5 || complexity.avgBranching > 2 || form.nodes.length > 20) {
            complexityLevel = 'medium';
        }
        // Calculate distributions
        const nodeTypeDistribution = form.nodes.reduce((acc, node) => {
            acc[node.type] = (acc[node.type] || 0) + 1;
            return acc;
        }, {});
        const relationTypeDistribution = form.relations.reduce((acc, relation) => {
            acc[relation.type] = (acc[relation.type] || 0) + 1;
            return acc;
        }, {});
        // Identify potential issues
        const potentialIssues = [];
        const recommendations = [];
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
    findIsolatedNodes(form) {
        const connectedNodes = new Set();
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
    validateDependencies(forms) {
        const formMap = new Map(forms.map(form => [form.metadata.id, form]));
        const missingDependencies = [];
        const circularDependencies = [];
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
        const visited = new Set();
        const recursionStack = new Set();
        const checkCircular = (formId, path) => {
            if (recursionStack.has(formId)) {
                const cycleStart = path.indexOf(formId);
                circularDependencies.push([...path.slice(cycleStart), formId]);
                return;
            }
            if (visited.has(formId))
                return;
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
    generateReport(form) {
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
exports.FormPlatform = FormPlatform;
//# sourceMappingURL=FormPlatform.js.map