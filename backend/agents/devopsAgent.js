import { BaseAgent } from './baseAgent.js';

export class DevopsAgent extends BaseAgent {
  constructor({ systemPrompt, model }) {
    super({ name: 'devops', role: 'DevOps Agent', systemPrompt, model: model || 'gpt-4o' });
  }
}

