import { BaseAgent } from './baseAgent.js';

export class WorkflowOptimizerAgent extends BaseAgent {
  constructor({ systemPrompt, model }) {
    const resolvedPrompt = systemPrompt || WorkflowOptimizerAgent.getDefaultSystemPrompt();
    super({
      name: 'WorkflowOptimizer',
      role: 'Workflow Optimization & Performance Analysis',
      systemPrompt: resolvedPrompt,
      model
    });
    
    // Specialized for workflow optimization
    this.optimizationStrategies = new Map();
    this.performanceBaselines = new Map();
    this.workflowPatterns = new Map();
    
    // Initialize optimization strategies
    this._initializeOptimizationStrategies();
  }

  static getDefaultSystemPrompt() {
    return `ROLE: Workflow Optimization & Performance Analysis Master
SCOPE: Analyze, optimize, and improve agent workflows for maximum efficiency and reliability
EXPERTISE:
- Performance analysis and bottleneck identification
- Workflow optimization and parallelization strategies
- Resource allocation and load balancing
- Error pattern analysis and prevention
- Agent collaboration optimization
- System scalability and efficiency improvements

OUTPUT: Comprehensive optimization recommendations and actionable improvements

CONSTRAINTS:
- Focus on measurable improvements
- Provide specific, actionable recommendations
- Consider system constraints and trade-offs
- Prioritize high-impact optimizations
- Include implementation steps and timelines`;
  }

  _initializeOptimizationStrategies() {
    this.optimizationStrategies.set('parallelization', {
      name: 'Task Parallelization',
      description: 'Identify tasks that can run concurrently',
      impact: 'high',
      implementation: 'medium',
      conditions: ['multiple independent tasks', 'different agent types', 'no shared dependencies']
    });

    this.optimizationStrategies.set('dependency_optimization', {
      name: 'Dependency Chain Optimization',
      description: 'Optimize task dependency chains for faster execution',
      impact: 'high',
      implementation: 'medium',
      conditions: ['long dependency chains', 'sequential bottlenecks', 'unnecessary dependencies']
    });

    this.optimizationStrategies.set('agent_specialization', {
      name: 'Agent Specialization',
      description: 'Optimize agent assignments based on expertise',
      impact: 'medium',
      implementation: 'low',
      conditions: ['mismatched agent-task assignments', 'suboptimal agent usage', 'skill gaps']
    });

    this.optimizationStrategies.set('resource_allocation', {
      name: 'Resource Allocation',
      description: 'Optimize resource usage and distribution',
      impact: 'medium',
      implementation: 'high',
      conditions: ['resource contention', 'uneven load distribution', 'idle resources']
    });

    this.optimizationStrategies.set('error_prevention', {
      name: 'Error Prevention',
      description: 'Implement proactive error prevention strategies',
      impact: 'high',
      implementation: 'medium',
      conditions: ['recurring errors', 'high failure rates', 'error patterns']
    });
  }

  async analyzeWorkflow(workflowData, context = {}) {
    try {
      const analysis = {
        performance: await this._analyzePerformance(workflowData),
        bottlenecks: await this._identifyBottlenecks(workflowData),
        optimizations: await this._generateOptimizations(workflowData, context),
        recommendations: await this._prioritizeRecommendations(workflowData),
        implementation: await this._createImplementationPlan(workflowData)
      };

      return {
        type: 'workflow_analysis',
        data: analysis,
        raw: JSON.stringify(analysis, null, 2)
      };
    } catch (error) {
      throw this._enhanceError(error, context);
    }
  }

  async _analyzePerformance(workflowData) {
    const { results, totalTime, tasksExecuted } = workflowData;
    
    if (!results || !Array.isArray(results)) {
      return { error: 'Invalid workflow data for performance analysis' };
    }

    const successfulTasks = results.filter(r => r.status === 'fulfilled');
    const failedTasks = results.filter(r => r.status === 'rejected');
    
    const performance = {
      overall: {
        totalTime,
        tasksExecuted,
        successRate: successfulTasks.length / results.length,
        failureRate: failedTasks.length / results.length,
        averageTaskTime: totalTime / results.length
      },
      byAgent: this._analyzeAgentPerformance(results),
      byTaskType: this._analyzeTaskTypePerformance(results),
      efficiency: this._calculateEfficiencyMetrics(results, totalTime)
    };

    return performance;
  }

  _analyzeAgentPerformance(results) {
    const agentStats = new Map();
    
    results.forEach(({ task, result, executionTime, status }) => {
      const agentKey = task.assignee || 'unknown';
      
      if (!agentStats.has(agentKey)) {
        agentStats.set(agentKey, {
          totalTasks: 0,
          successfulTasks: 0,
          failedTasks: 0,
          totalExecutionTime: 0,
          averageExecutionTime: 0,
          tasks: []
        });
      }
      
      const stats = agentStats.get(agentKey);
      stats.totalTasks++;
      stats.totalExecutionTime += executionTime || 0;
      
      if (status === 'fulfilled') {
        stats.successfulTasks++;
      } else {
        stats.failedTasks++;
      }
      
      stats.tasks.push({
        title: task.title,
        executionTime,
        status,
        result: result?.error || 'success'
      });
    });

    // Calculate averages
    agentStats.forEach(stats => {
      stats.averageExecutionTime = stats.totalExecutionTime / stats.totalTasks;
      stats.successRate = stats.successfulTasks / stats.totalTasks;
    });

    return Object.fromEntries(agentStats);
  }

  _analyzeTaskTypePerformance(results) {
    const taskTypeStats = new Map();
    
    results.forEach(({ task, executionTime, status }) => {
      const taskType = this._categorizeTask(task);
      
      if (!taskTypeStats.has(taskType)) {
        taskTypeStats.set(taskType, {
          totalTasks: 0,
          successfulTasks: 0,
          failedTasks: 0,
          totalExecutionTime: 0,
          averageExecutionTime: 0
        });
      }
      
      const stats = taskTypeStats.get(taskType);
      stats.totalTasks++;
      stats.totalExecutionTime += executionTime || 0;
      
      if (status === 'fulfilled') {
        stats.successfulTasks++;
      } else {
        stats.failedTasks++;
      }
    });

    // Calculate averages
    taskTypeStats.forEach(stats => {
      stats.averageExecutionTime = stats.totalExecutionTime / stats.totalTasks;
      stats.successRate = stats.successfulTasks / stats.totalTasks;
    });

    return Object.fromEntries(taskTypeStats);
  }

  _categorizeTask(task) {
    const title = (task.title || '').toLowerCase();
    const description = (task.description || '').toLowerCase();
    const text = `${title} ${description}`;
    
    if (text.includes('plan') || text.includes('strategy')) return 'planning';
    if (text.includes('ui') || text.includes('component') || text.includes('frontend')) return 'frontend';
    if (text.includes('api') || text.includes('backend') || text.includes('server')) return 'backend';
    if (text.includes('database') || text.includes('schema') || text.includes('db')) return 'database';
    if (text.includes('test') || text.includes('quality')) return 'testing';
    if (text.includes('deploy') || text.includes('infrastructure')) return 'devops';
    if (text.includes('design') || text.includes('asset')) return 'assets';
    
    return 'general';
  }

  _calculateEfficiencyMetrics(results, totalTime) {
    const executionTimes = results.map(r => r.executionTime).filter(Boolean);
    const totalExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0);
    
    return {
      parallelizationEfficiency: totalExecutionTime / totalTime,
      resourceUtilization: results.length / Math.max(1, totalTime / 1000), // tasks per second
      overheadPercentage: ((totalTime - totalExecutionTime) / totalTime) * 100
    };
  }

  async _identifyBottlenecks(workflowData) {
    const { results, totalTime } = workflowData;
    
    if (!results || !Array.isArray(results)) {
      return { error: 'Invalid workflow data for bottleneck analysis' };
    }

    const bottlenecks = [];
    
    // Identify slow tasks
    const executionTimes = results.map(r => ({ task: r.task, time: r.executionTime, status: r.status }));
    const sortedByTime = executionTimes.sort((a, b) => (b.time || 0) - (a.time || 0));
    
    if (sortedByTime.length > 0) {
      const slowestTask = sortedByTime[0];
      if (slowestTask.time > totalTime * 0.3) { // Task taking more than 30% of total time
        bottlenecks.push({
          type: 'slow_task',
          description: `Task "${slowestTask.task.title}" is taking ${slowestTask.time}ms (${((slowestTask.time / totalTime) * 100).toFixed(1)}% of total time)`,
          impact: 'high',
          task: slowestTask.task
        });
      }
    }

    // Identify failed tasks
    const failedTasks = results.filter(r => r.status === 'rejected');
    if (failedTasks.length > 0) {
      bottlenecks.push({
        type: 'task_failures',
        description: `${failedTasks.length} tasks failed, reducing overall success rate`,
        impact: 'high',
        failedTasks: failedTasks.map(f => f.task.title)
      });
    }

    // Identify sequential bottlenecks
    const sequentialBottlenecks = this._identifySequentialBottlenecks(results);
    bottlenecks.push(...sequentialBottlenecks);

    return bottlenecks;
  }

  _identifySequentialBottlenecks(results) {
    const bottlenecks = [];
    
    // Look for tasks that could potentially run in parallel
    const agentGroups = new Map();
    results.forEach(({ task, executionTime }) => {
      const agent = task.assignee || 'unknown';
      if (!agentGroups.has(agent)) {
        agentGroups.set(agent, []);
      }
      agentGroups.get(agent).push({ task, executionTime });
    });

    // Check if multiple agents could run simultaneously
    const agentCount = agentGroups.size;
    if (agentCount > 1) {
      const maxSequentialTime = Math.max(...Array.from(agentGroups.values()).map(tasks => 
        tasks.reduce((sum, t) => sum + (t.executionTime || 0), 0)
      ));
      
      const totalSequentialTime = Array.from(agentGroups.values()).reduce((sum, tasks) => 
        sum + tasks.reduce((taskSum, t) => taskSum + (t.executionTime || 0), 0), 0
      );

      if (totalSequentialTime > maxSequentialTime * 1.5) {
        bottlenecks.push({
          type: 'parallelization_opportunity',
          description: `Potential for parallel execution: ${agentCount} agents could run simultaneously`,
          impact: 'medium',
          potentialSavings: totalSequentialTime - maxSequentialTime
        });
      }
    }

    return bottlenecks;
  }

  async _generateOptimizations(workflowData, context) {
    const optimizations = [];
    const { results, totalTime } = workflowData;
    
    // Apply optimization strategies
    for (const [strategyKey, strategy] of this.optimizationStrategies) {
      if (this._shouldApplyStrategy(strategyKey, workflowData, context)) {
        const optimization = await this._createOptimization(strategyKey, strategy, workflowData, context);
        if (optimization) {
          optimizations.push(optimization);
        }
      }
    }

    // Generate custom optimizations based on analysis
    const customOptimizations = await this._generateCustomOptimizations(workflowData, context);
    optimizations.push(...customOptimizations);

    return optimizations;
  }

  _shouldApplyStrategy(strategyKey, workflowData, context) {
    const { results } = workflowData;
    
    switch (strategyKey) {
      case 'parallelization':
        return results.length > 2 && results.some(r => r.task.assignee !== results[0].task.assignee);
      
      case 'dependency_optimization':
        return results.length > 3; // Multiple tasks suggest dependencies
      
      case 'agent_specialization':
        return results.some(r => !r.task.assignee || r.status === 'rejected');
      
      case 'resource_allocation':
        return results.length > 1;
      
      case 'error_prevention':
        return results.some(r => r.status === 'rejected');
      
      default:
        return true;
    }
  }

  async _createOptimization(strategyKey, strategy, workflowData, context) {
    const { results, totalTime } = workflowData;
    
    switch (strategyKey) {
      case 'parallelization':
        return this._createParallelizationOptimization(results, totalTime);
      
      case 'dependency_optimization':
        return this._createDependencyOptimization(results, totalTime);
      
      case 'agent_specialization':
        return this._createAgentSpecializationOptimization(results, context);
      
      case 'resource_allocation':
        return this._createResourceAllocationOptimization(results, totalTime);
      
      case 'error_prevention':
        return this._createErrorPreventionOptimization(results, context);
      
      default:
        return null;
    }
  }

  _createParallelizationOptimization(results, totalTime) {
    const agentGroups = new Map();
    results.forEach(({ task, executionTime }) => {
      const agent = task.assignee || 'unknown';
      if (!agentGroups.has(agent)) {
        agentGroups.set(agent, []);
      }
      agentGroups.get(agent).push({ task, executionTime });
    });

    const maxSequentialTime = Math.max(...Array.from(agentGroups.values()).map(tasks => 
      tasks.reduce((sum, t) => sum + (t.executionTime || 0), 0)
    ));
    
    const potentialSavings = totalTime - maxSequentialTime;
    
    return {
      type: 'parallelization',
      title: 'Task Parallelization',
      description: `Execute tasks from different agents in parallel to reduce total execution time`,
      impact: 'high',
      implementation: 'medium',
      potentialSavings: `${potentialSavings}ms (${((potentialSavings / totalTime) * 100).toFixed(1)}%)`,
      steps: [
        'Identify independent task groups',
        'Modify workflow to execute groups in parallel',
        'Monitor for resource contention',
        'Measure performance improvement'
      ],
      risks: ['Resource contention', 'Increased complexity', 'Debugging difficulty']
    };
  }

  _createDependencyOptimization(results, totalTime) {
    return {
      type: 'dependency_optimization',
      title: 'Dependency Chain Optimization',
      description: 'Optimize task dependencies to reduce sequential bottlenecks',
      impact: 'medium',
      implementation: 'medium',
      potentialSavings: '10-30% of total time',
      steps: [
        'Analyze current dependency chains',
        'Identify unnecessary dependencies',
        'Restructure task dependencies',
        'Validate dependency changes'
      ],
      risks: ['Breaking existing workflows', 'Introducing race conditions']
    };
  }

  _createAgentSpecializationOptimization(results, context) {
    const failedTasks = results.filter(r => r.status === 'rejected');
    const unassignedTasks = results.filter(r => !r.task.assignee);
    
    if (failedTasks.length === 0 && unassignedTasks.length === 0) {
      return null;
    }

    return {
      type: 'agent_specialization',
      title: 'Agent Assignment Optimization',
      description: 'Improve task-agent assignments based on expertise and success patterns',
      impact: 'medium',
      implementation: 'low',
      potentialSavings: 'Improved success rate and execution time',
      steps: [
        'Analyze agent success patterns',
        'Review failed task assignments',
        'Optimize agent-task matching',
        'Implement assignment rules'
      ],
      risks: ['Reduced flexibility', 'Over-specialization']
    };
  }

  _createResourceAllocationOptimization(results, totalTime) {
    return {
      type: 'resource_allocation',
      title: 'Resource Allocation Optimization',
      description: 'Optimize resource usage and distribution across agents',
      impact: 'medium',
      implementation: 'high',
      potentialSavings: '15-25% of resource usage',
      steps: [
        'Monitor resource usage patterns',
        'Identify resource contention',
        'Implement load balancing',
        'Optimize resource distribution'
      ],
      risks: ['Complexity increase', 'Resource starvation']
    };
  }

  _createErrorPreventionOptimization(results, context) {
    const failedTasks = results.filter(r => r.status === 'rejected');
    
    if (failedTasks.length === 0) {
      return null;
    }

    return {
      type: 'error_prevention',
      title: 'Error Prevention Strategy',
      description: 'Implement proactive measures to prevent common errors',
      impact: 'high',
      implementation: 'medium',
      potentialSavings: 'Reduced failure rate and improved reliability',
      steps: [
        'Analyze error patterns',
        'Implement input validation',
        'Add error handling',
        'Create retry mechanisms'
      ],
      risks: ['Increased complexity', 'Performance overhead']
    };
  }

  async _generateCustomOptimizations(workflowData, context) {
    const customOptimizations = [];
    const { results, totalTime } = workflowData;
    
    // Analyze for specific patterns and suggest custom optimizations
    if (results.length > 5) {
      customOptimizations.push({
        type: 'workflow_batching',
        title: 'Workflow Batching',
        description: 'Group related tasks into batches for more efficient processing',
        impact: 'medium',
        implementation: 'medium',
        potentialSavings: '20-40% of overhead time',
        steps: [
          'Identify related task groups',
          'Create batch processing logic',
          'Implement batch execution',
          'Monitor batch performance'
        ]
      });
    }

    // Suggest caching strategies for repeated patterns
    if (this._hasRepeatedPatterns(results)) {
      customOptimizations.push({
        type: 'result_caching',
        title: 'Result Caching',
        description: 'Cache results from similar tasks to avoid recomputation',
        impact: 'high',
        implementation: 'high',
        potentialSavings: '30-60% for repeated tasks',
        steps: [
          'Identify cacheable results',
          'Implement caching layer',
          'Add cache invalidation',
          'Monitor cache hit rates'
        ]
      });
    }

    return customOptimizations;
  }

  _hasRepeatedPatterns(results) {
    const taskPatterns = results.map(r => r.task.title.toLowerCase());
    const uniquePatterns = new Set(taskPatterns);
    return taskPatterns.length > uniquePatterns.size + 2; // At least 3 repeated patterns
  }

  async _prioritizeRecommendations(workflowData) {
    const { results, totalTime } = workflowData;
    
    if (!results || !Array.isArray(results)) {
      return { error: 'Invalid workflow data for recommendation prioritization' };
    }

    const recommendations = [];
    
    // High priority: Critical failures
    if (results.some(r => r.status === 'rejected')) {
      recommendations.push({
        priority: 'critical',
        category: 'reliability',
        title: 'Fix Task Failures',
        description: 'Address failed tasks to improve workflow reliability',
        effort: 'medium',
        impact: 'high'
      });
    }

    // High priority: Performance bottlenecks
    const slowTasks = results.filter(r => (r.executionTime || 0) > totalTime * 0.2);
    if (slowTasks.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        title: 'Optimize Slow Tasks',
        description: `Optimize ${slowTasks.length} tasks that are taking significant time`,
        effort: 'high',
        impact: 'high'
      });
    }

    // Medium priority: Parallelization opportunities
    const agentCount = new Set(results.map(r => r.task.assignee)).size;
    if (agentCount > 1) {
      recommendations.push({
        priority: 'medium',
        category: 'efficiency',
        title: 'Implement Parallel Execution',
        description: 'Execute tasks from different agents in parallel',
        effort: 'medium',
        impact: 'medium'
      });
    }

    // Low priority: Monitoring and optimization
    recommendations.push({
      priority: 'low',
      category: 'monitoring',
      title: 'Implement Performance Monitoring',
      description: 'Add comprehensive monitoring for continuous optimization',
      effort: 'low',
      impact: 'medium'
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  async _createImplementationPlan(workflowData) {
    const { results, totalTime } = workflowData;
    
    const plan = {
      phases: [
        {
          id: 'phase-1',
          name: 'Immediate Fixes',
          duration: '1-2 days',
          objectives: ['Fix critical failures', 'Address immediate bottlenecks'],
          deliverables: ['Working workflow', 'Basic error handling'],
          tasks: [
            {
              id: 'task-1',
              title: 'Fix Failed Tasks',
              description: 'Investigate and resolve task failures',
              assignee: 'planning',
              priority: 'critical',
              estimatedHours: 4
            }
          ]
        },
        {
          id: 'phase-2',
          name: 'Performance Optimization',
          duration: '3-5 days',
          objectives: ['Optimize slow tasks', 'Implement parallelization'],
          deliverables: ['Optimized workflow', 'Performance improvements'],
          tasks: [
            {
              id: 'task-2',
              title: 'Task Parallelization',
              description: 'Implement parallel execution for independent tasks',
              assignee: 'planning',
              priority: 'high',
              estimatedHours: 8
            }
          ]
        },
        {
          id: 'phase-3',
          name: 'Monitoring & Maintenance',
          duration: '1-2 weeks',
          objectives: ['Implement monitoring', 'Establish optimization process'],
          deliverables: ['Monitoring system', 'Optimization procedures'],
          tasks: [
            {
              id: 'task-3',
              title: 'Performance Monitoring',
              description: 'Set up comprehensive performance monitoring',
              assignee: 'devops',
              priority: 'medium',
              estimatedHours: 12
            }
          ]
        }
      ],
      timeline: {
        totalEstimatedDays: 14,
        criticalPath: ['task-1', 'task-2'],
        milestones: ['Working workflow', 'Optimized performance', 'Monitoring system']
      }
    };

    return plan;
  }

  // Public methods for external access
  getOptimizationStrategies() {
    return Object.fromEntries(this.optimizationStrategies);
  }

  getPerformanceBaselines() {
    return Object.fromEntries(this.performanceBaselines);
  }

  setPerformanceBaseline(workflowType, baseline) {
    this.performanceBaselines.set(workflowType, baseline);
  }

  updateOptimizationStrategy(strategyKey, updates) {
    if (this.optimizationStrategies.has(strategyKey)) {
      const strategy = this.optimizationStrategies.get(strategyKey);
      Object.assign(strategy, updates);
      this.optimizationStrategies.set(strategyKey, strategy);
    }
  }
}
