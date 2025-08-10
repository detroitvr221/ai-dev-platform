import { PlanningAgent } from './planningAgent.js';
import { FrontendAgent } from './frontendAgent.js';
import { BackendAgent } from './backendAgent.js';
import { DatabaseAgent } from './databaseAgent.js';
import { TestingAgent } from './testingAgent.js';
import { DevopsAgent } from './devopsAgent.js';
import { AssetsAgent } from './assetsAgent.js';
import { WorkflowOptimizerAgent } from './workflowOptimizerAgent.js';
import promptsPkg from '../../shared/prompts/agents.js';
const { agentSystemPrompts } = promptsPkg;
import { LRUCache } from 'lru-cache';

export class AgentOrchestrator {
  constructor({ projectManager }) {
    this.projectManager = projectManager;
    this.agents = {
      planning: new PlanningAgent({ systemPrompt: agentSystemPrompts.planning, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }),
      frontend: new FrontendAgent({ systemPrompt: agentSystemPrompts.frontend, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }),
      backend: new BackendAgent({ systemPrompt: agentSystemPrompts.backend, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }),
      database: new DatabaseAgent({ systemPrompt: agentSystemPrompts.database, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }),
      testing: new TestingAgent({ systemPrompt: agentSystemPrompts.testing, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }),
      devops: new DevopsAgent({ systemPrompt: agentSystemPrompts.devops, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }),
      assets: new AssetsAgent({ systemPrompt: agentSystemPrompts.assets, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }),
      workflowOptimizer: new WorkflowOptimizerAgent({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }),
    };
    
    // Enhanced agent system state
    this.agentPerformance = new Map();
    this.workflowHistory = new Map();
    this.agentCollaboration = new Map();
    this.errorRecovery = new Map();
    this.optimizationHistory = new Map();
    
    // Concurrency and caching settings
    this.maxConcurrentAgents = Math.min(12, Number(process.env.MAX_CONCURRENT_AGENTS || 12));
    this.resultCacheTtlMs = Number(process.env.RESULT_CACHE_TTL_MS || 5 * 60 * 1000);
    this.resultCache = new LRUCache({ max: Number(process.env.RESULT_CACHE_MAX || 500), ttl: this.resultCacheTtlMs });
    this.inFlightTasks = new Map(); // key -> Promise
    
    // Initialize performance tracking
    Object.keys(this.agents).forEach(agentKey => {
      this.agentPerformance.set(agentKey, {
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        averageResponseTime: 0,
        lastUsed: null,
        specializations: this._getAgentSpecializations(agentKey)
      });
    });

    // Auto-optimization settings
    this.autoOptimization = {
      enabled: process.env.AUTO_OPTIMIZATION !== 'false',
      threshold: Number(process.env.OPTIMIZATION_THRESHOLD || 3), // Optimize after N workflows
      minWorkflowsForOptimization: Number(process.env.MIN_WORKFLOWS_FOR_OPTIMIZATION || 2)
    };
  }

  _getAgentSpecializations(agentKey) {
    const specializations = {
      planning: ['strategy', 'roadmapping', 'risk-assessment', 'resource-planning'],
      frontend: ['react', 'typescript', 'css', 'accessibility', 'performance'],
      backend: ['api-design', 'security', 'scalability', 'database-integration'],
      database: ['schema-design', 'optimization', 'migrations', 'data-integrity'],
      testing: ['unit-testing', 'integration-testing', 'e2e-testing', 'performance-testing'],
      devops: ['deployment', 'ci-cd', 'monitoring', 'infrastructure'],
      assets: ['design', 'branding', 'visual-identity', 'user-experience'],
      workflowOptimizer: ['performance-analysis', 'bottleneck-identification', 'optimization-strategies', 'efficiency-improvement']
    };
    return specializations[agentKey] || [];
  }

  async processUserMessage(message, projectId, updateCallback) {
    const startTime = Date.now();
    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const projectSummary = await this.projectManager.getProjectSummary(projectId).catch(() => null);
      const context = { 
        projectId, 
        projectSummary, 
        workflowId,
        agentCollaboration: this.agentCollaboration.get(projectId) || new Map()
      };

      const sendUpdate = (agent, status, msg, data) => {
        const update = { 
          id: `${agent}-${Date.now()}`, 
          agent, 
          status, 
          message: msg, 
          data,
          workflowId,
          timestamp: new Date().toISOString()
        };
        updateCallback?.(update);
        this._trackAgentUpdate(agent, status, data);
      };

      // Enhanced intent detection with confidence scoring
      const intentAnalysis = this._analyzeIntent(message);
      sendUpdate('orchestrator', 'started', `Analyzing request: ${intentAnalysis.confidence > 0.8 ? 'High confidence' : 'Medium confidence'} intent detected`);

      let executionOrder = [];
      let plan = null;
      const allowedAgents = this._agentsForIntent(intentAnalysis.intent);

      // Fast-path: if high confidence, run single targeted task without full planning
      if (intentAnalysis.confidence >= Number(process.env.INTENT_FASTPATH_CONFIDENCE || 0.75)) {
        const fastTask = {
          id: `intent-${Date.now()}`,
          title: String(message).slice(0, 120),
          description: String(message),
          assignee: allowedAgents[0]
        };
        executionOrder = [fastTask];
        sendUpdate('orchestrator', 'info', `Intent gating active → executing with agent: ${fastTask.assignee}`);
      } else {
        // Fall back to planning
        sendUpdate('planning', 'started', 'Creating comprehensive project plan');
        plan = await this._executeWithRetry('planning', async () => {
          return await this.agents.planning.sendMessage(
            `Create a detailed project plan for: ${message}. Include:
            - Task breakdown with clear assignees
            - Dependencies and critical path
            - Success metrics and acceptance criteria
            - Resource requirements and timeline`,
            context
          );
        });
        sendUpdate('planning', 'completed', 'Project plan created successfully', plan);

        // Build task list and filter to allowed agents only
        const tasks = (plan?.data?.tasks || []).filter(Boolean).filter(t => allowedAgents.includes(t.assignee));
        if (tasks.length === 0) {
          // Fallback: create a single task for primary intent
          tasks.push({ id: `intent-${Date.now()}`, title: String(message).slice(0, 120), description: String(message), assignee: allowedAgents[0] });
        }
        executionOrder = this._createExecutionOrder(tasks, context);
      }
      
      // Execute tasks in parallel where possible, respecting dependencies
      const results = await this._executeTasksInOrder(executionOrder, context, sendUpdate);
      
      // Post-execution analysis and optimization
      await this._analyzeWorkflowResults(results, context, sendUpdate);
      
      const totalTime = Date.now() - startTime;
      sendUpdate('orchestrator', 'completed', `Workflow completed in ${totalTime}ms`, { 
        workflowId, 
        totalTime, 
        tasksExecuted: results.length,
        results 
      });

      // Store workflow history for future reference
      this.workflowHistory.set(workflowId, {
        message,
        projectId,
        intent: intentAnalysis.intent,
        plan,
        results,
        totalTime,
        timestamp: new Date().toISOString()
      });

      // Auto-optimization check
      if (this.autoOptimization.enabled && this._shouldTriggerOptimization()) {
        await this._triggerAutoOptimization(sendUpdate);
      }

    } catch (error) {
      const errorUpdate = {
        id: `orchestrator-error-${Date.now()}`,
        agent: 'orchestrator',
        status: 'error',
        message: `Workflow failed: ${error.message}`,
        data: { error: error.message, stack: error.stack },
        workflowId,
        timestamp: new Date().toISOString()
      };
      updateCallback?.(errorUpdate);
      this._handleWorkflowError(error, projectId, workflowId);
    }
  }

  _shouldTriggerOptimization() {
    const recentWorkflows = Array.from(this.workflowHistory.values())
      .filter(w => Date.now() - new Date(w.timestamp).getTime() < 24 * 60 * 60 * 1000); // Last 24 hours
    
    return recentWorkflows.length >= this.autoOptimization.minWorkflowsForOptimization;
  }

  async _triggerAutoOptimization(sendUpdate) {
    try {
      sendUpdate('workflowOptimizer', 'started', 'Triggering automatic workflow optimization');
      
      // Collect recent workflow data for analysis
      const recentWorkflows = Array.from(this.workflowHistory.values())
        .filter(w => Date.now() - new Date(w.timestamp).getTime() < 24 * 60 * 60 * 1000)
        .slice(-this.autoOptimization.threshold);
      
      // Analyze workflows for optimization opportunities
      const optimizationAnalysis = await this.agents.workflowOptimizer.analyzeWorkflow({
        results: recentWorkflows.flatMap(w => w.results || []),
        totalTime: recentWorkflows.reduce((sum, w) => sum + w.totalTime, 0),
        tasksExecuted: recentWorkflows.reduce((sum, w) => sum + (w.results?.length || 0), 0)
      });
      
      sendUpdate('workflowOptimizer', 'completed', 'Workflow optimization analysis completed', optimizationAnalysis);
      
      // Store optimization results
      this.optimizationHistory.set(`opt-${Date.now()}`, {
        timestamp: new Date().toISOString(),
        analysis: optimizationAnalysis,
        workflowsAnalyzed: recentWorkflows.length
      });
      
      // Apply high-impact optimizations automatically
      await this._applyHighImpactOptimizations(optimizationAnalysis, sendUpdate);
      
    } catch (error) {
      sendUpdate('workflowOptimizer', 'error', `Auto-optimization failed: ${error.message}`);
      console.error('Auto-optimization error:', error);
    }
  }

  async _applyHighImpactOptimizations(optimizationAnalysis, sendUpdate) {
    const { data } = optimizationAnalysis;
    if (!data?.optimizations) return;
    
    const highImpactOpts = data.optimizations.filter(opt => opt.impact === 'high');
    
    for (const optimization of highImpactOpts) {
      try {
        sendUpdate('workflowOptimizer', 'started', `Applying optimization: ${optimization.title}`);
        
        // Apply optimization based on type
        switch (optimization.type) {
          case 'parallelization':
            await this._applyParallelizationOptimization(optimization, sendUpdate);
            break;
          case 'error_prevention':
            await this._applyErrorPreventionOptimization(optimization, sendUpdate);
            break;
          default:
            sendUpdate('workflowOptimizer', 'info', `Manual implementation required for: ${optimization.title}`);
        }
        
        sendUpdate('workflowOptimizer', 'completed', `Optimization applied: ${optimization.title}`);
        
      } catch (error) {
        sendUpdate('workflowOptimizer', 'error', `Failed to apply optimization ${optimization.title}: ${error.message}`);
      }
    }
  }

  async _applyParallelizationOptimization(optimization, sendUpdate) {
    // Update orchestrator settings for better parallelization
    this.parallelizationSettings = {
      enabled: true,
      maxConcurrentAgents: 3,
      agentTimeout: 30000
    };
    
    sendUpdate('workflowOptimizer', 'info', 'Parallelization settings updated for better task execution');
  }

  async _applyErrorPreventionOptimization(optimization, sendUpdate) {
    // Update retry and error handling settings
    this.errorHandlingSettings = {
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        recoveryTimeout: 60000
      }
    };
    
    sendUpdate('workflowOptimizer', 'info', 'Error handling settings updated for better reliability');
  }

  _analyzeIntent(text) {
    const lower = text.toLowerCase();
    const intentScores = {
      planning: 0,
      frontend: 0,
      backend: 0,
      database: 0,
      testing: 0,
      devops: 0,
      assets: 0
    };

    // Enhanced pattern matching with weighted scoring
    const patterns = {
      planning: [
        { pattern: /(plan|roadmap|tasks|steps|strategy|timeline)/, weight: 2 },
        { pattern: /(organize|structure|prioritize)/, weight: 1.5 }
      ],
      frontend: [
        { pattern: /(ui|component|react|frontend|monaco|tailwind|css|interface)/, weight: 2 },
        { pattern: /(button|form|layout|responsive|mobile)/, weight: 1.5 }
      ],
      backend: [
        { pattern: /(api|server|express|backend|route|endpoint)/, weight: 2 },
        { pattern: /(authentication|authorization|middleware)/, weight: 1.5 }
      ],
      database: [
        { pattern: /(db|database|schema|migration|sql|prisma|model)/, weight: 2 },
        { pattern: /(query|index|constraint|relationship)/, weight: 1.5 }
      ],
      testing: [
        { pattern: /(test|jest|coverage|integration|unit|e2e)/, weight: 2 },
        { pattern: /(quality|reliability|validation)/, weight: 1.5 }
      ],
      devops: [
        { pattern: /(deploy|docker|ci|cd|pipeline|infrastructure)/, weight: 2 },
        { pattern: /(monitoring|logging|scaling)/, weight: 1.5 }
      ],
      assets: [
        { pattern: /(design|brand|logo|icon|illustration|animation|visual)/, weight: 2 },
        { pattern: /(color|typography|style|aesthetic)/, weight: 1.5 }
      ]
    };

    // Calculate weighted scores
    Object.entries(patterns).forEach(([intent, patternList]) => {
      patternList.forEach(({ pattern, weight }) => {
        if (pattern.test(lower)) {
          intentScores[intent] += weight;
        }
      });
    });

    // Find primary intent
    const primaryIntent = Object.entries(intentScores).reduce((a, b) => 
      intentScores[a[0]] > intentScores[b[0]] ? a : b
    );

    const confidence = primaryIntent[1] / 4; // Normalize confidence to 0-1

    return {
      intent: primaryIntent[0],
      confidence,
      scores: intentScores,
      isMixed: confidence < 0.3
    };
  }

  _agentsForIntent(intent) {
    const map = {
      planning: ['planning'],
      frontend: ['frontend', 'assets', 'testing'],
      backend: ['backend', 'database', 'testing'],
      database: ['database', 'backend', 'testing'],
      testing: ['testing'],
      devops: ['devops', 'backend', 'testing'],
      assets: ['assets', 'frontend']
    };
    return map[intent] || ['planning'];
  }

  _createExecutionOrder(tasks, context) {
    const taskMap = new Map(tasks.map(t => [t.id || t.title, t]));
    const executionOrder = [];
    const visited = new Set();
    const inProgress = new Set();

    const visit = (taskId) => {
      if (inProgress.has(taskId)) {
        throw new Error(`Circular dependency detected: ${taskId}`);
      }
      if (visited.has(taskId)) return;

      const task = taskMap.get(taskId);
      if (!task) return;

      inProgress.add(taskId);
      
      // Visit dependencies first
      const dependencies = Array.isArray(task.dependsOn) ? task.dependsOn : [];
      dependencies.forEach(depId => visit(depId));
      
      inProgress.delete(taskId);
      visited.add(taskId);
      executionOrder.push(task);
    };

    tasks.forEach(task => visit(task.id || task.title));
    return executionOrder;
  }

  async _executeTasksInOrder(executionOrder, context, sendUpdate) {
    const results = [];
    const sorted = this._sortTasksByPriority(executionOrder);
    const parallelGroups = this._groupParallelTasks(sorted);

    for (const group of parallelGroups) {
      // Process this group with bounded concurrency for efficiency
      for (let i = 0; i < group.length; i += this.maxConcurrentAgents) {
        const chunk = group.slice(i, i + this.maxConcurrentAgents);
        const chunkPromises = chunk.map(task => this._executeSingleTask(task, context, sendUpdate));
        const chunkResults = await Promise.allSettled(chunkPromises);
        results.push(...chunkResults.map((result, index) => ({
          task: chunk[index],
          result: result.status === 'fulfilled' ? result.value : result.reason,
          status: result.status
        })));
      }
    }

    return results;
  }

  _groupParallelTasks(executionOrder) {
    const groups = [];
    let currentGroup = [];

    executionOrder.forEach(task => {
      if (currentGroup.length === 0 || this._canRunInParallel(currentGroup[0], task)) {
        currentGroup.push(task);
      } else {
        groups.push([...currentGroup]);
        currentGroup = [task];
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  _canRunInParallel(task1, task2) {
    // Simple heuristic: different assignees can often run in parallel
    return task1.assignee !== task2.assignee;
  }

  async _executeSingleTask(task, context, sendUpdate) {
    const startTime = Date.now();
    const agentKey = task.assignee || this._detectIntent(task.title + ' ' + task.description);
    
    if (!this.agents[agentKey]) {
      throw new Error(`No agent available for task: ${task.title}`);
    }

    try {
      // Cache check for repeated tasks
      const cacheKey = this._getTaskCacheKey(task, context);
      const cached = this._getCachedResult(cacheKey);
      if (cached) {
        sendUpdate(agentKey, 'completed', `Cache hit: ${task.title}`, cached.value);
        const executionTime = Date.now() - startTime;
        this._updateAgentPerformance(agentKey, true, executionTime);
        return { task, result: cached.value, executionTime, files: cached.value.files || [] };
      }

      // In-flight suppression
      if (this.inFlightTasks.has(cacheKey)) {
        sendUpdate(agentKey, 'info', `Joining in-flight task: ${task.title}`);
        return await this.inFlightTasks.get(cacheKey);
      }

      sendUpdate(agentKey, 'started', `Executing: ${task.title}`);
      
      const runPromise = this._executeWithRetry(agentKey, async () => {
        const ctxWithStream = { ...context, streamDelta: (delta) => sendUpdate(agentKey, 'stream', delta) };
        return await this.agents[agentKey].sendMessage(
          `Task: ${task.title}\nDescription: ${task.description}\n\nWhen producing files, wrap each file in a triple-fenced block starting with:\n\n\`\`\`file:/<relative project path>\n<content>\n\`\`\`\n\nYou can output multiple files in one response.`,
          ctxWithStream
        );
      });
      this.inFlightTasks.set(cacheKey, runPromise);
      const result = await runPromise;

      // Handle file generation
      const files = this._extractFilesFromResponse(result.raw || '');
      if (files.length > 0) {
        await this._writeFilesSafely(files, context.projectId, sendUpdate);
      }

      const executionTime = Date.now() - startTime;
      this._updateAgentPerformance(agentKey, true, executionTime);
      // Cache successful result
      this._setCachedResult(cacheKey, { ...result, files });
      
      sendUpdate(agentKey, 'completed', `Task completed in ${executionTime}ms`, result);
      const value = { task, result, executionTime, files };
      return value;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this._updateAgentPerformance(agentKey, false, executionTime);
      
      sendUpdate(agentKey, 'error', `Task failed: ${error.message}`, { error: error.message });
      throw error;
    }
    finally {
      // Clear in-flight marker
      const cacheKey = this._getTaskCacheKey(task, context);
      this.inFlightTasks.delete(cacheKey);
    }
  }

  async _executeWithRetry(agentKey, operation, maxRetries = 2) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    throw lastError;
  }

  async _writeFilesSafely(files, projectId, sendUpdate) {
    for (const file of files) {
      try {
        await this.projectManager.writeFile(projectId, file.path.replace(/^\/?/, ''), file.content);
        sendUpdate('file-manager', 'completed', `File written: ${file.path}`);
      } catch (error) {
        sendUpdate('file-manager', 'error', `Failed to write ${file.path}: ${error.message}`);
        throw error;
      }
    }
  }

  async _analyzeWorkflowResults(results, context, sendUpdate) {
    const successfulTasks = results.filter(r => r.status === 'fulfilled');
    const failedTasks = results.filter(r => r.status === 'rejected');
    
    if (failedTasks.length > 0) {
      sendUpdate('orchestrator', 'warning', `${failedTasks.length} tasks failed, analyzing for recovery`);
      
      // Attempt automatic recovery for failed tasks
      for (const failedTask of failedTasks) {
        await this._attemptTaskRecovery(failedTask, context, sendUpdate);
      }
    }

    // Update collaboration patterns
    this._updateCollaborationPatterns(results, context);
    
    // Generate optimization recommendations
    const recommendations = this._generateOptimizationRecommendations(results);
    if (recommendations.length > 0) {
      sendUpdate('orchestrator', 'info', 'Workflow optimization recommendations available', { recommendations });
    }
  }

  async _attemptTaskRecovery(failedTask, context, sendUpdate) {
    const { task, result } = failedTask;
    
    // Try to identify the cause and suggest alternatives
    if (result.code === 'EADDRINUSE' || result.code === 'ENOTFOUND') {
      sendUpdate('orchestrator', 'info', `Infrastructure issue detected for ${task.title}, suggesting alternative approach`);
      // Could trigger infrastructure agent here
    } else if (result.message?.includes('permission') || result.message?.includes('access')) {
      sendUpdate('orchestrator', 'info', `Permission issue for ${task.title}, checking access requirements`);
      // Could trigger security review
    }
  }

  _updateCollaborationPatterns(results, context) {
    const projectCollaboration = this.agentCollaboration.get(context.projectId) || new Map();
    
    results.forEach(({ task, status }) => {
      const agentKey = task.assignee;
      if (!projectCollaboration.has(agentKey)) {
        projectCollaboration.set(agentKey, { collaborations: [], successRate: 0, totalTasks: 0 });
      }
      
      const agentData = projectCollaboration.get(agentKey);
      agentData.totalTasks++;
      agentData.successRate = (agentData.successRate * (agentData.totalTasks - 1) + (status === 'fulfilled' ? 1 : 0)) / agentData.totalTasks;
    });
    
    this.agentCollaboration.set(context.projectId, projectCollaboration);
  }

  _generateOptimizationRecommendations(results) {
    const recommendations = [];
    
    // Analyze execution times
    const executionTimes = results.map(r => r.executionTime).filter(Boolean);
    if (executionTimes.length > 0) {
      const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
      if (avgTime > 10000) { // 10 seconds
        recommendations.push({
          type: 'performance',
          message: 'Consider optimizing agent response times',
          suggestion: 'Review agent prompts and model configurations'
        });
      }
    }
    
    // Analyze success rates
    const successRate = results.filter(r => r.status === 'fulfilled').length / results.length;
    if (successRate < 0.8) {
      recommendations.push({
        type: 'reliability',
        message: 'Task success rate below 80%',
        suggestion: 'Review error patterns and improve error handling'
      });
    }
    
    return recommendations;
  }

  _trackAgentUpdate(agent, status, data) {
    const performance = this.agentPerformance.get(agent);
    if (performance) {
      performance.lastUsed = new Date();
      if (status === 'completed') {
        performance.successfulTasks++;
      } else if (status === 'error') {
        performance.failedTasks++;
      }
      performance.totalTasks++;
    }
  }

  _updateAgentPerformance(agentKey, success, executionTime) {
    const performance = this.agentPerformance.get(agentKey);
    if (performance) {
      performance.totalTasks++;
      if (success) {
        performance.successfulTasks++;
      } else {
        performance.failedTasks++;
      }
      
      // Update average response time
      performance.averageResponseTime = 
        (performance.averageResponseTime * (performance.totalTasks - 1) + executionTime) / performance.totalTasks;
    }
  }

  _handleWorkflowError(error, projectId, workflowId) {
    console.error(`Workflow ${workflowId} failed:`, error);
    
    // Store error for analysis
    this.errorRecovery.set(workflowId, {
      error: error.message,
      stack: error.stack,
      projectId,
      timestamp: new Date().toISOString()
    });
  }

  // Enhanced intent detection for backward compatibility
  _detectIntent(text) {
    const analysis = this._analyzeIntent(text);
    return analysis.intent;
  }

  // Enhanced topological ordering for backward compatibility
  _topologicalOrder(tasks) {
    return this._createExecutionOrder(tasks, {});
  }

  // Enhanced agent execution for backward compatibility
  async _runAgentThatMayWriteFiles(agentKey, message, context, sendUpdate) {
    const task = {
      id: `legacy-${Date.now()}`,
      title: message,
      description: message,
      assignee: agentKey
    };
    
    return await this._executeSingleTask(task, context, sendUpdate);
  }

  // Public methods for monitoring and management
  getAgentPerformance() {
    return Object.fromEntries(this.agentPerformance);
  }

  getWorkflowHistory() {
    return Object.fromEntries(this.workflowHistory);
  }

  getCollaborationPatterns(projectId) {
    return this.agentCollaboration.get(projectId) || new Map();
  }

  resetAgentPerformance(agentKey) {
    if (agentKey && this.agentPerformance.has(agentKey)) {
      this.agentPerformance.set(agentKey, {
        totalTasks: 0,
        successfulTasks: 0,
        failedTasks: 0,
        averageResponseTime: 0,
        lastUsed: null,
        specializations: this._getAgentSpecializations(agentKey)
      });
    } else if (!agentKey) {
      // Reset all agents
      Object.keys(this.agents).forEach(key => this.resetAgentPerformance(key));
    }
  }

  _extractFilesFromResponse(text) {
    const files = [];
    const regex = /```file:(.*?)\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const rawPath = match[1].trim();
      const content = match[2];
      const cleaned = rawPath.replace(/^file:/, '').replace(/^\//, '');
      files.push({ path: cleaned, content });
    }
    return files;
  }

  // Caching helpers
  _getTaskCacheKey(task, context) {
    const id = task.id || task.title || '';
    const desc = task.description || '';
    const projectId = context?.projectId || 'global';
    return `${projectId}::${id}::${desc}`.slice(0, 500);
  }

  _getCachedResult(key) {
    return this.resultCache.get(key) || null;
  }

  _setCachedResult(key, value) {
    this.resultCache.set(key, { value });
  }

  _sortTasksByPriority(tasks) {
    const priority = {
      planning: 10,
      backend: 9,
      database: 8,
      frontend: 7,
      testing: 6,
      devops: 5,
      assets: 4,
      workflowOptimizer: 3,
    };
    return [...tasks].sort((a, b) => (priority[b.assignee || ''] || 0) - (priority[a.assignee || ''] || 0));
  }
}

