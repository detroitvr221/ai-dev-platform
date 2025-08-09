import { BaseAgent } from './baseAgent.js';

export class PlanningAgent extends BaseAgent {
  constructor({ systemPrompt, model }) {
    super({ name: 'planning', role: 'Planning Agent', systemPrompt, model: model || 'gpt-4o' });
  }
}

