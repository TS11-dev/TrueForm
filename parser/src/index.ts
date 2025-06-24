/**
 * .form Cognitive Platform Parser
 * Main entry point for the .form file parser and compiler
 */

// Core types
export * from './types/FormTypes';

// Validation
export { FormValidator } from './validation/FormValidator';
export { FormSchema } from './validation/FormSchema';

// Compilation
export { FormCompiler } from './compiler/FormCompiler';

// Main API class
export { FormPlatform } from './FormPlatform';

// Re-export common interfaces for convenience
export type {
  FormFile,
  FormGraph,
  FormNode,
  FormRelation,
  ValidationResult,
  ExecutionResult
} from './types/FormTypes';