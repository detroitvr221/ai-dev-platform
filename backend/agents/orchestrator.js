import { PlanningAgent } from './planningAgent.js';
import { FrontendAgent } from './frontendAgent.js';
import { BackendAgent } from './backendAgent.js';
import { DatabaseAgent } from './databaseAgent.js';
import { TestingAgent } from './testingAgent.js';
import { DevopsAgent } from './devopsAgent.js';
import promptsPkg from '../../shared/prompts/agents.js';
const { agentSystemPrompts } = promptsPkg;

export class AgentOrchestrator {
  constructor({ projectManager }) {
    this.projectManager = projectManager;
    this.agents = {
      planning: new PlanningAgent({ systemPrompt: agentSystemPrompts.planning }),
      frontend: new FrontendAgent({ systemPrompt: agentSystemPrompts.frontend }),
      backend: new BackendAgent({ systemPrompt: agentSystemPrompts.backend }),
      database: new DatabaseAgent({ systemPrompt: agentSystemPrompts.database }),
      testing: new TestingAgent({ systemPrompt: agentSystemPrompts.testing }),
      devops: new DevopsAgent({ systemPrompt: agentSystemPrompts.devops }),
    };
  }

  async processUserMessage(message, projectId, updateCallback) {
    const context = { projectId };
    const lower = message.toLowerCase();

    const sendUpdate = (agent, status, msg, data) => {
      updateCallback?.({ id: `${agent}-${Date.now()}`, agent, status, message: msg, data });
    };

    // Determine intent
    const intent = this._detectIntent(lower);

    if (intent === 'planning') {
      sendUpdate('planning', 'started', 'Planning started');
      const plan = await this.agents.planning.sendMessage(message, context);
      sendUpdate('planning', 'completed', 'Plan created', plan);
      return;
    }

    // Always get/refresh plan context first for other intents
    sendUpdate('planning', 'started', 'Planning for task');
    const plan = await this.agents.planning.sendMessage(`Plan for: ${message}. Return tasks JSON.`, context);
    sendUpdate('planning', 'completed', 'Plan ready', plan);

    if (intent === 'frontend') {
      await this._runAgentThatMayWriteFiles('frontend', message, context, sendUpdate);
    } else if (intent === 'backend') {
      await this._runAgentThatMayWriteFiles('backend', message, context, sendUpdate);
    } else if (intent === 'database') {
      await this._runAgentThatMayWriteFiles('database', message, context, sendUpdate);
    } else if (intent === 'testing') {
      await this._runAgentThatMayWriteFiles('testing', message, context, sendUpdate);
    } else if (intent === 'devops') {
      await this._runAgentThatMayWriteFiles('devops', message, context, sendUpdate);
    } else {
      // Mixed/unsure: run frontend then backend
      await this._runAgentThatMayWriteFiles('frontend', message, context, sendUpdate);
      await this._runAgentThatMayWriteFiles('backend', message, context, sendUpdate);
      await this._runAgentThatMayWriteFiles('testing', `Write minimal tests for new changes in response to: ${message}`, context, sendUpdate);
    }
  }

  _detectIntent(text) {
    if (/(plan|roadmap|tasks|steps)/.test(text)) return 'planning';
    if (/(ui|component|react|frontend|monaco|tailwind|css)/.test(text)) return 'frontend';
    if (/(api|server|express|backend|route)/.test(text)) return 'backend';
    if (/(db|database|schema|migration|sql|prisma)/.test(text)) return 'database';
    if (/(test|jest|coverage|integration)/.test(text)) return 'testing';
    if (/(deploy|docker|ci|cd|pipeline|infrastructure)/.test(text)) return 'devops';
    return 'mixed';
  }

  async _runAgentThatMayWriteFiles(agentKey, message, context, sendUpdate) {
    sendUpdate(agentKey, 'started', `Running ${agentKey} agent`);
    const result = await this.agents[agentKey].sendMessage(
      `${message}\n\nWhen producing files, wrap each file in a triple-fenced block starting with: \n\n\`\`\`file:/<relative project path>\n<content>\n\`\`\`\n\nYou can output multiple files in one response.`,
      context
    );
    const files = this._extractFilesFromResponse(result.raw || '');
    if (files.length) {
      for (const f of files) {
        await this.projectManager.writeFile(context.projectId, f.path.replace(/^\/?/, ''), f.content);
      }
      sendUpdate(agentKey, 'completed', `${files.length} files written`, { files });
    } else {
      sendUpdate(agentKey, 'completed', 'No files generated', result);
    }
  }

  _extractFilesFromResponse(text) {
    const files = [];
    const regex = /```file:(.*?)\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const rawPath = match[1].trim();
      const content = match[2];
      const cleaned = rawPath.replace(/^file:/, '').replace(/^\//, '');
      files.push({ path: cleaned, content });
    }
    return files;
  }
}

