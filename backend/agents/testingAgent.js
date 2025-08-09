import { BaseAgent } from './baseAgent.js';

export class TestingAgent extends BaseAgent {
  constructor({ systemPrompt, model }) {
    super({ name: 'testing', role: 'Testing Agent', systemPrompt, model });
  }
}

