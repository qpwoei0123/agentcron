import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';
import TOML from '@iarna/toml';
import type { Skill } from '../core/skill-parser.js';
import { isCron } from '../core/schedule.js';
import { cronToRRule } from '../core/schedule.js';
import type { AgentAdapter, InstalledAutomation, WriteOptions } from './types.js';

interface AutomationToml {
  version: number;
  id: string;
  kind: string;
  name: string;
  prompt: string;
  status: string;
  rrule: string;
  model: string;
  reasoning_effort: string;
  execution_environment: string;
  cwds: string[];
  created_at: number;
  updated_at: number;
}

export class CodexAdapter implements AgentAdapter {
  readonly agentId = 'codex' as const;
  readonly agentName = 'Codex App';

  private get basePath() {
    return path.join(homedir(), '.codex', 'automations');
  }

  async write(skill: Skill, options: WriteOptions): Promise<string> {
    const automationDir = path.join(this.basePath, skill.meta.name);
    mkdirSync(automationDir, { recursive: true });

    let rrule = '';
    if (skill.meta.schedule) {
      const schedule = String(skill.meta.schedule);
      rrule = isCron(schedule) ? cronToRRule(schedule) : schedule;
      if (!rrule.startsWith('RRULE:')) rrule = 'RRULE:' + rrule;
    }

    const now = Date.now();
    const toml: AutomationToml = {
      version: 1,
      id: skill.meta.name,
      kind: 'cron',
      name: skill.meta.description || skill.meta.name,
      prompt: skill.prompt,
      status: options.status || 'ACTIVE',
      rrule,
      model: typeof skill.meta.model === 'string' ? skill.meta.model : 'gpt-5.4',
      reasoning_effort:
        typeof skill.meta.reasoning_effort === 'string' ? skill.meta.reasoning_effort : 'high',
      execution_environment: 'local',
      cwds: options.cwds || [process.cwd()],
      created_at: now,
      updated_at: now
    };

    writeFileSync(path.join(automationDir, 'automation.toml'), TOML.stringify(toml as any), 'utf-8');

    for (const [filename, fileContent] of skill.auxiliaryFiles) {
      writeFileSync(path.join(automationDir, filename), fileContent, 'utf-8');
    }

    return automationDir;
  }

  async read(id: string): Promise<Skill> {
    const automationDir = path.join(this.basePath, id);
    const tomlPath = path.join(automationDir, 'automation.toml');

    if (!existsSync(tomlPath)) {
      throw new Error('Codex automation "' + id + '" not found');
    }

    const raw = readFileSync(tomlPath, 'utf-8');
    const toml = TOML.parse(raw) as unknown as AutomationToml;

    const auxiliaryFiles = new Map<string, string>();
    const skipFiles = new Set(['automation.toml', 'memory.md', 'result.md', 'result.json', '.DS_Store']);

    for (const file of readdirSync(automationDir)) {
      if (!skipFiles.has(file) && !file.startsWith('result-') && !file.endsWith('.json')) {
        const filePath = path.join(automationDir, file);
        try {
          auxiliaryFiles.set(file, readFileSync(filePath, 'utf-8'));
        } catch {
          // 바이너리는 건너뜀
        }
      }
    }

    return {
      meta: {
        name: toml.id,
        description: toml.name,
        schedule: toml.rrule,
        model: toml.model,
        reasoning_effort: toml.reasoning_effort,
        source_agent: 'codex'
      },
      prompt: toml.prompt,
      auxiliaryFiles
    };
  }

  async list(): Promise<InstalledAutomation[]> {
    if (!existsSync(this.basePath)) return [];

    const entries = readdirSync(this.basePath, { withFileTypes: true });
    const results: InstalledAutomation[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const tomlPath = path.join(this.basePath, entry.name, 'automation.toml');
        if (existsSync(tomlPath)) {
          try {
            const raw = readFileSync(tomlPath, 'utf-8');
            const toml = TOML.parse(raw) as unknown as AutomationToml;
            results.push({
              name: toml.id || entry.name,
              agent: 'codex',
              schedule: toml.rrule,
              status: toml.status,
              path: path.join(this.basePath, entry.name)
            });
          } catch {
            // 손상된 파일은 건너뜀
          }
        }
      }
    }

    return results;
  }

  async remove(id: string): Promise<void> {
    const automationDir = path.join(this.basePath, id);
    if (existsSync(automationDir)) {
      rmSync(automationDir, { recursive: true, force: true });
    }
  }
}
