import { BaseAgent } from './baseAgent.js';

export class FrontendAgent extends BaseAgent {
  constructor({ systemPrompt, model }) {
    super({ name: 'frontend', role: 'Frontend Agent', systemPrompt, model });
  }
}

