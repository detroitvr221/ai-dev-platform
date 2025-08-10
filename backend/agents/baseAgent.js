import OpenAI from 'openai';

export class BaseAgent {
  constructor({ name, role, systemPrompt, model }) {
    this.name = name;
    this.role = role;
    this.systemPrompt = systemPrompt;
    this.model = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.client = null; // Lazy init to avoid crashing server when no API key is set
    this.memories = new Map(); // key: conversationId or projectId -> messages[]
  }

  _getMemoryKey(context) {
    return context?.projectId || context?.conversationId || 'global';
  }

  _getMessages(context) {
    const key = this._getMemoryKey(context);
    if (!this.memories.has(key)) this.memories.set(key, [{ role: 'system', content: this.systemPrompt }]);
    return this.memories.get(key);
  }

  _pushMessage(context, role, content) {
    const msgs = this._getMessages(context);
    msgs.push({ role, content });
  }

  async sendMessage(message, context = {}) {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set. Configure it in environment to enable agent responses.');
      }
      this.client = new OpenAI({ apiKey });
    }
    const msgs = this._getMessages(context);
    msgs.push({ role: 'user', content: this._augmentWithContext(message, context) });
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        // Prepare parameters based on model type
        const params = {
          model: this.model,
          messages: msgs,
          temperature: Number(process.env.OPENAI_TEMPERATURE || 0.2)
        };

        // Use appropriate token parameter based on model
        if (this.model.includes('gpt-4o') || this.model.includes('gpt-4o-mini')) {
          // Newer models use max_completion_tokens
          params.max_completion_tokens = Number(process.env.OPENAI_MAX_TOKENS || 2000);
        } else {
          // Older models use max_tokens
          params.max_tokens = Number(process.env.OPENAI_MAX_TOKENS || 2000);
        }

        const response = await this.client.chat.completions.create(params);
        const assistantMessage = response.choices?.[0]?.message?.content || '';
        this._pushMessage(context, 'assistant', assistantMessage);
        return this._normalizeResponse(assistantMessage);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('OpenAI request failed');
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
    return pieces.join('');
  }
}

