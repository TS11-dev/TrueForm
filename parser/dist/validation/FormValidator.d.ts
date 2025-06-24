import { ValidationResult } from '../types/FormTypes';
/**
 * Comprehensive validator for .form cognitive model files
 * Provides schema validation, reference checking, and logical consistency validation
 */
export declare class FormValidator {
    private ajv;
    private schema;
    constructor();
    /**
     * Validates a .form file from filesystem
     */
    validateFile(filePath: string): Promise<ValidationResult>;
    /**
     * Validates a parsed .form object
     */
    validate(formData: any): ValidationResult;
    /**
     * Converts AJV validation errors to our error format
     */
    private convertAjvErrors;
    /**
     * Validates that all node and relation references are valid
     */
    private validateReferences;
    /**
     * Validates logical consistency of the form structure
     */
    private validateLogicalConsistency;
    /**
     * Detects cycles in the relation graph
     */
    private detectCycles;
    /**
     * Basic syntax validation for formula expressions
     */
    private validateFormulaSyntax;
    /**
     * Generates best practice warnings
     */
    private generateWarnings;
    /**
     * Finds the longest chains in the relation graph
     */
    private findLongestChains;
    /**
     * Extracts metadata for validation result
     */
    private extractMetadata;
    /**
     * Extracts basic metadata when full parsing fails
     */
    private extractBasicMetadata;
}
//# sourceMappingURL=FormValidator.d.ts.map