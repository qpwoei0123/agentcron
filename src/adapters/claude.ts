import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';
import type { Skill } from '../core/skill-parser.js';
import { parseSkillMd, serializeSkillMd } from '../core/skill-parser.js';
import type { AgentAdapter, InstalledAutomation, WriteOptions } from './types.js';

export class ClaudeAdapter implements AgentAdapter {
  readonly agentId = 'claude' as const;
  readonly agentName = 'Claude Code';

  private get basePath() {
    return path.join(homedir(), '.claude', 'scheduled-tasks');
  }

  async write(skill: Skill, _options: WriteOptions): Promise<string> {
    const taskDir = path.join(this.basePath, skill.meta.name);
    mkdirSync(taskDir, { recursive: true });

    const claudeMeta = {
      name: skill.meta.name,
      description: skill.meta.description
    };

    const content = serializeSkillMd(claudeMeta, skill.prompt);
    writeFileSync(path.join(taskDir, 'SKILL.md'), content, 'utf-8');

    for (const [filename, fileContent] of skill.auxiliaryFiles) {
      writeFileSync(path.join(taskDir, filename), fileContent, 'utf-8');
    }

    return taskDir;
  }

  async read(name: string): Promise<Skill> {
    const taskDir = path.join(this.basePath, name);
    const skillMdPath = path.join(taskDir, 'SKILL.md');

    if (!existsSync(skillMdPath)) {
      throw new Error('Claude scheduled task "' + name + '" not found');
    }

    const raw = readFileSync(skillMdPath, 'utf-8');
    const { meta, prompt } = parseSkillMd(raw);
    meta.source_agent = 'claude';

    const auxiliaryFiles = new Map<string, string>();
    for (const file of readdirSync(taskDir)) {
      if (file !== 'SKILL.md') {
        const filePath = path.join(taskDir, file);
        try {
          auxiliaryFiles.set(file, readFileSync(filePath, 'utf-8'));
        } catch {
          // 바이너리는 건너뜀
        }
      }
    }

    return { meta, prompt, auxiliaryFiles };
  }

  async list(): Promise<InstalledAutomation[]> {
    if (!existsSync(this.basePath)) return [];

    const entries = readdirSync(this.basePath, { withFileTypes: true });
    const results: InstalledAutomation[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = path.join(this.basePath, entry.name, 'SKILL.md');
        if (existsSync(skillPath)) {
          const raw = readFileSync(skillPath, 'utf-8');
          const { meta } = parseSkillMd(raw);
          results.push({
            name: meta.name || entry.name,
            agent: 'claude',
            schedule: typeof meta.schedule === 'string' ? meta.schedule : undefined,
            path: path.join(this.basePath, entry.name)
          });
        }
      }
    }

    return results;
  }

  async remove(name: string): Promise<void> {
    const taskDir = path.join(this.basePath, name);
    if (existsSync(taskDir)) {
      rmSync(taskDir, { recursive: true, force: true });
    }
  }
}
