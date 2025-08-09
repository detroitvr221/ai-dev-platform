import { BaseAgent } from './baseAgent.js';

export class BackendAgent extends BaseAgent {
  constructor({ systemPrompt, model }) {
    super({ name: 'backend', role: 'Backend Agent', systemPrompt, model: model || 'gpt-4o' });
  }
}

