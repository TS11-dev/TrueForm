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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRunner = void 0;
const FormPlatform_1 = require("../FormPlatform");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * Simple test runner for validating the .form parser against example files
 */
class TestRunner {
    constructor() {
        this.platform = new FormPlatform_1.FormPlatform();
        this.exampleDir = path.resolve(__dirname, '../../../');
    }
    /**
     * Runs all tests and displays results
     */
    async runAllTests() {
        console.log(chalk_1.default.blue('🧪 Running .form Parser Tests\n'));
        const testResults = {
            passed: 0,
            failed: 0,
            errors: []
        };
        // Test 1: Schema validation with example files
        console.log(chalk_1.default.yellow('Test 1: Schema Validation'));
        try {
            await this.testSchemaValidation();
            testResults.passed++;
            console.log(chalk_1.default.green('✅ Schema validation passed\n'));
        }
        catch (error) {
            testResults.failed++;
            testResults.errors.push(`Schema validation: ${error.message}`);
            console.log(chalk_1.default.red(`❌ Schema validation failed: ${error.message}\n`));
        }
        // Test 2: Compilation
        console.log(chalk_1.default.yellow('Test 2: Form Compilation'));
        try {
            await this.testCompilation();
            testResults.passed++;
            console.log(chalk_1.default.green('✅ Form compilation passed\n'));
        }
        catch (error) {
            testResults.failed++;
            testResults.errors.push(`Form compilation: ${error.message}`);
            console.log(chalk_1.default.red(`❌ Form compilation failed: ${error.message}\n`));
        }
        // Test 3: Graph analysis
        console.log(chalk_1.default.yellow('Test 3: Graph Analysis'));
        try {
            await this.testGraphAnalysis();
            testResults.passed++;
            console.log(chalk_1.default.green('✅ Graph analysis passed\n'));
        }
        catch (error) {
            testResults.failed++;
            testResults.errors.push(`Graph analysis: ${error.message}`);
            console.log(chalk_1.default.red(`❌ Graph analysis failed: ${error.message}\n`));
        }
        // Test 4: Error handling
        console.log(chalk_1.default.yellow('Test 4: Error Handling'));
        try {
            await this.testErrorHandling();
            testResults.passed++;
            console.log(chalk_1.default.green('✅ Error handling passed\n'));
        }
        catch (error) {
            testResults.failed++;
            testResults.errors.push(`Error handling: ${error.message}`);
            console.log(chalk_1.default.red(`❌ Error handling failed: ${error.message}\n`));
        }
        // Test 5: Template creation
        console.log(chalk_1.default.yellow('Test 5: Template Creation'));
        try {
            await this.testTemplateCreation();
            testResults.passed++;
            console.log(chalk_1.default.green('✅ Template creation passed\n'));
        }
        catch (error) {
            testResults.failed++;
            testResults.errors.push(`Template creation: ${error.message}`);
            console.log(chalk_1.default.red(`❌ Template creation failed: ${error.message}\n`));
        }
        // Summary
        console.log(chalk_1.default.blue('📊 Test Summary:'));
        console.log(`   Passed: ${chalk_1.default.green(testResults.passed)}`);
        console.log(`   Failed: ${chalk_1.default.red(testResults.failed)}`);
        console.log(`   Total: ${testResults.passed + testResults.failed}`);
        if (testResults.failed > 0) {
            console.log(chalk_1.default.red('\n❌ Some tests failed:'));
            testResults.errors.forEach(error => {
                console.log(chalk_1.default.red(`   - ${error}`));
            });
            process.exit(1);
        }
        else {
            console.log(chalk_1.default.green('\n🎉 All tests passed!'));
        }
    }
    /**
     * Test schema validation with example files
     */
    async testSchemaValidation() {
        const exampleFiles = this.getExampleFiles();
        if (exampleFiles.length === 0) {
            throw new Error('No example .form files found');
        }
        let validatedCount = 0;
        const errors = [];
        for (const file of exampleFiles) {
            try {
                const result = await this.platform.loadFile(file);
                if (result.valid) {
                    validatedCount++;
                    console.log(chalk_1.default.gray(`   ✓ ${path.basename(file)}`));
                }
                else {
                    errors.push(`${path.basename(file)}: ${result.validation.errors[0]?.message || 'Unknown error'}`);
                    console.log(chalk_1.default.red(`   ✗ ${path.basename(file)}`));
                }
            }
            catch (error) {
                errors.push(`${path.basename(file)}: ${error.message}`);
                console.log(chalk_1.default.red(`   ✗ ${path.basename(file)} (exception)`));
            }
        }
        if (errors.length > 0) {
            throw new Error(`${errors.length}/${exampleFiles.length} files failed validation:\n${errors.join('\n')}`);
        }
        console.log(chalk_1.default.gray(`   Validated ${validatedCount}/${exampleFiles.length} files`));
    }
    /**
     * Test form compilation functionality
     */
    async testCompilation() {
        const exampleFile = this.getExampleFiles()[0];
        if (!exampleFile) {
            throw new Error('No example files available for compilation test');
        }
        const result = await this.platform.loadFile(exampleFile);
        if (!result.valid || !result.form || !result.graph) {
            throw new Error('Failed to load example file for compilation test');
        }
        // Test basic compilation
        const graph = result.graph;
        if (!graph.nodes || !graph.relations || !graph.adjacencyList) {
            throw new Error('Compiled graph missing required properties');
        }
        // Test optimization modes
        const speedOptimized = this.platform.compileForm(result.form, 'speed');
        const memoryOptimized = this.platform.compileForm(result.form, 'memory');
        const balancedOptimized = this.platform.compileForm(result.form, 'balanced');
        if (!speedOptimized.extensions.optimization ||
            !memoryOptimized.extensions.optimization ||
            !balancedOptimized.extensions.optimization) {
            throw new Error('Optimization metadata not applied correctly');
        }
        console.log(chalk_1.default.gray(`   ✓ Basic compilation`));
        console.log(chalk_1.default.gray(`   ✓ Speed optimization`));
        console.log(chalk_1.default.gray(`   ✓ Memory optimization`));
        console.log(chalk_1.default.gray(`   ✓ Balanced optimization`));
    }
    /**
     * Test graph analysis functionality
     */
    async testGraphAnalysis() {
        const exampleFile = this.getExampleFiles()[0];
        if (!exampleFile) {
            throw new Error('No example files available for analysis test');
        }
        const result = await this.platform.loadFile(exampleFile);
        if (!result.valid || !result.form) {
            throw new Error('Failed to load example file for analysis test');
        }
        // Test analysis functionality
        const analysis = this.platform.analyzeForm(result.form);
        if (!analysis.complexity ||
            !analysis.nodeTypeDistribution ||
            !analysis.relationTypeDistribution ||
            !Array.isArray(analysis.potentialIssues) ||
            !Array.isArray(analysis.recommendations)) {
            throw new Error('Analysis missing required properties');
        }
        // Test report generation
        const report = this.platform.generateReport(result.form);
        if (!report || typeof report !== 'string' || report.length < 100) {
            throw new Error('Generated report is invalid or too short');
        }
        console.log(chalk_1.default.gray(`   ✓ Form analysis`));
        console.log(chalk_1.default.gray(`   ✓ Report generation`));
        console.log(chalk_1.default.gray(`   ✓ Complexity assessment: ${analysis.complexity}`));
    }
    /**
     * Test error handling with invalid inputs
     */
    async testErrorHandling() {
        // Test invalid JSON
        try {
            const invalidJson = '{ "invalid": json }';
            const result = this.platform.validateForm(JSON.parse(invalidJson));
            // This should not reach here if JSON parsing fails correctly
            throw new Error('Expected JSON parsing to fail');
        }
        catch (error) {
            if (error.message.includes('Expected JSON parsing to fail')) {
                throw error;
            }
            // Expected behavior - JSON parsing should fail
            console.log(chalk_1.default.gray(`   ✓ Invalid JSON handling`));
        }
        // Test missing required fields
        const invalidForm = {
            metadata: {
                id: 'test'
                // Missing required fields
            },
            nodes: [],
            relations: []
        };
        const result = this.platform.validateForm(invalidForm);
        if (result.valid) {
            throw new Error('Expected validation to fail for invalid form');
        }
        console.log(chalk_1.default.gray(`   ✓ Invalid form handling`));
        // Test non-existent file
        const fileResult = await this.platform.loadFile('/non/existent/file.form');
        if (fileResult.valid) {
            throw new Error('Expected file loading to fail for non-existent file');
        }
        console.log(chalk_1.default.gray(`   ✓ Non-existent file handling`));
    }
    /**
     * Test template creation functionality
     */
    async testTemplateCreation() {
        const template = this.platform.createTemplate('test_template', 'Test Template', 'Test Author');
        // Validate the created template
        const validation = this.platform.validateForm(template);
        if (!validation.valid) {
            throw new Error(`Created template is invalid: ${validation.errors[0]?.message}`);
        }
        // Check required fields
        if (!template.metadata.id ||
            !template.metadata.name ||
            !template.metadata.version ||
            !template.metadata.created_at ||
            !template.metadata.updated_at) {
            throw new Error('Template missing required metadata fields');
        }
        if (!Array.isArray(template.nodes) ||
            !Array.isArray(template.relations)) {
            throw new Error('Template missing required arrays');
        }
        console.log(chalk_1.default.gray(`   ✓ Template creation`));
        console.log(chalk_1.default.gray(`   ✓ Template validation`));
        console.log(chalk_1.default.gray(`   ✓ Metadata completeness`));
    }
    /**
     * Gets list of example .form files
     */
    getExampleFiles() {
        try {
            return fs.readdirSync(this.exampleDir)
                .filter(file => file.endsWith('.form'))
                .map(file => path.join(this.exampleDir, file))
                .filter(file => fs.existsSync(file));
        }
        catch (error) {
            return [];
        }
    }
}
exports.TestRunner = TestRunner;
// Run tests if this file is executed directly
if (require.main === module) {
    const runner = new TestRunner();
    runner.runAllTests().catch(error => {
        console.error(chalk_1.default.red(`Test runner error: ${error.message}`));
        process.exit(1);
    });
}
//# sourceMappingURL=testRunner.js.map