import OpenAI from 'openai';

export class BaseAgent {
  constructor({ name, role, systemPrompt, model }) {
    this.name = name;
    this.role = role;
    this.systemPrompt = systemPrompt;
    this.model = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.client = null; // Lazy init to avoid crashing server when no API key is set
    this.memories = new Map(); // key: conversationId or projectId -> messages[]
    
    // Enhanced agent capabilities
    this.conversationContext = new Map(); // key: conversationId -> context metadata
    this.performanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: null,
      errorHistory: []
    };
    
    // Agent personality and behavior
    this.personality = {
      creativity: Number(process.env.AGENT_CREATIVITY || 0.3),
      thoroughness: Number(process.env.AGENT_THOROUGHNESS || 0.8),
      adaptability: Number(process.env.AGENT_ADAPTABILITY || 0.7)
    };
    
    // Circuit breaker
    this.breaker = {
      failures: 0,
      threshold: Number(process.env.AGENT_BREAKER_THRESHOLD || 5),
      cooldownMs: Number(process.env.AGENT_BREAKER_COOLDOWN_MS || 60_000),
      openedAt: null,
    };
    
    // Learning and adaptation
    this.learningHistory = new Map();
    this.successPatterns = new Set();
    this.failurePatterns = new Set();
  }

  _getMemoryKey(context) {
    return context?.projectId || context?.conversationId || 'global';
  }

  _getMessages(context) {
    const key = this._getMemoryKey(context);
    if (!this.memories.has(key)) {
      this.memories.set(key, [{ 
        role: 'system', 
        content: this._buildEnhancedSystemPrompt(context) 
      }]);
    }
    return this.memories.get(key);
  }

  _buildEnhancedSystemPrompt(context) {
    let enhancedPrompt = this.systemPrompt;
    
    // Add context-specific instructions
    if (context?.projectSummary) {
      enhancedPrompt += `\n\nPROJECT CONTEXT: ${JSON.stringify(context.projectSummary).slice(0, 2000)}`;
    }
    
    // Add personality traits
    enhancedPrompt += `\n\nAGENT PERSONALITY:
    - Creativity Level: ${this.personality.creativity > 0.5 ? 'High' : 'Moderate'}
    - Thoroughness: ${this.personality.thoroughness > 0.7 ? 'Very thorough' : 'Balanced'}
    - Adaptability: ${this.personality.adaptability > 0.6 ? 'Highly adaptive' : 'Stable'}`;
    
    // Add learning from previous interactions
    if (this.successPatterns.size > 0) {
      enhancedPrompt += `\n\nSUCCESS PATTERNS: ${Array.from(this.successPatterns).slice(0, 3).join(', ')}`;
    }
    
    return enhancedPrompt;
  }

  _pushMessage(context, role, content) {
    const msgs = this._getMessages(context);
    msgs.push({ role, content });
    
    // Maintain conversation context within reasonable limits
    if (msgs.length > 20) {
      // Keep system message and last 19 messages
      const systemMsg = msgs[0];
      const recentMsgs = msgs.slice(-19);
      this.memories.set(this._getMemoryKey(context), [systemMsg, ...recentMsgs]);
    }
  }

  async sendMessage(message, context = {}) {
    const startTime = Date.now();
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.lastRequestTime = new Date();
    
    try {
      // Circuit breaker check
      if (this.breaker.openedAt && Date.now() - this.breaker.openedAt < this.breaker.cooldownMs) {
        throw new Error(`${this.name} circuit open; skipping request`);
      }
      
      if (!this.client) {
        await this._initializeClient();
      }
      
      const msgs = this._getMessages(context);
      const enhancedMessage = this._augmentWithContext(message, context);
      msgs.push({ role: 'user', content: enhancedMessage });
      
      // Update conversation context
      this._updateConversationContext(context, message);
      const result = await this._executeWithRetry(async () => {
        return await this._makeOpenAIRequest(msgs, context);
      });
      
      this._pushMessage(context, 'assistant', result.text || '');
      
      // Track success
      this.performanceMetrics.successfulRequests++;
      this.breaker.failures = 0; // reset breaker on success
      this._recordSuccessPattern(message, context);
      
      const responseTime = Date.now() - startTime;
      this._updatePerformanceMetrics(responseTime);
      
      return this._normalizeResponse(result.text || '');
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this._updatePerformanceMetrics(responseTime);
      this.performanceMetrics.failedRequests++;
      this.breaker.failures++;
      if (this.breaker.failures >= this.breaker.threshold) {
        this.breaker.openedAt = Date.now();
      }
      
      // Record failure pattern
      this._recordFailurePattern(message, context, error);
      
      // Enhanced error handling
      throw this._enhanceError(error, context);
    }
  }

  async _initializeClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set. Configure it in environment to enable agent responses.');
    }
    const project = process.env.OPENAI_PROJECT || process.env.OPENAI_PROJECT_ID;
    this.client = new OpenAI(project ? { apiKey, project } : { apiKey });
  }

  async _makeOpenAIRequest(messages, context) {
    const maxTokens = this._calculateMaxTokens(context);
    const temperature = this._calculateDynamicTemperature(context);
    
    const controller = new AbortController();
    const timeoutMs = Number(process.env.AGENT_TIMEOUT_MS || 30_000);
    const t = setTimeout(() => controller.abort(), timeoutMs);
    
    let fullText = '';
    try {
      const stream = await this.client.responses.stream(
        {
          model: this.model,
          input: [
            { role: 'system', content: messages[0]?.content || this.systemPrompt },
            ...messages.slice(1),
          ],
          temperature,
          max_output_tokens: maxTokens,
        },
        { signal: controller.signal }
      );
      for await (const event of stream) {
        if (event.type === 'response.output_text.delta') {
          fullText += event.delta;
          if (typeof context?.streamDelta === 'function') {
            try { context.streamDelta(event.delta); } catch {}
          }
        }
      }
      return { text: fullText };
    } finally {
      clearTimeout(t);
    }
  }

  _calculateDynamicTemperature(context) {
    let baseTemp = Number(process.env.OPENAI_TEMPERATURE || 0.2);
    
    // Adjust based on agent personality
    baseTemp += (this.personality.creativity - 0.5) * 0.4;
    
    // Adjust based on context
    if (context?.requiresCreativity) {
      baseTemp += 0.3;
    }
    if (context?.requiresPrecision) {
      baseTemp -= 0.2;
    }
    
    // Ensure within reasonable bounds
    return Math.max(0.1, Math.min(1.0, baseTemp));
  }

  _calculateMaxTokens(context) {
    let baseTokens = Number(process.env.OPENAI_MAX_TOKENS || 2000);
    
    // Adjust based on context complexity
    if (context?.projectSummary && context.projectSummary.length > 1000) {
      baseTokens += 500;
    }
    
    // Adjust based on agent role
    if (this.role === 'planning') {
      baseTokens += 1000; // Planning agents need more tokens for comprehensive responses
    }
    
    return baseTokens;
  }

  _getAvailableTools() {
    // Define available tools for function calling
    return [
      {
        type: 'function',
        function: {
          name: 'create_file',
          description: 'Create a new file with specified content',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path' },
              content: { type: 'string', description: 'File content' }
            },
            required: ['path', 'content']
          }
        }
      }
    ];
  }

  async _executeWithRetry(operation, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain types of errors
        if (this._shouldNotRetry(error)) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          const delay = this._calculateRetryDelay(attempt, error);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Log retry attempt
          console.log(`Agent ${this.name} retry attempt ${attempt + 1}/${maxRetries} after error:`, error.message);
        }
      }
    }
    
    throw lastError;
  }

  _shouldNotRetry(error) {
    // Don't retry on authentication, permission, or invalid request errors
    const nonRetryableCodes = ['authentication_error', 'permission_error', 'invalid_request_error'];
    return nonRetryableCodes.includes(error.code) || error.status === 401 || error.status === 403;
  }

  _calculateRetryDelay(attempt, error) {
    // Exponential backoff with jitter
    const baseDelay = 1000 * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return baseDelay + jitter;
  }

  _updateConversationContext(context, message) {
    const key = this._getMemoryKey(context);
    if (!this.conversationContext.has(key)) {
      this.conversationContext.set(key, {
        startTime: new Date(),
        messageCount: 0,
        topics: new Set(),
        complexity: 'low'
      });
    }
    
    const contextData = this.conversationContext.get(key);
    contextData.messageCount++;
    contextData.lastMessageTime = new Date();
    
    // Analyze message complexity
    const wordCount = message.split(' ').length;
    if (wordCount > 50) contextData.complexity = 'high';
    else if (wordCount > 20) contextData.complexity = 'medium';
    
    // Extract topics (simple keyword extraction)
    const keywords = message.toLowerCase().match(/\b\w{4,}\b/g) || [];
    keywords.forEach(keyword => contextData.topics.add(keyword));
  }

  _recordSuccessPattern(message, context) {
    const pattern = this._extractPattern(message, context);
    if (pattern) {
      this.successPatterns.add(pattern);
    }
  }

  _recordFailurePattern(message, context, error) {
    const pattern = this._extractPattern(message, context);
    if (pattern) {
      this.failurePatterns.add(pattern);
    }
    
    // Store error details for analysis
    this.performanceMetrics.errorHistory.push({
      timestamp: new Date(),
      message: message.substring(0, 100),
      error: error.message,
      context: this._getMemoryKey(context)
    });
    
    // Keep only recent errors
    if (this.performanceMetrics.errorHistory.length > 50) {
      this.performanceMetrics.errorHistory = this.performanceMetrics.errorHistory.slice(-50);
    }
  }

  _extractPattern(message, context) {
    // Extract meaningful patterns from messages
    const words = message.toLowerCase().split(' ').filter(word => word.length > 3);
    const contextKey = this._getMemoryKey(context);
    
    if (words.length > 0) {
      return `${contextKey}:${words.slice(0, 3).join('-')}`;
    }
    return null;
  }

  _updatePerformanceMetrics(responseTime) {
    const current = this.performanceMetrics.averageResponseTime;
    const count = this.performanceMetrics.totalRequests;
    
    this.performanceMetrics.averageResponseTime = 
      (current * (count - 1) + responseTime) / count;
  }

  _enhanceError(error, context) {
    // Add context to error messages
    const enhancedError = new Error(`${this.name} agent error: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.context = context;
    enhancedError.agentRole = this.role;
    enhancedError.timestamp = new Date();
    
    return enhancedError;
  }

  _normalizeResponse(text) {
    // Try parse JSON, otherwise return as text
    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonStr = text.slice(jsonStart, jsonEnd + 1);
        return { type: 'json', data: JSON.parse(jsonStr), raw: text };
      }
    } catch {
      // ignore
    }
    return { type: 'text', data: text, raw: text };
  }

  _augmentWithContext(message, context) {
    const pieces = [String(message || '')];
    
    if (context?.projectSummary) {
      pieces.push(`\n\n[PROJECT_SUMMARY]\n${JSON.stringify(context.projectSummary).slice(0, 4000)}`);
    }
    
    // Add conversation context
    const conversationKey = this._getMemoryKey(context);
    const conversationData = this.conversationContext.get(conversationKey);
    if (conversationData) {
      pieces.push(`\n\n[CONVERSATION_CONTEXT]
      - Message count: ${conversationData.messageCount}
      - Complexity: ${conversationData.complexity}
      - Topics: ${Array.from(conversationData.topics).slice(0, 5).join(', ')}`);
    }
    
    // Add learning context
    if (this.successPatterns.size > 0) {
      pieces.push(`\n\n[LEARNING_CONTEXT]
      - Known success patterns: ${Array.from(this.successPatterns).slice(0, 3).join(', ')}`);
    }
    
    return pieces.join('');
  }

  // Public methods for monitoring and management
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  getConversationContext(conversationId) {
    return this.conversationContext.get(conversationId);
  }

  getLearningHistory() {
    return {
      successPatterns: Array.from(this.successPatterns),
      failurePatterns: Array.from(this.failurePatterns),
      errorHistory: [...this.performanceMetrics.errorHistory]
    };
  }

  resetPerformanceMetrics() {
    this.performanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestTime: null,
      errorHistory: []
    };
  }

  updatePersonality(traits) {
    Object.assign(this.personality, traits);
  }

  // Memory management
  clearMemory(contextKey) {
    this.memories.delete(contextKey);
    this.conversationContext.delete(contextKey);
  }

  getMemorySize() {
    return {
      memories: this.memories.size,
      conversationContext: this.conversationContext.size,
      learningHistory: this.learningHistory.size
    };
  }
}

