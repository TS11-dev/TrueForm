import { FormFile, FormGraph, ValidationResult } from './types/FormTypes';
/**
 * High-level API for the .form cognitive platform
 * Provides unified interface for validation, compilation, and execution
 */
export declare class FormPlatform {
    private validator;
    private compiler;
    private loadedGraphs;
    constructor();
    /**
     * Loads and validates a .form file from filesystem
     */
    loadFile(filePath: string): Promise<{
        valid: boolean;
        form?: FormFile;
        graph?: FormGraph;
        validation: ValidationResult;
    }>;
    /**
     * Validates a .form object directly
     */
    validateForm(form: any): ValidationResult;
    /**
     * Compiles a validated .form object to internal representation
     */
    compileForm(form: FormFile, optimizationMode?: 'speed' | 'memory' | 'balanced'): FormGraph;
    /**
     * Gets a cached compiled graph by form ID
     */
    getGraph(formId: string): FormGraph | undefined;
    /**
     * Lists all loaded form IDs
     */
    getLoadedForms(): string[];
    /**
     * Saves a compiled graph to filesystem
     */
    saveGraph(graph: FormGraph, outputPath: string): void;
    /**
     * Creates a new empty .form template
     */
    createTemplate(id: string, name: string, author?: string): FormFile;
    /**
     * Validates multiple .form files in batch
     */
    batchValidate(filePaths: string[]): Promise<Array<{
        file: string;
        result: ValidationResult;
    }>>;
    /**
     * Analyzes a .form file and returns insights
     */
    analyzeForm(form: FormFile): {
        complexity: 'low' | 'medium' | 'high';
        nodeTypeDistribution: Record<string, number>;
        relationTypeDistribution: Record<string, number>;
        potentialIssues: string[];
        recommendations: string[];
    };
    /**
     * Finds nodes with no incoming or outgoing relations
     */
    private findIsolatedNodes;
    /**
     * Validates dependencies between multiple .form files
     */
    validateDependencies(forms: FormFile[]): {
        valid: boolean;
        missingDependencies: Array<{
            formId: string;
            missingDep: string;
        }>;
        circularDependencies: string[][];
    };
    /**
     * Generates a summary report for a .form file
     */
    generateReport(form: FormFile): string;
}
//# sourceMappingURL=FormPlatform.d.ts.map