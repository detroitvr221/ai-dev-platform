import OpenAI from 'openai';

export class BaseAgent {
  constructor({ name, role, systemPrompt, model = 'gpt-4o-mini' }) {
    this.name = name;
    this.role = role;
    this.systemPrompt = systemPrompt;
    this.model = model;
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
    const msgs = this._getMessages(context);
    msgs.push({ role: 'user', content: message });
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: msgs,
      temperature: 0.2,
    });
    const assistantMessage = response.choices?.[0]?.message?.content || '';
    this._pushMessage(context, 'assistant', assistantMessage);
    return this._normalizeResponse(assistantMessage);
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
}

