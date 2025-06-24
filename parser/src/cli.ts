#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { FormValidator } from './validation/FormValidator';
import { FormCompiler } from './compiler/FormCompiler';
import { FormFile } from './types/FormTypes';

const program = new Command();

program
  .name('form-cli')
  .description('CLI for .form cognitive model files')
  .version('1.0.0');

/**
 * Validate command - validates .form files against schema
 */
program
  .command('validate')
  .description('Validate .form files against schema')
  .argument('<files...>', '.form files to validate')
  .option('-v, --verbose', 'show detailed validation output')
  .option('-w, --warnings', 'show warnings in addition to errors')
  .option('--json', 'output results in JSON format')
  .action(async (files: string[], options) => {
    const validator = new FormValidator();
    const results = [];

    console.log(chalk.blue('🔍 Validating .form files...\n'));

    for (const file of files) {
      try {
        if (!fs.existsSync(file)) {
          console.log(chalk.red(`❌ File not found: ${file}`));
          continue;
        }

        const result = await validator.validateFile(file);
        results.push({ file, result });

        if (options.json) {
          continue; // Skip console output for JSON mode
        }

        // Console output
        const fileName = path.basename(file);
        if (result.valid) {
          console.log(chalk.green(`✅ ${fileName} - Valid`));
          if (options.verbose) {
            console.log(chalk.gray(`   Nodes: ${result.metadata.nodeCount}, Relations: ${result.metadata.relationCount}`));
            console.log(chalk.gray(`   Entry points: ${result.metadata.entryPoints.join(', ') || 'auto-detected'}`));
            console.log(chalk.gray(`   Exit points: ${result.metadata.exitPoints.join(', ') || 'auto-detected'}`));
          }
        } else {
          console.log(chalk.red(`❌ ${fileName} - Invalid`));
          
          // Show errors
          const errors = result.errors.filter(e => e.severity === 'error');
          errors.forEach(error => {
            console.log(chalk.red(`   Error: ${error.message}`));
            if (options.verbose && error.path) {
              console.log(chalk.gray(`     Path: ${error.path}`));
            }
          });

          // Show warnings if requested
          if (options.warnings && result.warnings.length > 0) {
            result.warnings.forEach(warning => {
              console.log(chalk.yellow(`   Warning: ${warning.message}`));
              if (warning.suggestion) {
                console.log(chalk.gray(`     Suggestion: ${warning.suggestion}`));
              }
            });
          }
        }

        console.log(''); // Empty line for readability
      } catch (error) {
        console.log(chalk.red(`❌ Error processing ${file}: ${error.message}`));
      }
    }

    // JSON output
    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      // Summary
      const validCount = results.filter(r => r.result.valid).length;
      const totalCount = results.length;
      
      if (validCount === totalCount) {
        console.log(chalk.green(`🎉 All ${totalCount} files are valid!`));
      } else {
        console.log(chalk.yellow(`⚠️  ${validCount}/${totalCount} files are valid`));
      }
    }
  });

/**
 * Compile command - compiles .form files to internal representation
 */
program
  .command('compile')
  .description('Compile .form files to optimized internal representation')
  .argument('<file>', '.form file to compile')
  .option('-o, --output <file>', 'output file for compiled graph')
  .option('--optimize <mode>', 'optimization mode: speed, memory, balanced', 'balanced')
  .option('--stats', 'show compilation statistics')
  .action(async (file: string, options) => {
    try {
      console.log(chalk.blue('🔧 Compiling .form file...\n'));

      // Validate first
      const validator = new FormValidator();
      const validationResult = await validator.validateFile(file);

      if (!validationResult.valid) {
        console.log(chalk.red('❌ Cannot compile: validation failed'));
        validationResult.errors.forEach(error => {
          console.log(chalk.red(`   ${error.message}`));
        });
        process.exit(1);
      }

      // Load and parse file
      const fileContent = fs.readFileSync(file, 'utf-8');
      const formData = JSON.parse(fileContent) as FormFile;

      // Compile
      const compiler = new FormCompiler();
      const compiledGraph = compiler.compile(formData);

      // Optimize if requested
      if (options.optimize !== 'none') {
        const optimizedGraph = compiler.optimizeForExecution(
          compiledGraph, 
          options.optimize as 'speed' | 'memory' | 'balanced'
        );
        
        // Output compiled graph
        if (options.output) {
          fs.writeFileSync(options.output, JSON.stringify(optimizedGraph, null, 2));
          console.log(chalk.green(`✅ Compiled graph saved to: ${options.output}`));
        }

        // Show statistics
        if (options.stats) {
          console.log(chalk.blue('\n📊 Compilation Statistics:'));
          console.log(`   Nodes: ${optimizedGraph.nodes.size}`);
          console.log(`   Relations: ${optimizedGraph.relations.size}`);
          console.log(`   Max Depth: ${optimizedGraph.extensions.compilation.complexity.maxDepth}`);
          console.log(`   Avg Branching: ${optimizedGraph.extensions.compilation.complexity.avgBranching.toFixed(2)}`);
          console.log(`   Detected Cycles: ${optimizedGraph.extensions.compilation.complexity.cycleCount}`);
          console.log(`   Optimization: ${optimizedGraph.extensions.optimization?.type || 'none'}`);
          console.log(`   Entry Points: ${optimizedGraph.execution.entry_points?.join(', ') || 'auto-detected'}`);
          console.log(`   Exit Points: ${optimizedGraph.execution.exit_points?.join(', ') || 'auto-detected'}`);
        }

        console.log(chalk.green(`\n🎉 Compilation completed successfully!`));
      }

    } catch (error) {
      console.log(chalk.red(`❌ Compilation failed: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Info command - shows information about .form files
 */
program
  .command('info')
  .description('Show information about .form files')
  .argument('<file>', '.form file to analyze')
  .option('--graph', 'show graph structure analysis')
  .option('--dependencies', 'show dependency analysis')
  .action(async (file: string, options) => {
    try {
      if (!fs.existsSync(file)) {
        console.log(chalk.red(`❌ File not found: ${file}`));
        process.exit(1);
      }

      const fileContent = fs.readFileSync(file, 'utf-8');
      const formData = JSON.parse(fileContent) as FormFile;

      console.log(chalk.blue(`📋 Information for: ${path.basename(file)}\n`));

      // Basic metadata
      console.log(chalk.green('Metadata:'));
      console.log(`   ID: ${formData.metadata.id}`);
      console.log(`   Name: ${formData.metadata.name}`);
      console.log(`   Version: ${formData.metadata.version}`);
      console.log(`   Author: ${formData.metadata.author || 'Unknown'}`);
      console.log(`   Created: ${formData.metadata.created_at}`);
      console.log(`   Updated: ${formData.metadata.updated_at}`);
      if (formData.metadata.tags && formData.metadata.tags.length > 0) {
        console.log(`   Tags: ${formData.metadata.tags.join(', ')}`);
      }

      // Node analysis
      console.log(chalk.green('\nNodes:'));
      console.log(`   Total: ${formData.nodes.length}`);
      const nodeTypes = formData.nodes.reduce((acc, node) => {
        acc[node.type] = (acc[node.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      Object.entries(nodeTypes).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });

      // Relation analysis
      console.log(chalk.green('\nRelations:'));
      console.log(`   Total: ${formData.relations.length}`);
      const relationTypes = formData.relations.reduce((acc, relation) => {
        acc[relation.type] = (acc[relation.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      Object.entries(relationTypes).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });

      // Execution configuration
      if (formData.execution) {
        console.log(chalk.green('\nExecution:'));
        console.log(`   Mode: ${formData.execution.mode || 'adaptive'}`);
        console.log(`   Max Iterations: ${formData.execution.max_iterations || 1000}`);
        console.log(`   Timeout: ${formData.execution.timeout ? formData.execution.timeout + 'ms' : '30000ms'}`);
        if (formData.execution.entry_points) {
          console.log(`   Entry Points: ${formData.execution.entry_points.join(', ')}`);
        }
        if (formData.execution.exit_points) {
          console.log(`   Exit Points: ${formData.execution.exit_points.join(', ')}`);
        }
      }

      // Graph analysis
      if (options.graph) {
        const compiler = new FormCompiler();
        const graph = compiler.compile(formData);
        
        console.log(chalk.green('\nGraph Analysis:'));
        console.log(`   Max Depth: ${graph.extensions.compilation.complexity.maxDepth}`);
        console.log(`   Avg Branching Factor: ${graph.extensions.compilation.complexity.avgBranching.toFixed(2)}`);
        console.log(`   Detected Cycles: ${graph.extensions.compilation.complexity.cycleCount}`);
        
        // Find highly connected nodes
        const connectionCounts = Array.from(graph.adjacencyList.entries())
          .map(([nodeId, targets]) => ({ nodeId, connections: targets.length }))
          .sort((a, b) => b.connections - a.connections)
          .slice(0, 5);
        
        if (connectionCounts.length > 0) {
          console.log('   Highly Connected Nodes:');
          connectionCounts.forEach(({ nodeId, connections }) => {
            const node = graph.nodes.get(nodeId);
            console.log(`     ${nodeId} (${node?.label}): ${connections} connections`);
          });
        }
      }

      // Dependency analysis
      if (options.dependencies && formData.metadata.dependencies) {
        console.log(chalk.green('\nDependencies:'));
        formData.metadata.dependencies.forEach(dep => {
          console.log(`   ${dep.id}@${dep.version}`);
        });
      }

    } catch (error) {
      console.log(chalk.red(`❌ Error analyzing file: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Example command - runs validation on example files
 */
program
  .command('examples')
  .description('Validate example .form files')
  .option('--path <dir>', 'path to examples directory', '../')
  .action(async (options) => {
    const examplesPath = path.resolve(__dirname, options.path);
    
    try {
      const files = fs.readdirSync(examplesPath)
        .filter(file => file.endsWith('.form'))
        .map(file => path.join(examplesPath, file));

      if (files.length === 0) {
        console.log(chalk.yellow('⚠️  No .form files found in examples directory'));
        return;
      }

      console.log(chalk.blue(`🧪 Testing ${files.length} example files...\n`));

      const validator = new FormValidator();
      let validCount = 0;

      for (const file of files) {
        const result = await validator.validateFile(file);
        const fileName = path.basename(file);

        if (result.valid) {
          console.log(chalk.green(`✅ ${fileName}`));
          validCount++;
        } else {
          console.log(chalk.red(`❌ ${fileName}`));
          result.errors.slice(0, 3).forEach(error => {
            console.log(chalk.red(`   ${error.message}`));
          });
        }
      }

      console.log(chalk.blue(`\n📈 Results: ${validCount}/${files.length} examples valid`));

      if (validCount === files.length) {
        console.log(chalk.green('🎉 All examples passed validation!'));
      }

    } catch (error) {
      console.log(chalk.red(`❌ Error testing examples: ${error.message}`));
    }
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}