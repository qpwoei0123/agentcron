import { readFileSync } from 'fs';
import path from 'path';
import ora from 'ora';
import { ClaudeAdapter } from '../adapters/claude.js';
import { CodexAdapter } from '../adapters/codex.js';
import type { AgentAdapter } from '../adapters/types.js';
import { detectAgents } from '../core/detector.js';
import { fetchFromGitHub } from '../core/github.js';
import { parseSkillMd, type Skill } from '../core/skill-parser.js';
import { addToLock, getLockEntry } from '../lock/lockfile.js';
import { header, info, success, warn } from '../utils/display.js';
import { confirm, inputCwd, selectAgents } from '../utils/prompt.js';

export async function addCommand(repoSlug: string, options: { target?: string; cwd?: string }) {
  const spinner = ora('Fetching ' + repoSlug + '...').start();

  let fetchResult: Awaited<ReturnType<typeof fetchFromGitHub>> | undefined;
  try {
    fetchResult = await fetchFromGitHub(repoSlug);
    spinner.stop();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    spinner.fail(message);
    process.exit(1);
  }
  if (!fetchResult) return;

  const raw = readFileSync(fetchResult.skillMdPath, 'utf-8');
  const { meta, prompt } = parseSkillMd(raw);

  const auxiliaryFiles = new Map<string, string>();
  for (const file of fetchResult.files) {
    const basename = path.basename(file);
    if (basename !== 'SKILL.md' && basename !== 'README.md' && basename !== 'LICENSE') {
      const fullPath = path.join(fetchResult.directory, basename);
      try {
        auxiliaryFiles.set(basename, readFileSync(fullPath, 'utf-8'));
      } catch {
        // 텍스트 파일만 포함
      }
    }
  }

  const skill: Skill = { meta, prompt, auxiliaryFiles };

  header(meta.name);
  info(meta.description || '');
  if (meta.schedule) info('Schedule: ' + meta.schedule);
  console.log();

  const existing = getLockEntry(meta.name);
  if (existing) {
    warn(meta.name + ' is already installed');
    const shouldUpdate = await confirm('Update to latest?');
    if (!shouldUpdate) return;
  }

  const agents = detectAgents();
  info('Detected agents:');
  for (const agent of agents) {
    const version = agent.version ? ' v' + agent.version : '';
    info('  ' + (agent.installed ? '✓' : '✗') + ' ' + agent.name + version);
  }
  console.log();

  let selectedAgents;
  if (options.target) {
    const targetIds = options.target.split(',');
    selectedAgents = agents.filter((agent) => targetIds.includes(agent.id) && agent.installed);
  } else {
    selectedAgents = await selectAgents(agents);
  }

  if (selectedAgents.length === 0) {
    warn('No agents selected');
    return;
  }

  const cwd = options.cwd || (await inputCwd());

  const adapters: AgentAdapter[] = selectedAgents.map((agent) => {
    if (agent.id === 'claude') return new ClaudeAdapter();
    return new CodexAdapter();
  });

  console.log();
  info('Creating files...');

  const targets: Record<string, string> = {};

  for (const adapter of adapters) {
    try {
      const createdPath = await adapter.write(skill, { cwds: [cwd] });
      success(adapter.agentName + '  ' + createdPath);
      targets[adapter.agentId] = createdPath;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      warn(adapter.agentName + '  ' + message);
    }
  }

  addToLock(meta.name, {
    source: repoSlug,
    installed_at: new Date().toISOString(),
    targets
  });

  success('Lock file updated');
  console.log();
  info('Done! Installed ' + meta.name + ' → ' + selectedAgents.length + ' agent(s)');
}
