/**
 * Simple test runner for validating the .form parser against example files
 */
export declare class TestRunner {
    private platform;
    private exampleDir;
    constructor();
    /**
     * Runs all tests and displays results
     */
    runAllTests(): Promise<void>;
    /**
     * Test schema validation with example files
     */
    private testSchemaValidation;
    /**
     * Test form compilation functionality
     */
    private testCompilation;
    /**
     * Test graph analysis functionality
     */
    private testGraphAnalysis;
    /**
     * Test error handling with invalid inputs
     */
    private testErrorHandling;
    /**
     * Test template creation functionality
     */
    private testTemplateCreation;
    /**
     * Gets list of example .form files
     */
    private getExampleFiles;
}
//# sourceMappingURL=testRunner.d.ts.map