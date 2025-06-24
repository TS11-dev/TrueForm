import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { FormPlatform } from '../FormPlatform';
import { 
  FormFile, 
  ValidationResult, 
  ExecutionResult,
  ExecutionConfig 
} from '../types/FormTypes';

/**
 * Express REST API server for TrueForm Platform
 * Provides endpoints for validation, compilation, execution, and file management
 */
export class TrueFormServer {
  private app: express.Application;
  private platform: FormPlatform;
  private upload: multer.Multer;

  constructor() {
    this.app = express();
    this.platform = new FormPlatform();
    this.setupMiddleware();
    this.setupUpload();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Enable CORS for frontend
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Parse JSON bodies
    this.app.use(express.json({ limit: '10mb' }));
    
    // Parse URL-encoded bodies
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });

    // Serve static files for downloads
    this.app.use('/downloads', express.static(path.join(__dirname, '../../../downloads')));
  }

  /**
   * Setup file upload handling
   */
  private setupUpload(): void {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        // Keep original filename with timestamp
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}_${timestamp}${ext}`);
      }
    });

    this.upload = multer({ 
      storage,
      fileFilter: (req, file, cb) => {
        // Only accept .form and .json files
        if (file.mimetype === 'application/json' || file.originalname.endsWith('.form')) {
          cb(null, true);
        } else {
          cb(new Error('Only .form and .json files are allowed'));
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
      }
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // Platform statistics
    this.app.get('/api/stats', (req, res) => {
      try {
        const stats = this.platform.getStatistics();
        res.json({ success: true, data: stats });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // Validation endpoints
    this.setupValidationRoutes();
    
    // Compilation endpoints
    this.setupCompilationRoutes();
    
    // Execution endpoints
    this.setupExecutionRoutes();
    
    // File management endpoints
    this.setupFileRoutes();
    
    // Analysis endpoints
    this.setupAnalysisRoutes();
    
    // Batch operation endpoints
    this.setupBatchRoutes();
  }

  /**
   * Setup validation-related routes
   */
  private setupValidationRoutes(): void {
    // Validate .form JSON object
    this.app.post('/api/validate', (req, res) => {
      try {
        const formData = req.body;
        const result = this.platform.validateForm(formData);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });

    // Validate .form file
    this.app.post('/api/validate/file', this.upload.single('formFile'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: 'No file uploaded'
          });
        }

        const result = await this.platform.loadFile(req.file.path);
        
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        res.json({
          success: true,
          data: result.validation
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });
  }

  /**
   * Setup compilation-related routes
   */
  private setupCompilationRoutes(): void {
    // Compile .form to graph
    this.app.post('/api/compile', (req, res) => {
      try {
        const { form, optimizationMode = 'balanced' } = req.body;
        
        // Validate first
        const validation = this.platform.validateForm(form);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: 'Form validation failed',
            validation
          });
        }

        const graph = this.platform.compileForm(form, optimizationMode);
        
        res.json({
          success: true,
          data: {
            graph: this.serializeGraph(graph),
            validation
          }
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get loaded forms
    this.app.get('/api/forms', (req, res) => {
      try {
        const loadedForms = this.platform.getLoadedForms();
        res.json({
          success: true,
          data: loadedForms
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get specific form graph
    this.app.get('/api/forms/:formId/graph', (req, res) => {
      try {
        const { formId } = req.params;
        const graph = this.platform.getGraph(formId);
        
        if (!graph) {
          return res.status(404).json({
            success: false,
            error: `Form ${formId} not found`
          });
        }

        res.json({
          success: true,
          data: this.serializeGraph(graph)
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  }

  /**
   * Setup execution-related routes
   */
  private setupExecutionRoutes(): void {
    // Execute loaded form
    this.app.post('/api/execute/:formId', async (req, res) => {
      try {
        const { formId } = req.params;
        const { inputs = {}, config = {} } = req.body;

        const result = await this.platform.executeForm(formId, inputs, config);
        
        res.json({
          success: true,
          data: this.serializeExecutionResult(result)
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });

    // Execute .form directly from JSON
    this.app.post('/api/execute', async (req, res) => {
      try {
        const { form, inputs = {}, config = {} } = req.body;

        // Load and execute
        const loadResult = await this.loadFormFromObject(form);
        if (!loadResult.valid) {
          return res.status(400).json({
            success: false,
            error: 'Form validation failed',
            validation: loadResult.validation
          });
        }

        const result = await this.platform.executeForm(form.metadata.id, inputs, config);
        
        res.json({
          success: true,
          data: this.serializeExecutionResult(result)
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });

    // Simulate execution (dry run)
    this.app.post('/api/simulate/:formId', async (req, res) => {
      try {
        const { formId } = req.params;
        const { inputs = {}, config = {} } = req.body;

        const result = await this.platform.simulateExecution(formId, inputs, config);
        
        res.json({
          success: true,
          data: this.serializeExecutionResult(result)
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get execution history
    this.app.get('/api/forms/:formId/executions', (req, res) => {
      try {
        const { formId } = req.params;
        const history = this.platform.getExecutionHistory(formId);
        
        res.json({
          success: true,
          data: history.map(result => this.serializeExecutionResult(result))
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Clear execution history
    this.app.delete('/api/forms/:formId/executions', (req, res) => {
      try {
        const { formId } = req.params;
        this.platform.clearExecutionHistory(formId);
        
        res.json({
          success: true,
          message: `Execution history cleared for form ${formId}`
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  }

  /**
   * Setup file management routes
   */
  private setupFileRoutes(): void {
    // Upload and load .form file
    this.app.post('/api/upload', this.upload.single('formFile'), async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: 'No file uploaded'
          });
        }

        const result = await this.platform.loadFile(req.file.path);
        
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        res.json({
          success: true,
          data: {
            formId: result.form?.metadata.id,
            valid: result.valid,
            validation: result.validation
          }
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });

    // Download form as JSON
    this.app.get('/api/forms/:formId/download', (req, res) => {
      try {
        const { formId } = req.params;
        const graph = this.platform.getGraph(formId);
        
        if (!graph) {
          return res.status(404).json({
            success: false,
            error: `Form ${formId} not found`
          });
        }

        // Convert back to FormFile format
        const formFile = this.graphToFormFile(graph);
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${formId}.form"`);
        res.send(JSON.stringify(formFile, null, 2));
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Create new form template
    this.app.post('/api/forms/template', (req, res) => {
      try {
        const { id, name, author = 'Unknown' } = req.body;
        
        if (!id || !name) {
          return res.status(400).json({
            success: false,
            error: 'id and name are required'
          });
        }

        const template = this.platform.createTemplate(id, name, author);
        
        res.json({
          success: true,
          data: template
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });
  }

  /**
   * Setup analysis-related routes
   */
  private setupAnalysisRoutes(): void {
    // Analyze form
    this.app.post('/api/analyze', (req, res) => {
      try {
        const { form } = req.body;
        const analysis = this.platform.analyzeForm(form);
        
        res.json({
          success: true,
          data: analysis
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });

    // Generate form report
    this.app.post('/api/report', (req, res) => {
      try {
        const { form, format = 'markdown' } = req.body;
        const report = this.platform.generateReport(form);
        
        res.json({
          success: true,
          data: {
            report,
            format
          }
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });

    // Validate dependencies
    this.app.post('/api/validate/dependencies', (req, res) => {
      try {
        const { forms } = req.body;
        
        if (!Array.isArray(forms)) {
          return res.status(400).json({
            success: false,
            error: 'forms must be an array'
          });
        }

        const result = this.platform.validateDependencies(forms);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });
  }

  /**
   * Setup batch operation routes
   */
  private setupBatchRoutes(): void {
    // Batch validation
    this.app.post('/api/batch/validate', this.upload.array('formFiles', 10), async (req, res) => {
      try {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No files uploaded'
          });
        }

        const filePaths = (req.files as Express.Multer.File[]).map(file => file.path);
        const results = await this.platform.batchValidate(filePaths);
        
        // Clean up uploaded files
        filePaths.forEach(filePath => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
        
        res.json({
          success: true,
          data: results
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });

    // Batch execution
    this.app.post('/api/batch/execute', async (req, res) => {
      try {
        const { executions } = req.body;
        
        if (!Array.isArray(executions)) {
          return res.status(400).json({
            success: false,
            error: 'executions must be an array'
          });
        }

        const results = await this.platform.batchExecute(executions);
        
        res.json({
          success: true,
          data: results.map(result => ({
            ...result,
            result: result.result ? this.serializeExecutionResult(result.result) : undefined
          }))
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });

    // Export execution results
    this.app.post('/api/export/executions', (req, res) => {
      try {
        const { formId, format = 'json' } = req.body;
        const history = this.platform.getExecutionHistory(formId);
        
        if (history.length === 0) {
          return res.status(404).json({
            success: false,
            error: `No execution history found for form ${formId}`
          });
        }

        const exported = this.platform.exportExecutionResults(history, format);
        
        let contentType = 'application/json';
        let fileExtension = 'json';
        
        if (format === 'csv') {
          contentType = 'text/csv';
          fileExtension = 'csv';
        } else if (format === 'summary') {
          contentType = 'text/markdown';
          fileExtension = 'md';
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${formId}_executions.${fileExtension}"`);
        res.send(exported);
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    // Handle 404
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`
      });
    });

    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Server error:', error);
      
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    });
  }

  /**
   * Helper methods
   */

  private async loadFormFromObject(form: FormFile): Promise<{
    valid: boolean;
    validation: ValidationResult;
  }> {
    const validation = this.platform.validateForm(form);
    
    if (validation.valid) {
      const graph = this.platform.compileForm(form);
      // Cache the compiled graph
      this.platform['loadedGraphs'].set(form.metadata.id, graph);
    }

    return { valid: validation.valid, validation };
  }

  private serializeGraph(graph: any): any {
    return {
      metadata: graph.metadata,
      nodes: Object.fromEntries(graph.nodes),
      relations: Object.fromEntries(graph.relations),
      adjacencyList: Object.fromEntries(graph.adjacencyList),
      reverseAdjacencyList: Object.fromEntries(graph.reverseAdjacencyList),
      execution: graph.execution,
      extensions: graph.extensions
    };
  }

  private serializeExecutionResult(result: ExecutionResult): any {
    return {
      success: result.success,
      finalState: Object.fromEntries(result.finalState),
      executionTrace: result.executionTrace,
      metrics: result.metrics,
      errors: result.errors
    };
  }

  private graphToFormFile(graph: any): FormFile {
    return {
      metadata: graph.metadata,
      nodes: Array.from(graph.nodes.values()),
      relations: Array.from(graph.relations.values()),
      execution: graph.execution,
      extensions: graph.extensions
    };
  }

  /**
   * Start the server
   */
  public start(port: number = 3001): void {
    this.app.listen(port, () => {
      console.log(`TrueForm API Server running on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
      console.log(`API Documentation: http://localhost:${port}/api`);
    });
  }

  /**
   * Get Express app instance
   */
  public getApp(): express.Application {
    return this.app;
  }
}

// Create and export server instance for external use
export const createServer = () => new TrueFormServer();

// Start server if run directly
if (require.main === module) {
  const server = new TrueFormServer();
  const port = parseInt(process.env.PORT || '3001', 10);
  server.start(port);
}
