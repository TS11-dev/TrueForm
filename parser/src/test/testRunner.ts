import { FormPlatform } from '../FormPlatform';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';

/**
 * Simple test runner for validating the .form parser against example files
 */
export class TestRunner {
  private platform: FormPlatform;
  private exampleDir: string;

  constructor() {
    this.platform = new FormPlatform();
    this.exampleDir = path.resolve(__dirname, '../../../');
  }

  /**
   * Runs all tests and displays results
   */
  async runAllTests(): Promise<void> {
    console.log(chalk.blue('🧪 Running .form Parser Tests\n'));

    const testResults = {
      passed: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Test 1: Schema validation with example files
    console.log(chalk.yellow('Test 1: Schema Validation'));
    try {
      await this.testSchemaValidation();
      testResults.passed++;
      console.log(chalk.green('✅ Schema validation passed\n'));
    } catch (error) {
      testResults.failed++;
      testResults.errors.push(`Schema validation: ${error.message}`);
      console.log(chalk.red(`❌ Schema validation failed: ${error.message}\n`));
    }

    // Test 2: Compilation
    console.log(chalk.yellow('Test 2: Form Compilation'));
    try {
      await this.testCompilation();
      testResults.passed++;
      console.log(chalk.green('✅ Form compilation passed\n'));
    } catch (error) {
      testResults.failed++;
      testResults.errors.push(`Form compilation: ${error.message}`);
      console.log(chalk.red(`❌ Form compilation failed: ${error.message}\n`));
    }

    // Test 3: Graph analysis
    console.log(chalk.yellow('Test 3: Graph Analysis'));
    try {
      await this.testGraphAnalysis();
      testResults.passed++;
      console.log(chalk.green('✅ Graph analysis passed\n'));
    } catch (error) {
      testResults.failed++;
      testResults.errors.push(`Graph analysis: ${error.message}`);
      console.log(chalk.red(`❌ Graph analysis failed: ${error.message}\n`));
    }

    // Test 4: Error handling
    console.log(chalk.yellow('Test 4: Error Handling'));
    try {
      await this.testErrorHandling();
      testResults.passed++;
      console.log(chalk.green('✅ Error handling passed\n'));
    } catch (error) {
      testResults.failed++;
      testResults.errors.push(`Error handling: ${error.message}`);
      console.log(chalk.red(`❌ Error handling failed: ${error.message}\n`));
    }

    // Test 5: Template creation
    console.log(chalk.yellow('Test 5: Template Creation'));
    try {
      await this.testTemplateCreation();
      testResults.passed++;
      console.log(chalk.green('✅ Template creation passed\n'));
    } catch (error) {
      testResults.failed++;
      testResults.errors.push(`Template creation: ${error.message}`);
      console.log(chalk.red(`❌ Template creation failed: ${error.message}\n`));
    }

    // Summary
    console.log(chalk.blue('📊 Test Summary:'));
    console.log(`   Passed: ${chalk.green(testResults.passed)}`);
    console.log(`   Failed: ${chalk.red(testResults.failed)}`);
    console.log(`   Total: ${testResults.passed + testResults.failed}`);

    if (testResults.failed > 0) {
      console.log(chalk.red('\n❌ Some tests failed:'));
      testResults.errors.forEach(error => {
        console.log(chalk.red(`   - ${error}`));
      });
      process.exit(1);
    } else {
      console.log(chalk.green('\n🎉 All tests passed!'));
    }
  }

  /**
   * Test schema validation with example files
   */
  private async testSchemaValidation(): Promise<void> {
    const exampleFiles = this.getExampleFiles();
    
    if (exampleFiles.length === 0) {
      throw new Error('No example .form files found');
    }

    let validatedCount = 0;
    const errors: string[] = [];

    for (const file of exampleFiles) {
      try {
        const result = await this.platform.loadFile(file);
        
        if (result.valid) {
          validatedCount++;
          console.log(chalk.gray(`   ✓ ${path.basename(file)}`));
        } else {
          errors.push(`${path.basename(file)}: ${result.validation.errors[0]?.message || 'Unknown error'}`);
          console.log(chalk.red(`   ✗ ${path.basename(file)}`));
        }
      } catch (error) {
        errors.push(`${path.basename(file)}: ${error.message}`);
        console.log(chalk.red(`   ✗ ${path.basename(file)} (exception)`));
      }
    }

    if (errors.length > 0) {
      throw new Error(`${errors.length}/${exampleFiles.length} files failed validation:\n${errors.join('\n')}`);
    }

    console.log(chalk.gray(`   Validated ${validatedCount}/${exampleFiles.length} files`));
  }

  /**
   * Test form compilation functionality
   */
  private async testCompilation(): Promise<void> {
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

    console.log(chalk.gray(`   ✓ Basic compilation`));
    console.log(chalk.gray(`   ✓ Speed optimization`));
    console.log(chalk.gray(`   ✓ Memory optimization`));
    console.log(chalk.gray(`   ✓ Balanced optimization`));
  }

  /**
   * Test graph analysis functionality
   */
  private async testGraphAnalysis(): Promise<void> {
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

    console.log(chalk.gray(`   ✓ Form analysis`));
    console.log(chalk.gray(`   ✓ Report generation`));
    console.log(chalk.gray(`   ✓ Complexity assessment: ${analysis.complexity}`));
  }

  /**
   * Test error handling with invalid inputs
   */
  private async testErrorHandling(): Promise<void> {
    // Test invalid JSON
    try {
      const invalidJson = '{ "invalid": json }';
      const result = this.platform.validateForm(JSON.parse(invalidJson));
      // This should not reach here if JSON parsing fails correctly
      throw new Error('Expected JSON parsing to fail');
    } catch (error) {
      if (error.message.includes('Expected JSON parsing to fail')) {
        throw error;
      }
      // Expected behavior - JSON parsing should fail
      console.log(chalk.gray(`   ✓ Invalid JSON handling`));
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

    console.log(chalk.gray(`   ✓ Invalid form handling`));

    // Test non-existent file
    const fileResult = await this.platform.loadFile('/non/existent/file.form');
    if (fileResult.valid) {
      throw new Error('Expected file loading to fail for non-existent file');
    }

    console.log(chalk.gray(`   ✓ Non-existent file handling`));
  }

  /**
   * Test template creation functionality
   */
  private async testTemplateCreation(): Promise<void> {
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

    console.log(chalk.gray(`   ✓ Template creation`));
    console.log(chalk.gray(`   ✓ Template validation`));
    console.log(chalk.gray(`   ✓ Metadata completeness`));
  }

  /**
   * Gets list of example .form files
   */
  private getExampleFiles(): string[] {
    try {
      return fs.readdirSync(this.exampleDir)
        .filter(file => file.endsWith('.form'))
        .map(file => path.join(this.exampleDir, file))
        .filter(file => fs.existsSync(file));
    } catch (error) {
      return [];
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(error => {
    console.error(chalk.red(`Test runner error: ${error.message}`));
    process.exit(1);
  });
}