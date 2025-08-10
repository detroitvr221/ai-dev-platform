import { PlanningAgent } from './planningAgent.js';
import { FrontendAgent } from './frontendAgent.js';
import { BackendAgent } from './backendAgent.js';
import { DatabaseAgent } from './databaseAgent.js';
import { TestingAgent } from './testingAgent.js';
import { DevopsAgent } from './devopsAgent.js';
import { AssetsAgent } from './assetsAgent.js';
import promptsPkg from '../../shared/prompts/agents.js';
const { agentSystemPrompts } = promptsPkg;

export class AgentOrchestrator {
  constructor({ projectManager }) {
    this.projectManager = projectManager;
    this.agents = {
      planning: new PlanningAgent({ systemPrompt: agentSystemPrompts.planning, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }),
      frontend: new FrontendAgent({ systemPrompt: agentSystemPrompts.frontend, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }),
      backend: new BackendAgent({ systemPrompt: agentSystemPrompts.backend, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }),
      database: new DatabaseAgent({ systemPrompt: agentSystemPrompts.database, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }),
      testing: new TestingAgent({ systemPrompt: agentSystemPrompts.testing, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }),
      devops: new DevopsAgent({ systemPrompt: agentSystemPrompts.devops, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }),
      assets: new AssetsAgent({ systemPrompt: agentSystemPrompts.assets, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }),
    };
  }

  async processUserMessage(message, projectId, updateCallback) {
    const projectSummary = await this.projectManager.getProjectSummary(projectId).catch(() => null);
    const context = { projectId, projectSummary };
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
    const plan = await this.agents.planning.sendMessage(
      `Create a project plan for: ${message}. Ensure tasks include assignee among [frontend,backend,database,testing,devops,planning] and dependencies.`,
      context
    );
    sendUpdate('planning', 'completed', 'Plan ready', plan);

    // If the plan contains tasks, route them to respective agents in dependency order (simple pass for now)
    const tasks = (plan?.data?.tasks || []).filter(Boolean);
    const ordered = this._topologicalOrder(tasks);
    for (const t of ordered) {
      const agentKey = t.assignee || this._detectIntent(t.title + ' ' + t.description);
      if (!this.agents[agentKey]) continue;
      await this._runAgentThatMayWriteFiles(agentKey, `${t.title}\n${t.description}`, context, sendUpdate);
    }

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
    } else if (intent === 'assets') {
      await this._runAgentThatMayWriteFiles('assets', message, context, sendUpdate);
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
    if (/(design|brand|logo|icon|illustration|animation|visual|asset|graphic|color|typography)/.test(text)) return 'assets';
    return 'mixed';
  }

  _topologicalOrder(tasks) {
    const idToTask = new Map(tasks.map((t) => [t.id || t.title, t]));
    const visited = new Set();
    const onStack = new Set();
    const result = [];
    const getDeps = (t) => (Array.isArray(t.dependsOn) ? t.dependsOn : []);

    const dfs = (task) => {
      const key = task.id || task.title;
      if (visited.has(key)) return;
      if (onStack.has(key)) return; // cycle guard
      onStack.add(key);
      for (const dep of getDeps(task)) {
        const depTask = idToTask.get(dep);
        if (depTask) dfs(depTask);
      }
      onStack.delete(key);
      visited.add(key);
      result.push(task);
    };

    for (const t of tasks) dfs(t);
    return result;
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
        try {
          await this.projectManager.writeFile(context.projectId, f.path.replace(/^\/?/, ''), f.content);
        } catch (e) {
          sendUpdate(agentKey, 'error', `Failed to write ${f.path}: ${e.message}`);
        }
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

