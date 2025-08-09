import { BaseAgent } from './baseAgent.js';

export class DatabaseAgent extends BaseAgent {
  constructor({ systemPrompt, model }) {
    super({ name: 'database', role: 'Database Agent', systemPrompt, model: model || 'gpt-4o' });
  }
}

